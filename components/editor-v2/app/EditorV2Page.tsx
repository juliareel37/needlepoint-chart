"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { createEditorStateFromDocument } from "@/lib/editor-v2/editor/store/createEditorStateFromDocument";
import { createNewDesignState } from "@/lib/editor-v2/editor/store/createNewDesignState";
import { EditorV2Providers } from "./EditorV2Providers";
import {
  EditorV2SetupModal,
  type EditorV2DesignConfig,
} from "./EditorV2SetupModal";
import { EditorV2Workspace } from "./EditorV2Workspace";
import {
  getServerSavedEditorV2DocumentsSnapshot,
  listSavedEditorV2Documents,
  saveEditorV2Document,
  subscribeToSavedEditorV2Documents,
} from "./editorV2LocalPersistence";

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
  const [draftWidth, setDraftWidth] = useState("8");
  const [draftHeight, setDraftHeight] = useState("8");
  const [draftSizingMode, setDraftSizingMode] = useState<"stitches" | "inches">(
    "stitches",
  );
  const [draftWidthInches, setDraftWidthInches] = useState("1");
  const [draftHeightInches, setDraftHeightInches] = useState("1");
  const [draftMeshCount, setDraftMeshCount] = useState("8");
  const savedDocuments = useSyncExternalStore(
    subscribeToSavedEditorV2Documents,
    listSavedEditorV2Documents,
    getServerSavedEditorV2DocumentsSnapshot,
  );
  const [designConfig, setDesignConfig] =
    useState<EditorV2DesignConfig>(INITIAL_DESIGN_CONFIG);
  const [currentStorageId, setCurrentStorageId] = useState("");
  const [selectedStorageId, setSelectedStorageId] = useState("");
  const [setupModalOpen, setSetupModalOpen] = useState(true);
  const isInitialSession =
    designConfig.kind === "new" &&
    designConfig.instanceKey === INITIAL_DESIGN_CONFIG.instanceKey &&
    currentStorageId.length === 0;

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
        currentStorageId={currentStorageId}
        savedDocuments={savedDocuments}
        selectedStorageId={selectedStorageId}
        setSelectedStorageId={setSelectedStorageId}
        onSaveDocument={(document, storageId) => {
          const savedRecord = saveEditorV2Document(document, storageId);
          setCurrentStorageId(savedRecord.storageId);
          setSelectedStorageId(savedRecord.storageId);
          return savedRecord;
        }}
        onLoadDocument={(record) => {
          setCurrentStorageId(record.storageId);
          setSelectedStorageId(record.storageId);
          setDesignConfig({
            kind: "loaded",
            document: record.document,
            storageId: record.storageId,
            instanceKey: `loaded_${record.storageId}_${Date.now()}`,
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
            onClose={() => setSetupModalOpen(false)}
            onCreateDesign={(config) => {
              setCurrentStorageId("");
              setSelectedStorageId("");
              setDesignConfig(config);
              setSetupModalOpen(false);
            }}
            onDraftHeightChange={setDraftHeight}
            onDraftHeightInchesChange={setDraftHeightInches}
            onDraftMeshCountChange={setDraftMeshCount}
            onDraftSizingModeChange={setDraftSizingMode}
            onDraftWidthChange={setDraftWidth}
            onDraftWidthInchesChange={setDraftWidthInches}
            onLoadSavedDesign={(config) => {
              setCurrentStorageId(config.storageId);
              setSelectedStorageId(config.storageId);
              setDesignConfig(config);
              setSetupModalOpen(false);
            }}
            savedDocuments={savedDocuments}
            selectedStorageId={selectedStorageId}
            setSelectedStorageId={setSelectedStorageId}
          />
        }
      />
    </EditorV2Providers>
  );
}
