"use client";

import React from "react";
import Palette from "../ui/Palette";
import type { Color } from "../../../lib/grid";

type PaletteSectionProps = {
  cardStyle: React.CSSProperties;
  cardShadow: string;
  cardShadowCollapsed: string;
  paletteOpen: boolean;
  setPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  collapseStyle: (open: boolean, maxHeight?: number) => React.CSSProperties;
  traceImage: HTMLImageElement | null;
  extractPaletteOpen: boolean;
  setExtractPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  extractPaletteSize: number;
  setExtractPaletteSize: React.Dispatch<React.SetStateAction<number>>;
  extractPaletteFromTrace: () => void;
  extractingPalette: boolean;
  palette: Color[];
  extractedIds: number[];
  usedColorIds: number[];
  activeColorId: number;
  remapTargetId: number | null;
  remapSourceId: number | null;
  onSelectActive: (id: number) => void;
  onRemapSelect: (id: number) => void;
  onAddColor: (name: string, hex: string) => void;
};

export function PaletteSection({
  cardStyle,
  cardShadow,
  cardShadowCollapsed,
  paletteOpen,
  setPaletteOpen,
  collapseStyle,
  traceImage,
  extractPaletteOpen,
  setExtractPaletteOpen,
  extractPaletteSize,
  setExtractPaletteSize,
  extractPaletteFromTrace,
  extractingPalette,
  palette,
  extractedIds,
  usedColorIds,
  activeColorId,
  remapTargetId,
  remapSourceId,
  onSelectActive,
  onRemapSelect,
  onAddColor,
}: PaletteSectionProps) {
  return (
    <div className="app-card" style={{ ...cardStyle, boxShadow: paletteOpen ? cardShadow : cardShadowCollapsed }}>
      <button
        onClick={() => setPaletteOpen((open) => !open)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          border: "none",
          background: "transparent",
          padding: 0,
          marginBottom: paletteOpen ? 10 : 0,
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 14,
        }}
        type="button"
      >
        <span>Palette</span>
        <span style={{ opacity: 0.7, width: 14, textAlign: "center" }}>{paletteOpen ? "▾" : "▸"}</span>
      </button>
      <div style={{ display: "grid", gap: 10, ...collapseStyle(paletteOpen, 1600) }}>
        {traceImage && (
          <div
            style={{
              display: "grid",
              gap: extractPaletteOpen ? 6 : 0,
              padding: extractPaletteOpen ? "10px 12px" : "6px 10px",
              borderRadius: 10,
              background: "var(--accent-wash)",
            }}
          >
            <button
              onClick={() => setExtractPaletteOpen((open) => !open)}
              type="button"
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
                fontSize: 14,
                opacity: 0.85,
              }}
            >
              <span>Generate from image</span>
              <span style={{ opacity: 0.7, width: 14, textAlign: "center" }}>
                {extractPaletteOpen ? "▾" : "▸"}
              </span>
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                ...collapseStyle(extractPaletteOpen, 120),
              }}
            >
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>Max colors</span>
                <input
                  type="number"
                  min={2}
                  max={32}
                  step={1}
                  value={extractPaletteSize}
                  onChange={(e) => setExtractPaletteSize(Number(e.target.value))}
                  style={{
                    width: 72,
                    padding: "6px 8px",
                    borderRadius: 8,
                    border: "1px solid var(--panel-border)",
                    background: "transparent",
                    color: "var(--foreground)",
                  }}
                />
              </label>
              <button
                onClick={extractPaletteFromTrace}
                disabled={extractingPalette}
                style={{
                  padding: "4px 10px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--accent)",
                  color: "#ffffff",
                  cursor: "pointer",
                  opacity: extractingPalette ? 0.5 : 1,
                }}
              >
                {extractingPalette ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        )}
        <Palette
          palette={palette}
          extractedIds={extractedIds}
          showExtractedFilter={Boolean(traceImage) && extractedIds.length > 0}
          usedIds={usedColorIds}
          showUsedFilter={usedColorIds.length > 0}
          activeColorId={remapTargetId ?? activeColorId}
          onSelect={onSelectActive}
          remapSourceId={remapSourceId}
          remapTargetId={remapTargetId}
          onRemapSelect={(targetId) => onRemapSelect(targetId)}
          onAddColor={onAddColor}
        />
      </div>
    </div>
  );
}
