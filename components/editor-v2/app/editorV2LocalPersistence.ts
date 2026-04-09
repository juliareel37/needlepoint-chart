"use client";

import type { EditorDocumentState } from "@/lib/editor-v2/editor/store";

const STORAGE_KEY = "editor-v2:saved-documents";

export interface SavedEditorV2DocumentRecord {
  storageId: string;
  savedAt: string;
  document: EditorDocumentState;
}

export function listSavedEditorV2Documents(): SavedEditorV2DocumentRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(isSavedEditorV2DocumentRecord)
      .sort((left, right) => right.savedAt.localeCompare(left.savedAt));
  } catch {
    return [];
  }
}

export function saveEditorV2Document(
  document: EditorDocumentState,
): SavedEditorV2DocumentRecord {
  const savedAt = new Date().toISOString();
  const storageId = createStorageId();
  const record: SavedEditorV2DocumentRecord = {
    storageId,
    savedAt,
    document,
  };
  const existing = listSavedEditorV2Documents();
  const nextRecords = [record, ...existing];

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRecords));

  return record;
}

function createStorageId(): string {
  return `editor_v2_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function isSavedEditorV2DocumentRecord(
  value: unknown,
): value is SavedEditorV2DocumentRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SavedEditorV2DocumentRecord>;

  return (
    typeof candidate.storageId === "string" &&
    typeof candidate.savedAt === "string" &&
    !!candidate.document &&
    typeof candidate.document === "object"
  );
}
