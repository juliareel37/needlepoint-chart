import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteBlobIfExists } from "@/lib/blob";
import {
  getDeletedEditorDesignWhere,
  permanentlyDeleteEditorDesign,
} from "@/lib/editor-v2/server/designDeletion";

export const runtime = "nodejs";

const DEFAULT_BATCH_SIZE = 50;
const MAX_BATCH_SIZE = 200;

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.EDITOR_DESIGN_PURGE_SECRET || secret !== process.env.EDITOR_DESIGN_PURGE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const requestedBatchSize = Number(searchParams.get("batchSize") ?? DEFAULT_BATCH_SIZE);
  const batchSize = Number.isFinite(requestedBatchSize)
    ? Math.max(1, Math.min(MAX_BATCH_SIZE, Math.floor(requestedBatchSize)))
    : DEFAULT_BATCH_SIZE;

  const expiredDesigns = await prisma.editorDesign.findMany({
    where: {
      ...getDeletedEditorDesignWhere({}),
      purgeAfterAt: {
        lte: new Date(),
      },
    },
    orderBy: [{ purgeAfterAt: "asc" }, { id: "asc" }],
    take: batchSize,
    select: {
      id: true,
    },
  });

  const blobUrls = new Set<string>();
  for (const design of expiredDesigns) {
    const urls = await prisma.$transaction((tx) =>
      permanentlyDeleteEditorDesign(tx, design.id),
    );
    for (const url of urls) {
      blobUrls.add(url);
    }
  }

  for (const url of blobUrls) {
    void deleteBlobIfExists(url);
  }

  return NextResponse.json({
    ok: true,
    purgedCount: expiredDesigns.length,
    batchSize,
    deletedBlobCount: blobUrls.size,
  });
}
