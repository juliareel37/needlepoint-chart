import { del, list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractEditorV2TraceBlobUrls } from "@/lib/blob";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.BLOB_GC_SECRET || secret !== process.env.BLOB_GC_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const editorDesigns = await prisma.editorDesign.findMany({
    select: { data: true },
  });

  const referenced = new Set<string>();
  for (const design of editorDesigns) {
    for (const url of extractEditorV2TraceBlobUrls(design.data)) {
      referenced.add(url);
    }
  }

  const { searchParams } = new URL(req.url);
  const dryRun = searchParams.get("dryRun") === "1";
  const minAgeHoursValue = Number(searchParams.get("minAgeHours") ?? "24");
  const minAgeHours =
    Number.isFinite(minAgeHoursValue) && minAgeHoursValue >= 0 ? minAgeHoursValue : 24;
  const minAgeMs = minAgeHours * 60 * 60 * 1000;
  const now = Date.now();
  let deleted = 0;
  let candidates = 0;
  let cursor: string | undefined;

  while (true) {
    const page = await list({ cursor, limit: 1000 });
    for (const blob of page.blobs) {
      if (referenced.has(blob.url)) continue;
      const uploadedAt = new Date(blob.uploadedAt).getTime();
      if (Number.isNaN(uploadedAt)) continue;
      if (now - uploadedAt < minAgeMs) continue;
      candidates += 1;
      if (!dryRun) {
        await del(blob.url);
        deleted += 1;
      }
    }

    const nextCursor = page.cursor ?? undefined;
    if (!nextCursor || nextCursor === cursor) break;
    cursor = nextCursor;
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    deleted,
    candidates,
    referenced: referenced.size,
    minAgeHours,
  });
}
