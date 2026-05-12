import { prisma } from "@/lib/db";

export async function resolveOwnedFolderId(
  appUserId: string,
  folderId: unknown,
): Promise<string | null> {
  if (folderId === null) {
    return null;
  }

  if (typeof folderId !== "string") {
    throw new Error("Folder id must be a string or null.");
  }

  const existingFolder = await prisma.editorDesignFolder.findFirst({
    where: {
      id: folderId,
      appUserId,
    },
    select: {
      id: true,
    },
  });

  if (!existingFolder) {
    throw new Error("Folder not found.");
  }

  return existingFolder.id;
}
