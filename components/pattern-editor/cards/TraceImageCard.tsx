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
  traceFileSize: number | null;
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
  traceFileSize,
  traceImage,
  traceLocked,
  onTraceFileSelected,
  onClearTrace,
  onSetTraceLockedState,
}: TraceImageCardProps) {
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

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
          {traceImage && traceFileName ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "8px 8px",
                borderRadius: 10,
                border: "1px solid var(--ui-border-subtle)",
                background: "var(--ui-surface-soft)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--card-bg)",
                    border: "1px solid var(--ui-border-subtle)",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={assetPath("/file.svg")}
                    alt=""
                    aria-hidden="true"
                    width={14}
                    height={14}
                    style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                  />
                </span>
                <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--foreground)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={traceFileName}
                  >
                    {traceFileName}
                  </span>
                  <span style={{ fontSize: 11, opacity: 0.7 }}>
                    {traceFileSize != null ? formatBytes(traceFileSize) : "Size unavailable"}
                  </span>
                </div>
              </div>
              <button
                onClick={onClearTrace}
                style={{
                  padding: "6px",
                  borderRadius: 8,
                  border: "none",
                  background: "transparent",
                  color: "var(--foreground)",
                  cursor: "pointer",
                  fontSize: 12,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
                aria-label="Remove image"
              >
                <img
                  src={assetPath("/trash.svg")}
                  alt=""
                  aria-hidden="true"
                  width={16}
                  height={16}
                  style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                />
              </button>
            </div>
          ) : (
            <div
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files?.[0];
                if (!file) return;
                onTraceFileSelected(file);
              }}
              style={{
                display: "grid",
                placeItems: "center",
                gap: 6,
                padding: "14px 12px",
                borderRadius: 12,
                border: "none",
                background: "var(--ui-surface-faint)",
                textAlign: "center",
              }}
            >
              <img
                src={assetPath("/upload.svg")}
                alt=""
                aria-hidden="true"
                width={18}
                height={18}
                style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
              />
              <span style={{ fontSize: 12, fontWeight: 700 }}>Choose a file or drag &amp; drop.</span>
              <span style={{ fontSize: 11, opacity: 0.7 }}>PNG, JPG, WEBP, or GIF up to 10 MB.</span>
              <button
                type="button"
                onClick={() => traceInputRef.current?.click()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
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
                Browse file
              </button>
            </div>
          )}
        </div>
        <div />
      </div>
    </div>
  );
}
