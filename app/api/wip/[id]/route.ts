import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { deleteBlobIfExists, extractBlobUrl } from "@/lib/blob";
import { isWipVersioningEnabled } from "@/lib/wipVersioning";

export const runtime = "nodejs";

type DraftPayload = {
  version: number;
  title: string;
  gridW: number;
  gridH: number;
  grid: number[];
  gridMode: "stitches" | "inches";
  meshCount: number;
  widthIn: number;
  heightIn: number;
  trace: {
    imageDataUrl: string | null; // Vercel Blob URL (https://...) or legacy data: URL
    opacity: number;
    scale: number;
    offsetX: number;
    offsetY: number;
    cellSizeBasis?: number;
    locked: boolean;
  };
};

function hashDraft(draft: DraftPayload) {
  return createHash("sha256").update(JSON.stringify(draft)).digest("hex");
}

type SaveSourceInput = "manual" | "autosave";

function toPrismaSaveSource(value: SaveSourceInput | undefined) {
  return value === "autosave" ? "AUTOSAVE" : "MANUAL";
}

function isUnknownPrismaArgumentError(error: unknown, argumentName: string) {
  return (
    error instanceof Error &&
    error.message.includes("Unknown argument") &&
    error.message.includes(`\`${argumentName}\``)
  );
}

type RouteContext = { params: { id: string } } | { params: Promise<{ id: string }> };

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
  const draft = await prisma.patternDraft.findFirst({
    where: { id, userId },
  });

  if (!draft) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: draft.id,
    title: draft.title,
    draft: draft.data,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
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
    | { draft?: DraftPayload; title?: string; forceVersion?: boolean; saveSource?: SaveSourceInput }
    | null;

  if (!body?.draft || typeof body.draft !== "object") {
    return NextResponse.json({ error: "Missing draft" }, { status: 400 });
  }
  const draft = body.draft;
  const forceVersion = body?.forceVersion === true;
  const saveSource = toPrismaSaveSource(body?.saveSource);

  const existing = await prisma.patternDraft.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : existing.title;

  const dataHash = hashDraft(draft);
  const now = new Date();
  const versioningEnabled = isWipVersioningEnabled();
  const lastVersionAt = existing.lastVersionAt ? new Date(existing.lastVersionAt) : null;
  const VERSION_INTERVAL_MS = 3 * 60 * 1000;
  const shouldVersion =
    (forceVersion && dataHash !== existing.lastVersionHash) ||
    (versioningEnabled &&
      (!lastVersionAt ||
        (now.getTime() - lastVersionAt.getTime() >= VERSION_INTERVAL_MS &&
          dataHash !== existing.lastVersionHash)));

  const persistDraft = async (includeSaveSourceFields: boolean) => {
    const updateData = {
      title,
      data: draft,
      ...(includeSaveSourceFields ? { lastSaveSource: saveSource } : {}),
      ...(shouldVersion
        ? {
            lastVersionAt: now,
            lastVersionHash: dataHash,
          }
        : {}),
    };

    if (!shouldVersion) {
      return prisma.patternDraft.update({
        where: { id },
        data: updateData,
      });
    }

    const [updated] = await prisma.$transaction([
      prisma.patternDraft.update({
        where: { id },
        data: updateData,
      }),
      prisma.patternVersion.create({
        data: {
          draftId: id,
          data: draft,
          dataHash,
          ...(includeSaveSourceFields ? { saveSource } : {}),
        },
      }),
    ]);

    return updated;
  };

  let saved: Awaited<ReturnType<typeof persistDraft>>;
  try {
    saved = await persistDraft(true);
  } catch (error) {
    if (
      isUnknownPrismaArgumentError(error, "lastSaveSource") ||
      isUnknownPrismaArgumentError(error, "saveSource")
    ) {
      console.warn(
        "Prisma client/schema is missing save source fields; retrying WIP save without saveSource metadata."
      );
      saved = await persistDraft(false);
    } else {
      throw error;
    }
  }

  return NextResponse.json({
    ok: true,
    id: saved.id,
    updatedAt: saved.updatedAt,
    versioned: shouldVersion,
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

  const existing = await prisma.patternDraft.findFirst({
    where: { id, userId },
    include: { versions: { select: { data: true } } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await prisma.patternDraft.deleteMany({
    where: { id, userId },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const blobUrls = new Set<string>();
  const draftBlob = extractBlobUrl(existing.data);
  if (draftBlob) blobUrls.add(draftBlob);
  for (const version of existing.versions) {
    const versionBlob = extractBlobUrl(version.data);
    if (versionBlob) blobUrls.add(versionBlob);
  }
  for (const url of blobUrls) {
    void deleteBlobIfExists(url);
  }

  return NextResponse.json({ ok: true });
}
