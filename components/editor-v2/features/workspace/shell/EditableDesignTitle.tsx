"use client";

import { useEffect, useRef, useState } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import { ButtonIcon, FieldInput } from "@/components/design-system";
import type { EditorStore } from "@/lib/editor-v2/editor/store";
import { createSetProjectTitleCommand } from "../workspaceCommands";
import styles from "./EditorV2Shell.module.css";

export function EditableDesignTitle({
  className,
  dispatch,
  documentTitle,
  onCommitTitle,
  renameRequestToken,
  renameAriaLabel = "Rename design",
  inputAriaLabel = "Design name",
  variant = "panel",
}: {
  className?: string;
  dispatch?: EditorStore["dispatch"];
  documentTitle: string;
  onCommitTitle?: (nextTitle: string) => void;
  renameRequestToken: number;
  renameAriaLabel?: string;
  inputAriaLabel?: string;
  variant?: "header" | "panel";
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(documentTitle);
  const commitOnBlurRef = useRef(true);
  const inputSize = Math.max(12, Math.min(32, (draftTitle || documentTitle).trim().length || 12));

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

    if (onCommitTitle) {
      onCommitTitle(nextTitle);
    } else if (dispatch) {
      dispatch(createSetProjectTitleCommand(nextTitle));
    }
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
    <div
      className={[
        styles.editableTitleRoot,
        variant === "header" ? styles.editableTitleRootHeader : styles.editableTitleRootPanel,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isRenaming ? (
        <FieldInput
          autoFocus
          value={draftTitle}
          size={inputSize}
          className={[
            styles.editableTitleInput,
            variant === "header" ? styles.editableTitleInputHeader : styles.editableTitleInputPanel,
          ].join(" ")}
          style={variant === "header" ? { padding: "8px 14px" } : { padding: "8px 12px" }}
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
          aria-label={inputAriaLabel}
        />
      ) : (
        <button
          type="button"
          className={styles.editableTitleTrigger}
          aria-label={renameAriaLabel}
          title={renameAriaLabel}
          onClick={startRename}
        >
          <span className={styles.editableTitleSurface}>
            <div
              className={styles.editableTitleText}
              style={typographyStyles.h5}
            >
              {documentTitle}
            </div>
          </span>
          <span className={styles.titleHoverIcon} aria-hidden="true">
            <ButtonIcon
              icon="/icons/lucide/pencil.svg"
              className={styles.titleHoverPencil}
            />
          </span>
        </button>
      )}
    </div>
  );
}
