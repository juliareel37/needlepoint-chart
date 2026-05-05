"use client";

import { useState, type ReactNode } from "react";
import type { EditorDocumentState } from "@/lib/editor-v2/editor/store";
import { exportPatternPdfFromDocument } from "@/lib/editor-v2/export";
import type {
  EditorDesignVersionListItem,
  LoadEditorV2VersionResult,
  RestoreEditorV2VersionResult,
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
  isVersionHistoryMode,
  isVersionPreview,
  versionPreviewMeta,
  saveMode,
  savedDocuments,
  savedDocumentsLoading,
  savedDocumentsHasMore,
  savedDocumentsLoadingMore,
  onOpenSavedDocuments,
  onLoadMoreSavedDocuments,
  selectedStorageId,
  setSelectedStorageId,
  onSaveDocument,
  onLoadDocument,
  onListVersions,
  onEnterVersionHistoryMode,
  onExitVersionHistoryMode,
  onPreviewVersion,
  onExitVersionPreview,
  onSelectCurrentVersionInHistoryMode,
  onRestoreVersion,
  onRestoreVersionAsCopy,
  onDeleteCurrentDesign,
  onStartOver,
  persistentSuccessNotification,
  onDismissPersistentSuccessNotification,
  onCloseSetupModal,
  setupModal,
  setupModalMode,
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
  isVersionHistoryMode: boolean;
  isVersionPreview: boolean;
  versionPreviewMeta: {
    versionId: string;
    createdAt: string;
    saveSource: LoadEditorV2VersionResult["saveSource"];
  } | null;
  saveMode: "manual" | "autosave";
  savedDocuments: SavedEditorV2DocumentRecord[];
  savedDocumentsLoading: boolean;
  savedDocumentsHasMore: boolean;
  savedDocumentsLoadingMore: boolean;
  onOpenSavedDocuments: () => Promise<void> | void;
  onLoadMoreSavedDocuments: () => Promise<void> | void;
  selectedStorageId: string;
  setSelectedStorageId: (value: string) => void;
  onSaveDocument: (
    document: EditorDocumentState,
    storageId?: string,
    baseVersion?: string | null,
    saveSource?: "manual" | "autosave",
    forceVersion?: boolean,
  ) => Promise<SaveEditorV2DocumentResult | null>;
  onLoadDocument: (record: SavedEditorV2DocumentRecord) => Promise<void> | void;
  onListVersions: (storageId: string) => Promise<EditorDesignVersionListItem[]>;
  onEnterVersionHistoryMode: () => void;
  onExitVersionHistoryMode: () => void;
  onPreviewVersion: (
    storageId: string,
    versionId: string,
    currentDocument: EditorDocumentState,
  ) => Promise<void>;
  onExitVersionPreview: () => void;
  onSelectCurrentVersionInHistoryMode: () => void;
  onRestoreVersion: (
    storageId: string,
    versionId: string,
  ) => Promise<RestoreEditorV2VersionResult>;
  onRestoreVersionAsCopy: (
    storageId: string,
    versionId: string,
  ) => Promise<RestoreEditorV2VersionResult>;
  onDeleteCurrentDesign: (document: EditorDocumentState) => Promise<void> | void;
  onStartOver: () => void;
  persistentSuccessNotification: EditorV2SuccessNotification | null;
  onDismissPersistentSuccessNotification: () => void;
  onCloseSetupModal: () => void;
  setupModal: ReactNode;
  setupModalMode: "full" | "new-only";
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
  const displayedSuccessNotification = successNotification ?? persistentSuccessNotification;

  const { controllerState, handleManualSave, handleManualVersionSnapshot } =
    useEditorV2PersistenceController({
    currentStorageId,
    currentServerVersion,
    hasSavedDesignAccess,
    initialRecoveredLocalChanges,
    initialDegradedLocalRecovery,
    initialLocalSnapshot,
    isVersionHistoryMode,
    isVersionPreview,
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
        onSaveVersionSnapshot={async () => {
          await handleManualVersionSnapshot();
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
        onPreviewVersion={async (storageId, versionId, currentDocument) => {
          try {
            await onPreviewVersion(storageId, versionId, currentDocument);
            setErrorNotification(null);
          } catch (error) {
            setErrorNotification({
              title: "Couldn't preview version",
              description: getErrorMessage(error, "Try again in a moment."),
            });
            throw error;
          }
        }}
        onExitVersionPreview={onExitVersionPreview}
        onListVersions={onListVersions}
        onEnterVersionHistoryMode={onEnterVersionHistoryMode}
        onExitVersionHistoryMode={onExitVersionHistoryMode}
        onSelectCurrentVersionInHistoryMode={onSelectCurrentVersionInHistoryMode}
        onRestoreVersion={async (storageId, versionId) => {
          try {
            const restored = await onRestoreVersion(storageId, versionId);
            setErrorNotification(null);
            return restored;
          } catch (error) {
            setSuccessNotification(null);
            setErrorNotification({
              title: "Couldn't restore version",
              description: getErrorMessage(error, "Try again in a moment."),
            });
            throw error;
          }
        }}
        onRestoreVersionAsCopy={async (storageId, versionId) => {
          try {
            const restored = await onRestoreVersionAsCopy(storageId, versionId);
            setErrorNotification(null);
            return restored;
          } catch (error) {
            setSuccessNotification(null);
            setErrorNotification({
              title: "Couldn't make copy from version",
              description: getErrorMessage(error, "Try again in a moment."),
            });
            throw error;
          }
        }}
        onDeleteCurrentDesign={async (document) => {
          setDeleteButtonState("deleting");

          try {
            await onDeleteCurrentDesign(document);
            setSuccessNotification({
              title: "Moved to Trash",
              description: "The design can be restored for 30 days from My Designs.",
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
        hasPersistableUnsavedChanges={controllerState.hasPersistableUnsavedChanges}
        recoveredLocalChanges={controllerState.recoveredLocalChanges}
        saveButtonState={controllerState.saveButtonState}
        saveMessage={controllerState.saveMessage}
        isVersionHistoryMode={isVersionHistoryMode}
        isVersionPreview={isVersionPreview}
        versionPreviewMeta={versionPreviewMeta}
        saveMode={saveMode}
        savedDocuments={savedDocuments}
        savedDocumentsLoading={savedDocumentsLoading}
        savedDocumentsHasMore={savedDocumentsHasMore}
        savedDocumentsLoadingMore={savedDocumentsLoadingMore}
        onOpenSavedDocuments={onOpenSavedDocuments}
        onLoadMoreSavedDocuments={onLoadMoreSavedDocuments}
        selectedStorageId={selectedStorageId}
        setSelectedStorageId={setSelectedStorageId}
        successNotification={displayedSuccessNotification}
        onDismissSuccessNotification={() => {
          if (successNotification) {
            setSuccessNotification(null);
            return;
          }

          onDismissPersistentSuccessNotification();
        }}
        onCloseSetupModal={onCloseSetupModal}
        setupModal={setupModal}
        setupModalMode={setupModalMode}
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
