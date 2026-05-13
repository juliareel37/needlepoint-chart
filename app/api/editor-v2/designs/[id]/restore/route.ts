import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { getDeletedEditorDesignMetadata } from "@/lib/editor-v2/server/designDeletion";

export const runtime = "nodejs";

type RouteContext = { params: { id: string } } | { params: Promise<{ id: string }> };

export async function POST(_req: Request, context: RouteContext) {
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
      title: true,
      gridWidth: true,
      gridHeight: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      purgeAfterAt: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!existing.deletedAt) {
    return NextResponse.json({ error: "Design is not in Recently Deleted." }, { status: 409 });
  }

  const restored = await prisma.editorDesign.update({
    where: { id: existing.id },
    data: {
      deletedAt: null,
      purgeAfterAt: null,
    },
  });

  return NextResponse.json({
    ok: true,
    id: restored.id,
    title: restored.title,
    gridWidth: restored.gridWidth,
    gridHeight: restored.gridHeight,
    createdAt: restored.createdAt.toISOString(),
    updatedAt: restored.updatedAt.toISOString(),
    versionToken: restored.updatedAt.toISOString(),
    restoredFromDeleted: getDeletedEditorDesignMetadata({
      id: existing.id,
      title: existing.title,
      deletedAt: existing.deletedAt,
      purgeAfterAt: existing.purgeAfterAt,
    }),
  });
}
