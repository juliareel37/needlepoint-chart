"use client";

import React from "react";
import { Toggle } from "../ui/Toggle";

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
          fontWeight: 600,
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
          <label style={{ display: "grid", gap: 6, padding: "10px 0 5px" }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>Image opacity</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(traceOpacity * 100)}
              onChange={(e) => setTraceOpacity(parseInt(e.target.value, 10) / 100)}
              style={{ width: 120 }}
            />
          </label>
        )}
      </div>
    </div>
  );
}
