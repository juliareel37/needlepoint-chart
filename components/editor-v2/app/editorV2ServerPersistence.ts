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

export interface SaveEditorV2DocumentResult {
  storageId: string;
  title: string;
  gridWidth: number;
  gridHeight: number;
  createdAt: string;
  updatedAt: string;
  versionToken: string;
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

export async function listSavedEditorV2Documents(): Promise<SavedEditorV2DocumentRecord[]> {
  const response = await fetch("/api/editor-v2/designs", {
    method: "GET",
    credentials: "same-origin",
  });
  const body = (await response.json().catch(() => null)) as
    | { designs?: Array<{ id: string; title: string; gridWidth: number; gridHeight: number; updatedAt: string }>; error?: string }
    | null;

  if (!response.ok) {
    throw new EditorV2PersistenceError(
      body?.error ?? "Couldn't load your saved designs.",
      response.status,
    );
  }

  return Array.isArray(body?.designs)
    ? body.designs.map((design) => ({
        storageId: design.id,
        title: design.title,
        gridWidth: design.gridWidth,
        gridHeight: design.gridHeight,
        updatedAt: design.updatedAt,
      }))
    : [];
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
