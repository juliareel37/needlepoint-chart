"use client";

import type { EditorDocumentState } from "@/lib/editor-v2/editor/store";

const STORAGE_KEY = "editor-v2:saved-documents";
const EMPTY_SAVED_DOCUMENTS: SavedEditorV2DocumentRecord[] = [];
const savedDocumentsListeners = new Set<() => void>();
let cachedRawSavedDocuments: string | null | undefined;
let cachedSavedDocuments: SavedEditorV2DocumentRecord[] = [];

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

    if (raw === cachedRawSavedDocuments) {
      return cachedSavedDocuments;
    }

    cachedRawSavedDocuments = raw;

    if (!raw) {
      cachedSavedDocuments = [];
      return cachedSavedDocuments;
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      cachedSavedDocuments = [];
      return cachedSavedDocuments;
    }

    cachedSavedDocuments = parsed
      .filter(isSavedEditorV2DocumentRecord)
      .sort((left, right) => right.savedAt.localeCompare(left.savedAt));
    return cachedSavedDocuments;
  } catch {
    cachedSavedDocuments = [];
    return cachedSavedDocuments;
  }
}

export function getServerSavedEditorV2DocumentsSnapshot(): SavedEditorV2DocumentRecord[] {
  return EMPTY_SAVED_DOCUMENTS;
}

export function subscribeToSavedEditorV2Documents(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      listener();
    }
  };

  savedDocumentsListeners.add(listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    savedDocumentsListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function saveEditorV2Document(
  document: EditorDocumentState,
  storageId?: string,
): SavedEditorV2DocumentRecord {
  const savedAt = new Date().toISOString();
  const nextStorageId = storageId ?? createStorageId();
  const record: SavedEditorV2DocumentRecord = {
    storageId: nextStorageId,
    savedAt,
    document,
  };
  const existing = listSavedEditorV2Documents();
  const existingWithoutCurrent = existing.filter(
    (existingRecord) => existingRecord.storageId !== nextStorageId,
  );
  const nextRecords = [record, ...existingWithoutCurrent];

  if (tryWriteSavedDocuments(nextRecords)) {
    return record;
  }

  const compactRecord: SavedEditorV2DocumentRecord = {
    ...record,
    document: createStorageSafeDocument(document),
  };

  if (tryWriteSavedDocuments([compactRecord, ...existingWithoutCurrent])) {
    return compactRecord;
  }

  throw new Error(
    "Unable to save this design locally because browser storage is full.",
  );
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

function tryWriteSavedDocuments(records: SavedEditorV2DocumentRecord[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    cachedRawSavedDocuments = undefined;
    for (const listener of savedDocumentsListeners) {
      listener();
    }
    return true;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      return false;
    }

    throw error;
  }
}

function isQuotaExceededError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "QuotaExceededError";
}

function createStorageSafeDocument(
  document: EditorDocumentState,
): EditorDocumentState {
  const trace = document.trace;

  if (!trace) {
    return document;
  }

  if (
    trace.assetUrl.startsWith("data:") ||
    trace.assetUrl.startsWith("blob:")
  ) {
    return {
      ...document,
      trace: null,
    };
  }

  return document;
}
