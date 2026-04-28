"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditorStore, useEditorStoreDispatch } from "./editorStoreContext";
import type {
  EditorV2PersistenceError,
  SaveEditorV2DocumentResult,
} from "./editorV2ServerPersistence";
import {
  computeSerializedDocumentHash,
  createAutosaveSnapshotRecord,
  deleteLocalSnapshot,
  getAutosaveDocumentKey,
  getDirtyChunksFromPatches,
  pruneLocalSnapshots,
  type AutosaveSyncStatus,
  type EditorV2LocalSnapshotRecord,
  writeLocalSnapshot,
} from "./editorV2AutosavePersistence";
import type { EditorDocumentState } from "@/lib/editor-v2/editor/store";
import { createApplyProjectServerStateCommand } from "../features/workspace/workspaceCommands";

const LOCAL_FLUSH_DEBOUNCE_MS = 250;
const SERVER_FLUSH_DEBOUNCE_MS = 2000;

export interface EditorV2PersistenceUiState {
  saveButtonState: "idle" | "saving" | "saved";
  saveMessage: string;
  recoveredLocalChanges: boolean;
  degradedLocalRecovery: boolean;
  syncStatus: AutosaveSyncStatus;
}

interface UseEditorV2PersistenceControllerArgs {
  currentStorageId: string;
  currentServerVersion: string | null;
  hasSavedDesignAccess: boolean;
  initialRecoveredLocalChanges: boolean;
  initialDegradedLocalRecovery: boolean;
  initialLocalSnapshot: EditorV2LocalSnapshotRecord | null;
  saveMode: "manual" | "autosave";
  onSaveDocument: (
    document: EditorDocumentState,
    storageId?: string,
    baseVersion?: string | null,
  ) => Promise<SaveEditorV2DocumentResult | null>;
}

export function useEditorV2PersistenceController({
  currentStorageId,
  currentServerVersion,
  hasSavedDesignAccess,
  initialRecoveredLocalChanges,
  initialDegradedLocalRecovery,
  initialLocalSnapshot,
  saveMode,
  onSaveDocument,
}: UseEditorV2PersistenceControllerArgs) {
  const store = useEditorStore();
  const dispatch = useEditorStoreDispatch();
  const [saveButtonState, setSaveButtonState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [saveMessage, setSaveMessage] = useState<string>(
    initialRecoveredLocalChanges ? "Local recovery active" : "",
  );
  const [recoveredLocalChanges, setRecoveredLocalChanges] = useState(
    initialRecoveredLocalChanges,
  );
  const [degradedLocalRecovery, setDegradedLocalRecovery] = useState(
    initialDegradedLocalRecovery,
  );
  const [syncStatus, setSyncStatus] = useState<AutosaveSyncStatus>("idle");
  const storageIdRef = useRef(currentStorageId);
  const serverVersionRef = useRef<string | null>(currentServerVersion);
  const latestLocalSequenceIdRef = useRef(
    initialLocalSnapshot?.latestLocalSequenceId ?? 0,
  );
  const latestSyncRequestedSequenceIdRef = useRef(
    initialLocalSnapshot?.latestSyncRequestedSequenceId ?? 0,
  );
  const latestSyncAppliedSequenceIdRef = useRef(
    initialLocalSnapshot?.latestSyncAppliedSequenceId ?? 0,
  );
  const lastSerializedHashRef = useRef<string | null>(
    initialLocalSnapshot?.serializedHash ?? null,
  );
  const dirtyChunksRef = useRef(new Set(initialLocalSnapshot?.dirtyChunks ?? []));
  const localFlushTimerRef = useRef<number | null>(null);
  const serverFlushTimerRef = useRef<number | null>(null);
  const localKeyRef = useRef(
    getAutosaveDocumentKey(store.getState().document, currentStorageId || undefined),
  );
  const saveInFlightRef = useRef(false);
  const pendingServerFlushRef = useRef(false);
  const pendingLocalFlushRef = useRef(false);

  useEffect(() => {
    storageIdRef.current = currentStorageId;
  }, [currentStorageId]);

  useEffect(() => {
    serverVersionRef.current = currentServerVersion;
  }, [currentServerVersion]);

  useEffect(() => {
    latestLocalSequenceIdRef.current = initialLocalSnapshot?.latestLocalSequenceId ?? 0;
    latestSyncRequestedSequenceIdRef.current =
      initialLocalSnapshot?.latestSyncRequestedSequenceId ?? 0;
    latestSyncAppliedSequenceIdRef.current =
      initialLocalSnapshot?.latestSyncAppliedSequenceId ?? 0;
    lastSerializedHashRef.current = initialLocalSnapshot?.serializedHash ?? null;
    dirtyChunksRef.current = new Set(initialLocalSnapshot?.dirtyChunks ?? []);

    if (initialLocalSnapshot?.baseServerVersion) {
      serverVersionRef.current = initialLocalSnapshot.baseServerVersion;
    }
  }, [initialLocalSnapshot]);

  useEffect(() => {
    void pruneLocalSnapshots({
      preserveKeys: [localKeyRef.current],
    });
  }, []);

  const persistSnapshot = useCallback(
    async (document: EditorDocumentState, keyOverride?: string) => {
      const key = keyOverride ?? getAutosaveDocumentKey(document, storageIdRef.current || undefined);
      const { hash } = computeSerializedDocumentHash(document);
      const snapshot = createAutosaveSnapshotRecord({
        key,
        storageId: storageIdRef.current || null,
        document,
        dirtyChunks: dirtyChunksRef.current,
        serializedHash: hash,
        latestLocalSequenceId: latestLocalSequenceIdRef.current,
        latestSyncRequestedSequenceId: latestSyncRequestedSequenceIdRef.current,
        latestSyncAppliedSequenceId: latestSyncAppliedSequenceIdRef.current,
        baseServerVersion: serverVersionRef.current,
        lastKnownServerVersion: serverVersionRef.current,
        lastSuccessfulSyncAt: initialLocalSnapshot?.lastSuccessfulSyncAt ?? null,
        recoveredLocalChanges,
        degradedLocalRecovery,
      });
      const result = await writeLocalSnapshot(snapshot);

      if (result.degradedLocalRecovery) {
        setDegradedLocalRecovery(true);
        setSaveMessage("Local recovery limited because browser storage is full.");
      }

      localKeyRef.current = key;
    },
    [degradedLocalRecovery, initialLocalSnapshot, recoveredLocalChanges],
  );

  const flushLocalSnapshot = useCallback(async () => {
    pendingLocalFlushRef.current = false;
    const document = store.getState().document;
    await persistSnapshot(document);
  }, [persistSnapshot, store]);

  const scheduleLocalSnapshot = useCallback(() => {
    pendingLocalFlushRef.current = true;

    if (localFlushTimerRef.current !== null) {
      window.clearTimeout(localFlushTimerRef.current);
    }

    localFlushTimerRef.current = window.setTimeout(() => {
      localFlushTimerRef.current = null;
      void flushLocalSnapshot();
    }, LOCAL_FLUSH_DEBOUNCE_MS);
  }, [flushLocalSnapshot]);

  const applySuccessfulSave = useCallback(
    async (
      result: SaveEditorV2DocumentResult,
      sequenceId: number,
      hash: string,
    ) => {
      const previousKey = localKeyRef.current;
      const currentDocument = store.getState().document;

      storageIdRef.current = result.storageId;
      serverVersionRef.current = result.versionToken;
      latestSyncAppliedSequenceIdRef.current = Math.max(
        latestSyncAppliedSequenceIdRef.current,
        sequenceId,
      );

      if (sequenceId >= latestLocalSequenceIdRef.current) {
        dispatch(
          createApplyProjectServerStateCommand({
            id: result.storageId,
            title: result.title,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
          }),
        );
        setSaveButtonState("saved");
        setSaveMessage(
          `Saved at ${new Date(result.updatedAt).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}`,
        );
        setRecoveredLocalChanges(false);
        setSyncStatus("saved");
        dirtyChunksRef.current.clear();
        lastSerializedHashRef.current = hash;
      } else {
        setSyncStatus("saved");
      }

      await persistSnapshot(currentDocument, result.storageId);

      if (previousKey !== result.storageId) {
        await deleteLocalSnapshot(previousKey);
      }
    },
    [dispatch, persistSnapshot, store],
  );

  const performServerSave = useCallback(
    async (reason: "manual" | "autosave", force = false) => {
      const document = store.getState().document;
      const { hash } = computeSerializedDocumentHash(document);
      const sequenceId = latestLocalSequenceIdRef.current;

      if (
        !force &&
        reason === "autosave" &&
        hash === lastSerializedHashRef.current &&
        sequenceId <= latestSyncAppliedSequenceIdRef.current
      ) {
        return;
      }

      if (saveInFlightRef.current) {
        pendingServerFlushRef.current = true;
        return;
      }

      saveInFlightRef.current = true;
      latestSyncRequestedSequenceIdRef.current = sequenceId;
      setSaveButtonState("saving");
      setSaveMessage("Saving…");
      setSyncStatus("saving");

      try {
        const result = await onSaveDocument(
          document,
          storageIdRef.current || undefined,
          serverVersionRef.current,
        );

        if (!result) {
          setSaveButtonState("idle");
          setSaveMessage("Sign in to save to your profile.");
          setSyncStatus("idle");
          return;
        }

        await applySuccessfulSave(result, sequenceId, hash);
      } catch (error) {
        const persistenceError = error as EditorV2PersistenceError | Error;
        const versionToken =
          "versionToken" in (persistenceError as object)
            ? ((persistenceError as EditorV2PersistenceError).versionToken ?? null)
            : null;

        if ((persistenceError as EditorV2PersistenceError).status === 409) {
          if (versionToken) {
            serverVersionRef.current = versionToken;
          }
          setSaveMessage("Sync conflict. Local changes need review.");
          setSyncStatus("conflict");
        } else {
          setSaveMessage(
            persistenceError instanceof Error
              ? persistenceError.message
              : "Couldn't sync your latest changes.",
          );
          setSyncStatus("error");
        }
        setSaveButtonState("idle");
      } finally {
        saveInFlightRef.current = false;

        if (pendingServerFlushRef.current) {
          pendingServerFlushRef.current = false;
          void performServerSave("autosave");
        }
      }
    },
    [applySuccessfulSave, onSaveDocument, store],
  );

  const handleManualSave = useCallback(async () => {
    await flushLocalSnapshot();
    await performServerSave("manual", true);
  }, [flushLocalSnapshot, performServerSave]);

  useEffect(() => {
    if (saveMode !== "autosave" || !hasSavedDesignAccess) {
      return;
    }

    return store.subscribe((nextState, prevState, event) => {
      if (!event.patches || event.patches.length === 0) {
        return;
      }

      const nextHash = computeSerializedDocumentHash(nextState.document).hash;
      const prevHash = computeSerializedDocumentHash(prevState.document).hash;

      if (nextHash === prevHash) {
        return;
      }

      latestLocalSequenceIdRef.current += 1;
      for (const chunk of getDirtyChunksFromPatches(
        event.patches,
        Math.max(nextState.document.grid.width, 1),
      )) {
        dirtyChunksRef.current.add(chunk);
      }

      scheduleLocalSnapshot();

      if (serverFlushTimerRef.current !== null) {
        window.clearTimeout(serverFlushTimerRef.current);
      }

      serverFlushTimerRef.current = window.setTimeout(() => {
        serverFlushTimerRef.current = null;
        void performServerSave("autosave");
      }, SERVER_FLUSH_DEBOUNCE_MS);
    });
  }, [hasSavedDesignAccess, performServerSave, saveMode, scheduleLocalSnapshot, store]);

  useEffect(() => {
    if (saveMode !== "autosave" || !hasSavedDesignAccess) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "hidden") {
        return;
      }

      if (localFlushTimerRef.current !== null) {
        window.clearTimeout(localFlushTimerRef.current);
        localFlushTimerRef.current = null;
      }

      if (serverFlushTimerRef.current !== null) {
        window.clearTimeout(serverFlushTimerRef.current);
        serverFlushTimerRef.current = null;
      }

      void flushLocalSnapshot().then(() => performServerSave("autosave"));
    };

    window.document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      window.document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [flushLocalSnapshot, hasSavedDesignAccess, performServerSave, saveMode]);

  useEffect(() => {
    if (
      saveMode !== "autosave" ||
      !hasSavedDesignAccess ||
      !initialRecoveredLocalChanges
    ) {
      return;
    }

    void performServerSave("autosave", true);
  }, [
    hasSavedDesignAccess,
    initialRecoveredLocalChanges,
    performServerSave,
    saveMode,
  ]);

  useEffect(() => {
    return () => {
      if (localFlushTimerRef.current !== null) {
        window.clearTimeout(localFlushTimerRef.current);
      }
      if (serverFlushTimerRef.current !== null) {
        window.clearTimeout(serverFlushTimerRef.current);
      }
    };
  }, []);

  const controllerState = useMemo<EditorV2PersistenceUiState>(
    () => ({
      saveButtonState,
      saveMessage,
      recoveredLocalChanges,
      degradedLocalRecovery,
      syncStatus,
    }),
    [
      degradedLocalRecovery,
      recoveredLocalChanges,
      saveButtonState,
      saveMessage,
      syncStatus,
    ],
  );

  return {
    controllerState,
    handleManualSave,
  };
}
