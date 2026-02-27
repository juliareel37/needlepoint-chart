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
}: Props) {
  return (
    <button
      onClick={() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        exportPatternPdf({ title, canvas, threadView, usedColors, grid, paletteById, symbolMap, width, height, cellSize });
      }}
      style={{
        padding: "4px 8px",
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
        src={assetPath("/download.svg")}
        alt=""
        aria-hidden="true"
        width={16}
        height={16}
        style={{ display: "block", filter: "var(--icon-on-fg-filter)" }}
      />
      Export PDF
    </button>
  );
}
