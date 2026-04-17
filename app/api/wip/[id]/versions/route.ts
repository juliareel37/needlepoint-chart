import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isWipVersioningEnabled } from "@/lib/wipVersioning";

export const runtime = "nodejs";

type RouteContext = { params: { id: string } } | { params: Promise<{ id: string }> };

type RestoreBody = { versionId?: string };

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

  const draft = await prisma.patternDraft.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!draft) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const versions = await prisma.patternVersion.findMany({
    where: { draftId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({ versions });
}

export async function POST(req: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await Promise.resolve(context.params);
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as RestoreBody | null;
  const versionId = body?.versionId;
  if (!versionId) {
    return NextResponse.json({ error: "Missing versionId" }, { status: 400 });
  }

  const draft = await prisma.patternDraft.findFirst({
    where: { id, userId },
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

  const now = new Date();
  const versioningEnabled = isWipVersioningEnabled();
  const updated = await prisma.patternDraft.update({
    where: { id },
    data: {
      data: version.data === null ? Prisma.JsonNull : (version.data as Prisma.InputJsonValue),
      lastSaveSource: "RESTORE",
      ...(versioningEnabled
        ? {
            lastVersionAt: now,
            lastVersionHash: version.dataHash,
          }
        : {}),
    },
  });

  return NextResponse.json({ ok: true, draft: updated.data, updatedAt: updated.updatedAt });
}
