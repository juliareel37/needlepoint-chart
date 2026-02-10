"use client";

import React from "react";

type ConfirmDialogState = {
  title: string;
  message: string;
  confirmLabel?: string;
  position?: { top: number; left: number } | null;
} | null;

type ConfirmDialogProps = {
  dialog: ConfirmDialogState;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({ dialog, onClose, onConfirm }: ConfirmDialogProps) {
  if (!dialog) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={dialog.title}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.35)",
        display: "block",
        zIndex: 70,
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
          width: "min(360px, 90vw)",
          boxShadow: "0 16px 40px rgba(15, 23, 42, 0.2)",
          display: "grid",
          gap: 12,
          position: "absolute",
          top: dialog.position ? dialog.position.top : "50%",
          left: dialog.position ? dialog.position.left : "50%",
          transform: dialog.position ? "none" : "translate(-50%, -50%)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ fontWeight: 700, fontSize: 15 }}>{dialog.title}</div>
        <div style={{ fontSize: 12.5, opacity: 0.75 }}>{dialog.message}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
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
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
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
            {dialog.confirmLabel ?? "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
