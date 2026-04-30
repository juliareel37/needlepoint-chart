import { NextResponse } from "next/server";
import { Prisma, SaveSource } from "@prisma/client";
import { getCurrentUserId } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import {
  normalizeProjectTitle,
  parsePersistedEditorV2Design,
} from "@/lib/editor-v2/persistence/designs";
import {
  cleanupPrunedVersionBlobs,
  createEditorDesignVersionSnapshot,
  hashPersistedEditorV2Design,
} from "@/lib/editor-v2/server/versioning";
import { deleteBlobIfExists } from "@/lib/blob";
import { loadLibraryDesignPage } from "@/lib/library/designs";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 24;

type SaveSourceInput = "manual" | "autosave";

function toPrismaSaveSource(value: SaveSourceInput | undefined): SaveSource {
  return value === "autosave" ? SaveSource.AUTOSAVE : SaveSource.MANUAL;
}

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const requestedLimitParam = url.searchParams.get("limit");
  const requestedOffsetParam = url.searchParams.get("offset");
  const requestedLimit =
    requestedLimitParam === null ? Number.NaN : Number(requestedLimitParam);
  const requestedOffset =
    requestedOffsetParam === null ? Number.NaN : Number(requestedOffsetParam);
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(MAX_LIMIT, Math.floor(requestedLimit)))
    : DEFAULT_LIMIT;
  const offset = Number.isFinite(requestedOffset)
    ? Math.max(0, Math.floor(requestedOffset))
    : 0;

  return NextResponse.json(await loadLibraryDesignPage({ userId, limit, offset }));
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { data?: unknown; saveSource?: SaveSourceInput }
    | null;
  const data = parsePersistedEditorV2Design(body?.data);

  if (!data) {
    return NextResponse.json({ error: "Invalid design payload" }, { status: 400 });
  }

  const title = normalizeProjectTitle(data.project.title);
  const saveSource = toPrismaSaveSource(body?.saveSource);
  const now = new Date();
  const dataHash = hashPersistedEditorV2Design(data);

  const created = await prisma.$transaction(async (tx) => {
    const createdDesign = await tx.editorDesign.create({
      data: {
        userId,
        title,
        data: data as unknown as Prisma.InputJsonValue,
        gridWidth: data.grid.width,
        gridHeight: data.grid.height,
        lastSaveSource: saveSource,
        lastVersionAt: now,
        lastVersionHash: dataHash,
      },
    });

    const prunedVersions = await createEditorDesignVersionSnapshot(tx, {
      designId: createdDesign.id,
      data,
      dataHash,
      saveSource,
    });
    const orphanedBlobUrls = await cleanupPrunedVersionBlobs({
      client: tx,
      designId: createdDesign.id,
      currentDesignData: data,
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
    title: created.createdDesign.title,
    gridWidth: created.createdDesign.gridWidth,
    gridHeight: created.createdDesign.gridHeight,
    createdAt: created.createdDesign.createdAt.toISOString(),
    updatedAt: created.createdDesign.updatedAt.toISOString(),
    versionToken: created.createdDesign.updatedAt.toISOString(),
  });
}
