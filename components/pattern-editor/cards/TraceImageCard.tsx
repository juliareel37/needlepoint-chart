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
  onFitToGrid: () => void;
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
  onFitToGrid,
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
          marginBottom: traceOpen ? 12 : 0,
          cursor: "pointer",
          fontWeight: 600,
        }}
        type="button"
      >
        <span>Background Image</span>
        <span style={{ opacity: 0.7 }}>{traceOpen ? "▾" : "▸"}</span>
      </button>
      <div style={{ display: "grid", gap: 10, width: "100%", ...collapseStyle(traceOpen, 900) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
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
          <span style={{ fontSize: 12, opacity: 0.75 }}>{traceFileName ?? "No file chosen"}</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={onFitToGrid}
            disabled={!traceImage || traceLocked}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "none",
              background: "var(--muted-bg)",
              color: "var(--foreground)",
              cursor: "pointer",
              opacity: !traceImage || traceLocked ? 0.5 : 1,
              fontSize: 12,
            }}
          >
            Fit to grid
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
        </div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Drag the image to move it. Drag the corners to resize. Lock it when aligned.
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "inline-flex", gap: 4 }}>
            <button
              onClick={() => onSetTraceLockedState(true)}
              disabled={!traceImage}
              aria-pressed={traceLocked}
              style={{
                padding: "7px 8px",
                borderRadius: 10,
                border: traceLocked ? "1px solid var(--accent-strong)" : "none",
                background: traceLocked ? "var(--accent-soft)" : "var(--muted-bg)",
                color: traceLocked ? "var(--accent-strong)" : "var(--foreground)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                opacity: traceImage ? 1 : 0.5,
                fontSize: 13,
              }}
            >
              <img
                src={assetPath("/lock.svg")}
                alt=""
                aria-hidden="true"
                width={15}
                height={15}
                style={{
                  display: "block",
                  filter: traceLocked ? "none" : "var(--icon-on-bg-filter)",
                }}
              />
              Lock Image
            </button>
            <button
              onClick={() => onSetTraceLockedState(false)}
              disabled={!traceImage}
              aria-pressed={!traceLocked}
              style={{
                padding: "7px 8px",
                borderRadius: 10,
                border: !traceLocked ? "1px solid var(--accent-strong)" : "none",
                background: !traceLocked ? "var(--accent-soft)" : "var(--muted-bg)",
                color: !traceLocked ? "var(--accent-strong)" : "var(--foreground)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                opacity: traceImage ? 1 : 0.5,
                fontSize: 13,
              }}
            >
              <img
                src={assetPath("/unlock.svg")}
                alt=""
                aria-hidden="true"
                width={15}
                height={15}
                style={{
                  display: "block",
                  filter: !traceLocked ? "none" : "var(--icon-on-bg-filter)",
                }}
              />
              Unlock Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
