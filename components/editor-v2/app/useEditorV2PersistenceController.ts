"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditorStore, useEditorStoreDispatch } from "./editorStoreContext";
import { getPersistableEditorDocument } from "./getPersistableEditorDocument";
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
import type { DocumentPatch } from "@/lib/editor-v2/editor/store";

const LOCAL_FLUSH_DEBOUNCE_MS = 250;
const SERVER_FLUSH_DEBOUNCE_MS = 2000;
const AUTOSAVE_SUCCESS_PREFIX = "Autosaved at ";
const LOCAL_AUTOSAVE_SUCCESS_PREFIX = "Saved locally at ";
const MANUAL_VERSION_SNAPSHOT_SUCCESS_PREFIX = "Version saved at ";
const MANUAL_SAVE_BUTTON_SUCCESS_DURATION_MS = 2500;

export interface EditorV2PersistenceUiState {
  saveButtonState: "idle" | "saving" | "saved";
  saveMessage: string;
  lastSaveConfirmedAt: number | null;
  recoveredLocalChanges: boolean;
  degradedLocalRecovery: boolean;
  syncStatus: AutosaveSyncStatus;
  hasPersistableUnsavedChanges: boolean;
}

interface UseEditorV2PersistenceControllerArgs {
  currentStorageId: string;
  currentServerVersion: string | null;
  hasSavedDesignAccess: boolean;
  initialRecoveredLocalChanges: boolean;
  initialDegradedLocalRecovery: boolean;
  initialLocalSnapshot: EditorV2LocalSnapshotRecord | null;
  isVersionHistoryMode: boolean;
  isVersionPreview: boolean;
  saveMode: "manual" | "autosave";
  onLocalDraftPersisted?: (draftId: string) => void;
  onSaveDocument: (
    document: EditorDocumentState,
    storageId?: string,
    baseVersion?: string | null,
    saveSource?: "manual" | "autosave",
    forceVersion?: boolean,
  ) => Promise<SaveEditorV2DocumentResult | null>;
}

export function useEditorV2PersistenceController({
  currentStorageId,
  currentServerVersion,
  hasSavedDesignAccess,
  initialRecoveredLocalChanges,
  initialDegradedLocalRecovery,
  initialLocalSnapshot,
  isVersionHistoryMode,
  isVersionPreview,
  saveMode,
  onLocalDraftPersisted,
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
  const [lastSaveConfirmedAt, setLastSaveConfirmedAt] = useState<number | null>(null);
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
  const lastObservedPersistableHashRef = useRef<string | null>(null);
  const lastAutosaveProcessedHashRef = useRef<string | null>(null);
  const dirtyChunksRef = useRef(new Set(initialLocalSnapshot?.dirtyChunks ?? []));
  const localFlushTimerRef = useRef<number | null>(null);
  const serverFlushTimerRef = useRef<number | null>(null);
  const localKeyRef = useRef(
    getAutosaveDocumentKey(store.getState().document, currentStorageId || undefined),
  );
  const saveInFlightRef = useRef(false);
  const pendingServerFlushRef = useRef(false);
  const pendingLocalFlushRef = useRef(false);
  const [hasPersistableUnsavedChanges, setHasPersistableUnsavedChanges] = useState(
    () => {
      const document = getPersistableEditorDocument(store.getState());
      const { hash } = computeSerializedDocumentHash(document);
      return hash !== lastSerializedHashRef.current;
    },
  );
  const localAutosaveEnabled =
    saveMode === "autosave" && !isVersionHistoryMode && !isVersionPreview;
  const serverAutosaveEnabled = localAutosaveEnabled && hasSavedDesignAccess;

  useEffect(() => {
    storageIdRef.current = currentStorageId;
  }, [currentStorageId]);

  useEffect(() => {
    serverVersionRef.current = currentServerVersion;
  }, [currentServerVersion]);

  useEffect(() => {
    if (isVersionHistoryMode || isVersionPreview) {
      setSaveButtonState("idle");
      setSyncStatus("idle");
      setSaveMessage("Viewing version history. Changes won't be saved.");
      return;
    }

    if (saveMessage === "Viewing version history. Changes won't be saved.") {
      setSaveMessage("");
    }
  }, [isVersionHistoryMode, isVersionPreview, saveMessage]);

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

    const document = getPersistableEditorDocument(store.getState());
    const { hash } = computeSerializedDocumentHash(document);
    lastObservedPersistableHashRef.current = hash;
    lastAutosaveProcessedHashRef.current = hash;
    setHasPersistableUnsavedChanges(hash !== lastSerializedHashRef.current);
  }, [initialLocalSnapshot]);

  useEffect(() => {
    return store.subscribe((nextState) => {
      const document = getPersistableEditorDocument(nextState);
      const { hash } = computeSerializedDocumentHash(document);
      lastObservedPersistableHashRef.current = hash;
      setHasPersistableUnsavedChanges(hash !== lastSerializedHashRef.current);
    });
  }, [store]);

  useEffect(() => {
    void pruneLocalSnapshots({
      preserveKeys: [localKeyRef.current],
    });
  }, []);

  const persistSnapshot = useCallback(
    async (document: EditorDocumentState, activeColorId: string | null, keyOverride?: string) => {
      const key = keyOverride ?? getAutosaveDocumentKey(document, storageIdRef.current || undefined);
      const { hash } = computeSerializedDocumentHash(document);
      const snapshot = createAutosaveSnapshotRecord({
        key,
        storageId: storageIdRef.current || null,
        persistenceScope: hasSavedDesignAccess ? "server-recovery" : "guest-draft",
        document,
        activeColorId,
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

      if (!hasSavedDesignAccess && key.startsWith("local_")) {
        onLocalDraftPersisted?.(key);
      }
    },
    [
      degradedLocalRecovery,
      hasSavedDesignAccess,
      initialLocalSnapshot,
      onLocalDraftPersisted,
      recoveredLocalChanges,
    ],
  );

  const flushLocalSnapshot = useCallback(async () => {
    pendingLocalFlushRef.current = false;
    const state = store.getState();
    const document = getPersistableEditorDocument(state);
    await persistSnapshot(document, state.session.activeTool.colorId);
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
      reason: "manual" | "autosave",
      forceVersion: boolean,
    ) => {
      const previousKey = localKeyRef.current;
      const currentDocument = getPersistableEditorDocument(store.getState());

      storageIdRef.current = result.storageId;
      serverVersionRef.current = result.versionToken;
      latestSyncAppliedSequenceIdRef.current = Math.max(
        latestSyncAppliedSequenceIdRef.current,
        sequenceId,
      );

      if (sequenceId >= latestLocalSequenceIdRef.current) {
        const confirmationTime = Date.now();

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
          buildSaveConfirmationMessage(reason, confirmationTime, forceVersion),
        );
        setLastSaveConfirmedAt(confirmationTime);
        setRecoveredLocalChanges(false);
        setSyncStatus("saved");
        dirtyChunksRef.current.clear();
        lastSerializedHashRef.current = hash;
        lastObservedPersistableHashRef.current = hash;
        lastAutosaveProcessedHashRef.current = hash;
        setHasPersistableUnsavedChanges(false);
      } else {
        setSyncStatus("saved");
      }

      await persistSnapshot(
        currentDocument,
        store.getState().session.activeTool.colorId,
        result.storageId,
      );

      if (previousKey !== result.storageId) {
        await deleteLocalSnapshot(previousKey);
      }
    },
    [dispatch, persistSnapshot, store],
  );

  const performServerSave = useCallback(
    async (
      reason: "manual" | "autosave",
      options?: { forceSave?: boolean; forceVersion?: boolean },
    ) => {
      const forceSave = options?.forceSave ?? false;
      const forceVersion = options?.forceVersion ?? false;
      const state = store.getState();
      const document = getPersistableEditorDocument(state);
      const { hash } = computeSerializedDocumentHash(document);
      const sequenceId = latestLocalSequenceIdRef.current;

      if (
        !forceSave &&
        storageIdRef.current &&
        hash === lastSerializedHashRef.current &&
        sequenceId <= latestSyncAppliedSequenceIdRef.current
      ) {
        const confirmationTime = Date.now();
        setSaveButtonState("saved");
        setSaveMessage(buildSaveConfirmationMessage(reason, confirmationTime, false));
        setLastSaveConfirmedAt(confirmationTime);
        setSyncStatus("saved");
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
          reason,
          forceVersion,
        );

        if (!result) {
          setSaveButtonState("idle");
          setSaveMessage("Sign in to save to your profile.");
          setSyncStatus("idle");
          return;
        }

        await applySuccessfulSave(result, sequenceId, hash, reason, forceVersion);
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

  const performLocalSave = useCallback(
    async (
      reason: "manual" | "autosave",
      options?: { forceSave?: boolean },
    ) => {
      const forceSave = options?.forceSave ?? false;
      const state = store.getState();
      const document = getPersistableEditorDocument(state);
      const { hash } = computeSerializedDocumentHash(document);

      if (!forceSave && hash === lastSerializedHashRef.current) {
        return;
      }

      setSaveButtonState("saving");
      setSaveMessage("Saving locally…");
      setSyncStatus("saving");

      await persistSnapshot(document, state.session.activeTool.colorId);

      const confirmationTime = Date.now();
      setSaveButtonState("saved");
      setSaveMessage(buildLocalSaveConfirmationMessage(confirmationTime));
      setLastSaveConfirmedAt(confirmationTime);
      setRecoveredLocalChanges(false);
      setSyncStatus("saved");
      dirtyChunksRef.current.clear();
      lastSerializedHashRef.current = hash;
      lastObservedPersistableHashRef.current = hash;
      lastAutosaveProcessedHashRef.current = hash;
      setHasPersistableUnsavedChanges(false);
    },
    [persistSnapshot, store],
  );

  const handleManualSave = useCallback(async () => {
    if (isVersionHistoryMode || isVersionPreview) {
      return;
    }

    await flushLocalSnapshot();
    await performServerSave("manual");
  }, [flushLocalSnapshot, isVersionHistoryMode, isVersionPreview, performServerSave]);

  const handleManualVersionSnapshot = useCallback(async () => {
    if (isVersionHistoryMode || isVersionPreview) {
      return;
    }

    await flushLocalSnapshot();
    await performServerSave("manual", { forceSave: true, forceVersion: true });
  }, [flushLocalSnapshot, isVersionHistoryMode, isVersionPreview, performServerSave]);

  useEffect(() => {
    if (!localAutosaveEnabled) {
      return;
    }

    return store.subscribe((nextState, prevState, event) => {
      if (!event.patches || event.patches.length === 0) {
        return;
      }

      const nextHash = computeSerializedDocumentHash(
        getPersistableEditorDocument(nextState),
      ).hash;
      const previousProcessedHash = lastAutosaveProcessedHashRef.current;
      lastAutosaveProcessedHashRef.current = nextHash;

      if (previousProcessedHash !== null && nextHash === previousProcessedHash) {
        return;
      }

      latestLocalSequenceIdRef.current += 1;
      for (const chunk of getDirtyChunksFromPatches(
        event.patches,
        Math.max(nextState.document.grid.width, 1),
      )) {
        dirtyChunksRef.current.add(chunk);
      }

      if (shouldFlushImmediatelyForPatches(event.patches)) {
        if (localFlushTimerRef.current !== null) {
          window.clearTimeout(localFlushTimerRef.current);
          localFlushTimerRef.current = null;
        }

        if (serverFlushTimerRef.current !== null) {
          window.clearTimeout(serverFlushTimerRef.current);
          serverFlushTimerRef.current = null;
        }

        pendingLocalFlushRef.current = false;
        void flushLocalSnapshot().then(() =>
          hasSavedDesignAccess
            ? performServerSave("autosave", { forceSave: true })
            : performLocalSave("autosave", { forceSave: true }),
        );
        return;
      }

      scheduleLocalSnapshot();

      if (serverFlushTimerRef.current !== null) {
        window.clearTimeout(serverFlushTimerRef.current);
      }

      serverFlushTimerRef.current = window.setTimeout(() => {
        serverFlushTimerRef.current = null;
        void (hasSavedDesignAccess
          ? performServerSave("autosave")
          : performLocalSave("autosave"));
      }, SERVER_FLUSH_DEBOUNCE_MS);
    });
  }, [
    hasSavedDesignAccess,
    localAutosaveEnabled,
    performLocalSave,
    performServerSave,
    scheduleLocalSnapshot,
    store,
  ]);

  useEffect(() => {
    if (!localAutosaveEnabled) {
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

      void flushLocalSnapshot().then(() =>
        hasSavedDesignAccess
          ? performServerSave("autosave")
          : performLocalSave("autosave"),
      );
    };

    window.document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      window.document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [
    flushLocalSnapshot,
    hasSavedDesignAccess,
    localAutosaveEnabled,
    performLocalSave,
    performServerSave,
  ]);

  useEffect(() => {
    if (
      !serverAutosaveEnabled ||
      !initialRecoveredLocalChanges
    ) {
      return;
    }

    void performServerSave("autosave", { forceSave: true });
  }, [
    initialRecoveredLocalChanges,
    performServerSave,
    serverAutosaveEnabled,
  ]);

  useEffect(() => {
    if (saveMode !== "manual" || saveButtonState !== "saved") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSaveButtonState("idle");
    }, MANUAL_SAVE_BUTTON_SUCCESS_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [saveButtonState, saveMode]);

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
      lastSaveConfirmedAt,
      recoveredLocalChanges,
      degradedLocalRecovery,
      syncStatus,
      hasPersistableUnsavedChanges,
    }),
    [
      degradedLocalRecovery,
      hasPersistableUnsavedChanges,
      lastSaveConfirmedAt,
      recoveredLocalChanges,
      saveButtonState,
      saveMessage,
      syncStatus,
    ],
  );

  return {
    controllerState,
    handleManualSave,
    handleManualVersionSnapshot,
  };
}

function buildSaveConfirmationMessage(
  reason: "manual" | "autosave",
  confirmedAt: number,
  forceVersion: boolean,
): string {
  return `${forceVersion
    ? MANUAL_VERSION_SNAPSHOT_SUCCESS_PREFIX
    : reason === "autosave"
      ? AUTOSAVE_SUCCESS_PREFIX
      : "Saved at "}${new Date(confirmedAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function buildLocalSaveConfirmationMessage(confirmedAt: number): string {
  return `${LOCAL_AUTOSAVE_SUCCESS_PREFIX}${new Date(confirmedAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function shouldFlushImmediatelyForPatches(patches: DocumentPatch[]): boolean {
  return patches.some((patch) => {
    if (patch.type === "trace.remove" || patch.type === "trace.upsert") {
      return true;
    }

    return (
      patch.type === "trace.update" &&
      Object.prototype.hasOwnProperty.call(patch.changes, "locked")
    );
  });
}
