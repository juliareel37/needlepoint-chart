"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Field,
  FieldInput,
  MenuSurface,
  MenuItem,
  MenuTrailingCheck,
  MenuTrigger,
  MenuChevronIcon,
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
                  <img
                    src="/icons/lucide/pencil.svg"
                    alt=""
                    aria-hidden="true"
                    style={{ width: 12, height: 12, display: "block" }}
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
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target || !rootRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const selectedRecord = useMemo(
    () =>
      savedDocuments.find((record) => record.storageId === selectedStorageId) ?? null,
    [savedDocuments, selectedStorageId],
  );

  return (
    <Field label="Choose a design">
      <div ref={rootRef} style={{ position: "relative", width: "fit-content", maxWidth: "100%" }}>
        <MenuTrigger
          type="button"
          variant="selection"
          open={open}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Saved designs"
          onClick={() => setOpen((value) => !value)}
          style={{ width: "100%", minWidth: 240, maxWidth: "100%" }}
        >
          <span>
            {selectedRecord
              ? formatSavedDesignLabel(selectedRecord)
              : "Load saved design"}
          </span>
          <MenuChevronIcon open={open} />
        </MenuTrigger>

        {open ? (
          <MenuSurface
            role="menu"
            aria-label="Saved designs"
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              zIndex: 10,
              width: "max-content",
              maxWidth: "min(320px, 100%)",
              maxHeight: 280,
              overflowY: "auto",
            }}
          >
            {savedDocuments.length ? (
              savedDocuments.map((record) => {
                const active = record.storageId === selectedStorageId;
                return (
                  <MenuItem
                    key={record.storageId}
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    active={active}
                    layout="trailing"
                    trailing={<MenuTrailingCheck active={active} />}
                    onClick={() => {
                      setSelectedStorageId(record.storageId);
                      setOpen(false);
                    }}
                  >
                    {formatSavedDesignLabel(record)}
                  </MenuItem>
                );
              })
            ) : (
              <MenuItem type="button" disabled>
                No saved designs
              </MenuItem>
            )}
          </MenuSurface>
        ) : null}
      </div>
    </Field>
  );
}

function formatSavedDesignLabel(record: SavedEditorV2DocumentRecord): string {
  const title = record.document.project.title || "Untitled Design";
  const { width, height } = record.document.grid;
  return `${title} (${width}x${height})`;
}
