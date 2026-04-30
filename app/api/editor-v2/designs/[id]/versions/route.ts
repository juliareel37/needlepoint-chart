import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma, SaveSource } from "@prisma/client";
import { deleteBlobIfExists, extractEditorV2TraceBlobUrls } from "@/lib/blob";
import { prisma } from "@/lib/db";
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
type RestoreBody = { versionId?: string; mode?: "replace" | "copy" };

function formatRestoredCopyTitle(title: string, timestamp: Date): string {
  const baseTitle = normalizeProjectTitle(title);
  const formattedTimestamp = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);

  return `${baseTitle} (Restored Version - ${formattedTimestamp})`;
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
    select: { id: true },
  });
  if (!design) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const versions = await prisma.editorDesignVersion.findMany({
    where: { designId: id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      createdAt: true,
      saveSource: true,
    },
  });

  return NextResponse.json({ versions });
}

export async function POST(req: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await Promise.resolve(context.params);
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as RestoreBody | null;
  if (!body?.versionId) {
    return NextResponse.json({ error: "Missing versionId" }, { status: 400 });
  }

  const existing = await prisma.editorDesign.findFirst({
    where: { id, userId },
    select: {
      id: true,
      title: true,
      data: true,
      createdAt: true,
      updatedAt: true,
      lastVersionAt: true,
      lastVersionHash: true,
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const version = await prisma.editorDesignVersion.findFirst({
    where: { id: body.versionId, designId: id },
    select: {
      id: true,
      data: true,
      dataHash: true,
      createdAt: true,
      saveSource: true,
    },
  });
  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const restoredData = parsePersistedEditorV2Design(version.data);
  if (!restoredData) {
    return NextResponse.json({ error: "Stored version is invalid" }, { status: 500 });
  }

  const now = new Date();
  const mode = body.mode === "copy" ? "copy" : "replace";

  if (mode === "copy") {
    const restoredCopyTitle = formatRestoredCopyTitle(
      restoredData.project.title || existing.title,
      version.createdAt,
    );
    const restoredCopyData = {
      ...restoredData,
      project: {
        ...restoredData.project,
        title: restoredCopyTitle,
      },
    };

    const created = await prisma.$transaction(async (tx) => {
      const createdDesign = await tx.editorDesign.create({
        data: {
          userId,
          title: restoredCopyTitle,
          data: restoredCopyData as unknown as Prisma.InputJsonValue,
          gridWidth: restoredCopyData.grid.width,
          gridHeight: restoredCopyData.grid.height,
          lastSaveSource: SaveSource.RESTORE,
          lastVersionAt: now,
          lastVersionHash: version.dataHash,
        },
      });

      const prunedVersions = await createEditorDesignVersionSnapshot(tx, {
        designId: createdDesign.id,
        data: restoredCopyData,
        dataHash: version.dataHash,
        saveSource: SaveSource.RESTORE,
      });
      const orphanedBlobUrls = await cleanupPrunedVersionBlobs({
        client: tx,
        designId: createdDesign.id,
        currentDesignData: restoredCopyData,
        prunedVersions,
      });

      return {
        createdDesign,
        orphanedBlobUrls,
      };
    });

    for (const url of created.orphanedBlobUrls) {
      void deleteBlobIfExists(url);
    }

    return NextResponse.json({
      ok: true,
      id: created.createdDesign.id,
      storageId: created.createdDesign.id,
      title: created.createdDesign.title,
      gridWidth: created.createdDesign.gridWidth,
      gridHeight: created.createdDesign.gridHeight,
      createdAt: created.createdDesign.createdAt.toISOString(),
      updatedAt: created.createdDesign.updatedAt.toISOString(),
      versionToken: created.createdDesign.updatedAt.toISOString(),
      restoredVersionId: version.id,
      data: restoredCopyData,
    });
  }

  const shouldVersion = shouldCreateEditorDesignVersion({
    saveSource: SaveSource.RESTORE,
    dataHash: version.dataHash,
    existing,
    now,
  });

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.editorDesign.update({
      where: { id },
      data: {
        title: restoredData.project.title.trim() || existing.title,
        data: restoredData as unknown as Prisma.InputJsonValue,
        gridWidth: restoredData.grid.width,
        gridHeight: restoredData.grid.height,
        lastSaveSource: SaveSource.RESTORE,
        ...(shouldVersion
          ? {
              lastVersionAt: now,
              lastVersionHash: version.dataHash,
            }
          : {}),
      },
    });

    const prunedVersions = shouldVersion
      ? await createEditorDesignVersionSnapshot(tx, {
          designId: id,
          data: restoredData,
          dataHash: version.dataHash,
          saveSource: SaveSource.RESTORE,
        })
      : [];

    const retainedVersions = await tx.editorDesignVersion.findMany({
      where: { designId: id },
      select: { data: true },
    });
    const retainedBlobUrls = new Set<string>(extractEditorV2TraceBlobUrls(restoredData));
    for (const retainedVersion of retainedVersions) {
      for (const url of extractEditorV2TraceBlobUrls(retainedVersion.data)) {
        retainedBlobUrls.add(url);
      }
    }

    const orphanedPrunedBlobUrls = await cleanupPrunedVersionBlobs({
      client: tx,
      designId: id,
      currentDesignData: restoredData,
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
    storageId: result.updated.id,
    title: result.updated.title,
    gridWidth: result.updated.gridWidth,
    gridHeight: result.updated.gridHeight,
    createdAt: result.updated.createdAt.toISOString(),
    updatedAt: result.updated.updatedAt.toISOString(),
    versionToken: result.updated.updatedAt.toISOString(),
    restoredVersionId: version.id,
    data: restoredData,
  });
}
