import { NextResponse } from "next/server";
import { deleteBlobIfExists } from "@/lib/blob";
import { prisma } from "@/lib/db";
import {
  deleteGuestTraceAssetsByDraftId,
  isGuestDraftId,
} from "@/lib/editor-v2/server/guestTraceAssets";

export const runtime = "nodejs";

type RouteContext = { params: { draftId: string } } | { params: Promise<{ draftId: string }> };

export async function DELETE(_req: Request, context: RouteContext) {
  const params = await Promise.resolve(context.params);
  const draftId = params?.draftId;

  if (!isGuestDraftId(draftId)) {
    return NextResponse.json({ error: "Invalid guest draft id" }, { status: 400 });
  }

  const urls = await deleteGuestTraceAssetsByDraftId(prisma, draftId);

  for (const url of urls) {
    void deleteBlobIfExists(url);
  }

  return NextResponse.json({
    ok: true,
    draftId,
    deletedBlobCount: urls.length,
  });
}
