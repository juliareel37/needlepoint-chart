"use client";

import { SignInButton } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  ButtonIcon,
  FieldInput,
  SingleSelectDropdown,
} from "@/components/design-system";
import { typographyStyles } from "@/app/design-system/typography";
import type { EditorDocumentState, EditorStore } from "@/lib/editor-v2/editor/store";
import type { SavedEditorV2DocumentRecord } from "../../../../app/editorV2ServerPersistence";
import type { SaveButtonState } from "../../../../app/EditorV2Workspace";
import { createSetProjectTitleCommand } from "../../workspaceCommands";
import styles from "../EditorV2Shell.module.css";

interface DocumentPanelPageProps {
  dispatch: EditorStore["dispatch"];
  document: EditorDocumentState;
  documentTitle: string;
  hasSavedDesignAccess: boolean;
  onLoadSelected: () => void;
  onSaveDocument: (document: EditorDocumentState) => Promise<void> | void;
  onStartOver: () => void;
  saveButtonState: SaveButtonState;
  savedDocuments: SavedEditorV2DocumentRecord[];
  savedDocumentsLoading: boolean;
  selectedStorageId: string;
  setSelectedStorageId: (value: string) => void;
}

export function DocumentPanelPage({
  dispatch,
  document,
  documentTitle,
  hasSavedDesignAccess,
  onLoadSelected,
  onSaveDocument,
  onStartOver,
  saveButtonState,
  savedDocuments,
  savedDocumentsLoading,
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

  return (
    <section className={styles.sidebarSection}>
      <div className={styles.sidebarPageBody}>
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
              New design
            </Button>
            <Button
              type="button"
              variant="primary"
              className={styles.pendingActionButton}
              disabled={saveButtonState === "saving"}
              onClick={() => onSaveDocument(document)}
            >
              <SaveButtonLabel
                hasSavedDesignAccess={hasSavedDesignAccess}
                state={saveButtonState}
              />
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
              <SignInButton mode="modal">
                <Button type="button" variant="primary" className={styles.loadButton}>
                  Sign in
                </Button>
              </SignInButton>
            </>
          )}

        </div>
      </div>
    </section>
  );
}

function SaveButtonLabel({
  hasSavedDesignAccess,
  state,
}: {
  hasSavedDesignAccess: boolean;
  state: SaveButtonState;
}) {
  if (state === "saving") {
    return (
      <>
        <span className={styles.saveButtonSpinner} aria-hidden="true" />
        Saving
      </>
    );
  }

  if (state === "saved") {
    return (
      <>
        <ButtonIcon icon="/icons/lucide/check.svg" className={styles.saveButtonIcon} />
        Saved
      </>
    );
  }

  return <>{hasSavedDesignAccess ? "Save" : "Sign in to save"}</>;
}

function SavedDesignSingleSelect({
  savedDocuments,
  savedDocumentsLoading,
  selectedStorageId,
  setSelectedStorageId,
}: {
  savedDocuments: SavedEditorV2DocumentRecord[];
  savedDocumentsLoading: boolean;
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
        onValueChange={setSelectedStorageId}
        placeholder={savedDocumentsLoading ? "Loading saved designs..." : "Load saved design"}
        wrapperStyle={{ width: "100%" }}
        value={selectedStorageId}
      />
          </div>
    </>

  );
}

function formatSavedDesignLabel(record: SavedEditorV2DocumentRecord): string {
  return `${record.title || "Untitled Design"} (${record.gridWidth}x${record.gridHeight})`;
}
