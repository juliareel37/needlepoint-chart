"use client";

import { useState } from "react";
import type { EditorDocumentState } from "@/lib/editor-v2/editor/store";
import { useEditorStoreSelector } from "./editorStoreContext";
import type { SavedEditorV2DocumentRecord } from "./editorV2LocalPersistence";
import { EditorV2Shell } from "../features/workspace/shell/EditorV2Shell";

export function EditorV2Workspace({
  savedDocuments,
  onSaveDocument,
  onLoadDocument,
  onStartOver,
}: {
  savedDocuments: SavedEditorV2DocumentRecord[];
  onSaveDocument: (document: EditorDocumentState) => void;
  onLoadDocument: (record: SavedEditorV2DocumentRecord) => void;
  onStartOver: () => void;
}) {
  const document = useEditorStoreSelector((state) => state.document);
  const [selectedStorageId, setSelectedStorageId] = useState<string>("");
  const [saveMessage, setSaveMessage] = useState<string>("");

  return (
    <div>
      <EditorV2Shell
        onSaveDocument={(nextDocument) => {
          onSaveDocument(nextDocument);
          setSaveMessage(`Saved at ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`);
        }}
        onLoadDocument={(record) => {
          onLoadDocument(record);
          setSelectedStorageId("");
          setSaveMessage("");
        }}
        onStartOver={onStartOver}
        saveMessage={saveMessage}
        savedDocuments={savedDocuments}
        selectedStorageId={selectedStorageId}
        setSelectedStorageId={setSelectedStorageId}
      />
    </div>
  );
}
