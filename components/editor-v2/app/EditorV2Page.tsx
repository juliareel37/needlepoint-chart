"use client";

import { useEffect, useMemo, useState } from "react";
import { createEditorStateFromDocument } from "@/lib/editor-v2/editor/store/createEditorStateFromDocument";
import { createNewDesignState } from "@/lib/editor-v2/editor/store/createNewDesignState";
import { EditorV2Providers } from "./EditorV2Providers";
import {
  EditorV2SetupScreen,
  type EditorV2DesignConfig,
} from "./EditorV2SetupScreen";
import { EditorV2Workspace } from "./EditorV2Workspace";
import {
  listSavedEditorV2Documents,
  saveEditorV2Document,
  type SavedEditorV2DocumentRecord,
} from "./editorV2LocalPersistence";

export function EditorV2Page() {
  const [draftWidth, setDraftWidth] = useState("8");
  const [draftHeight, setDraftHeight] = useState("8");
  const [savedDocuments, setSavedDocuments] = useState<SavedEditorV2DocumentRecord[]>([]);
  const [designConfig, setDesignConfig] = useState<EditorV2DesignConfig | null>(
    null,
  );

  useEffect(() => {
    setSavedDocuments(listSavedEditorV2Documents());
  }, []);

  const initialState = useMemo(() => {
    if (!designConfig) {
      return null;
    }

    if (designConfig.kind === "loaded") {
      return createEditorStateFromDocument(designConfig.document);
    }

    return createNewDesignState(designConfig.width, designConfig.height);
  }, [designConfig]);

  if (!designConfig || !initialState) {
    return (
      <EditorV2SetupScreen
        draftHeight={draftHeight}
        draftWidth={draftWidth}
        onCreateDesign={setDesignConfig}
        onDraftHeightChange={setDraftHeight}
        onDraftWidthChange={setDraftWidth}
        onLoadSavedDesign={setDesignConfig}
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
        savedDocuments={savedDocuments}
        onSaveDocument={(document) => {
          saveEditorV2Document(document);
          setSavedDocuments(listSavedEditorV2Documents());
        }}
        onLoadDocument={(record) =>
          setDesignConfig({
            kind: "loaded",
            document: record.document,
            instanceKey: `loaded_${record.storageId}_${Date.now()}`,
          })
        }
        onStartOver={() => setDesignConfig(null)}
      />
    </EditorV2Providers>
  );
}
