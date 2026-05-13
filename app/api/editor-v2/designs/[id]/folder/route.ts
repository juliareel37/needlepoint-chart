import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { resolveOwnedFolderId } from "@/lib/editor-v2/server/designFolders";

export const runtime = "nodejs";

type RouteContext = { params: { id: string } } | { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  const appUserId = await getCurrentUserId();
  if (!appUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await Promise.resolve(context.params);
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const existing = await prisma.editorDesign.findFirst({
    where: { id, appUserId },
    select: {
      id: true,
      deletedAt: true,
      folderId: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.deletedAt) {
    return NextResponse.json(
      { error: "Designs in Trash cannot be moved between folders." },
      { status: 409 },
    );
  }

  try {
    const body = (await req.json().catch(() => null)) as { folderId?: unknown } | null;
    const folderId = await resolveOwnedFolderId(appUserId, body?.folderId ?? null);
    const updated = await prisma.editorDesign.update({
      where: { id: existing.id },
      data: { folderId },
      select: {
        id: true,
        folderId: true,
      },
    });

    return NextResponse.json({
      ok: true,
      id: updated.id,
      folderId: updated.folderId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Couldn't move design." },
      { status: 404 },
    );
  }
}
