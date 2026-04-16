import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  normalizeProjectTitle,
  parsePersistedEditorV2Design,
} from "@/lib/editor-v2/persistence/designs";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const designs = await prisma.editorDesign.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      gridWidth: true,
      gridHeight: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    designs: designs.map((design) => ({
      ...design,
      updatedAt: design.updatedAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { data?: unknown }
    | null;
  const data = parsePersistedEditorV2Design(body?.data);

  if (!data) {
    return NextResponse.json({ error: "Invalid design payload" }, { status: 400 });
  }

  const title = normalizeProjectTitle(data.project.title);
  const created = await prisma.editorDesign.create({
    data: {
      userId,
      title,
      data: data as unknown as Prisma.InputJsonValue,
      gridWidth: data.grid.width,
      gridHeight: data.grid.height,
    },
  });

  return NextResponse.json({
    ok: true,
    id: created.id,
    title: created.title,
    gridWidth: created.gridWidth,
    gridHeight: created.gridHeight,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  });
}
