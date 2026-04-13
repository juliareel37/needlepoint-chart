"use client";

import { useRef, useState } from "react";
import {
  Button,
  ButtonIcon,
  FieldInput,
  SingleSelectDropdown,
  panelMutedTextStyle,
} from "@/components/design-system";
import { typographyStyles } from "@/app/design-system/typography";
import type { EditorDocumentState, EditorStore } from "@/lib/editor-v2/editor/store";
import type { SavedEditorV2DocumentRecord } from "../../../../app/editorV2LocalPersistence";
import { createSetProjectTitleCommand } from "../../workspaceCommands";
import styles from "../EditorV2Shell.module.css";

interface DocumentPanelPageProps {
  dispatch: EditorStore["dispatch"];
  document: EditorDocumentState;
  documentTitle: string;
  onLoadSelected: () => void;
  onSaveDocument: (document: EditorDocumentState) => void;
  onStartOver: () => void;
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
              onClick={() => onSaveDocument(document)}
            >
              Save
            </Button>
          </div>
          {saveMessage ? (
            <p className={styles.emptyMessage} style={panelMutedTextStyle}>
              {saveMessage}
            </p>
          ) : null}
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
  const title = record.document.project.title || "Untitled Design";
  const { width, height } = record.document.grid;
  return `${title} (${width}x${height})`;
}
