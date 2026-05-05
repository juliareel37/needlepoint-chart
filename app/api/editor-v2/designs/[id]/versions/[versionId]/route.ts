import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { parsePersistedEditorV2Design } from "@/lib/editor-v2/persistence/designs";
import { getDeletedEditorDesignMetadata } from "@/lib/editor-v2/server/designDeletion";

export const runtime = "nodejs";

type RouteContext =
  | { params: { id: string; versionId: string } }
  | { params: Promise<{ id: string; versionId: string }> };

function deletedDesignResponse(design: {
  id: string;
  title: string;
  deletedAt: Date;
  purgeAfterAt: Date | null;
}) {
  return NextResponse.json(
    {
      error: "This design is in Recently Deleted.",
      deletedDesign: getDeletedEditorDesignMetadata(design),
    },
    { status: 410 },
  );
}

export async function GET(_req: Request, context: RouteContext) {
  const appUserId = await getCurrentUserId();
  if (!appUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await Promise.resolve(context.params);
  const id = params?.id;
  const versionId = params?.versionId;
  if (!id || !versionId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const design = await prisma.editorDesign.findFirst({
    where: { id, appUserId },
    select: {
      id: true,
      title: true,
      createdAt: true,
      deletedAt: true,
      purgeAfterAt: true,
    },
  });
  if (!design) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (design.deletedAt) {
    return deletedDesignResponse({
      ...design,
      deletedAt: design.deletedAt,
    });
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
