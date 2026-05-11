"use client";

import { typographyStyles } from "@/app/design-system/typography";
import { StitchThumbnailCanvas } from "@/app/library/StitchThumbnailCanvas";
import { Button, ButtonIcon } from "@/components/design-system";
import type { LibraryTracePlacement } from "@/lib/library/designs";
import type { EditorDocumentState, EditorStore } from "@/lib/editor-v2/editor/store";
import { buildLibraryStitchSnapshot } from "@/lib/library/stitchSnapshot";
import { EditableDesignTitle } from "../EditableDesignTitle";
import styles from "../EditorV2Shell.module.css";

interface DocumentPanelPageProps {
  autoSaveEnabled: boolean;
  currentStorageId: string;
  dispatch: EditorStore["dispatch"];
  document: EditorDocumentState;
  documentTitle: string;
  exportInProgress: boolean;
  hasSavedDesignAccess: boolean;
  hasUnsavedChanges: boolean;
  isDocumentPanelStatusVisible: boolean;
  lastSaveConfirmedAt: number | null;
  onClearLocalBrowserData: () => Promise<void> | void;
  onDownloadDocument: () => void;
  onDuplicateDocument: () => void;
  onOpenVersionHistory: () => void;
  onSaveVersionSnapshot: () => void;
  onSignIn: () => void;
  onStartOver: () => void;
  recoveredLocalChanges: boolean;
  renameRequestToken: number;
  saveMessage: string;
  snapshotSaving: boolean;
}

export function DocumentPanelPage({
  autoSaveEnabled,
  currentStorageId,
  dispatch,
  document,
  documentTitle,
  exportInProgress,
  hasSavedDesignAccess,
  hasUnsavedChanges,
  isDocumentPanelStatusVisible,
  lastSaveConfirmedAt,
  onClearLocalBrowserData,
  onDownloadDocument,
  onDuplicateDocument,
  onOpenVersionHistory,
  onSaveVersionSnapshot,
  onSignIn,
  onStartOver,
  recoveredLocalChanges,
  renameRequestToken,
  saveMessage,
  snapshotSaving,
}: DocumentPanelPageProps) {
  const stitchSnapshot = buildLibraryStitchSnapshot({
    gridWidth: document.grid.width,
    gridHeight: document.grid.height,
    cells: document.grid.cells,
    colorsById: document.palette.colorsById,
  });
  const tracePlacement = document.trace
    ? ({
        imageWidth: document.trace.imageWidth,
        imageHeight: document.trace.imageHeight,
        cropX: document.trace.cropX,
        cropY: document.trace.cropY,
        cropWidth: document.trace.cropWidth,
        cropHeight: document.trace.cropHeight,
        offsetX: document.trace.offsetX,
        offsetY: document.trace.offsetY,
        scale: document.trace.scale,
        rotation: document.trace.rotation,
      } satisfies LibraryTracePlacement)
    : null;
  const colorCount = countUsedColors(document.grid.cells);
  const status = getDocumentStatus({
    autoSaveEnabled,
    hasSavedDesignAccess,
    hasUnsavedChanges,
    recoveredLocalChanges,
    saveMessage,
    lastSaveConfirmedAt,
    updatedAt: document.project.updatedAt,
  });
  const canvasLabel =
    typeof document.grid.meshCount === "number" && Number.isFinite(document.grid.meshCount)
      ? `${document.grid.meshCount}-count`
      : "Not set";
  const historyDisabled = hasSavedDesignAccess && !currentStorageId;

  return (
    <section className={styles.sidebarSection}>
      <div className={styles.sidebarPageBody}>
        <section className={styles.documentSummaryCard}>
          <div className={styles.documentSummaryRow}>
            <div className={styles.documentThumbnailFrame}>
              <div className={styles.documentThumbnailSurface}>
                <StitchThumbnailCanvas
                  snapshot={stitchSnapshot}
                  traceThumbnailUrl={document.trace?.previewUrl ?? null}
                  tracePlacement={tracePlacement}
                  className={styles.documentThumbnailCanvas}
                  testId="document-sidebar-thumbnail"
                />
              </div>
            </div>
            <div className={styles.documentSummaryContent}>
              <div className={styles.documentPanelTitleRow}>
                <div className={styles.sidebarTitleBlock}>
                  <EditableDesignTitle
                    className={styles.documentPanelTitle}
                    dispatch={dispatch}
                    documentTitle={documentTitle}
                    renameRequestToken={renameRequestToken}
                  />
                </div>
              </div>
              {isDocumentPanelStatusVisible ? (
                <div className={styles.documentStatusRow} data-state={status.state}>
                  <span className={styles.documentStatusDot} aria-hidden="true" />
                  <p className={styles.documentStatusLabel} style={typographyStyles.p2}>
                    {status.label}
                  </p>
                  {status.detail ? (
                    <>
                      <span className={styles.documentStatusDivider} aria-hidden="true">
                        •
                      </span>
                      <p className={styles.documentStatusDetail} style={typographyStyles.p2}>
                        {status.detail}
                      </p>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className={styles.documentMetadataCard}>
          <div className={styles.documentMetadataGrid}>
            <DocumentMetaItem
              label="Size"
              value={`${document.grid.width} × ${document.grid.height} sts`}
            />
            <DocumentMetaItem label="Canvas" value={canvasLabel} />
            <DocumentMetaItem label="Colors" value={`${colorCount}`} />
            <DocumentMetaItem
              label="Created"
              value={formatDocumentDate(document.project.createdAt)}
            />
          </div>
        </section>
            <div className={styles.traceSectionDivider} aria-hidden="true" />

        <section className={styles.documentActionGrid}>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className={styles.documentActionButton}
            onClick={onDuplicateDocument}
          >
            <span className={styles.documentActionIconWrap}>
              <ButtonIcon icon="/icons/lucide/copy.svg" className={styles.documentActionIcon} />
            </span>
            Duplicate
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className={styles.documentActionButton}
            disabled={snapshotSaving}
            onClick={onSaveVersionSnapshot}
          >
            <span className={styles.documentActionIconWrap}>
              {snapshotSaving ? (
                <span className={styles.saveButtonSpinner} aria-hidden="true" />
              ) : (
                <ButtonIcon icon="/icons/lucide/save.svg" className={styles.documentActionIcon} />
              )}
            </span>
            {snapshotSaving ? "Saving..." : "Snapshot"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className={styles.documentActionButton}
            disabled={exportInProgress}
            onClick={onDownloadDocument}
          >
            <span className={styles.documentActionIconWrap}>
              {exportInProgress ? (
                <span className={styles.saveButtonSpinner} aria-hidden="true" />
              ) : (
                <ButtonIcon
                  icon="/icons/lucide/download.svg"
                  className={styles.documentActionIcon}
                />
              )}
            </span>
            {exportInProgress ? "Exporting..." : "Download"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className={styles.documentActionButton}
            disabled={historyDisabled}
            onClick={onOpenVersionHistory}
          >
            <span className={styles.documentActionIconWrap}>
              <ButtonIcon icon="/icons/lucide/history.svg" className={styles.documentActionIcon} />
            </span>
            History
          </Button>
        </section>

        <section className={styles.documentSecondaryActions}>
          {/* <Button
            type="button"
            variant="ghostV2"
            size="md"
            className={styles.documentSecondaryButton}
            onClick={onStartOver}
          >
            <ButtonIcon icon="/icons/lucide/file-plus-corner.svg" />
            New design
          </Button> */}
          {!hasSavedDesignAccess ? (
            <Button
              type="button"
              variant="ghostV2"
              size="md"
              className={styles.documentSecondaryButton}
              onClick={onSignIn}
            >
              <ButtonIcon icon="/icons/lucide/user.svg" />
              Sign in
            </Button>
          ) : null}
          {!hasSavedDesignAccess ? (
            <Button
              type="button"
              variant="ghostV2"
              size="md"
              className={styles.documentSecondaryButton}
              onClick={() => {
                void onClearLocalBrowserData();
              }}
            >
              <ButtonIcon icon="/icons/lucide/trash2.svg" />
              Clear local draft
            </Button>
          ) : null}
        </section>
      </div>
    </section>
  );
}

function DocumentMetaItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={styles.documentMetaItem}>
      <p className={styles.documentMetaLabel} style={typographyStyles.p2}>
        {label}
      </p>
      <p className={styles.documentMetaValue} style={typographyStyles.p1}>
        {value}
      </p>
    </div>
  );
}

function countUsedColors(cells: Array<string | null>) {
  return new Set(cells.filter((cellId): cellId is string => Boolean(cellId))).size;
}

function formatDocumentDate(value: string | null) {
  if (!value) {
    return "Local draft";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Local draft";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatRelativeTimestamp(value: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  const elapsedMs = Date.now() - timestamp;
  const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));

  if (elapsedSeconds < 45) {
    return "just now";
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays === 1) {
    return "yesterday";
  }

  if (elapsedDays < 7) {
    return `${elapsedDays}d ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}

function formatRelativeTimestampFromNumber(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return formatRelativeTimestamp(new Date(value).toISOString());
}

function getDocumentStatus({
  autoSaveEnabled,
  hasSavedDesignAccess,
  hasUnsavedChanges,
  lastSaveConfirmedAt,
  recoveredLocalChanges,
  saveMessage,
  updatedAt,
}: {
  autoSaveEnabled: boolean;
  hasSavedDesignAccess: boolean;
  hasUnsavedChanges: boolean;
  lastSaveConfirmedAt: number | null;
  recoveredLocalChanges: boolean;
  saveMessage: string;
  updatedAt: string | null;
}) {
  const confirmedDetail =
    formatRelativeTimestampFromNumber(lastSaveConfirmedAt) ??
    formatRelativeTimestamp(updatedAt);

  if (!hasSavedDesignAccess) {
    if (recoveredLocalChanges) {
      return { state: "info", label: "Restored locally", detail: "this browser" } as const;
    }

    if (saveMessage.startsWith("Saving locally")) {
      return { state: "pending", label: "Saving", detail: null } as const;
    }

    return {
      state: "saved",
      label: autoSaveEnabled ? "Saved locally" : "Local draft",
      detail: confirmedDetail ?? "this browser",
    } as const;
  }

  if (saveMessage.startsWith("Saving")) {
    return {
      state: "pending",
      label: "Saving",
      detail: null,
    } as const;
  }

  if (saveMessage.toLowerCase().includes("error")) {
    return { state: "error", label: "Save issue", detail: null } as const;
  }

  return {
    state: "saved",
    label: "Saved",
    detail: confirmedDetail,
  } as const;
}
