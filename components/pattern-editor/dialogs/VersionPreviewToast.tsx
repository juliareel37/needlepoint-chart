"use client";

import React from "react";

type VersionPreviewState = {
  draftId: string;
  versionId: string;
  versionCreatedAt?: string;
};

type VersionPreviewToastProps = {
  preview: VersionPreviewState | null;
  onRestore: (draftId: string, versionId: string) => void;
  onCancel: () => void;
  formatDraftDate: (value: string) => string;
};

export function VersionPreviewToast({
  preview,
  onRestore,
  onCancel,
  formatDraftDate,
}: VersionPreviewToastProps) {
  if (!preview) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 65,
        background: "var(--card-bg)",
        color: "var(--foreground)",
        borderRadius: 14,
        padding: "10px 14px",
        boxShadow: "0 12px 32px var(--ui-border-strong)",
        border: "1px solid var(--panel-border)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{ fontSize: 12.5, opacity: 0.8 }}>
        Viewing version from {formatDraftDate(preview.versionCreatedAt ?? "")}
      </span>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => onRestore(preview.draftId, preview.versionId)}
          style={{
            padding: "6px 10px",
            borderRadius: 10,
            border: "1px solid var(--accent-strong)",
            background: "var(--accent-wash)",
            color: "var(--accent-strong)",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          Restore
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "6px 10px",
            borderRadius: 10,
            border: "1px solid var(--panel-border)",
            background: "var(--card-bg)",
            color: "var(--foreground)",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
