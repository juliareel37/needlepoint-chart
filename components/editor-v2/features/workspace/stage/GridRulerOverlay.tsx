"use client";

import { typographySpecs } from "@/app/design-system/typography";
import type { GridWorldMetrics } from "@/lib/editor-v2/editor/viewport";
import type { ViewportState } from "@/lib/editor-v2/editor/store";

export function GridRulerOverlay({
  axisStep,
  metrics,
  viewport,
}: {
  axisStep: number;
  metrics: GridWorldMetrics;
  viewport: ViewportState;
}) {
  const rulerScale = viewport.zoom < 1 ? Math.max(0.75, viewport.zoom) : 1;
  const fontSize = Math.max(8, Math.round(typographySpecs.s.size * rulerScale));
  const lineHeight = Math.max(10, Math.round(typographySpecs.s.lineHeight * rulerScale));
  const labelInset = Math.max(6, Math.round(fontSize * 0.75));

  const columns = [];
  for (let x = axisStep; x <= metrics.width; x += axisStep) {
    columns.push({
      key: `x-${x}`,
      label: String(x),
      position: viewport.offsetX + x * metrics.cellSize * viewport.zoom,
    });
  }

  const rows = [];
  for (let y = axisStep; y <= metrics.height; y += axisStep) {
    rows.push({
      key: `y-${y}`,
      label: String(y),
      position: viewport.offsetY + y * metrics.cellSize * viewport.zoom,
    });
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "visible",
        pointerEvents: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        color: "rgba(31, 41, 55, 0.9)",
        fontSize: `${fontSize}px`,
        lineHeight: `${lineHeight}px`,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          position: "absolute",
          left: `${viewport.offsetX - labelInset}px`,
          top: `${viewport.offsetY - labelInset}px`,
          transform: "translate(-100%, -100%)",
        }}
      >
        0
      </span>

      {columns.map((column) => (
        <span
          key={`${column.key}-top`}
          style={{
            position: "absolute",
            left: `${column.position}px`,
            top: `${viewport.offsetY - labelInset}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          {column.label}
        </span>
      ))}

      {columns.map((column) => (
        <span
          key={`${column.key}-bottom`}
          style={{
            position: "absolute",
            left: `${column.position}px`,
            top: `${viewport.offsetY + metrics.surfaceHeight * viewport.zoom + labelInset}px`,
            transform: "translate(-50%, 0)",
          }}
        >
          {column.label}
        </span>
      ))}

      {rows.map((row) => (
        <span
          key={`${row.key}-left`}
          style={{
            position: "absolute",
            left: `${viewport.offsetX - labelInset}px`,
            top: `${row.position}px`,
            transform: "translate(-100%, -50%)",
          }}
        >
          {row.label}
        </span>
      ))}

      {rows.map((row) => (
        <span
          key={`${row.key}-right`}
          style={{
            position: "absolute",
            left: `${viewport.offsetX + metrics.surfaceWidth * viewport.zoom + labelInset}px`,
            top: `${row.position}px`,
            transform: "translate(0, -50%)",
          }}
        >
          {row.label}
        </span>
      ))}
    </div>
  );
}
