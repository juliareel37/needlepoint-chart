"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  ButtonIcon,
  FieldInput,
  SingleSelectDropdown,
} from "@/components/design-system";
import { typographyStyles } from "@/app/design-system/typography";
import type { EditorDocumentState, EditorStore } from "@/lib/editor-v2/editor/store";
import type {
  EditorDesignVersionListItem,
  LoadEditorV2VersionResult,
  RestoreEditorV2VersionResult,
  SavedEditorV2DocumentRecord,
} from "../../../../app/editorV2ServerPersistence";
import { createSetProjectTitleCommand } from "../../workspaceCommands";
import { SaveStatusCard } from "../SaveStatusCard";
import styles from "../EditorV2Shell.module.css";

interface DocumentPanelPageProps {
  autoSaveEnabled: boolean;
  dispatch: EditorStore["dispatch"];
  currentDocument: EditorDocumentState;
  documentTitle: string;
  hasSavedDesignAccess: boolean;
  hasUnsavedChanges: boolean;
  isDocumentPanelStatusVisible: boolean;
  onLoadSelected: () => void;
  renameRequestToken: number;
  onSignIn: () => void;
  onStartOver: () => void;
  recoveredLocalChanges: boolean;
  saveMessage: string;
  saveMode: "manual" | "autosave";
  savedDocuments: SavedEditorV2DocumentRecord[];
  savedDocumentsLoading: boolean;
  savedDocumentsHasMore: boolean;
  savedDocumentsLoadingMore: boolean;
  onOpenSavedDocuments: () => Promise<void> | void;
  onLoadMoreSavedDocuments: () => Promise<void> | void;
  currentStorageId: string;
  onListVersions: (storageId: string) => Promise<EditorDesignVersionListItem[]>;
  onPreviewVersion: (
    storageId: string,
    versionId: string,
    currentDocument: EditorDocumentState,
  ) => Promise<void> | void;
  onExitVersionPreview: () => void;
  onRestoreVersion: (
    storageId: string,
    versionId: string,
  ) => Promise<RestoreEditorV2VersionResult>;
  isVersionPreview: boolean;
  versionPreviewMeta: {
    versionId: string;
    createdAt: string;
    saveSource: LoadEditorV2VersionResult["saveSource"];
  } | null;
  selectedStorageId: string;
  setSelectedStorageId: (value: string) => void;
}

export function DocumentPanelPage({
  autoSaveEnabled,
  dispatch,
  currentDocument,
  documentTitle,
  hasSavedDesignAccess,
  hasUnsavedChanges,
  isDocumentPanelStatusVisible,
  onLoadSelected,
  renameRequestToken,
  onSignIn,
  onStartOver,
  recoveredLocalChanges,
  saveMessage,
  saveMode,
  savedDocuments,
  savedDocumentsLoading,
  savedDocumentsHasMore,
  savedDocumentsLoadingMore,
  onOpenSavedDocuments,
  onLoadMoreSavedDocuments,
  currentStorageId,
  onListVersions,
  onPreviewVersion,
  onExitVersionPreview,
  onRestoreVersion,
  isVersionPreview,
  versionPreviewMeta,
  selectedStorageId,
  setSelectedStorageId,
}: DocumentPanelPageProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(documentTitle);
  const [versionHistory, setVersionHistory] = useState<EditorDesignVersionListItem[]>([]);
  const [versionHistoryLoading, setVersionHistoryLoading] = useState(false);
  const [versionHistoryError, setVersionHistoryError] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [previewingVersionId, setPreviewingVersionId] = useState<string | null>(null);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);
  const commitOnBlurRef = useRef(true);

  const selectedVersion = versionHistory.find((version) => version.id === selectedVersionId) ?? null;

  function cancelRename() {
    setDraftTitle(documentTitle);
    setIsRenaming(false);
  }

  function commitRename() {
    const nextTitle = draftTitle.trim();
    if (!nextTitle || nextTitle === documentTitle) {
      cancelRename();
      return;
    }

    dispatch(createSetProjectTitleCommand(nextTitle));
    setIsRenaming(false);
  }

  function startRename() {
    commitOnBlurRef.current = true;
    setDraftTitle(documentTitle);
    setIsRenaming(true);
  }

  useEffect(() => {
    if (renameRequestToken <= 0) {
      return;
    }

    startRename();
  }, [documentTitle, renameRequestToken]);

  useEffect(() => {
    setVersionHistory([]);
    setVersionHistoryError(null);
    setSelectedVersionId("");
    setPreviewingVersionId(null);
    setRestoringVersionId(null);
  }, [currentStorageId]);

  useEffect(() => {
    if (versionPreviewMeta?.versionId) {
      setSelectedVersionId(versionPreviewMeta.versionId);
    }
  }, [versionPreviewMeta]);

  async function loadVersionHistory() {
    if (!currentStorageId) {
      return;
    }

    setVersionHistoryLoading(true);
    try {
      const versions = await onListVersions(currentStorageId);
      setVersionHistory(versions);
      setVersionHistoryError(null);
      setSelectedVersionId((current) =>
        current && versions.some((version) => version.id === current)
          ? current
          : versions[0]?.id ?? "",
      );
    } catch (error) {
      setVersionHistoryError(
        error instanceof Error ? error.message : "Couldn't load version history.",
      );
    } finally {
      setVersionHistoryLoading(false);
    }
  }

  async function handleRestoreSelectedVersion() {
    if (!currentStorageId || !selectedVersionId) {
      return;
    }

    setRestoringVersionId(selectedVersionId);
    try {
      await onRestoreVersion(currentStorageId, selectedVersionId);
      setVersionHistoryError(null);
      await loadVersionHistory();
    } catch (error) {
      setVersionHistoryError(
        error instanceof Error ? error.message : "Couldn't restore this version.",
      );
    } finally {
      setRestoringVersionId(null);
    }
  }

  async function handlePreviewSelectedVersion() {
    if (!currentStorageId || !selectedVersionId) {
      return;
    }

    setPreviewingVersionId(selectedVersionId);
    try {
      await onPreviewVersion(currentStorageId, selectedVersionId, currentDocument);
      setVersionHistoryError(null);
    } catch (error) {
      setVersionHistoryError(
        error instanceof Error ? error.message : "Couldn't preview this version.",
      );
    } finally {
      setPreviewingVersionId(null);
    }
  }

  return (
    <section className={styles.sidebarSection}>
      <div className={styles.sidebarPageBody}>
        {isDocumentPanelStatusVisible ? (
          <div className={styles.sidebarSubsection}>
            <SaveStatusCard
              autoSaveEnabled={autoSaveEnabled}
              hasSavedDesignAccess={hasSavedDesignAccess}
              hasUnsavedChanges={hasUnsavedChanges}
              layout="panel"
              onDismiss={null}
              onSignIn={onSignIn}
              recoveredLocalChanges={recoveredLocalChanges}
              saveMessage={saveMessage}
              saveMode={saveMode}
            />
          </div>
        ) : null}
        <div className={styles.sidebarSubsection}>
          <div className={styles.sidebarTitleBlock}>
            {isRenaming ? (
              <div>
                <FieldInput
                  autoFocus
                  value={draftTitle}
                  style={{ padding: "8px 12px" }}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  onBlur={() => {
                    if (!commitOnBlurRef.current) {
                      commitOnBlurRef.current = true;
                      return;
                    }

                    commitRename();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      commitOnBlurRef.current = false;
                      commitRename();
                    }

                    if (event.key === "Escape") {
                      event.preventDefault();
                      commitOnBlurRef.current = false;
                      cancelRename();
                    }
                  }}
                  aria-label="Design name"
                />
              </div>
            ) : (
              <button
                type="button"
                className={styles.editableTitleTrigger}
                aria-label="Rename design"
                title="Rename design"
                onClick={startRename}
              >
                <div
                  className={styles.sidebarDocumentTitle}
                  style={{
                    ...typographyStyles.h5,
                  }}
                >
                  {documentTitle}
                </div>
                <span className={styles.titleHoverIcon} aria-hidden="true">
                  <ButtonIcon
                    icon="/icons/lucide/pencil.svg"
                    className={styles.titleHoverPencil}
                  />
                </span>
              </button>
            )}
          </div>
          <div className={styles.panelRow}>
            <Button type="button" variant="secondary" onClick={onStartOver}>
              <ButtonIcon icon="/icons/lucide/plus.svg" className={styles.saveButtonIcon} />
              New design
            </Button>
          </div>
        </div>

        <div className={styles.sidebarSubsection}>
          <div className={styles.sidebarSubsectionHeader}>
            <h3 style={typographyStyles.h5}>Saved designs</h3>
          </div>
        
          {hasSavedDesignAccess ? (
            <>
            <div className={styles.loadDesignButtonRow}>

              <SavedDesignSingleSelect
                savedDocuments={savedDocuments}
                savedDocumentsLoading={savedDocumentsLoading}
                savedDocumentsHasMore={savedDocumentsHasMore}
                savedDocumentsLoadingMore={savedDocumentsLoadingMore}
                onOpenSavedDocuments={onOpenSavedDocuments}
                onLoadMoreSavedDocuments={onLoadMoreSavedDocuments}
                selectedStorageId={selectedStorageId}
                setSelectedStorageId={setSelectedStorageId}
              />
              <Button
                type="button"
                variant="primary"
                disabled={savedDocumentsLoading || !selectedStorageId}
                onClick={onLoadSelected}
                className={styles.loadButton}
              >
                Load
              </Button>
                          </div>

            </>
          ) : (
            <>
              <p className={styles.emptyMessage} style={typographyStyles.p2}>
                Sign in to access your saved designs.
              </p>
              <Button
                type="button"
                variant="primary"
                className={styles.loadButton}
                onClick={onSignIn}
              >
                Sign in
              </Button>
            </>
          )}

        </div>

        <div className={styles.sidebarSubsection}>
          <div className={styles.sidebarSubsectionHeaderRow}>
            <h3 style={typographyStyles.h5}>Version history</h3>
            <Button
              type="button"
              variant="ghostV2"
              size="sm"
              disabled={!currentStorageId || versionHistoryLoading}
              onClick={() => {
                void loadVersionHistory();
              }}
            >
              {versionHistoryLoading ? "Loading..." : "Refresh"}
            </Button>
          </div>

          {!currentStorageId ? (
            <p className={styles.emptyMessage} style={typographyStyles.p2}>
              Save this design to start tracking version history.
            </p>
          ) : (
            <>
              <div className={styles.loadDesignButtonRow}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <p className={styles.sidebarDocumentLabel} style={typographyStyles.p2}>
                    Choose a version
                  </p>
                  <SingleSelectDropdown
                    ariaLabel="Design version history"
                    emptyLabel={
                      versionHistoryLoading ? (
                        <span className={styles.loadingDropdownState}>
                          <span className={styles.saveButtonSpinner} aria-hidden="true" />
                          Loading version history...
                        </span>
                      ) : "No versions yet"
                    }
                    getItemLabel={formatVersionLabel}
                    getItemValue={(record) => record.id}
                    items={versionHistory}
                    menuMaxHeight={240}
                    menuMatchTriggerWidth
                    minWidth={0}
                    onOpenChange={(open) => {
                      if (open && versionHistory.length === 0 && !versionHistoryLoading) {
                        void loadVersionHistory();
                      }
                    }}
                    onValueChange={setSelectedVersionId}
                    placeholder={
                      versionHistoryLoading ? "Loading version history..." : "Select a version"
                    }
                    value={selectedVersionId}
                    wrapperStyle={{ width: "50vw" }}
                  />
                </div>
                <Button
                  type="button"
                  variant="primary"
                  disabled={
                    !selectedVersionId ||
                    restoringVersionId !== null ||
                    previewingVersionId !== null
                  }
                  onClick={() => {
                    void handlePreviewSelectedVersion();
                  }}
                  className={styles.loadButton}
                >
                  {previewingVersionId === selectedVersionId ? "Previewing..." : "Preview"}
                </Button>
              </div>

              {isVersionPreview && versionPreviewMeta ? (
                <div className={styles.versionPreviewCard}>
                  <p className={styles.sidebarDocumentLabel} style={typographyStyles.p2}>
                    Viewing {formatVersionTimestamp(versionPreviewMeta.createdAt)}
                  </p>
                  <p className={styles.versionPreviewMeta} style={typographyStyles.p2}>
                    Loaded from a {formatSaveSourceLabel(versionPreviewMeta.saveSource)} snapshot.
                  </p>
                  <div className={styles.versionPreviewActions}>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onExitVersionPreview}
                    >
                      Back to current
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      disabled={
                        !selectedVersionId ||
                        restoringVersionId !== null ||
                        selectedVersionId !== versionPreviewMeta.versionId
                      }
                      onClick={() => {
                        void handleRestoreSelectedVersion();
                      }}
                    >
                      {restoringVersionId === versionPreviewMeta.versionId
                        ? "Restoring..."
                        : "Restore this version"}
                    </Button>
                  </div>
                </div>
              ) : selectedVersion ? (
                <div className={styles.versionPreviewCard}>
                  <p className={styles.sidebarDocumentLabel} style={typographyStyles.p2}>
                    {formatVersionTimestamp(selectedVersion.createdAt)}
                  </p>
                  <p className={styles.versionPreviewMeta} style={typographyStyles.p2}>
                    Saved via {formatSaveSourceLabel(selectedVersion.saveSource)}.
                  </p>
                  <p className={styles.versionPreviewMeta} style={typographyStyles.p2}>
                    Preview it in the editor, then decide whether to restore it.
                  </p>
                </div>
              ) : (
                <p className={styles.sidebarSubsectionHint} style={typographyStyles.p2}>
                  The newest 50 versions are kept for this design.
                </p>
              )}

              {versionHistoryError ? (
                <p className={styles.emptyMessage} style={typographyStyles.p2}>
                  {versionHistoryError}
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function SavedDesignSingleSelect({
  savedDocuments,
  savedDocumentsLoading,
  savedDocumentsHasMore,
  savedDocumentsLoadingMore,
  onOpenSavedDocuments,
  onLoadMoreSavedDocuments,
  selectedStorageId,
  setSelectedStorageId,
}: {
  savedDocuments: SavedEditorV2DocumentRecord[];
  savedDocumentsLoading: boolean;
  savedDocumentsHasMore: boolean;
  savedDocumentsLoadingMore: boolean;
  onOpenSavedDocuments: () => Promise<void> | void;
  onLoadMoreSavedDocuments: () => Promise<void> | void;
  selectedStorageId: string;
  setSelectedStorageId: (value: string) => void;
}) {
  const [useTopDropdownPlacement, setUseTopDropdownPlacement] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");

    const updatePlacement = () => {
      setUseTopDropdownPlacement(mediaQuery.matches);
    };

    updatePlacement();
    mediaQuery.addEventListener("change", updatePlacement);

    return () => mediaQuery.removeEventListener("change", updatePlacement);
  }, []);

  return (
    <>

    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <p className={styles.sidebarDocumentLabel} style={typographyStyles.p2}>
        Choose a design
      </p>
      <SingleSelectDropdown
        ariaLabel="Saved designs"
        emptyLabel={
          savedDocumentsLoading ? (
            <span className={styles.loadingDropdownState}>
              <span className={styles.saveButtonSpinner} aria-hidden="true" />
              Loading saved designs...
            </span>
          ) : "No saved designs"
        }
        getItemLabel={formatSavedDesignLabel}
        getItemValue={(record) => record.storageId}
        items={savedDocuments}
        menuMaxHeight={240}
        menuMatchTriggerWidth
        menuPlacement={useTopDropdownPlacement ? "top-start" : "bottom-start"}
        menuPortalToViewport={useTopDropdownPlacement}
        minWidth={0}
        onOpenChange={(open) => {
          if (open) {
            void onOpenSavedDocuments();
          }
        }}
        onReachEnd={() => {
          if (savedDocumentsHasMore) {
            void onLoadMoreSavedDocuments();
          }
        }}
        onValueChange={setSelectedStorageId}
        menuFooter={
          savedDocumentsLoadingMore ? (
            <div className={styles.loadingDropdownState}>
              <span className={styles.saveButtonSpinner} aria-hidden="true" />
              Loading more designs...
            </div>
          ) : null
        }
        placeholder={savedDocumentsLoading ? "Loading saved designs..." : "Load saved design"}
        wrapperStyle={{ width: "50vw" }}
        value={selectedStorageId}
      />
          </div>
    </>

  );
}

function formatSavedDesignLabel(record: SavedEditorV2DocumentRecord): string {
  return `${record.title || "Untitled Design"} (${record.gridWidth}x${record.gridHeight})`;
}

function formatVersionLabel(record: EditorDesignVersionListItem): string {
  return `${formatVersionTimestamp(record.createdAt)} • ${formatSaveSourceLabel(record.saveSource)}`;
}

function formatVersionTimestamp(value: string): string {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatSaveSourceLabel(
  value: EditorDesignVersionListItem["saveSource"],
): string {
  if (value === "AUTOSAVE") {
    return "autosave";
  }

  if (value === "RESTORE") {
    return "restore";
  }

  return "manual save";
}
