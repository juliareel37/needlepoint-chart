"use client";

import { serializeEditorV2Document } from "@/lib/editor-v2/persistence/designs";
import type { DocumentPatch, EditorDocumentState } from "@/lib/editor-v2/editor/store";

const AUTOSAVE_DB_NAME = "editor-v2-autosave";
const AUTOSAVE_DB_VERSION = 1;
const AUTOSAVE_STORE_NAME = "snapshots";
const GRID_CHUNK_SIZE = 32;
const SYNCED_RETENTION_MS = 1000 * 60 * 60 * 24 * 7;
const TEMP_RETENTION_MS = 1000 * 60 * 60 * 24;

export type AutosaveSyncStatus =
  | "idle"
  | "saving"
  | "saved"
  | "error"
  | "conflict";

export interface EditorV2LocalSnapshotRecord {
  key: string;
  storageId: string | null;
  document: EditorDocumentState;
  dirtyChunks: string[];
  serializedHash: string | null;
  latestLocalSequenceId: number;
  latestSyncRequestedSequenceId: number;
  latestSyncAppliedSequenceId: number;
  baseServerVersion: string | null;
  lastKnownServerVersion: string | null;
  lastAttemptedSyncAt: string | null;
  lastSuccessfulSyncAt: string | null;
  lastModifiedAt: string;
  recoveredLocalChanges: boolean;
  degradedLocalRecovery: boolean;
}

export interface RecoveryDecisionInput {
  localSnapshot: EditorV2LocalSnapshotRecord | null;
  currentServerVersion: string | null;
}

export function createAutosaveSnapshotRecord(input: {
  key: string;
  storageId: string | null;
  document: EditorDocumentState;
  dirtyChunks?: Iterable<string>;
  serializedHash?: string | null;
  latestLocalSequenceId?: number;
  latestSyncRequestedSequenceId?: number;
  latestSyncAppliedSequenceId?: number;
  baseServerVersion?: string | null;
  lastKnownServerVersion?: string | null;
  lastAttemptedSyncAt?: string | null;
  lastSuccessfulSyncAt?: string | null;
  recoveredLocalChanges?: boolean;
  degradedLocalRecovery?: boolean;
}): EditorV2LocalSnapshotRecord {
  return {
    key: input.key,
    storageId: input.storageId,
    document: input.document,
    dirtyChunks: Array.from(input.dirtyChunks ?? []),
    serializedHash: input.serializedHash ?? null,
    latestLocalSequenceId: input.latestLocalSequenceId ?? 0,
    latestSyncRequestedSequenceId: input.latestSyncRequestedSequenceId ?? 0,
    latestSyncAppliedSequenceId: input.latestSyncAppliedSequenceId ?? 0,
    baseServerVersion: input.baseServerVersion ?? null,
    lastKnownServerVersion: input.lastKnownServerVersion ?? null,
    lastAttemptedSyncAt: input.lastAttemptedSyncAt ?? null,
    lastSuccessfulSyncAt: input.lastSuccessfulSyncAt ?? null,
    lastModifiedAt: new Date().toISOString(),
    recoveredLocalChanges: input.recoveredLocalChanges ?? false,
    degradedLocalRecovery: input.degradedLocalRecovery ?? false,
  };
}

export function getAutosaveDocumentKey(
  document: EditorDocumentState,
  storageId?: string | null,
): string {
  return storageId ?? document.project.id ?? "editor-v2-unsaved";
}

export function getDirtyChunksFromPatches(
  patches: DocumentPatch[],
  gridWidth: number,
): Set<string> {
  const chunks = new Set<string>();

  for (const patch of patches) {
    switch (patch.type) {
      case "grid.replaceCells": {
        for (const cell of patch.cells) {
          const x = cell.index % gridWidth;
          const y = Math.floor(cell.index / gridWidth);
          chunks.add(`grid:${Math.floor(x / GRID_CHUNK_SIZE)}:${Math.floor(y / GRID_CHUNK_SIZE)}`);
        }
        break;
      }
      case "grid.resize":
        chunks.add("grid:*");
        break;
      case "palette.replaceColor":
      case "palette.setExtractedColorIds":
      case "palette.assignSymbols":
        chunks.add("palette");
        break;
      case "trace.upsert":
      case "trace.update":
      case "trace.remove":
        chunks.add("trace");
        break;
      case "project.metadata.update":
        chunks.add("project");
        break;
      case "text.upsertEntity":
      case "text.removeEntity":
        chunks.add("text");
        break;
      default:
        break;
    }
  }

  return chunks;
}

export function computeSerializedDocumentHash(document: EditorDocumentState): {
  serialized: string;
  hash: string;
} {
  const serialized = JSON.stringify(serializeEditorV2Document(document));
  let hash = 5381;

  for (let index = 0; index < serialized.length; index += 1) {
    hash = (hash * 33) ^ serialized.charCodeAt(index);
  }

  return {
    serialized,
    hash: `h${(hash >>> 0).toString(16)}`,
  };
}

export function shouldRecoverLocalSnapshot({
  localSnapshot,
  currentServerVersion,
}: RecoveryDecisionInput): boolean {
  if (!localSnapshot) {
    return false;
  }

  if (!localSnapshot.baseServerVersion) {
    return false;
  }

  if (
    localSnapshot.latestLocalSequenceId <=
    localSnapshot.latestSyncAppliedSequenceId
  ) {
    return false;
  }

  if (
    localSnapshot.lastKnownServerVersion !== null &&
    localSnapshot.lastKnownServerVersion === localSnapshot.baseServerVersion
  ) {
    // The snapshot was created after the client had seen this server version.
  } else {
    return false;
  }

  return currentServerVersion === localSnapshot.baseServerVersion;
}

export async function readLocalSnapshot(
  key: string,
): Promise<EditorV2LocalSnapshotRecord | null> {
  if (typeof indexedDB === "undefined") {
    return null;
  }

  const db = await openAutosaveDb();
  const transaction = db.transaction(AUTOSAVE_STORE_NAME, "readonly");
  const store = transaction.objectStore(AUTOSAVE_STORE_NAME);
  const result = await requestToPromise<EditorV2LocalSnapshotRecord | undefined>(
    store.get(key),
  );

  return result ?? null;
}

export async function writeLocalSnapshot(
  snapshot: EditorV2LocalSnapshotRecord,
): Promise<{ degradedLocalRecovery: boolean }> {
  if (typeof indexedDB === "undefined") {
    return { degradedLocalRecovery: true };
  }

  try {
    await putSnapshot(snapshot);
    return { degradedLocalRecovery: false };
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      throw error;
    }
  }

  const minimalSnapshot: EditorV2LocalSnapshotRecord = {
    ...snapshot,
    dirtyChunks: [],
  };

  try {
    await putSnapshot(minimalSnapshot);
    return { degradedLocalRecovery: false };
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      throw error;
    }
  }

  await pruneLocalSnapshots({
    preserveKeys: [snapshot.key],
  });

  try {
    await putSnapshot(minimalSnapshot);
    return { degradedLocalRecovery: false };
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      throw error;
    }
  }

  return { degradedLocalRecovery: true };
}

export async function deleteLocalSnapshot(key: string): Promise<void> {
  if (typeof indexedDB === "undefined") {
    return;
  }

  const db = await openAutosaveDb();
  const transaction = db.transaction(AUTOSAVE_STORE_NAME, "readwrite");
  transaction.objectStore(AUTOSAVE_STORE_NAME).delete(key);
  await transactionDone(transaction);
}

export async function pruneLocalSnapshots(options?: {
  preserveKeys?: string[];
  now?: number;
}): Promise<void> {
  if (typeof indexedDB === "undefined") {
    return;
  }

  const now = options?.now ?? Date.now();
  const preserveKeys = new Set(options?.preserveKeys ?? []);
  const db = await openAutosaveDb();
  const transaction = db.transaction(AUTOSAVE_STORE_NAME, "readwrite");
  const store = transaction.objectStore(AUTOSAVE_STORE_NAME);
  const snapshots = await requestToPromise<EditorV2LocalSnapshotRecord[]>(store.getAll());

  for (const snapshot of snapshots) {
    if (preserveKeys.has(snapshot.key)) {
      continue;
    }

    const lastModified = Date.parse(snapshot.lastModifiedAt);
    const isSynced =
      snapshot.latestLocalSequenceId <= snapshot.latestSyncAppliedSequenceId &&
      snapshot.latestSyncAppliedSequenceId > 0;
    const maxAge = snapshot.storageId ? SYNCED_RETENTION_MS : TEMP_RETENTION_MS;

    if (!Number.isFinite(lastModified) || now - lastModified < maxAge) {
      continue;
    }

    if (!snapshot.storageId || isSynced) {
      store.delete(snapshot.key);
    }
  }

  await transactionDone(transaction);
}

async function putSnapshot(snapshot: EditorV2LocalSnapshotRecord): Promise<void> {
  const db = await openAutosaveDb();
  const transaction = db.transaction(AUTOSAVE_STORE_NAME, "readwrite");
  transaction.objectStore(AUTOSAVE_STORE_NAME).put(snapshot);
  await transactionDone(transaction);
}

async function openAutosaveDb(): Promise<IDBDatabase> {
  const request = indexedDB.open(AUTOSAVE_DB_NAME, AUTOSAVE_DB_VERSION);

  request.onupgradeneeded = () => {
    const db = request.result;

    if (!db.objectStoreNames.contains(AUTOSAVE_STORE_NAME)) {
      db.createObjectStore(AUTOSAVE_STORE_NAME, {
        keyPath: "key",
      });
    }
  };

  return requestToPromise(request);
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

function isQuotaExceededError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" || error.name === "AbortError")
  );
}
