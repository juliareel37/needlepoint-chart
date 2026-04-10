"use client";

import { useEffect, useState } from "react";
import type { EditorDocumentState } from "@/lib/editor-v2/editor/store";
import type { SavedEditorV2DocumentRecord } from "./editorV2LocalPersistence";
import { EditorV2Shell } from "../features/workspace/shell/EditorV2Shell";

export function EditorV2Workspace({
  currentStorageId,
  savedDocuments,
  onSaveDocument,
  onLoadDocument,
  onStartOver,
}: {
  currentStorageId: string;
  savedDocuments: SavedEditorV2DocumentRecord[];
  onSaveDocument: (
    document: EditorDocumentState,
    storageId?: string,
  ) => SavedEditorV2DocumentRecord;
  onLoadDocument: (record: SavedEditorV2DocumentRecord) => void;
  onStartOver: () => void;
}) {
  const [selectedStorageId, setSelectedStorageId] = useState<string>(currentStorageId);
  const [saveMessage, setSaveMessage] = useState<string>("");

  useEffect(() => {
    setSelectedStorageId(currentStorageId);
  }, [currentStorageId]);

  return (
    <div>
      <EditorV2Shell
        onSaveDocument={(nextDocument) => {
          try {
            const savedRecord = onSaveDocument(
              nextDocument,
              currentStorageId || undefined,
            );
            setSelectedStorageId(savedRecord.storageId);
            setSaveMessage(
              `Saved at ${new Date().toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}`,
            );
          } catch {
            setSaveMessage("Couldn't save locally. Browser storage is full.");
          }
        }}
        onLoadDocument={(record) => {
          onLoadDocument(record);
          setSelectedStorageId(record.storageId);
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
