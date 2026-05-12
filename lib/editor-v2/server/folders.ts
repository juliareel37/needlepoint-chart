import { Prisma } from "@prisma/client";

export interface EditorDesignFolderRecord {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  designCount: number;
}

export class EditorDesignFolderError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "EditorDesignFolderError";
    this.status = status;
  }
}

export function normalizeEditorDesignFolderName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function assertEditorDesignFolderName(name: unknown): string {
  if (typeof name !== "string") {
    throw new EditorDesignFolderError("Folder name is required.", 400);
  }

  const normalizedName = normalizeEditorDesignFolderName(name);
  if (normalizedName.length === 0) {
    throw new EditorDesignFolderError("Folder name is required.", 400);
  }

  if (normalizedName.length > 80) {
    throw new EditorDesignFolderError("Folder names must be 80 characters or fewer.", 400);
  }

  return normalizedName;
}

export function isFolderNameUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export function serializeEditorDesignFolder(record: {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: { designs?: number };
}): EditorDesignFolderRecord {
  return {
    id: record.id,
    name: record.name,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    designCount: record._count?.designs ?? 0,
  };
}
