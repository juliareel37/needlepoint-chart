"use client";

import type { EditorDocumentState } from "@/lib/editor-v2/editor/store";
import {
  type PersistedEditorV2DesignRecord,
  hydrateEditorV2Document,
  serializeEditorV2Document,
} from "@/lib/editor-v2/persistence/designs";

export interface SavedEditorV2DocumentRecord {
  storageId: string;
  title: string;
  gridWidth: number;
  gridHeight: number;
  updatedAt: string;
}

export interface ListSavedEditorV2DocumentsResult {
  documents: SavedEditorV2DocumentRecord[];
  hasMore: boolean;
  nextOffset: number | null;
}

export interface SaveEditorV2DocumentResult {
  storageId: string;
  title: string;
  gridWidth: number;
  gridHeight: number;
  createdAt: string;
  updatedAt: string;
  versionToken: string;
}

export interface EditorDesignVersionListItem {
  id: string;
  createdAt: string;
  saveSource: "MANUAL" | "AUTOSAVE" | "RESTORE" | null;
}

export interface LoadEditorV2VersionResult {
  versionId: string;
  designId: string;
  document: EditorDocumentState;
  createdAt: string;
  saveSource: "MANUAL" | "AUTOSAVE" | "RESTORE" | null;
}

export interface RestoreEditorV2VersionResult {
  storageId: string;
  title: string;
  gridWidth: number;
  gridHeight: number;
  updatedAt: string;
  versionToken: string;
  restoredVersionId: string;
  document: EditorDocumentState;
}

export interface LoadEditorV2DocumentResult {
  document: EditorDocumentState;
  versionToken: string;
  storageId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeleteEditorV2DocumentResult {
  storageId: string;
}

export class EditorV2PersistenceError extends Error {
  status: number;
  versionToken: string | null;

  constructor(message: string, status = 500, versionToken: string | null = null) {
    super(message);
    this.name = "EditorV2PersistenceError";
    this.status = status;
    this.versionToken = versionToken;
  }
}

export async function listSavedEditorV2Documents({
  limit,
  offset,
}: {
  limit?: number;
  offset?: number;
} = {}): Promise<ListSavedEditorV2DocumentsResult> {
  const searchParams = new URLSearchParams();

  if (typeof limit === "number") {
    searchParams.set("limit", String(limit));
  }

  if (typeof offset === "number") {
    searchParams.set("offset", String(offset));
  }

  const response = await fetch(
    `/api/editor-v2/designs${searchParams.size ? `?${searchParams.toString()}` : ""}`,
    {
    method: "GET",
    credentials: "same-origin",
    },
  );
  const body = (await response.json().catch(() => null)) as
    | {
        designs?: Array<{
          id: string;
          title: string;
          gridWidth: number;
          gridHeight: number;
          updatedAt: string;
        }>;
        hasMore?: boolean;
        nextOffset?: number | null;
        error?: string;
      }
    | null;

  if (!response.ok) {
    throw new EditorV2PersistenceError(
      body?.error ?? "Couldn't load your saved designs.",
      response.status,
    );
  }

  return {
    documents: Array.isArray(body?.designs)
      ? body.designs.map((design) => ({
        storageId: design.id,
        title: design.title,
        gridWidth: design.gridWidth,
        gridHeight: design.gridHeight,
        updatedAt: design.updatedAt,
      }))
      : [],
    hasMore: body?.hasMore === true,
    nextOffset: typeof body?.nextOffset === "number" ? body.nextOffset : null,
  };
}

export async function loadSavedEditorV2Document(
  storageId: string,
): Promise<LoadEditorV2DocumentResult> {
  const response = await fetch(`/api/editor-v2/designs/${storageId}`, {
    method: "GET",
    credentials: "same-origin",
  });
  const body = (await response.json().catch(() => null)) as
    | ({ error?: string; versionToken?: string } & Partial<PersistedEditorV2DesignRecord>)
    | null;

  if (
    !response.ok ||
    !body?.data ||
    !body.id ||
    !body.createdAt ||
    !body.updatedAt ||
    !body.versionToken
  ) {
    throw new EditorV2PersistenceError(
      body?.error ?? "Couldn't load this design.",
      response.status,
      body?.versionToken ?? null,
    );
  }

  return {
    document: hydrateEditorV2Document({
      id: body.id,
      createdAt: body.createdAt,
      updatedAt: body.updatedAt,
      data: body.data,
    }),
    versionToken: body.versionToken,
    storageId: body.id,
    createdAt: body.createdAt,
    updatedAt: body.updatedAt,
  };
}

export async function saveEditorV2Document(
  document: EditorDocumentState,
  storageId?: string,
  baseVersion?: string | null,
  saveSource: "manual" | "autosave" = "manual",
): Promise<SaveEditorV2DocumentResult> {
  const response = await fetch(
    storageId ? `/api/editor-v2/designs/${storageId}` : "/api/editor-v2/designs",
    {
      method: storageId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        data: serializeEditorV2Document(document),
        baseVersion: baseVersion ?? null,
        saveSource,
      }),
    },
  );
  const body = (await response.json().catch(() => null)) as
    | ({
        id?: string;
        title?: string;
        gridWidth?: number;
        gridHeight?: number;
        createdAt?: string;
        updatedAt?: string;
        versionToken?: string;
        error?: string;
      })
    | null;

  if (
    !response.ok ||
    !body?.id ||
    !body.title ||
    typeof body.gridWidth !== "number" ||
    typeof body.gridHeight !== "number" ||
    !body.createdAt ||
    !body.updatedAt ||
    !body.versionToken
  ) {
    throw new EditorV2PersistenceError(
      body?.error ?? "Couldn't save this design.",
      response.status,
      body?.versionToken ?? null,
    );
  }

  return {
    storageId: body.id,
    title: body.title,
    gridWidth: body.gridWidth,
    gridHeight: body.gridHeight,
    createdAt: body.createdAt,
    updatedAt: body.updatedAt,
    versionToken: body.versionToken,
  };
}

export async function listEditorV2DesignVersions(
  storageId: string,
): Promise<EditorDesignVersionListItem[]> {
  const response = await fetch(`/api/editor-v2/designs/${storageId}/versions`, {
    method: "GET",
    credentials: "same-origin",
  });
  const body = (await response.json().catch(() => null)) as
    | {
        versions?: Array<{
          id: string;
          createdAt: string;
          saveSource: "MANUAL" | "AUTOSAVE" | "RESTORE" | null;
        }>;
        error?: string;
      }
    | null;

  if (!response.ok) {
    throw new EditorV2PersistenceError(
      body?.error ?? "Couldn't load version history.",
      response.status,
    );
  }

  return Array.isArray(body?.versions) ? body.versions : [];
}

export async function loadEditorV2DesignVersion(
  storageId: string,
  versionId: string,
): Promise<LoadEditorV2VersionResult> {
  const response = await fetch(`/api/editor-v2/designs/${storageId}/versions/${versionId}`, {
    method: "GET",
    credentials: "same-origin",
  });
  const body = (await response.json().catch(() => null)) as
    | {
        versionId?: string;
        designId?: string;
        createdAt?: string;
        saveSource?: "MANUAL" | "AUTOSAVE" | "RESTORE" | null;
        data?: PersistedEditorV2DesignRecord["data"];
        error?: string;
      }
    | null;

  if (
    !response.ok ||
    !body?.versionId ||
    !body.designId ||
    !body.createdAt ||
    !body.data
  ) {
    throw new EditorV2PersistenceError(
      body?.error ?? "Couldn't load this version.",
      response.status,
    );
  }

  const document = hydrateEditorV2Document({
    id: body.designId,
    createdAt: body.createdAt,
    updatedAt: body.createdAt,
    data: body.data,
  });
  document.metadata.persistedVersionId = body.versionId;

  return {
    versionId: body.versionId,
    designId: body.designId,
    createdAt: body.createdAt,
    saveSource: body.saveSource ?? null,
    document,
  };
}

export async function restoreEditorV2DesignVersion(
  storageId: string,
  versionId: string,
): Promise<RestoreEditorV2VersionResult> {
  const response = await fetch(`/api/editor-v2/designs/${storageId}/versions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ versionId }),
  });
  const body = (await response.json().catch(() => null)) as
    | {
        id?: string;
        storageId?: string;
        title?: string;
        gridWidth?: number;
        gridHeight?: number;
        updatedAt?: string;
        versionToken?: string;
        restoredVersionId?: string;
        data?: PersistedEditorV2DesignRecord["data"];
        error?: string;
      }
    | null;

  if (
    !response.ok ||
    !body?.storageId ||
    !body.title ||
    typeof body.gridWidth !== "number" ||
    typeof body.gridHeight !== "number" ||
    !body.updatedAt ||
    !body.versionToken ||
    !body.restoredVersionId ||
    !body.data
  ) {
    throw new EditorV2PersistenceError(
      body?.error ?? "Couldn't restore this version.",
      response.status,
      body?.versionToken ?? null,
    );
  }

  const document = hydrateEditorV2Document({
    id: body.storageId,
    createdAt: body.updatedAt,
    updatedAt: body.updatedAt,
    data: body.data,
  });
  document.metadata.persistedVersionId = body.restoredVersionId;

  return {
    storageId: body.storageId,
    title: body.title,
    gridWidth: body.gridWidth,
    gridHeight: body.gridHeight,
    updatedAt: body.updatedAt,
    versionToken: body.versionToken,
    restoredVersionId: body.restoredVersionId,
    document,
  };
}

export async function deleteSavedEditorV2Document(
  storageId: string,
): Promise<DeleteEditorV2DocumentResult> {
  const response = await fetch(`/api/editor-v2/designs/${storageId}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  const body = (await response.json().catch(() => null)) as
    | {
        id?: string;
        error?: string;
      }
    | null;

  if (!response.ok || !body?.id) {
    throw new EditorV2PersistenceError(
      body?.error ?? "Couldn't delete this design.",
      response.status,
    );
  }

  return {
    storageId: body.id,
  };
}
