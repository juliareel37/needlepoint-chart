"use client";

import React from "react";
import { Toggle } from "../ui/Toggle";

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

type CanvasSettingsCardProps = {
  cardStyle: React.CSSProperties;
  cardShadow: string;
  cardShadowCollapsed: string;
  canvasSettingsOpen: boolean;
  setCanvasSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  collapseStyle: (open: boolean, maxHeight?: number) => React.CSSProperties;
  canvasSettingsMaxHeight: number;
  showGridlines: boolean;
  setShowGridlines: React.Dispatch<React.SetStateAction<boolean>>;
  threadView: boolean;
  setThreadView: React.Dispatch<React.SetStateAction<boolean>>;
  showSymbols: boolean;
  setShowSymbols: React.Dispatch<React.SetStateAction<boolean>>;
  traceImage: HTMLImageElement | null;
  traceOpacity: number;
  setTraceOpacity: React.Dispatch<React.SetStateAction<number>>;
  containerStyle?: React.CSSProperties;
};

export function CanvasSettingsCard({
  cardStyle,
  cardShadow,
  cardShadowCollapsed,
  canvasSettingsOpen,
  setCanvasSettingsOpen,
  collapseStyle,
  canvasSettingsMaxHeight,
  showGridlines,
  setShowGridlines,
  threadView,
  setThreadView,
  showSymbols,
  setShowSymbols,
  traceImage,
  traceOpacity,
  setTraceOpacity,
  containerStyle,
}: CanvasSettingsCardProps) {
  const opacityPercent = Math.round(traceOpacity * 100);

  return (
    <div
      className="app-card"
      style={{
        ...cardStyle,
        boxShadow: canvasSettingsOpen ? cardShadow : cardShadowCollapsed,
        display: "grid",
        gap: canvasSettingsOpen ? 12 : 0,
        ...containerStyle,
      }}
    >
      <button
        onClick={() => setCanvasSettingsOpen((open) => !open)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          border: "none",
          background: "transparent",
          padding: 0,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 15,
        }}
        type="button"
      >
        <span>Canvas Settings</span>
        <span style={{ opacity: 0.7, width: 14, textAlign: "center" }}>
          {canvasSettingsOpen ? "▾" : "▸"}
        </span>
      </button>
      <div style={{ ...collapseStyle(canvasSettingsOpen, canvasSettingsMaxHeight) }}>
        <div
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          }}
        >
          <Toggle label="Show gridlines" checked={showGridlines} onChange={setShowGridlines} />
          <Toggle label="Thread view" checked={threadView} onChange={setThreadView} />
          {/* <Toggle label="Dark canvas" checked={darkCanvas} onChange={setDarkCanvas} /> */}
          <Toggle label="Color symbols" checked={showSymbols} onChange={setShowSymbols} />
        </div>
        {traceImage && (
          <label
            style={{
              display: "grid",
              gridTemplateColumns: "auto minmax(0, 1fr) auto",
              alignItems: "center",
              gap: 10,
              padding: "10px 0 5px",
            }}
          >
            <span style={{ fontSize: 12, opacity: 0.7 }}>Image opacity</span>
            <input
              type="range"
              min={0}
              max={100}
              value={opacityPercent}
              onChange={(e) => setTraceOpacity(parseInt(e.target.value, 10) / 100)}
              style={{ width: "100%", minWidth: 0, cursor: "pointer" }}
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
                  setTraceOpacity(Math.max(0, Math.min(100, Math.round(next))) / 100);
                }}
                aria-label="Image opacity percentage"
                style={PERCENT_INPUT_STYLE}
              />
              <span style={{ fontSize: 12, opacity: 0.72 }}>%</span>
            </span>
          </label>
        )}
      </div>
    </div>
  );
}
