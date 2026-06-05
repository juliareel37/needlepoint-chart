"use client";

import { typographyStyles } from "@/app/design-system/typography";
import { Button, ButtonIcon } from "@/components/design-system";
import styles from "./EditorV2Shell.module.css";

const SAVE_SUCCESS_PREFIX = "Saved at ";
const AUTOSAVE_SUCCESS_PREFIX = "Autosaved at ";
const LOCAL_AUTOSAVE_SUCCESS_PREFIX = "Saved locally at ";
const VERSION_SAVE_SUCCESS_PREFIX = "Version saved at ";
const SAVING_LOCAL_PREFIX = "Saving locally";

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
  const guestBanner = layout === "banner" && !hasSavedDesignAccess;
  const localAutosaveOnly = saveMode === "autosave" && !hasSavedDesignAccess;

  if (layout !== "banner" && saveMode === "autosave" && !hasSavedDesignAccess && !localAutosaveOnly) {
    return null;
  }

  if (!guestBanner && !autoSaveEnabled && !saveMessage && !hasUnsavedChanges) {
    return null;
  }

  const state = guestBanner
    ? "alert"
    : getSaveStatusState(saveMessage, hasSavedDesignAccess);
  const showInlineSignInLink = guestBanner;
  const message = getSaveStatusMessage({
    autoSaveEnabled,
    hasSavedDesignAccess,
    hasUnsavedChanges,
    layout,
    recoveredLocalChanges,
    saveMessage,
  });
  const icon = getSaveStatusIcon({
    autoSaveEnabled,
    hasSavedDesignAccess,
    layout,
    recoveredLocalChanges,
    saveMode,
    saveMessage,
    state,
  });

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
        {showInlineSignInLink ? (
          <>
            <button
              type="button"
              className={styles.headerSaveStatusInlineLink}
              onClick={onSignIn}
            >
              Sign in
            </button>{" "}
            to keep designs in your library and sync them across devices. Guest drafts stay only on this browser for up to 7 days.
          </>
        ) : (
          message
        )}
      </p>
      {layout === "banner" && onDismiss ? (
        <Button
          type="button"
          variant="ghostV2"
          size="sm"
          iconOnly
          className={styles.headerSaveStatusDismiss}
          aria-label="Dismiss save status"
          onClick={onDismiss}
        >
          <ButtonIcon icon="/icons/lucide/x.svg" className={styles.headerSaveStatusDismissIcon} />
        </Button>
      ) : null}
    </div>
  );
}

function getSaveStatusMessage({
  autoSaveEnabled,
  hasSavedDesignAccess,
  hasUnsavedChanges,
  layout,
  recoveredLocalChanges,
  saveMessage,
}: {
  autoSaveEnabled: boolean;
  hasSavedDesignAccess: boolean;
  hasUnsavedChanges: boolean;
  layout: "header" | "banner" | "panel";
  recoveredLocalChanges: boolean;
  saveMessage: string;
}): string {
  if (!hasSavedDesignAccess) {
    if (layout === "banner") {
      return "Sign in to keep designs in your library and sync them across devices. Guest drafts stay only on this browser for up to 7 days.";
    }

    if (saveMessage.startsWith(SAVING_LOCAL_PREFIX) || saveMessage.startsWith(LOCAL_AUTOSAVE_SUCCESS_PREFIX)) {
      return saveMessage;
    }

    if (saveMessage.startsWith("Local recovery limited")) {
      return saveMessage;
    }

    if (recoveredLocalChanges) {
      return "Local draft restored on this browser.";
    }

    if (autoSaveEnabled) {
      return "Autosaving locally on this browser.";
    }

    if (hasUnsavedChanges) {
      return "Unsaved local changes.";
    }

    return "Local draft active on this browser.";
  }

  if (autoSaveEnabled) {
    return "Autosave enabled";
  }

  if (recoveredLocalChanges) {
    return "Recovered local changes. Sync pending.";
  }

  if (!hasSavedDesignAccess && !saveMessage) {
    return "Changes not saved. Sign in to save your work.";
  }

  return saveMessage || "Changes not saved";
}

function getSaveStatusIcon({
  autoSaveEnabled,
  hasSavedDesignAccess,
  layout,
  recoveredLocalChanges,
  saveMode,
  saveMessage,
  state,
}: {
  autoSaveEnabled: boolean;
  hasSavedDesignAccess: boolean;
  layout: "header" | "banner" | "panel";
  recoveredLocalChanges: boolean;
  saveMode: "manual" | "autosave";
  saveMessage: string;
  state: "ready" | "saving" | "saved" | "error" | "info" | "alert";
}): string {
  if (!hasSavedDesignAccess && layout === "banner") {
    return "/icons/lucide/alert.svg";
  }

  if (!hasSavedDesignAccess) {
    if (recoveredLocalChanges) {
      return "/icons/lucide/backup.svg";
    }

    if (
      autoSaveEnabled ||
      saveMessage.startsWith(SAVING_LOCAL_PREFIX) ||
      saveMessage.startsWith(LOCAL_AUTOSAVE_SUCCESS_PREFIX)
    ) {
      return "/icons/lucide/cloud_done.svg";
    }

    if (saveMessage.startsWith("Local recovery limited")) {
      return "/icons/lucide/alert.svg";
    }

    return "/icons/lucide/info.svg";
  }

  if (autoSaveEnabled) {
    return "/icons/lucide/cloud_done.svg";
  }

  if (recoveredLocalChanges) {
    return "/icons/lucide/backup.svg";
  }

  if (state === "info") {
    return "/icons/lucide/info.svg";
  }

  if (state === "alert" || state === "ready" || state === "error") {
    return "/icons/lucide/alert.svg";
  }

  return saveModeIconForState(state, saveMode);
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
    saveMessage.startsWith(AUTOSAVE_SUCCESS_PREFIX) ||
    saveMessage.startsWith(LOCAL_AUTOSAVE_SUCCESS_PREFIX) ||
    saveMessage.startsWith(VERSION_SAVE_SUCCESS_PREFIX)
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
