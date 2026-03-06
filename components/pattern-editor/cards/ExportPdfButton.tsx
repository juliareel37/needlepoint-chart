"use client";

import React from "react";
import type { Color } from "../../../lib/grid";
import { exportPatternPdf } from "../../../lib/pdf";
import { assetPath } from "../../../lib/assetPath";

type Props = {
  title: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  usedColors: { color: Color; count: number }[];
  grid: Uint16Array;
  paletteById: Map<number, Color>;
  symbolMap?: Map<number, string>;
  width: number;
  height: number;
  cellSize: number;
  threadView?: boolean;
  compact?: boolean;
};

export default function ExportPdfButton({
  title,
  canvasRef,
  usedColors,
  grid,
  paletteById,
  symbolMap,
  width,
  height,
  cellSize,
  threadView = false,
  compact = false,
}: Props) {
  return (
    <button
      onClick={() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        exportPatternPdf({ title, canvas, threadView, usedColors, grid, paletteById, symbolMap, width, height, cellSize });
      }}
      style={{
        padding: compact ? "4px 6px" : "4px 8px",
        borderRadius: 8,
        border: "1px solid var(--ui-border-subtle)",
        background: "var(--accent)",
        color: "#ffffff",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        justifyContent: "center",
      }}
    >
      <img
        src={assetPath("/icons/download.svg")}
        alt=""
        aria-hidden="true"
        width={16}
        height={16}
        style={{ display: "block", filter: "brightness(0) invert(1)" }}
      />
      {!compact && "Export PDF"}
    </button>
  );
}
