import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  normalizeProjectTitle,
  parsePersistedEditorV2Design,
} from "@/lib/editor-v2/persistence/designs";
import { loadLibraryDesignPage } from "@/lib/library/designs";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 24;

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const requestedLimitParam = url.searchParams.get("limit");
  const requestedOffsetParam = url.searchParams.get("offset");
  const requestedLimit =
    requestedLimitParam === null ? Number.NaN : Number(requestedLimitParam);
  const requestedOffset =
    requestedOffsetParam === null ? Number.NaN : Number(requestedOffsetParam);
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(MAX_LIMIT, Math.floor(requestedLimit)))
    : DEFAULT_LIMIT;
  const offset = Number.isFinite(requestedOffset)
    ? Math.max(0, Math.floor(requestedOffset))
    : 0;

  return NextResponse.json(await loadLibraryDesignPage({ userId, limit, offset }));
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
    versionToken: created.updatedAt.toISOString(),
  });
}
