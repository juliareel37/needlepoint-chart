import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { resolveOwnedFolderId } from "@/lib/editor-v2/server/designFolders";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const appUserId = await getCurrentUserId();
  if (!appUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { designIds?: unknown; folderId?: unknown }
    | null;
  const designIds = Array.isArray(body?.designIds)
    ? body.designIds.filter((value): value is string => typeof value === "string")
    : [];

  if (designIds.length === 0) {
    return NextResponse.json({ error: "Design ids are required." }, { status: 400 });
  }

  try {
    const folderId = await resolveOwnedFolderId(appUserId, body?.folderId ?? null);
    const ownedDesigns = await prisma.editorDesign.findMany({
      where: {
        id: { in: designIds },
        appUserId,
      },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    if (ownedDesigns.length !== designIds.length) {
      return NextResponse.json({ error: "One or more designs were not found." }, { status: 404 });
    }

    if (ownedDesigns.some((design) => design.deletedAt !== null)) {
      return NextResponse.json(
        { error: "Designs in Trash cannot be moved between folders." },
        { status: 409 },
      );
    }

    await prisma.editorDesign.updateMany({
      where: {
        id: { in: designIds },
        appUserId,
      },
      data: {
        folderId,
      },
    });

    return NextResponse.json({
      ok: true,
      designIds,
      folderId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Couldn't move designs." },
      { status: 404 },
    );
  }
}
