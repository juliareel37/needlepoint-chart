import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { deleteBlobIfExists, extractEditorV2TraceBlobUrls } from "@/lib/blob";
import {
  normalizeProjectTitle,
  parsePersistedEditorV2Design,
} from "@/lib/editor-v2/persistence/designs";

export const runtime = "nodejs";

type RouteContext = { params: { id: string } } | { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await Promise.resolve(context.params);
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const design = await prisma.editorDesign.findFirst({
    where: { id, userId },
    select: {
      id: true,
      data: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!design) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsedData = parsePersistedEditorV2Design(design.data);
  if (!parsedData) {
    return NextResponse.json({ error: "Stored design is invalid" }, { status: 500 });
  }

  return NextResponse.json({
    id: design.id,
    createdAt: design.createdAt.toISOString(),
    updatedAt: design.updatedAt.toISOString(),
    versionToken: design.updatedAt.toISOString(),
    data: parsedData,
  });
}

export async function PUT(req: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await Promise.resolve(context.params);
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as
    | { data?: unknown; baseVersion?: unknown }
    | null;
  const data = parsePersistedEditorV2Design(body?.data);
  if (!data) {
    return NextResponse.json({ error: "Invalid design payload" }, { status: 400 });
  }

  const existing = await prisma.editorDesign.findFirst({
    where: { id, userId },
    select: { id: true, data: true, updatedAt: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const baseVersion =
    typeof body?.baseVersion === "string" ? body.baseVersion : null;
  const currentVersionToken = existing.updatedAt.toISOString();

  if (baseVersion && baseVersion !== currentVersionToken) {
    return NextResponse.json(
      {
        error: "This design changed on the server before your save completed.",
        versionToken: currentVersionToken,
      },
      { status: 409 },
    );
  }

  const updated = await prisma.editorDesign.update({
    where: { id },
    data: {
      title: normalizeProjectTitle(data.project.title),
      data: data as unknown as Prisma.InputJsonValue,
      gridWidth: data.grid.width,
      gridHeight: data.grid.height,
    },
  });

  const previousBlobUrls = new Set(extractEditorV2TraceBlobUrls(existing.data));
  const nextBlobUrls = new Set(extractEditorV2TraceBlobUrls(data));
  for (const url of previousBlobUrls) {
    if (nextBlobUrls.has(url)) {
      continue;
    }
    void deleteBlobIfExists(url);
  }

  return NextResponse.json({
    ok: true,
    id: updated.id,
    title: updated.title,
    gridWidth: updated.gridWidth,
    gridHeight: updated.gridHeight,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    versionToken: updated.updatedAt.toISOString(),
  });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await Promise.resolve(context.params);
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const existing = await prisma.editorDesign.findFirst({
    where: { id, userId },
    select: {
      id: true,
      data: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.editorDesign.delete({
    where: { id: existing.id },
  });

  for (const url of extractEditorV2TraceBlobUrls(existing.data)) {
    void deleteBlobIfExists(url);
  }

  return NextResponse.json({ ok: true, id: existing.id });
}
