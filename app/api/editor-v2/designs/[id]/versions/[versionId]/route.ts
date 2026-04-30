import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { parsePersistedEditorV2Design } from "@/lib/editor-v2/persistence/designs";

export const runtime = "nodejs";

type RouteContext =
  | { params: { id: string; versionId: string } }
  | { params: Promise<{ id: string; versionId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await Promise.resolve(context.params);
  const id = params?.id;
  const versionId = params?.versionId;
  if (!id || !versionId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const design = await prisma.editorDesign.findFirst({
    where: { id, userId },
    select: {
      id: true,
      createdAt: true,
    },
  });
  if (!design) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const version = await prisma.editorDesignVersion.findFirst({
    where: { id: versionId, designId: id },
    select: {
      id: true,
      data: true,
      createdAt: true,
      saveSource: true,
    },
  });
  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const data = parsePersistedEditorV2Design(version.data);
  if (!data) {
    return NextResponse.json({ error: "Stored version is invalid" }, { status: 500 });
  }

  return NextResponse.json({
    id: version.id,
    versionId: version.id,
    designId: id,
    createdAt: version.createdAt.toISOString(),
    saveSource: version.saveSource,
    data,
    designCreatedAt: design.createdAt.toISOString(),
  });
}
