import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma, SaveSource } from "@prisma/client";
import { prisma } from "@/lib/db";
import { deleteBlobIfExists, extractEditorV2TraceBlobUrls } from "@/lib/blob";
import {
  normalizeProjectTitle,
  parsePersistedEditorV2Design,
} from "@/lib/editor-v2/persistence/designs";
import {
  cleanupPrunedVersionBlobs,
  createEditorDesignVersionSnapshot,
  hashPersistedEditorV2Design,
  shouldCreateEditorDesignVersion,
} from "@/lib/editor-v2/server/versioning";

export const runtime = "nodejs";

type RouteContext = { params: { id: string } } | { params: Promise<{ id: string }> };

type SaveSourceInput = "manual" | "autosave";

function toPrismaSaveSource(value: SaveSourceInput | undefined): SaveSource {
  return value === "autosave" ? SaveSource.AUTOSAVE : SaveSource.MANUAL;
}

export async function GET(_req: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await Promise.resolve(context.params);
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const design = await prisma.editorDesign.findFirst({
    where: { id, userId },
    select: {
      id: true,
      data: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!design) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsedData = parsePersistedEditorV2Design(design.data);
  if (!parsedData) {
    return NextResponse.json({ error: "Stored design is invalid" }, { status: 500 });
  }

  return NextResponse.json({
    id: design.id,
    createdAt: design.createdAt.toISOString(),
    updatedAt: design.updatedAt.toISOString(),
    versionToken: design.updatedAt.toISOString(),
    data: parsedData,
  });
}

export async function PUT(req: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await Promise.resolve(context.params);
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as
    | { data?: unknown; baseVersion?: unknown; saveSource?: SaveSourceInput }
    | null;
  const data = parsePersistedEditorV2Design(body?.data);
  if (!data) {
    return NextResponse.json({ error: "Invalid design payload" }, { status: 400 });
  }
  const saveSource = toPrismaSaveSource(body?.saveSource);
  const dataHash = hashPersistedEditorV2Design(data);
  const now = new Date();

  const existing = await prisma.editorDesign.findFirst({
    where: { id, userId },
    select: {
      id: true,
      data: true,
      updatedAt: true,
      lastVersionAt: true,
      lastVersionHash: true,
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const baseVersion =
    typeof body?.baseVersion === "string" ? body.baseVersion : null;
  const currentVersionToken = existing.updatedAt.toISOString();

  if (baseVersion && baseVersion !== currentVersionToken) {
    return NextResponse.json(
      {
        error: "This design changed on the server before your save completed.",
        versionToken: currentVersionToken,
      },
      { status: 409 },
    );
  }

  const shouldVersion = shouldCreateEditorDesignVersion({
    saveSource,
    dataHash,
    existing,
    now,
  });

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.editorDesign.update({
      where: { id },
      data: {
        title: normalizeProjectTitle(data.project.title),
        data: data as unknown as Prisma.InputJsonValue,
        gridWidth: data.grid.width,
        gridHeight: data.grid.height,
        lastSaveSource: saveSource,
        ...(shouldVersion
          ? {
              lastVersionAt: now,
              lastVersionHash: dataHash,
            }
          : {}),
      },
    });

    const prunedVersions = shouldVersion
      ? await createEditorDesignVersionSnapshot(tx, {
          designId: id,
          data,
          dataHash,
          saveSource,
        })
      : [];

    const retainedVersions = await tx.editorDesignVersion.findMany({
      where: { designId: id },
      select: { data: true },
    });
    const retainedBlobUrls = new Set<string>(extractEditorV2TraceBlobUrls(data));
    for (const version of retainedVersions) {
      for (const url of extractEditorV2TraceBlobUrls(version.data)) {
        retainedBlobUrls.add(url);
      }
    }

    const orphanedPrunedBlobUrls = await cleanupPrunedVersionBlobs({
      client: tx,
      designId: id,
      currentDesignData: data,
      prunedVersions,
    });

    return {
      updated,
      retainedBlobUrls: [...retainedBlobUrls],
      orphanedPrunedBlobUrls,
    };
  });

  const retainedBlobUrls = new Set(result.retainedBlobUrls);
  for (const url of extractEditorV2TraceBlobUrls(existing.data)) {
    if (!retainedBlobUrls.has(url)) {
      void deleteBlobIfExists(url);
    }
  }
  for (const url of result.orphanedPrunedBlobUrls) {
    void deleteBlobIfExists(url);
  }

  return NextResponse.json({
    ok: true,
    id: result.updated.id,
    title: result.updated.title,
    gridWidth: result.updated.gridWidth,
    gridHeight: result.updated.gridHeight,
    createdAt: result.updated.createdAt.toISOString(),
    updatedAt: result.updated.updatedAt.toISOString(),
    versionToken: result.updated.updatedAt.toISOString(),
  });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await Promise.resolve(context.params);
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const existing = await prisma.editorDesign.findFirst({
    where: { id, userId },
    select: {
      id: true,
      data: true,
      versions: {
        select: {
          data: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.editorDesign.delete({
    where: { id: existing.id },
  });

  const blobUrls = new Set<string>(extractEditorV2TraceBlobUrls(existing.data));
  for (const version of existing.versions) {
    for (const url of extractEditorV2TraceBlobUrls(version.data)) {
      blobUrls.add(url);
    }
  }

  for (const url of blobUrls) {
    void deleteBlobIfExists(url);
  }

  return NextResponse.json({ ok: true, id: existing.id });
}
