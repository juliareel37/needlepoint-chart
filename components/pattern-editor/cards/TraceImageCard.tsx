"use client";

import React from "react";
import { assetPath } from "../../../lib/assetPath";

type TraceImageCardProps = {
  cardStyle: React.CSSProperties;
  cardShadow: string;
  cardShadowCollapsed: string;
  traceOpen: boolean;
  setTraceOpen: React.Dispatch<React.SetStateAction<boolean>>;
  collapseStyle: (open: boolean, maxHeight?: number) => React.CSSProperties;
  traceInputRef: React.RefObject<HTMLInputElement | null>;
  traceFileName: string | null;
  traceImage: HTMLImageElement | null;
  traceLocked: boolean;
  onTraceFileSelected: (file: File) => void;
  onClearTrace: () => void;
  onSetTraceLockedState: (locked: boolean) => void;
};

export function TraceImageCard({
  cardStyle,
  cardShadow,
  cardShadowCollapsed,
  traceOpen,
  setTraceOpen,
  collapseStyle,
  traceInputRef,
  traceFileName,
  traceImage,
  traceLocked,
  onTraceFileSelected,
  onClearTrace,
  onSetTraceLockedState,
}: TraceImageCardProps) {
  return (
    <div className="app-card" style={{ ...cardStyle, boxShadow: traceOpen ? cardShadow : cardShadowCollapsed }}>
      <button
        onClick={() => setTraceOpen((open) => !open)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          border: "none",
          background: "transparent",
          padding: 0,
          marginBottom: traceOpen ? 10 : 0,
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 14,
        }}
        type="button"
      >
        <span>Background Image</span>
        <span style={{ opacity: 0.7, width: 14, textAlign: "center" }}>{traceOpen ? "▾" : "▸"}</span>
      </button>
      <div style={{ display: "grid", gap: 10, width: "100%", ...collapseStyle(traceOpen, 900) }}>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => traceInputRef.current?.click()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "6px 8px",
                borderRadius: 10,
                border: "none",
                background: "var(--muted-bg)",
                color: "var(--foreground)",
                cursor: "pointer",
                fontSize: 12,
                width: "fit-content",
              }}
            >
              Choose file
            </button>
            <button
              onClick={onClearTrace}
              disabled={!traceImage}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "none",
                background: "var(--muted-bg)",
                color: "var(--foreground)",
                cursor: "pointer",
                opacity: traceImage ? 1 : 0.5,
                fontSize: 12,
              }}
            >
              Remove
            </button>
            <input
              ref={traceInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                if (!file) return;
                onTraceFileSelected(file);
                e.currentTarget.value = "";
              }}
              style={{ display: "none" }}
            />
          </div>
          <span style={{ fontSize: 12, opacity: 0.75 }}>{traceFileName ?? "No file chosen"}</span>
        </div>
        <div />
      </div>
    </div>
  );
}
