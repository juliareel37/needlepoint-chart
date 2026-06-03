"use client";

import type { EditorDocumentState } from "@/lib/editor-v2/editor/store";
import type { LibraryTracePlacement } from "@/lib/library/designs";
import type { LibraryStitchSnapshot } from "@/lib/library/stitchSnapshot";
import {
  type PersistedEditorV2DesignRecord,
  hydrateEditorV2Document,
  serializeEditorV2Document,
} from "@/lib/editor-v2/persistence/designs";

export interface SavedEditorV2DocumentRecord {
  storageId: string;
  title: string;
  folderId: string | null;
  folderName: string | null;
  gridWidth: number;
  gridHeight: number;
  updatedAt: string;
  previewUrl: string | null;
  thumbnailUrl: string | null;
  tracePlacement: LibraryTracePlacement | null;
  stitchSnapshot: LibraryStitchSnapshot | null;
}

export interface DeletedEditorV2DesignMetadata {
  id: string;
  title: string;
  deletedAt: string;
  purgeAfterAt: string;
}

export type SavedEditorV2DocumentView = "active" | "deleted";

export interface ListSavedEditorV2DocumentsResult {
  documents: SavedEditorV2DocumentRecord[];
  folders: SavedEditorV2DesignFolder[];
  selectedFolder: SavedEditorV2DesignFolder | null;
  rootDesignCount: number;
  activeCount: number;
  deletedCount: number;
  hasMore: boolean;
  nextOffset: number | null;
}

export interface SavedEditorV2DesignFolder {
  id: string;
  name: string;
  designCount: number;
  updatedAt: string;
  createdAt?: string;
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
  deletedAt?: string;
  purgeAfterAt?: string;
  deletedPermanently?: boolean;
}

export interface RestoreDeletedEditorV2DocumentResult {
  storageId: string;
  title: string;
  gridWidth: number;
  gridHeight: number;
  createdAt: string;
  updatedAt: string;
  versionToken: string;
}

export class EditorV2PersistenceError extends Error {
  status: number;
  versionToken: string | null;
  deletedDesign: DeletedEditorV2DesignMetadata | null;

  constructor(
    message: string,
    status = 500,
    versionToken: string | null = null,
    deletedDesign: DeletedEditorV2DesignMetadata | null = null,
  ) {
    super(message);
    this.name = "EditorV2PersistenceError";
    this.status = status;
    this.versionToken = versionToken;
    this.deletedDesign = deletedDesign;
  }
}

export interface SubmitEditorV2BugReportInput {
  answers: Record<string, unknown> | Array<unknown>;
  clientMetadata?: Record<string, unknown>;
  context?: Record<string, unknown>;
  editorDesignId?: string | null;
  formId: string;
  formVersion?: string | null;
}

export async function listSavedEditorV2Documents({
  limit,
  offset,
  view = "active",
  folderId,
}: {
  limit?: number;
  offset?: number;
  view?: SavedEditorV2DocumentView;
  folderId?: string | null;
} = {}): Promise<ListSavedEditorV2DocumentsResult> {
  const searchParams = new URLSearchParams();

  if (typeof limit === "number") {
    searchParams.set("limit", String(limit));
  }

  if (typeof offset === "number") {
    searchParams.set("offset", String(offset));
  }

  searchParams.set("view", view);
  if (typeof folderId === "string" && folderId.length > 0) {
    searchParams.set("folder", folderId);
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
          folderId?: string | null;
          folderName?: string | null;
          gridWidth: number;
          gridHeight: number;
          updatedAt: string;
          previewUrl?: string | null;
          thumbnailUrl?: string | null;
          tracePlacement?: LibraryTracePlacement | null;
          stitchSnapshot?: LibraryStitchSnapshot | null;
        }>;
        folders?: SavedEditorV2DesignFolder[];
        selectedFolder?: SavedEditorV2DesignFolder | null;
        rootDesignCount?: number;
        activeCount?: number;
        deletedCount?: number;
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
          folderId: design.folderId ?? null,
          folderName: design.folderName ?? null,
          gridWidth: design.gridWidth,
          gridHeight: design.gridHeight,
          updatedAt: design.updatedAt,
          previewUrl: design.previewUrl ?? null,
          thumbnailUrl: design.thumbnailUrl ?? null,
          tracePlacement: design.tracePlacement ?? null,
          stitchSnapshot: design.stitchSnapshot ?? null,
        }))
      : [],
    folders: Array.isArray(body?.folders) ? body.folders : [],
    selectedFolder:
      body?.selectedFolder && typeof body.selectedFolder === "object"
        ? body.selectedFolder
        : null,
    rootDesignCount:
      typeof body?.rootDesignCount === "number" ? body.rootDesignCount : 0,
    activeCount: typeof body?.activeCount === "number" ? body.activeCount : 0,
    deletedCount: typeof body?.deletedCount === "number" ? body.deletedCount : 0,
    hasMore: body?.hasMore === true,
    nextOffset: typeof body?.nextOffset === "number" ? body.nextOffset : null,
  };
}

export async function listEditorV2Folders(): Promise<SavedEditorV2DesignFolder[]> {
  const response = await fetch("/api/editor-v2/folders", {
    method: "GET",
    credentials: "same-origin",
  });
  const body = (await response.json().catch(() => null)) as
    | { folders?: SavedEditorV2DesignFolder[]; error?: string }
    | null;

  if (!response.ok) {
    throw new EditorV2PersistenceError(
      body?.error ?? "Couldn't load folders.",
      response.status,
    );
  }

  return Array.isArray(body?.folders) ? body.folders : [];
}

export async function createEditorV2Folder(
  name: string,
): Promise<SavedEditorV2DesignFolder> {
  const response = await fetch("/api/editor-v2/folders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ name }),
  });
  const body = (await response.json().catch(() => null)) as
    | { folder?: SavedEditorV2DesignFolder; error?: string }
    | null;

  if (!response.ok || !body?.folder) {
    throw new EditorV2PersistenceError(
      body?.error ?? "Couldn't create folder.",
      response.status,
    );
  }

  return body.folder;
}

export async function submitEditorV2BugReport(
  input: SubmitEditorV2BugReportInput,
): Promise<{ id: string; createdAt: string; editorDesignId: string | null }> {
  const response = await fetch("/api/editor-v2/bug-reports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
  const body = (await response.json().catch(() => null)) as
    | {
        error?: string;
        report?: {
          id: string;
          createdAt: string;
          editorDesignId: string | null;
        };
      }
    | null;

  if (!response.ok || !body?.report) {
    throw new EditorV2PersistenceError(
      body?.error ?? "Couldn’t send your report.",
      response.status,
    );
  }

  return body.report;
}

export async function renameEditorV2Folder(
  folderId: string,
  name: string,
): Promise<SavedEditorV2DesignFolder> {
  const response = await fetch(`/api/editor-v2/folders/${folderId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ name }),
  });
  const body = (await response.json().catch(() => null)) as
    | { folder?: SavedEditorV2DesignFolder; error?: string }
    | null;

  if (!response.ok || !body?.folder) {
    throw new EditorV2PersistenceError(
      body?.error ?? "Couldn't rename folder.",
      response.status,
    );
  }

  return body.folder;
}

export async function deleteEditorV2Folder(folderId: string): Promise<{ id: string; name: string }> {
  const response = await fetch(`/api/editor-v2/folders/${folderId}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  const body = (await response.json().catch(() => null)) as
    | { id?: string; name?: string; error?: string }
    | null;

  if (!response.ok || !body?.id || !body.name) {
    throw new EditorV2PersistenceError(
      body?.error ?? "Couldn't delete folder.",
      response.status,
    );
  }

  return {
    id: body.id,
    name: body.name,
  };
}

export async function moveEditorV2DesignToFolder(
  storageId: string,
  folderId: string | null,
): Promise<{ storageId: string; folderId: string | null }> {
  const response = await fetch(`/api/editor-v2/designs/${storageId}/folder`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ folderId }),
  });
  const body = (await response.json().catch(() => null)) as
    | { id?: string; folderId?: string | null; error?: string }
    | null;

  if (!response.ok || !body?.id) {
    throw new EditorV2PersistenceError(
      body?.error ?? "Couldn't move design.",
      response.status,
    );
  }

  return {
    storageId: body.id,
    folderId: body.folderId ?? null,
  };
}

export async function moveEditorV2DesignsToFolder(
  designIds: string[],
  folderId: string | null,
): Promise<{ designIds: string[]; folderId: string | null }> {
  const response = await fetch("/api/editor-v2/designs/move", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ designIds, folderId }),
  });
  const body = (await response.json().catch(() => null)) as
    | { designIds?: string[]; folderId?: string | null; error?: string }
    | null;

  if (!response.ok || !Array.isArray(body?.designIds)) {
    throw new EditorV2PersistenceError(
      body?.error ?? "Couldn't move designs.",
      response.status,
    );
  }

  return {
    designIds: body.designIds,
    folderId: body.folderId ?? null,
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
    | ({
        error?: string;
        versionToken?: string;
        deletedDesign?: DeletedEditorV2DesignMetadata;
      } & Partial<PersistedEditorV2DesignRecord>)
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
      body?.deletedDesign ?? null,
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
  forceVersion = false,
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
        forceVersion,
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

export async function renameSavedEditorV2Document(
  storageId: string,
  title: string,
): Promise<SaveEditorV2DocumentResult> {
  const loaded = await loadSavedEditorV2Document(storageId);
  loaded.document.project.title = title;
  return saveEditorV2Document(
    loaded.document,
    storageId,
    loaded.versionToken,
    "manual",
  );
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
  options?: { mode?: "replace" | "copy" },
): Promise<RestoreEditorV2VersionResult> {
  const response = await fetch(`/api/editor-v2/designs/${storageId}/versions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      versionId,
      mode: options?.mode === "copy" ? "copy" : "replace",
    }),
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
  options: { permanent?: boolean } = {},
): Promise<DeleteEditorV2DocumentResult> {
  const searchParams = new URLSearchParams();
  if (options.permanent) {
    searchParams.set("mode", "permanent");
  }

  const response = await fetch(
    `/api/editor-v2/designs/${storageId}${searchParams.size ? `?${searchParams.toString()}` : ""}`,
    {
    method: "DELETE",
    credentials: "same-origin",
    },
  );
  const body = (await response.json().catch(() => null)) as
    | {
        id?: string;
        deletedAt?: string;
        purgeAfterAt?: string;
        deletedPermanently?: boolean;
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
    deletedAt: body.deletedAt,
    purgeAfterAt: body.purgeAfterAt,
    deletedPermanently: body.deletedPermanently,
  };
}

export async function restoreDeletedEditorV2Document(
  storageId: string,
): Promise<RestoreDeletedEditorV2DocumentResult> {
  const response = await fetch(`/api/editor-v2/designs/${storageId}/restore`, {
    method: "POST",
    credentials: "same-origin",
  });
  const body = (await response.json().catch(() => null)) as
    | {
        id?: string;
        title?: string;
        gridWidth?: number;
        gridHeight?: number;
        createdAt?: string;
        updatedAt?: string;
        versionToken?: string;
        error?: string;
      }
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
      body?.error ?? "Couldn't restore this design.",
      response.status,
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
