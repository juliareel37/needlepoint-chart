import { createHash } from "crypto";
import type { Prisma, PrismaClient, SaveSource } from "@prisma/client";
import { extractEditorV2TraceBlobUrls } from "@/lib/blob";
import type { PersistedEditorV2Design } from "../persistence/designs";

export const EDITOR_V2_VERSION_INTERVAL_MS = 3 * 60 * 1000;
export const EDITOR_V2_VERSION_HISTORY_LIMIT = 50;

type VersioningClient = PrismaClient | Prisma.TransactionClient;

type EditorDesignState = {
  data: unknown;
  lastVersionAt: Date | string | null;
  lastVersionHash: string | null;
};

type PrunedVersionRecord = {
  id: string;
  data: unknown;
};

export function hashPersistedEditorV2Design(data: PersistedEditorV2Design): string {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

export function shouldCreateEditorDesignVersion({
  saveSource,
  dataHash,
  existing,
  now,
}: {
  saveSource: SaveSource;
  dataHash: string;
  existing: EditorDesignState | null;
  now: Date;
}): boolean {
  if (!existing) {
    return true;
  }

  if (dataHash === existing.lastVersionHash) {
    return false;
  }

  if (saveSource === "MANUAL" || saveSource === "RESTORE") {
    return true;
  }

  const lastVersionAt = existing.lastVersionAt ? new Date(existing.lastVersionAt) : null;
  return (
    !lastVersionAt ||
    now.getTime() - lastVersionAt.getTime() >= EDITOR_V2_VERSION_INTERVAL_MS
  );
}

export async function pruneEditorDesignVersions(
  client: VersioningClient,
  designId: string,
): Promise<PrunedVersionRecord[]> {
  const prunedVersions = await client.editorDesignVersion.findMany({
    where: { designId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: EDITOR_V2_VERSION_HISTORY_LIMIT,
    select: {
      id: true,
      data: true,
    },
  });

  if (prunedVersions.length === 0) {
    return [];
  }

  await client.editorDesignVersion.deleteMany({
    where: {
      id: {
        in: prunedVersions.map((version) => version.id),
      },
    },
  });

  return prunedVersions;
}

export async function cleanupPrunedVersionBlobs({
  client,
  designId,
  currentDesignData,
  prunedVersions,
}: {
  client: VersioningClient;
  designId: string;
  currentDesignData: unknown;
  prunedVersions: PrunedVersionRecord[];
}): Promise<string[]> {
  if (prunedVersions.length === 0) {
    return [];
  }

  const retainedVersions = await client.editorDesignVersion.findMany({
    where: { designId },
    select: { data: true },
  });

  const retainedBlobUrls = new Set<string>(extractEditorV2TraceBlobUrls(currentDesignData));
  for (const version of retainedVersions) {
    for (const url of extractEditorV2TraceBlobUrls(version.data)) {
      retainedBlobUrls.add(url);
    }
  }

  const orphanedBlobUrls = new Set<string>();
  for (const version of prunedVersions) {
    for (const url of extractEditorV2TraceBlobUrls(version.data)) {
      if (!retainedBlobUrls.has(url)) {
        orphanedBlobUrls.add(url);
      }
    }
  }

  return [...orphanedBlobUrls];
}

export async function createEditorDesignVersionSnapshot(
  client: VersioningClient,
  {
    designId,
    data,
    dataHash,
    saveSource,
  }: {
    designId: string;
    data: PersistedEditorV2Design;
    dataHash: string;
    saveSource: SaveSource;
  },
): Promise<PrunedVersionRecord[]> {
  await client.editorDesignVersion.create({
    data: {
      designId,
      data: data as unknown as Prisma.InputJsonValue,
      dataHash,
      saveSource,
    },
  });

  return pruneEditorDesignVersions(client, designId);
}
