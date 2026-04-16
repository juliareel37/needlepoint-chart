"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { EditorDocumentState } from "@/lib/editor-v2/editor/store";
import { useEditorStoreDispatch } from "./editorStoreContext";
import type {
  SaveEditorV2DocumentResult,
  SavedEditorV2DocumentRecord,
} from "./editorV2ServerPersistence";
import { EditorV2Shell } from "../features/workspace/shell/EditorV2Shell";
import { createApplyProjectServerStateCommand } from "../features/workspace/workspaceCommands";

export type SaveButtonState = "idle" | "saving" | "saved";

export function EditorV2Workspace({
  canvasLoading,
  hasSavedDesignAccess,
  onCanvasReady,
  currentStorageId,
  savedDocuments,
  selectedStorageId,
  setSelectedStorageId,
  onSaveDocument,
  onLoadDocument,
  onStartOver,
  setupModal,
  setupModalOpen,
}: {
  canvasLoading: boolean;
  hasSavedDesignAccess: boolean;
  onCanvasReady: () => void;
  currentStorageId: string;
  savedDocuments: SavedEditorV2DocumentRecord[];
  selectedStorageId: string;
  setSelectedStorageId: (value: string) => void;
  onSaveDocument: (
    document: EditorDocumentState,
    storageId?: string,
  ) => Promise<SaveEditorV2DocumentResult | null>;
  onLoadDocument: (record: SavedEditorV2DocumentRecord) => Promise<void> | void;
  onStartOver: () => void;
  setupModal: ReactNode;
  setupModalOpen: boolean;
}) {
  const dispatch = useEditorStoreDispatch();
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [saveButtonState, setSaveButtonState] = useState<SaveButtonState>("idle");
  const saveButtonResetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (saveButtonResetTimeoutRef.current !== null) {
        window.clearTimeout(saveButtonResetTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div>
      <EditorV2Shell
        canvasLoading={canvasLoading}
        hasSavedDesignAccess={hasSavedDesignAccess}
        onCanvasReady={onCanvasReady}
        onSaveDocument={async (nextDocument) => {
          if (saveButtonResetTimeoutRef.current !== null) {
            window.clearTimeout(saveButtonResetTimeoutRef.current);
            saveButtonResetTimeoutRef.current = null;
          }

          setSaveButtonState("saving");

          try {
            const savedRecord = await onSaveDocument(
              nextDocument,
              currentStorageId || undefined,
            );

            if (!savedRecord) {
              setSaveMessage("Sign in to save to your profile.");
              setSaveButtonState("idle");
              return;
            }

            dispatch(
              createApplyProjectServerStateCommand({
                id: savedRecord.storageId,
                title: savedRecord.title,
                createdAt: savedRecord.createdAt,
                updatedAt: savedRecord.updatedAt,
              }),
            );
            setSelectedStorageId(savedRecord.storageId);
            setSaveMessage(
              `Saved at ${new Date().toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}`,
            );
            setSaveButtonState("saved");
            saveButtonResetTimeoutRef.current = window.setTimeout(() => {
              setSaveButtonState("idle");
              saveButtonResetTimeoutRef.current = null;
            }, 2000);
          } catch {
            setSaveMessage("Couldn't save to your profile. Try again.");
            setSaveButtonState("idle");
          }
        }}
        onLoadDocument={async (record) => {
          await onLoadDocument(record);
          setSelectedStorageId(record.storageId);
          setSaveMessage("");
          setSaveButtonState("idle");
        }}
        onStartOver={onStartOver}
        saveButtonState={saveButtonState}
        saveMessage={saveMessage}
        savedDocuments={savedDocuments}
        selectedStorageId={selectedStorageId}
        setSelectedStorageId={setSelectedStorageId}
        setupModal={setupModal}
        setupModalOpen={setupModalOpen}
      />
    </div>
  );
}
