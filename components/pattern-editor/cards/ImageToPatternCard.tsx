"use client";

import React from "react";

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

type ImageToPatternCardProps = {
  cardStyle: React.CSSProperties;
  cardShadow: string;
  cardShadowCollapsed: string;
  imageToPatternOpen: boolean;
  setImageToPatternOpen: React.Dispatch<React.SetStateAction<boolean>>;
  collapseStyle: (open: boolean, maxHeight?: number) => React.CSSProperties;
  traceImage: HTMLImageElement | null;
  convertMaxColors: number;
  setConvertMaxColors: React.Dispatch<React.SetStateAction<number>>;
  convertSmoothing: number;
  setConvertSmoothing: React.Dispatch<React.SetStateAction<number>>;
  onConvert: () => void;
};

export function ImageToPatternCard({
  cardStyle,
  cardShadow,
  cardShadowCollapsed,
  imageToPatternOpen,
  setImageToPatternOpen,
  collapseStyle,
  traceImage,
  convertMaxColors,
  setConvertMaxColors,
  convertSmoothing,
  setConvertSmoothing,
  onConvert,
}: ImageToPatternCardProps) {
  const convertEnabled = Boolean(traceImage);
  const smoothingPercent = Math.round(convertSmoothing * 100);

  return (
    <div
      className="app-card"
      style={{ ...cardStyle, boxShadow: imageToPatternOpen ? cardShadow : cardShadowCollapsed }}
    >
      <button
        onClick={() => setImageToPatternOpen((open) => !open)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          border: "none",
          background: "transparent",
          padding: 0,
          marginBottom: imageToPatternOpen ? 14 : 0,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 15,
          textAlign: "left",
        }}
        type="button"
      >
        <span>Convert Image to Pattern</span>
        <span style={{ opacity: 0.7, width: 14, textAlign: "center" }}>{imageToPatternOpen ? "▾" : "▸"}</span>
      </button>
      <div
        style={{
          display: "grid",
          gap: 16,
          width: "100%",
          ...collapseStyle(imageToPatternOpen, 500),
        }}
      >
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr) auto", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>Max colors</span>
            <input
              type="range"
              min={2}
              max={32}
              value={convertMaxColors}
              onChange={(e) => setConvertMaxColors(parseInt(e.target.value, 10))}
              disabled={!traceImage}
            />
            <input
              type="number"
              min={2}
              max={32}
              step={1}
              value={convertMaxColors}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (!Number.isFinite(next)) return;
                setConvertMaxColors(Math.max(2, Math.min(32, Math.round(next))));
              }}
              disabled={!traceImage}
              aria-label="Max colors value"
              style={VALUE_INPUT_STYLE}
            />
          </div>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr) auto", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>Smoothing</span>
            <input
              type="range"
              min={0}
              max={100}
              value={smoothingPercent}
              onChange={(e) => setConvertSmoothing(parseInt(e.target.value, 10) / 100)}
              disabled={!traceImage}
            />
            <span style={PERCENT_INPUT_WRAPPER_STYLE}>
              <input
                type="text"
                inputMode="numeric"
                value={String(smoothingPercent)}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^\d]/g, "");
                  if (!digits) return;
                  const next = Number(digits);
                  if (!Number.isFinite(next)) return;
                  setConvertSmoothing(Math.max(0, Math.min(100, Math.round(next))) / 100);
                }}
                disabled={!traceImage}
                aria-label="Smoothing percentage"
                style={PERCENT_INPUT_STYLE}
              />
              <span style={{ fontSize: 12, opacity: 0.72 }}>%</span>
            </span>
          </div>
        </div>
        <button
          onClick={onConvert}
          disabled={!convertEnabled}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "8px 10px",
            height: 34,
            minHeight: 34,
            boxSizing: "border-box",
            borderRadius: 8,
            border: "1px solid var(--ui-border-subtle)",
            background: "var(--accent)",
            color: "#ffffff",
            cursor: "pointer",
            opacity: convertEnabled ? 1 : 0.5,
            width: "100%",
            fontWeight: 600,
            fontSize: 12,
            lineHeight: 1,
          }}
        >
          Convert
        </button>
      </div>
    </div>
  );
}
