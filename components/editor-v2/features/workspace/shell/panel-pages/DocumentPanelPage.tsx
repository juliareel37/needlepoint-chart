"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  ButtonIcon,
  FieldInput,
  SingleSelectDropdown,
} from "@/components/design-system";
import { typographyStyles } from "@/app/design-system/typography";
import type { EditorStore } from "@/lib/editor-v2/editor/store";
import type { SavedEditorV2DocumentRecord } from "../../../../app/editorV2ServerPersistence";
import { createSetProjectTitleCommand } from "../../workspaceCommands";
import { SaveStatusCard } from "../SaveStatusCard";
import styles from "../EditorV2Shell.module.css";

interface DocumentPanelPageProps {
  autoSaveEnabled: boolean;
  dispatch: EditorStore["dispatch"];
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
  onEnterVersionHistoryMode: () => void;
  selectedStorageId: string;
  setSelectedStorageId: (value: string) => void;
}

export function DocumentPanelPage({
  autoSaveEnabled,
  dispatch,
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
  onEnterVersionHistoryMode,
  selectedStorageId,
  setSelectedStorageId,
}: DocumentPanelPageProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(documentTitle);
  const commitOnBlurRef = useRef(true);

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
          <div className={styles.sidebarSubsectionHeader}>
            <h3 style={typographyStyles.h5}>Version history</h3>
          </div>
          {!currentStorageId ? (
            <p className={styles.emptyMessage} style={typographyStyles.p2}>
              Save this design to start tracking version history.
            </p>
          ) : (
            <div 
            // className={styles.versionHistoryEntryCard}
            >
              {/* <p className={styles.versionHistoryEntryText} style={typographyStyles.p2}>
                Open a dedicated version history view to preview older states and restore one when you're ready.
              </p> */}
              <Button type="button" variant="secondary" onClick={onEnterVersionHistoryMode}>
                <ButtonIcon icon="/icons/lucide/history.svg" className={styles.saveButtonIcon} />
                View version history
              </Button>
            </div>
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
