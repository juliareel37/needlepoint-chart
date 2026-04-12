"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { createEditorStateFromDocument } from "@/lib/editor-v2/editor/store/createEditorStateFromDocument";
import { createNewDesignState } from "@/lib/editor-v2/editor/store/createNewDesignState";
import { EditorV2Providers } from "./EditorV2Providers";
import {
  EditorV2SetupScreen,
  type EditorV2DesignConfig,
} from "./EditorV2SetupScreen";
import { EditorV2Workspace } from "./EditorV2Workspace";
import {
  getServerSavedEditorV2DocumentsSnapshot,
  listSavedEditorV2Documents,
  saveEditorV2Document,
  subscribeToSavedEditorV2Documents,
} from "./editorV2LocalPersistence";

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
  const [designConfig, setDesignConfig] = useState<EditorV2DesignConfig | null>(
    null,
  );
  const [currentStorageId, setCurrentStorageId] = useState("");

  const initialState = useMemo(() => {
    if (!designConfig) {
      return null;
    }

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

  if (!designConfig || !initialState) {
    return (
      <EditorV2SetupScreen
        draftHeight={draftHeight}
        draftHeightInches={draftHeightInches}
        draftMeshCount={draftMeshCount}
        draftSizingMode={draftSizingMode}
        draftWidth={draftWidth}
        draftWidthInches={draftWidthInches}
        onCreateDesign={(config) => {
          setCurrentStorageId("");
          setDesignConfig(config);
        }}
        onDraftHeightChange={setDraftHeight}
        onDraftHeightInchesChange={setDraftHeightInches}
        onDraftMeshCountChange={setDraftMeshCount}
        onDraftSizingModeChange={setDraftSizingMode}
        onDraftWidthChange={setDraftWidth}
        onDraftWidthInchesChange={setDraftWidthInches}
        onLoadSavedDesign={(config) => {
          setCurrentStorageId(config.storageId);
          setDesignConfig(config);
        }}
        savedDocuments={savedDocuments}
      />
    );
  }

  return (
    <EditorV2Providers
      key={designConfig.instanceKey}
      initialState={initialState}
    >
      <EditorV2Workspace
        currentStorageId={currentStorageId}
        savedDocuments={savedDocuments}
        onSaveDocument={(document, storageId) => {
          const savedRecord = saveEditorV2Document(document, storageId);
          setCurrentStorageId(savedRecord.storageId);
          return savedRecord;
        }}
        onLoadDocument={(record) => {
          setCurrentStorageId(record.storageId);
          setDesignConfig({
            kind: "loaded",
            document: record.document,
            storageId: record.storageId,
            instanceKey: `loaded_${record.storageId}_${Date.now()}`,
          })
        }}
        onStartOver={() => {
          setCurrentStorageId("");
          setDesignConfig(null);
        }}
      />
    </EditorV2Providers>
  );
}
