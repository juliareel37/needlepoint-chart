import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { isWipVersioningEnabled } from "@/lib/wipVersioning";

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
    imageDataUrl: string | null; // Vercel Blob URL (https://...) or legacy data: URL
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

type SaveSourceInput = "manual" | "autosave";

function toPrismaSaveSource(value: SaveSourceInput | undefined) {
  return value === "autosave" ? "AUTOSAVE" : "MANUAL";
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
    | { draft?: DraftPayload; title?: string; forceVersion?: boolean; saveSource?: SaveSourceInput }
    | null;

  if (!body?.draft || typeof body.draft !== "object") {
    return NextResponse.json({ error: "Missing draft" }, { status: 400 });
  }
  const draft = body.draft;
  const forceVersion = body?.forceVersion === true;
  const saveSource = toPrismaSaveSource(body?.saveSource);

  const title =
    typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Untitled Pattern";

  const now = new Date();
  const dataHash = hashDraft(draft);
  const versioningEnabled = isWipVersioningEnabled();
  const shouldVersion = versioningEnabled || forceVersion;

  const saved = await prisma.$transaction(async (tx) => {
    const created = await tx.patternDraft.create({
      data: {
        userId,
        title,
        data: draft,
        lastSaveSource: saveSource,
        ...(shouldVersion
          ? {
              lastVersionAt: now,
              lastVersionHash: dataHash,
            }
          : {}),
      },
    });
    if (shouldVersion) {
      await tx.patternVersion.create({
        data: {
          draftId: created.id,
          data: draft,
          dataHash,
          saveSource,
        },
      });
    }
    return created;
  });

  return NextResponse.json({
    ok: true,
    id: saved.id,
    title: saved.title,
    createdAt: saved.createdAt,
    updatedAt: saved.updatedAt,
    versioned: shouldVersion,
  });
}
