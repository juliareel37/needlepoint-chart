"use client";

import React from "react";

type DraftVersionItem = { id: string; createdAt: string };

type VersionHistoryDialogProps = {
  open: boolean;
  loading: boolean;
  items: DraftVersionItem[];
  currentDraftId: string | null;
  onClose: () => void;
  onViewVersion: (draftId: string, versionId: string, createdAt?: string) => void;
  formatDraftDate: (value: string) => string;
};

export function VersionHistoryDialog({
  open,
  loading,
  items,
  currentDraftId,
  onClose,
  onViewVersion,
  formatDraftDate,
}: VersionHistoryDialogProps) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Version history"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.45)",
        display: "block",
        zIndex: 55,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--card-bg)",
          color: "var(--foreground)",
          borderRadius: 14,
          padding: 16,
          width: "min(420px, 92vw)",
          boxShadow: "0 16px 40px var(--ui-border-strong)",
          display: "grid",
          gap: 12,
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ fontWeight: 700, fontSize: 15 }}>Version History</div>
        {loading ? (
          <div style={{ fontSize: 12.5, opacity: 0.75 }}>Loading versions…</div>
        ) : items.length ? (
          <div style={{ display: "grid", gap: 8, maxHeight: "55vh", overflow: "auto" }}>
            {items.map((version) => (
              <div
                key={version.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid var(--panel-border)",
                  background: "var(--card-bg)",
                }}
              >
                <span style={{ fontSize: 12, opacity: 0.75 }}>
                  {formatDraftDate(version.createdAt)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    currentDraftId ? onViewVersion(currentDraftId, version.id, version.createdAt) : null
                  }
                  style={{
                    padding: "4px 8px",
                    borderRadius: 8,
                    border: "1px solid var(--panel-border)",
                    background: "var(--muted-bg)",
                    color: "var(--foreground)",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  View version
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12.5, opacity: 0.75 }}>No versions yet.</div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "6px 10px",
              borderRadius: 10,
              border: "none",
              background: "var(--muted-bg)",
              color: "var(--foreground)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
