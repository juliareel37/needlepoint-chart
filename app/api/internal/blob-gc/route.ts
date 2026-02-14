import { del, list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractBlobUrl } from "@/lib/blob";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.BLOB_GC_SECRET || secret !== process.env.BLOB_GC_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const drafts = await prisma.patternDraft.findMany({
    select: { data: true, versions: { select: { data: true } } },
  });

  const referenced = new Set<string>();
  for (const draft of drafts) {
    const draftBlob = extractBlobUrl(draft.data);
    if (draftBlob) referenced.add(draftBlob);
    for (const version of draft.versions) {
      const versionBlob = extractBlobUrl(version.data);
      if (versionBlob) referenced.add(versionBlob);
    }
  }

  const minAgeMs = 24 * 60 * 60 * 1000;
  const now = Date.now();
  let deleted = 0;
  let cursor: string | undefined;

  while (true) {
    const page = await list({ cursor, limit: 1000 });
    for (const blob of page.blobs) {
      if (referenced.has(blob.url)) continue;
      const uploadedAt = new Date(blob.uploadedAt).getTime();
      if (Number.isNaN(uploadedAt)) continue;
      if (now - uploadedAt < minAgeMs) continue;
      await del(blob.url);
      deleted += 1;
    }

    const nextCursor = page.cursor ?? undefined;
    if (!nextCursor || nextCursor === cursor) break;
    cursor = nextCursor;
  }

  return NextResponse.json({
    ok: true,
    deleted,
    referenced: referenced.size,
  });
}
