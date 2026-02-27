"use client";

import React from "react";

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
          marginBottom: imageToPatternOpen ? 12 : 0,
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 14,
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
          gap: 12,
          width: "100%",
          ...collapseStyle(imageToPatternOpen, 500),
        }}
      >
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>Max colors</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{convertMaxColors}</span>
          </div>
          <input
            type="range"
            min={2}
            max={32}
            value={convertMaxColors}
            onChange={(e) => setConvertMaxColors(parseInt(e.target.value, 10))}
            disabled={!traceImage}
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>Smoothing</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{Math.round(convertSmoothing * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(convertSmoothing * 100)}
            onChange={(e) => setConvertSmoothing(parseInt(e.target.value, 10) / 100)}
            disabled={!traceImage}
          />
        </div>
        <button
          onClick={onConvert}
          disabled={!convertEnabled}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "4px 8px",
            marginTop: 6,
            borderRadius: 8,
            border: "1px solid var(--ui-border-subtle)",
            background: "var(--card-bg)",
            color: "var(--foreground)",
            cursor: "pointer",
            opacity: convertEnabled ? 1 : 0.5,
            width: "100%",
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          Convert
        </button>
      </div>
    </div>
  );
}
