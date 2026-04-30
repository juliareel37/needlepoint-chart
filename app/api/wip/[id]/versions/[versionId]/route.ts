import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext =
  | { params: { id: string; versionId: string } }
  | { params: Promise<{ id: string; versionId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await Promise.resolve(context.params);
  const id = params?.id;
  const versionId = params?.versionId;
  if (!id || !versionId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const draft = await prisma.patternDraft.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!draft) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const version = await prisma.patternVersion.findFirst({
    where: { id: versionId, draftId: id },
  });

  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: version.id,
    draftId: id,
    draft: version.data,
    createdAt: version.createdAt,
  });
}
