"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { EditorDocumentState } from "@/lib/editor-v2/editor/store";
import { exportPatternPdfFromDocument } from "@/lib/editor-v2/export";
import { useEditorStoreDispatch } from "./editorStoreContext";
import type {
  SaveEditorV2DocumentResult,
  SavedEditorV2DocumentRecord,
} from "./editorV2ServerPersistence";
import { EditorV2Shell } from "../features/workspace/shell/EditorV2Shell";
import { createApplyProjectServerStateCommand } from "../features/workspace/workspaceCommands";

export type SaveButtonState = "idle" | "saving" | "saved";
export type ExportButtonState = "idle" | "exporting";
export interface EditorV2ErrorNotification {
  title: string;
  description?: string;
}
export interface EditorV2SuccessNotification {
  title: string;
  description?: string;
}

export function EditorV2Workspace({
  canvasLoading,
  hasSavedDesignAccess,
  onCanvasReady,
  currentStorageId,
  savedDocuments,
  savedDocumentsLoading,
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
  savedDocumentsLoading: boolean;
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
  const [exportButtonState, setExportButtonState] =
    useState<ExportButtonState>("idle");
  const [errorNotification, setErrorNotification] =
    useState<EditorV2ErrorNotification | null>(null);
  const [successNotification, setSuccessNotification] =
    useState<EditorV2SuccessNotification | null>(null);
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
        onExportDocument={async (document) => {
          setExportButtonState("exporting");

          try {
            exportPatternPdfFromDocument(document);
            setSuccessNotification({
              title: "Export complete",
              description: "Your PDF pattern is ready and has been added to downloads.",
            });
            setErrorNotification(null);
          } catch (error) {
            setSuccessNotification(null);
            setErrorNotification({
              title: "Couldn't export PDF",
              description: getErrorMessage(error, "Try again in a moment."),
            });
          } finally {
            setExportButtonState("idle");
          }
        }}
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
              setErrorNotification(null);
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
            setErrorNotification(null);
            saveButtonResetTimeoutRef.current = window.setTimeout(() => {
              setSaveButtonState("idle");
              saveButtonResetTimeoutRef.current = null;
            }, 2000);
          } catch (error) {
            setSaveMessage("");
            setSaveButtonState("idle");
            setErrorNotification({
              title: "Couldn't save design",
              description: getErrorMessage(error, "Try again in a moment."),
            });
          }
        }}
        onLoadDocument={async (record) => {
          try {
            await onLoadDocument(record);
            setSelectedStorageId(record.storageId);
            setSaveMessage("");
            setSaveButtonState("idle");
            setErrorNotification(null);
          } catch (error) {
            setErrorNotification({
              title: "Couldn't load design",
              description: getErrorMessage(error, "Try again in a moment."),
            });
          }
        }}
        onStartOver={onStartOver}
        errorNotification={errorNotification}
        onDismissErrorNotification={() => setErrorNotification(null)}
        exportButtonState={exportButtonState}
        saveButtonState={saveButtonState}
        saveMessage={saveMessage}
        savedDocuments={savedDocuments}
        savedDocumentsLoading={savedDocumentsLoading}
        selectedStorageId={selectedStorageId}
        setSelectedStorageId={setSelectedStorageId}
        successNotification={successNotification}
        onDismissSuccessNotification={() => setSuccessNotification(null)}
        setupModal={setupModal}
        setupModalOpen={setupModalOpen}
      />
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
