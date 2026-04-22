"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { createEditorStateFromDocument } from "@/lib/editor-v2/editor/store/createEditorStateFromDocument";
import { createNewDesignState } from "@/lib/editor-v2/editor/store/createNewDesignState";
import { EditorV2Providers } from "./EditorV2Providers";
import {
  EditorV2SetupModal,
  type EditorV2DesignConfig,
} from "./EditorV2SetupModal";
import { EditorV2Workspace } from "./EditorV2Workspace";
import {
  listSavedEditorV2Documents,
  loadSavedEditorV2Document,
  saveEditorV2Document,
  type SavedEditorV2DocumentRecord,
} from "./editorV2ServerPersistence";

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

export function EditorV2Page() {
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const [draftWidth, setDraftWidth] = useState("8");
  const [draftHeight, setDraftHeight] = useState("8");
  const [draftSizingMode, setDraftSizingMode] = useState<"stitches" | "inches">(
    "inches",
  );
  const [draftWidthInches, setDraftWidthInches] = useState("1");
  const [draftHeightInches, setDraftHeightInches] = useState("1");
  const [draftMeshCount, setDraftMeshCount] = useState("13");
  const [savedDocuments, setSavedDocuments] = useState<SavedEditorV2DocumentRecord[]>([]);
  const [designConfig, setDesignConfig] =
    useState<EditorV2DesignConfig>(INITIAL_DESIGN_CONFIG);
  const [currentStorageId, setCurrentStorageId] = useState("");
  const [selectedStorageId, setSelectedStorageId] = useState("");
  const [setupModalOpen, setSetupModalOpen] = useState(true);
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
      setSavedDocuments([]);
      setSavedDocumentsErrorMessage(null);
      setSetupErrorMessage(null);
      setCurrentStorageId("");
      setSelectedStorageId("");
      return;
    }

    void listSavedEditorV2Documents()
      .then((documents) => {
        if (!cancelled) {
          setSavedDocuments(documents);
          setSavedDocumentsErrorMessage(null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
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
        savedDocuments={savedDocuments}
        selectedStorageId={selectedStorageId}
        setSelectedStorageId={setSelectedStorageId}
        onSaveDocument={async (document, storageId) => {
          if (!isLoaded || !isSignedIn) {
            void clerk.openSignIn();
            return null;
          }

          const savedRecord = await saveEditorV2Document(document, storageId);
          setCurrentStorageId(savedRecord.storageId);
          setSelectedStorageId(savedRecord.storageId);
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
          const instanceKey = `loaded_${record.storageId}_${Date.now()}`;
          setCanvasLoadingKey(instanceKey);
          const document = await loadSavedEditorV2Document(record.storageId);
          setCurrentStorageId(record.storageId);
          setSelectedStorageId(record.storageId);
          setSetupErrorMessage(null);
          setDesignConfig({
            kind: "loaded",
            document,
            storageId: record.storageId,
            instanceKey,
          });
          setSetupModalOpen(false);
        }}
        onStartOver={() => setSetupModalOpen(true)}
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
            onDismissSavedDocumentsError={() => setSavedDocumentsErrorMessage(null)}
            onDismissSetupError={() => setSetupErrorMessage(null)}
            onClose={() => setSetupModalOpen(false)}
            onCreateDesign={(config) => {
              setCurrentStorageId("");
              setSelectedStorageId("");
              setSetupErrorMessage(null);
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
              const instanceKey = `loaded_${storageId}_${Date.now()}`;
              setCanvasLoadingKey(instanceKey);
              void loadSavedEditorV2Document(storageId)
                .then((document) => {
                  setCurrentStorageId(storageId);
                  setSelectedStorageId(storageId);
                  setSetupErrorMessage(null);
                  setDesignConfig({
                    kind: "loaded",
                    document,
                    storageId,
                    instanceKey,
                  });
                  setSetupModalOpen(false);
                })
                .catch((error) => {
                  setCanvasLoadingKey(null);
                  setSetupErrorMessage(
                    getErrorMessage(error, "Try again in a moment."),
                  );
                });
            }}
            savedDocuments={savedDocuments}
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
