import type { Prisma, PrismaClient } from "@prisma/client";
import { extractEditorV2TraceBlobUrls } from "@/lib/blob";

type DesignDeletionClient = PrismaClient | Prisma.TransactionClient;

export const EDITOR_DESIGN_DELETED_RETENTION_DAYS = 30;

export interface DeletedEditorDesignMetadata {
  id: string;
  title: string;
  deletedAt: string;
  purgeAfterAt: string;
}

export function getActiveEditorDesignWhere<T extends Prisma.EditorDesignWhereInput>(
  where: T,
): Prisma.EditorDesignWhereInput {
  return {
    ...where,
    deletedAt: null,
  };
}

export function getDeletedEditorDesignWhere<T extends Prisma.EditorDesignWhereInput>(
  where: T,
): Prisma.EditorDesignWhereInput {
  return {
    ...where,
    deletedAt: {
      not: null,
    },
  };
}

export function getEditorDesignPurgeAfterAt(deletedAt: Date): Date {
  return new Date(
    deletedAt.getTime() + EDITOR_DESIGN_DELETED_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );
}

export function getDeletedEditorDesignMetadata(
  design: {
    id: string;
    title: string;
    deletedAt: Date;
    purgeAfterAt: Date | null;
  },
): DeletedEditorDesignMetadata {
  return {
    id: design.id,
    title: design.title,
    deletedAt: design.deletedAt.toISOString(),
    purgeAfterAt: (design.purgeAfterAt ?? getEditorDesignPurgeAfterAt(design.deletedAt)).toISOString(),
  };
}

export async function permanentlyDeleteEditorDesign(
  client: DesignDeletionClient,
  designId: string,
): Promise<string[]> {
  const existing = await client.editorDesign.findUnique({
    where: { id: designId },
    select: {
      id: true,
      data: true,
      versions: {
        select: {
          data: true,
        },
      },
    },
  });

  if (!existing) {
    return [];
  }

  const blobUrls = new Set<string>(extractEditorV2TraceBlobUrls(existing.data));
  for (const version of existing.versions) {
    for (const url of extractEditorV2TraceBlobUrls(version.data)) {
      blobUrls.add(url);
    }
  }

  await client.editorDesign.delete({
    where: { id: existing.id },
  });

  return [...blobUrls];
}
