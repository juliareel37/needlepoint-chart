"use client";

import { typographyStyles } from "@/app/design-system/typography";
import { Button, ButtonIcon } from "@/components/design-system";
import styles from "./EditorV2Shell.module.css";

const SAVE_SUCCESS_PREFIX = "Saved at ";
const AUTOSAVE_SUCCESS_PREFIX = "Autosaved at ";

export function SaveStatusCard({
  autoSaveEnabled,
  hasSavedDesignAccess,
  hasUnsavedChanges,
  layout,
  onDismiss,
  onSignIn,
  recoveredLocalChanges,
  saveMode,
  saveMessage,
}: {
  autoSaveEnabled: boolean;
  hasSavedDesignAccess: boolean;
  hasUnsavedChanges: boolean;
  layout: "header" | "banner" | "panel";
  onDismiss: (() => void) | null;
  onSignIn: () => void;
  recoveredLocalChanges: boolean;
  saveMode: "manual" | "autosave";
  saveMessage: string;
}) {
  if (!autoSaveEnabled && !saveMessage && !hasUnsavedChanges) {
    return null;
  }

  const state = getSaveStatusState(saveMessage, hasSavedDesignAccess);
  const message =
    autoSaveEnabled
      ? "Autosave enabled"
      : recoveredLocalChanges
        ? "Recovered local changes. Sync pending."
        : !hasSavedDesignAccess && !saveMessage
          ? "Sign in to save changes"
          : saveMessage || "Changes not saved";
  const icon =
    autoSaveEnabled
      ? "/icons/lucide/cloud_done.svg"
      : recoveredLocalChanges
        ? "/icons/lucide/backup.svg"
        : state === "info"
          ? "/icons/lucide/info.svg"
          : state === "alert"
            ? "/icons/lucide/alert.svg"
            : state === "ready"
              ? "/icons/lucide/alert.svg"
              : state === "error"
                ? "/icons/lucide/alert.svg"
                : saveModeIconForState(state, saveMode);

  return (
    <div
      className={styles.headerSaveStatus}
      data-layout={layout}
      data-state={state}
      role="status"
      aria-live="polite"
      title={message}
    >
      <span className={styles.headerSaveStatusIconWrap} aria-hidden="true">
        <ButtonIcon icon={icon} className={styles.headerSaveStatusIcon} />
      </span>
      <p className={styles.headerSaveStatusMessage} style={typographyStyles.p2}>
        {message}
      </p>
      {layout === "banner" && !hasSavedDesignAccess ? (
        <Button type="button" variant="secondary" size="sm" onClick={onSignIn}>
          Sign in
        </Button>
      ) : null}
      {layout === "banner" && onDismiss ? (
        <button
          type="button"
          className={styles.headerSaveStatusDismiss}
          aria-label="Dismiss save status"
          onClick={onDismiss}
        >
          <ButtonIcon icon="/icons/lucide/x.svg" className={styles.headerSaveStatusDismissIcon} />
        </button>
      ) : null}
    </div>
  );
}

function getSaveStatusState(
  saveMessage: string,
  hasSavedDesignAccess: boolean,
): "ready" | "saving" | "saved" | "error" | "info" | "alert" {
  if (!hasSavedDesignAccess && !saveMessage) {
    return "info";
  }

  if (!saveMessage) {
    return "ready";
  }

  if (saveMessage.startsWith("Saving")) {
    return "saving";
  }

  if (
    saveMessage.startsWith(SAVE_SUCCESS_PREFIX) ||
    saveMessage.startsWith(AUTOSAVE_SUCCESS_PREFIX)
  ) {
    return "saved";
  }

  if (saveMessage.startsWith("Couldn't")) {
    return "error";
  }

  if (saveMessage.startsWith("Sync conflict")) {
    return "alert";
  }

  if (saveMessage.startsWith("Local recovery")) {
    return "info";
  }

  return "info";
}

function saveModeIconForState(
  state: "ready" | "saving" | "saved" | "error" | "info" | "alert",
  saveMode: "manual" | "autosave",
): string {
  return saveMode === "autosave" && (state === "saving" || state === "saved")
    ? "/icons/lucide/cloud_done.svg"
    : "/icons/lucide/save.svg";
}
