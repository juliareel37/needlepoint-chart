"use client";

import { useRef, useState } from "react";
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
  onLoadSelected: () => void;
  onSaveDocument: (document: EditorDocumentState) => Promise<void> | void;
  onStartOver: () => void;
  saveButtonState: SaveButtonState;
  saveMessage: string;
  savedDocuments: SavedEditorV2DocumentRecord[];
  selectedStorageId: string;
  setSelectedStorageId: (value: string) => void;
}

export function DocumentPanelPage({
  dispatch,
  document,
  documentTitle,
  onLoadSelected,
  onSaveDocument,
  onStartOver,
  saveButtonState,
  saveMessage,
  savedDocuments,
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
          <SaveStatus saveMessage={saveMessage} />

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
              <SaveButtonLabel state={saveButtonState} />
            </Button>
          </div>
        </div>

        <div className={styles.sidebarSubsection}>
          <div className={styles.sidebarSubsectionHeader}>
            <h3 style={typographyStyles.h5}>Saved designs</h3>
          </div>
          <SavedDesignSingleSelect
            savedDocuments={savedDocuments}
            selectedStorageId={selectedStorageId}
            setSelectedStorageId={setSelectedStorageId}
          />
          <Button
            type="button"
            variant="primary"
            disabled={!selectedStorageId}
            onClick={onLoadSelected}
            className={styles.loadButton}
          >
            Load
          </Button>
        </div>
      </div>
    </section>
  );
}

function SaveButtonLabel({ state }: { state: SaveButtonState }) {
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

  return <>Save</>;
}

function SaveStatus({ saveMessage }: { saveMessage: string }) {
  const state = getSaveStatusState(saveMessage);
  const message =
    state === "saved"
      ? saveMessage
      : state === "error"
        ? saveMessage
        : "Not saved yet";
  const icon = state === "error" ? "/icons/lucide/alert.svg" : "/icons/lucide/save.svg";

  return (
    <div className={styles.saveStatus} data-state={state} role="status" aria-live="polite">
      <span className={styles.saveStatusIconWrap} aria-hidden="true">
        <ButtonIcon icon={icon} className={styles.saveStatusIcon} />
      </span>
      <p className={styles.saveStatusMessage} style={typographyStyles.p2}>
        {message}
      </p>
    </div>
  );
}

function getSaveStatusState(saveMessage: string): "ready" | "saved" | "error" {
  if (!saveMessage) {
    return "ready";
  }

  if (saveMessage.startsWith("Couldn't")) {
    return "error";
  }

  return "saved";
}

function SavedDesignSingleSelect({
  savedDocuments,
  selectedStorageId,
  setSelectedStorageId,
}: {
  savedDocuments: SavedEditorV2DocumentRecord[];
  selectedStorageId: string;
  setSelectedStorageId: (value: string) => void;
}) {
  return (
    <SingleSelectDropdown
      ariaLabel="Saved designs"
      emptyLabel="No saved designs"
      getItemLabel={formatSavedDesignLabel}
      getItemValue={(record) => record.storageId}
      items={savedDocuments}
      label="Choose a design"
      onValueChange={setSelectedStorageId}
      placeholder="Load saved design"
      value={selectedStorageId}
    />
  );
}

function formatSavedDesignLabel(record: SavedEditorV2DocumentRecord): string {
  return `${record.title || "Untitled Design"} (${record.gridWidth}x${record.gridHeight})`;
}
