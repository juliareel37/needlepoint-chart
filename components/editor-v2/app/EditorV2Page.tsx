"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useOpenSignIn } from "@/components/auth/useOpenSignIn";
import { createEditorStateFromDocument } from "@/lib/editor-v2/editor/store/createEditorStateFromDocument";
import { createNewDesignState } from "@/lib/editor-v2/editor/store/createNewDesignState";
import type { EditorDocumentState } from "@/lib/editor-v2/editor/store";
import { EDITOR_V2_SAVE_MODE } from "@/lib/editor-v2/config";
import { EditorV2Providers } from "./EditorV2Providers";
import {
  EditorV2SetupModal,
  type EditorV2DesignConfig,
} from "./EditorV2SetupModal";
import { EditorV2Workspace } from "./EditorV2Workspace";
import {
  deleteSavedEditorV2Document,
  listSavedEditorV2Documents,
  loadSavedEditorV2Document,
  saveEditorV2Document,
  type SavedEditorV2DocumentRecord,
} from "./editorV2ServerPersistence";
import {
  deleteLocalSnapshot,
  readLocalSnapshot,
  shouldRecoverLocalSnapshot,
  type EditorV2LocalSnapshotRecord,
} from "./editorV2AutosavePersistence";

const INITIAL_DESIGN_CONFIG: EditorV2DesignConfig = {
  kind: "new",
  width: 8,
  height: 8,
  sizingMode: "stitches",
  meshCount: null,
  widthInches: null,
  heightInches: null,
  instanceKey: "design_8x8_initial",
};
const DUPLICATE_QUERY_PARAM = "duplicate";
const DUPLICATE_STORAGE_PREFIX = "editor-v2-duplicate:";

export function EditorV2Page() {
  const { isLoaded, isSignedIn } = useAuth();
  const openSignIn = useOpenSignIn();
  const [draftWidth, setDraftWidth] = useState("120");
  const [draftHeight, setDraftHeight] = useState("120");
  const [draftSizingMode, setDraftSizingMode] = useState<"stitches" | "inches">(
    "inches",
  );
  const [draftWidthInches, setDraftWidthInches] = useState("8");
  const [draftHeightInches, setDraftHeightInches] = useState("8");
  const [draftMeshCount, setDraftMeshCount] = useState("10");
  const [savedDocuments, setSavedDocuments] = useState<SavedEditorV2DocumentRecord[]>([]);
  const [savedDocumentsLoading, setSavedDocumentsLoading] = useState(false);
  const [designConfig, setDesignConfig] =
    useState<EditorV2DesignConfig>(INITIAL_DESIGN_CONFIG);
  const [currentStorageId, setCurrentStorageId] = useState("");
  const [currentServerVersion, setCurrentServerVersion] = useState<string | null>(null);
  const [initialRecoveredLocalChanges, setInitialRecoveredLocalChanges] = useState(false);
  const [initialDegradedLocalRecovery, setInitialDegradedLocalRecovery] = useState(false);
  const [initialLocalSnapshot, setInitialLocalSnapshot] =
    useState<EditorV2LocalSnapshotRecord | null>(null);
  const [selectedStorageId, setSelectedStorageId] = useState("");
  const [setupModalOpen, setSetupModalOpen] = useState(true);
  const [setupModalMode, setSetupModalMode] = useState<"full" | "new-only">("full");
  const [canvasLoadingKey, setCanvasLoadingKey] = useState<string | null>(null);
  const [savedDocumentsErrorMessage, setSavedDocumentsErrorMessage] =
    useState<string | null>(null);
  const [setupErrorMessage, setSetupErrorMessage] = useState<string | null>(null);
  const isInitialSession =
    designConfig.kind === "new" &&
    designConfig.instanceKey === INITIAL_DESIGN_CONFIG.instanceKey &&
    currentStorageId.length === 0;

  useEffect(() => {
    let cancelled = false;

    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setSavedDocumentsLoading(false);
      setSavedDocuments([]);
      setSavedDocumentsErrorMessage(null);
      setSetupErrorMessage(null);
      setCurrentStorageId("");
      setCurrentServerVersion(null);
      setInitialLocalSnapshot(null);
      setSelectedStorageId("");
      return;
    }

    setSavedDocumentsLoading(true);
    void listSavedEditorV2Documents()
      .then((documents) => {
        if (!cancelled) {
          setSavedDocumentsLoading(false);
          setSavedDocuments(documents);
          setSavedDocumentsErrorMessage(null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setSavedDocumentsLoading(false);
          setSavedDocuments([]);
          setSavedDocumentsErrorMessage(
            getErrorMessage(error, "Try signing in again or refreshing the page."),
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    const duplicateToken = url.searchParams.get(DUPLICATE_QUERY_PARAM);

    if (!duplicateToken) {
      return;
    }

    const storageKey = `${DUPLICATE_STORAGE_PREFIX}${duplicateToken}`;
    const rawPayload = window.localStorage.getItem(storageKey);

    window.localStorage.removeItem(storageKey);
    url.searchParams.delete(DUPLICATE_QUERY_PARAM);
    window.history.replaceState({}, "", url.toString());

    if (!rawPayload) {
      return;
    }

    const duplicatedDocument = parseDuplicatedDocument(rawPayload);

    if (!duplicatedDocument) {
      return;
    }

    setCurrentStorageId("");
    setCurrentServerVersion(null);
    setInitialRecoveredLocalChanges(false);
    setInitialDegradedLocalRecovery(false);
    setInitialLocalSnapshot(null);
    setSelectedStorageId("");
    setSetupErrorMessage(null);
    setSetupModalMode("full");
    setDesignConfig({
      kind: "loaded",
      document: duplicatedDocument,
      storageId: "",
      instanceKey: `duplicate_${duplicatedDocument.project.id ?? Date.now()}`,
    });
    setSetupModalOpen(false);
  }, []);

  const initialState = useMemo(() => {
    if (designConfig.kind === "loaded") {
      return createEditorStateFromDocument(designConfig.document);
    }

    return createNewDesignState(designConfig.width, designConfig.height, {
      sizingMode: designConfig.sizingMode,
      meshCount: designConfig.meshCount,
      widthInches: designConfig.widthInches,
      heightInches: designConfig.heightInches,
    });
  }, [designConfig]);

  const loadDesignIntoWorkspace = async (storageId: string) => {
      const instanceKey = `loaded_${storageId}_${Date.now()}`;
    setCanvasLoadingKey(instanceKey);

    try {
      const loaded = await loadSavedEditorV2Document(storageId);
      const localSnapshot = await readLocalSnapshot(storageId);
      const shouldRecover = shouldRecoverLocalSnapshot({
        localSnapshot,
        currentServerVersion: loaded.versionToken,
      });
      const document = shouldRecover && localSnapshot
        ? localSnapshot.document
        : loaded.document;
      setCurrentStorageId(loaded.storageId);
      setCurrentServerVersion(loaded.versionToken);
      setSelectedStorageId(storageId);
      setInitialRecoveredLocalChanges(shouldRecover);
      setInitialDegradedLocalRecovery(localSnapshot?.degradedLocalRecovery ?? false);
      setInitialLocalSnapshot(shouldRecover ? localSnapshot : null);
      setSetupErrorMessage(null);
      setDesignConfig({
        kind: "loaded",
        document,
        storageId,
        instanceKey,
      });
      setSetupModalOpen(false);
    } catch (error) {
      setCanvasLoadingKey(null);
      throw error;
    }
  };

  const returnToOpeningSpot = () => {
    setCurrentStorageId("");
    setCurrentServerVersion(null);
    setInitialRecoveredLocalChanges(false);
    setInitialDegradedLocalRecovery(false);
    setInitialLocalSnapshot(null);
    setSelectedStorageId("");
    setSetupErrorMessage(null);
    setSetupModalMode("full");
    setDesignConfig(INITIAL_DESIGN_CONFIG);
    setSetupModalOpen(true);
    setCanvasLoadingKey(null);
  };

  return (
    <EditorV2Providers
      key={designConfig.instanceKey}
      initialState={initialState}
    >
      <EditorV2Workspace
        canvasLoading={canvasLoadingKey !== null}
        hasSavedDesignAccess={Boolean(isLoaded && isSignedIn)}
        onCanvasReady={() => {
          setCanvasLoadingKey((currentKey) =>
            currentKey === designConfig.instanceKey ? null : currentKey,
          );
        }}
        currentStorageId={currentStorageId}
        currentServerVersion={currentServerVersion}
        initialRecoveredLocalChanges={initialRecoveredLocalChanges}
        initialDegradedLocalRecovery={initialDegradedLocalRecovery}
        initialLocalSnapshot={initialLocalSnapshot}
        saveMode={EDITOR_V2_SAVE_MODE}
        savedDocuments={savedDocuments}
        savedDocumentsLoading={savedDocumentsLoading}
        selectedStorageId={selectedStorageId}
        setSelectedStorageId={setSelectedStorageId}
        onSaveDocument={async (document, storageId, baseVersion) => {
          if (!isLoaded || !isSignedIn) {
            openSignIn();
            return null;
          }

          const savedRecord = await saveEditorV2Document(
            document,
            storageId,
            baseVersion,
          );
          setCurrentStorageId(savedRecord.storageId);
          setCurrentServerVersion(savedRecord.versionToken);
          setSelectedStorageId(savedRecord.storageId);
          setInitialRecoveredLocalChanges(false);
          setInitialDegradedLocalRecovery(false);
          setInitialLocalSnapshot(null);
          setSetupErrorMessage(null);
          setSavedDocuments((existing) => {
            const nextRecord: SavedEditorV2DocumentRecord = {
              storageId: savedRecord.storageId,
              title: savedRecord.title,
              gridWidth: savedRecord.gridWidth,
              gridHeight: savedRecord.gridHeight,
              updatedAt: savedRecord.updatedAt,
            };

            return [
              nextRecord,
              ...existing.filter((record) => record.storageId !== nextRecord.storageId),
            ];
          });
          return savedRecord;
        }}
        onLoadDocument={async (record) => {
          await loadDesignIntoWorkspace(record.storageId);
        }}
        onDeleteCurrentDesign={async (document) => {
          const localSnapshotKey = currentStorageId || document.project.id;

          if (currentStorageId) {
            await deleteSavedEditorV2Document(currentStorageId);
            setSavedDocuments((existing) =>
              existing.filter((record) => record.storageId !== currentStorageId),
            );
          }

          if (localSnapshotKey) {
            await deleteLocalSnapshot(localSnapshotKey);
          }

          returnToOpeningSpot();
        }}
        onStartOver={() => {
          setSetupModalMode("new-only");
          setSetupModalOpen(true);
        }}
        setupModalOpen={setupModalOpen}
        setupModal={
          <EditorV2SetupModal
            canClose={!isInitialSession}
            draftHeight={draftHeight}
            draftHeightInches={draftHeightInches}
            draftMeshCount={draftMeshCount}
            draftSizingMode={draftSizingMode}
            draftWidth={draftWidth}
            draftWidthInches={draftWidthInches}
            hasSavedDesignAccess={Boolean(isLoaded && isSignedIn)}
            mode={setupModalMode}
            onDismissSavedDocumentsError={() => setSavedDocumentsErrorMessage(null)}
            onDismissSetupError={() => setSetupErrorMessage(null)}
            onClose={() => setSetupModalOpen(false)}
            onCreateDesign={(config) => {
              setCurrentStorageId("");
              setCurrentServerVersion(null);
              setInitialRecoveredLocalChanges(false);
              setInitialDegradedLocalRecovery(false);
              setInitialLocalSnapshot(null);
              setSelectedStorageId("");
              setSetupErrorMessage(null);
              setSetupModalMode("full");
              setDesignConfig(config);
              setSetupModalOpen(false);
            }}
            onDraftHeightChange={setDraftHeight}
            onDraftHeightInchesChange={setDraftHeightInches}
            onDraftMeshCountChange={setDraftMeshCount}
            onDraftSizingModeChange={setDraftSizingMode}
            onDraftWidthChange={setDraftWidth}
            onDraftWidthInchesChange={setDraftWidthInches}
            onLoadSavedDesign={(storageId) => {
              void loadDesignIntoWorkspace(storageId)
                .catch((error) => {
                  setSetupErrorMessage(
                    getErrorMessage(error, "Try again in a moment."),
                  );
                });
            }}
            savedDocuments={savedDocuments}
            savedDocumentsLoading={savedDocumentsLoading}
            savedDocumentsErrorMessage={savedDocumentsErrorMessage}
            selectedStorageId={selectedStorageId}
            setSelectedStorageId={setSelectedStorageId}
            setupErrorMessage={setupErrorMessage}
          />
        }
      />
    </EditorV2Providers>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function parseDuplicatedDocument(rawPayload: string): EditorDocumentState | null {
  try {
    const candidate = JSON.parse(rawPayload) as EditorDocumentState;

    if (!candidate || typeof candidate !== "object") {
      return null;
    }

    if (
      !candidate.project ||
      !candidate.grid ||
      !candidate.palette ||
      !candidate.text ||
      typeof candidate.project.title !== "string" ||
      typeof candidate.grid.width !== "number" ||
      typeof candidate.grid.height !== "number" ||
      !Array.isArray(candidate.grid.cells)
    ) {
      return null;
    }

    return candidate;
  } catch {
    return null;
  }
}
