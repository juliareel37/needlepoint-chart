"use client";

import React from "react";
import { assetPath } from "../../../lib/assetPath";

const VALUE_INPUT_STYLE: React.CSSProperties = {
  width: 46,
  minWidth: 0,
  padding: "4px 6px",
  borderRadius: 8,
  border: "1px solid var(--ui-border-subtle)",
  background: "var(--card-bg)",
  color: "var(--foreground)",
  fontSize: 12,
  fontWeight: 400,
  textAlign: "left",
};

const PERCENT_INPUT_WRAPPER_STYLE: React.CSSProperties = {
  width: 46,
  minWidth: 0,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: 2,
  padding: "4px 6px",
  borderRadius: 8,
  border: "1px solid var(--ui-border-subtle)",
  background: "var(--card-bg)",
  color: "var(--foreground)",
};

const PERCENT_INPUT_STYLE: React.CSSProperties = {
  minWidth: 0,
  width: "100%",
  padding: 0,
  border: "none",
  background: "transparent",
  color: "inherit",
  fontSize: 12,
  fontWeight: 400,
  textAlign: "left",
  outline: "none",
};

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
  traceOpacity: number;
  traceEditMode: boolean;
  traceVisible: boolean;
  onTraceFileSelected: (file: File) => void;
  onClearTrace: () => void;
  onTraceOpacityChange: (value: number) => void;
  onToggleTraceEdit: () => void;
  onToggleTraceVisible: () => void;
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
  traceOpacity,
  traceEditMode,
  traceVisible,
  onTraceFileSelected,
  onClearTrace,
  onTraceOpacityChange,
  onToggleTraceEdit,
  onToggleTraceVisible,
}: TraceImageCardProps) {
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };
  const opacityPercent = Math.round((Number.isFinite(traceOpacity) ? traceOpacity : 0) * 100);

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
          marginBottom: traceOpen ? 16 : 0,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 15,
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
                display: "grid",
                gap: 16,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gap: 10,
                  padding: "8px 8px",
                  borderRadius: 10,
                  border: "none",
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
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={traceImage.currentSrc || traceImage.src}
                      alt=""
                      aria-hidden="true"
                      width={26}
                      height={26}
                      style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </span>
                  <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        opacity: 0.92,
                        color: "var(--foreground)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={traceFileName}
                    >
                      {traceFileName}
                    </span>
                    <span style={{ fontSize: 11, opacity: 0.84, color: "var(--foreground)" }}>
                      {traceFileSize != null ? formatBytes(traceFileSize) : "Size unavailable"}
                    </span>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => traceInputRef.current?.click()}
                    className="trace-image-row-action-button"
                    style={{
                      padding: "8px 10px",
                      minHeight: 34,
                      borderRadius: 8,
                      border: "none",
                      background: "rgba(15, 23, 42, 0.16)",
                      color: "var(--foreground)",
                      cursor: "pointer",
                      fontSize: 12,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 8,
                      textAlign: "left",
                    }}
                    aria-label="Replace image"
                  >
                    <span className="trace-image-row-action-button-icon" aria-hidden="true" style={{ opacity: 0.96 }}>
                      <img
                        src={assetPath("/icons/upload.svg")}
                        alt=""
                        aria-hidden="true"
                        width={16}
                        height={16}
                        style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                      />
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.96 }}>Replace</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClearTrace}
                    className="trace-image-row-action-button"
                    style={{
                      padding: "8px 10px",
                      minHeight: 34,
                      borderRadius: 8,
                      border: "none",
                      background: "rgba(15, 23, 42, 0.16)",
                      color: "var(--foreground)",
                      cursor: "pointer",
                      fontSize: 12,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 8,
                      textAlign: "left",
                    }}
                    aria-label="Remove image"
                  >
                    <span className="trace-image-row-action-button-icon" aria-hidden="true" style={{ opacity: 0.96 }}>
                      <img
                        src={assetPath("/icons/trash.svg")}
                        alt=""
                        aria-hidden="true"
                        width={16}
                        height={16}
                        style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                      />
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.96 }}>Remove</span>
                  </button>
                </div>
              </div>
              <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#000",
                    paddingBottom: 4,
                  }}
                >
                  Positioning
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, auto))", gap: 8 }}>
                  <button
                    type="button"
                    onClick={onToggleTraceEdit}
                    className="trace-image-row-action-button"
                    data-active={traceEditMode ? "true" : undefined}
                  style={{
                    padding: "8px 10px",
                    minHeight: 34,
                    borderRadius: 8,
                    border: "none",
                    background: "rgba(15, 23, 42, 0.16)",
                      color: "var(--foreground)",
                      cursor: "pointer",
                      fontSize: 12,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 8,
                      textAlign: "left",
                      width: "auto",
                    }}
                    aria-label="Reposition image"
                  >
                    <span className="trace-image-row-action-button-icon" aria-hidden="true" style={{ opacity: 0.96 }}>
                      <img
                        src={assetPath("/icons/transform.svg")}
                        alt=""
                        aria-hidden="true"
                        width={16}
                        height={16}
                        style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                      />
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.96 }}>Reposition Image</span>
                  </button>
                </div>
              </div>
              <div style={{ display: "grid", gap: 8, padding: "12px 2px 0" }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#000",
                    paddingBottom: 4,
                  }}
                >
                  Appearance
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, opacity: 0.7 }}>Visibility</span>
                  <button
                    type="button"
                    onClick={onToggleTraceVisible}
                    className="trace-image-row-action-button"
                    style={{
                      padding: "8px 10px",
                      minHeight: 34,
                      borderRadius: 8,
                      border: "none",
                      background: "rgba(15, 23, 42, 0.16)",
                      color: "var(--foreground)",
                      cursor: "pointer",
                      fontSize: 12,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 8,
                      textAlign: "left",
                      width: "fit-content",
                    }}
                    aria-label={traceVisible ? "Hide background image" : "Show background image"}
                  >
                    <span className="trace-image-row-action-button-icon" aria-hidden="true" style={{ opacity: 0.96 }}>
                      <img
                        src={assetPath(traceVisible ? "/icons/eye.svg" : "/icons/eye_off.svg")}
                        alt=""
                        aria-hidden="true"
                        width={16}
                        height={16}
                        style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                      />
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.96 }}>
                      {traceVisible ? "Hide Image" : "Show Image"}
                    </span>
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr) auto", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, opacity: 0.7 }}>Opacity</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={opacityPercent}
                    onChange={(e) => onTraceOpacityChange(parseInt(e.target.value, 10) / 100)}
                    style={{ cursor: "pointer" }}
                  />
                  <span style={PERCENT_INPUT_WRAPPER_STYLE}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={String(opacityPercent)}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/[^\d]/g, "");
                        if (!digits) return;
                        const next = Number(digits);
                        if (!Number.isFinite(next)) return;
                        onTraceOpacityChange(Math.max(0, Math.min(100, Math.round(next))) / 100);
                      }}
                      aria-label="Opacity percentage"
                      style={PERCENT_INPUT_STYLE}
                    />
                    <span style={{ fontSize: 12, opacity: 0.72 }}>%</span>
                  </span>
                </div>
              </div>
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
                background: "transparent",
                textAlign: "center",
              }}
            >
              <img
                src={assetPath("/icons/upload.svg")}
                alt=""
                aria-hidden="true"
                width={18}
                height={18}
                style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
              />
              <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.7 }}>Choose a file or drag &amp; drop.</span>
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
                  minHeight: 34,
                  borderRadius: 10,
                  border: "none",
                  background: "var(--muted-bg)",
                  color: "var(--foreground)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 400,
                  opacity: 0.7,
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
