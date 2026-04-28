"use client";

import { useState, type ReactNode } from "react";
import type { EditorDocumentState } from "@/lib/editor-v2/editor/store";
import { exportPatternPdfFromDocument } from "@/lib/editor-v2/export";
import type {
  SaveEditorV2DocumentResult,
  SavedEditorV2DocumentRecord,
} from "./editorV2ServerPersistence";
import { EditorV2Shell } from "../features/workspace/shell/EditorV2Shell";
import { useEditorV2PersistenceController } from "./useEditorV2PersistenceController";
import type { EditorV2LocalSnapshotRecord } from "./editorV2AutosavePersistence";

export type SaveButtonState = "idle" | "saving" | "saved";
export type ExportButtonState = "idle" | "exporting";
export type DeleteButtonState = "idle" | "deleting";
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
  currentServerVersion,
  initialRecoveredLocalChanges,
  initialDegradedLocalRecovery,
  initialLocalSnapshot,
  saveMode,
  savedDocuments,
  savedDocumentsLoading,
  selectedStorageId,
  setSelectedStorageId,
  onSaveDocument,
  onLoadDocument,
  onDeleteCurrentDesign,
  onStartOver,
  setupModal,
  setupModalOpen,
}: {
  canvasLoading: boolean;
  hasSavedDesignAccess: boolean;
  onCanvasReady: () => void;
  currentStorageId: string;
  currentServerVersion: string | null;
  initialRecoveredLocalChanges: boolean;
  initialDegradedLocalRecovery: boolean;
  initialLocalSnapshot: EditorV2LocalSnapshotRecord | null;
  saveMode: "manual" | "autosave";
  savedDocuments: SavedEditorV2DocumentRecord[];
  savedDocumentsLoading: boolean;
  selectedStorageId: string;
  setSelectedStorageId: (value: string) => void;
  onSaveDocument: (
    document: EditorDocumentState,
    storageId?: string,
    baseVersion?: string | null,
  ) => Promise<SaveEditorV2DocumentResult | null>;
  onLoadDocument: (record: SavedEditorV2DocumentRecord) => Promise<void> | void;
  onDeleteCurrentDesign: (document: EditorDocumentState) => Promise<void> | void;
  onStartOver: () => void;
  setupModal: ReactNode;
  setupModalOpen: boolean;
}) {
  const [exportButtonState, setExportButtonState] =
    useState<ExportButtonState>("idle");
  const [deleteButtonState, setDeleteButtonState] =
    useState<DeleteButtonState>("idle");
  const [errorNotification, setErrorNotification] =
    useState<EditorV2ErrorNotification | null>(null);
  const [successNotification, setSuccessNotification] =
    useState<EditorV2SuccessNotification | null>(null);

  const { controllerState, handleManualSave } = useEditorV2PersistenceController({
    currentStorageId,
    currentServerVersion,
    hasSavedDesignAccess,
    initialRecoveredLocalChanges,
    initialDegradedLocalRecovery,
    initialLocalSnapshot,
    saveMode,
    onSaveDocument,
  });

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
              description: "Your PDF pattern is ready.",
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
        onSaveDocument={async (_nextDocument) => {
          await handleManualSave();
          setErrorNotification(null);
        }}
        onLoadDocument={async (record) => {
          try {
            await onLoadDocument(record);
            setSelectedStorageId(record.storageId);
            setErrorNotification(null);
          } catch (error) {
            setErrorNotification({
              title: "Couldn't load design",
              description: getErrorMessage(error, "Try again in a moment."),
            });
          }
        }}
        onDeleteCurrentDesign={async (document) => {
          setDeleteButtonState("deleting");

          try {
            await onDeleteCurrentDesign(document);
            setSuccessNotification({
              title: "Design deleted",
              description: "The design was removed and the editor has been reset.",
            });
            setErrorNotification(null);
          } catch (error) {
            setSuccessNotification(null);
            setErrorNotification({
              title: "Couldn't delete design",
              description: getErrorMessage(error, "Try again in a moment."),
            });
          } finally {
            setDeleteButtonState("idle");
          }
        }}
        onStartOver={onStartOver}
        currentStorageId={currentStorageId}
        deleteButtonState={deleteButtonState}
        errorNotification={errorNotification}
        onDismissErrorNotification={() => setErrorNotification(null)}
        exportButtonState={exportButtonState}
        recoveredLocalChanges={controllerState.recoveredLocalChanges}
        saveButtonState={controllerState.saveButtonState}
        saveMessage={controllerState.saveMessage}
        saveMode={saveMode}
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
