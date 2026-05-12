import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import {
  assertEditorDesignFolderName,
  EditorDesignFolderError,
  isFolderNameUniqueConstraintError,
  serializeEditorDesignFolder,
} from "@/lib/editor-v2/server/folders";

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

  try {
    const body = (await req.json().catch(() => null)) as { name?: unknown } | null;
    const name = assertEditorDesignFolderName(body?.name);
    const existing = await prisma.editorDesignFolder.findFirst({
      where: { id, appUserId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Folder not found." }, { status: 404 });
    }

    const updated = await prisma.editorDesignFolder.update({
      where: { id: existing.id },
      data: { name },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            designs: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      folder: serializeEditorDesignFolder(updated),
    });
  } catch (error) {
    if (error instanceof EditorDesignFolderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (isFolderNameUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "You already have a folder with that name." },
        { status: 409 },
      );
    }

    throw error;
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const appUserId = await getCurrentUserId();
  if (!appUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await Promise.resolve(context.params);
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const existing = await prisma.editorDesignFolder.findFirst({
    where: { id, appUserId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Folder not found." }, { status: 404 });
  }

  await prisma.editorDesignFolder.delete({
    where: { id: existing.id },
  });

  return NextResponse.json({
    ok: true,
    id: existing.id,
    name: existing.name,
  });
}
