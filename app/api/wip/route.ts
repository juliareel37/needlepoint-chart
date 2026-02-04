import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type DraftPayload = {
  version: number;
  title: string;
  gridW: number;
  gridH: number;
  grid: number[];
  gridMode: "stitches" | "inches";
  meshCount: number;
  widthIn: number;
  heightIn: number;
  trace: {
    imageDataUrl: string | null;
    opacity: number;
    scale: number;
    offsetX: number;
    offsetY: number;
    locked: boolean;
  };
};

function hashDraft(draft: DraftPayload) {
  return createHash("sha256").update(JSON.stringify(draft)).digest("hex");
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const drafts = await prisma.patternDraft.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ drafts });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { draft?: DraftPayload; title?: string }
    | null;

  if (!body?.draft || typeof body.draft !== "object") {
    return NextResponse.json({ error: "Missing draft" }, { status: 400 });
  }

  const title =
    typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Untitled Pattern";

  const now = new Date();
  const dataHash = hashDraft(body.draft);

  const saved = await prisma.$transaction(async (tx) => {
    const created = await tx.patternDraft.create({
      data: {
        userId,
        title,
        data: body.draft,
        lastVersionAt: now,
        lastVersionHash: dataHash,
      },
    });
    await tx.patternVersion.create({
      data: {
        draftId: created.id,
        data: body.draft,
        dataHash,
      },
    });
    return created;
  });

  return NextResponse.json({
    ok: true,
    id: saved.id,
    title: saved.title,
    createdAt: saved.createdAt,
    updatedAt: saved.updatedAt,
  });
}
