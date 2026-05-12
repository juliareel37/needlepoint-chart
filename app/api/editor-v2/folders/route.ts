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

export async function GET() {
  const appUserId = await getCurrentUserId();
  if (!appUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folders = await prisma.editorDesignFolder.findMany({
    where: { appUserId },
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
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
    folders: folders.map(serializeEditorDesignFolder),
  });
}

export async function POST(req: Request) {
  const appUserId = await getCurrentUserId();
  if (!appUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => null)) as { name?: unknown } | null;
    const name = assertEditorDesignFolderName(body?.name);
    const created = await prisma.editorDesignFolder.create({
      data: {
        appUserId,
        name,
      },
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
      folder: serializeEditorDesignFolder(created),
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
