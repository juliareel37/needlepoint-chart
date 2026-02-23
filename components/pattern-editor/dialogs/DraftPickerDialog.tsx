"use client";

import React from "react";
import { createPortal } from "react-dom";

type DraftListItem = { id: string; title: string; updatedAt: string };

type DraftPickerDialogProps = {
  open: boolean;
  loading: boolean;
  items: DraftListItem[];
  previewUrls: Record<string, string | null>;
  onClose: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  formatDraftDate: (value: string) => string;
};

export function DraftPickerDialog({
  open,
  loading,
  items,
  previewUrls,
  onClose,
  onSelect,
  onDelete,
  formatDraftDate,
}: DraftPickerDialogProps) {
  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Load saved WIP"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.45)",
        display: "block",
        zIndex: 300,
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
          width: "min(440px, 92vw)",
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
        <div style={{ fontWeight: 700, fontSize: 15 }}>Load a saved WIP</div>
        {loading ? (
          <div style={{ fontSize: 12.5, opacity: 0.75 }}>Loading your drafts…</div>
        ) : (
          <div style={{ display: "grid", gap: 8, maxHeight: "55vh", overflow: "auto" }}>
            {items.map((draft) => (
              <div
                key={draft.id}
                style={{
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => onSelect(draft.id)}
                    style={{
                      flex: 1,
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      textAlign: "left",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid var(--panel-border)",
                      background: "var(--muted-bg)",
                      color: "var(--foreground)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 10,
                        border: "1px solid var(--panel-border)",
                        background: "var(--card-bg)",
                        display: "grid",
                        placeItems: "center",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {previewUrls[draft.id] ? (
                        <img
                          src={previewUrls[draft.id] ?? ""}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            imageRendering: "pixelated",
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 10, opacity: 0.6 }}>Preview</span>
                      )}
                    </div>
                    <div style={{ display: "grid", gap: 4 }}>
                      <span style={{ fontWeight: 600 }}>{draft.title || "Untitled Pattern"}</span>
                      <span style={{ fontSize: 12, opacity: 0.7 }}>
                        Updated {formatDraftDate(draft.updatedAt)}
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${draft.title || "Untitled Pattern"}`}
                    onClick={() => onDelete(draft.id, draft.title || "Untitled Pattern")}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      border: "1px solid var(--panel-border)",
                      background: "var(--card-bg)",
                      color: "var(--foreground)",
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      aria-hidden="true"
                      focusable="false"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M6 6l1 14h10l1-14" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
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
    </div>,
    document.body
  );
}
