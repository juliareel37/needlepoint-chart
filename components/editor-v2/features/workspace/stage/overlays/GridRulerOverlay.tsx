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
  const renderedCellSize = metrics.cellSize * viewport.zoom;
  const showSubdivisionTicks = axisStep > 1 && renderedCellSize < 8 && renderedCellSize >= 3;
  const tickLength = Math.max(4, Math.round(fontSize * 0.45));
  const tickThickness = 1;
  const tickColor = "rgba(120, 113, 108, 0.45)";

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
        color: "rgba(156, 156, 156, 0.9)",
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

      {showSubdivisionTicks
        ? Array.from({ length: metrics.width - 1 }, (_, index) => index + 1)
            .filter((value) => value % axisStep !== 0)
            .map((value) => {
              const position = viewport.offsetX + value * metrics.cellSize * viewport.zoom;
              return (
                <span
                  key={`subdivision-top-${value}`}
                  style={{
                    position: "absolute",
                    left: `${position}px`,
                    top: `${viewport.offsetY}px`,
                    width: `${tickThickness}px`,
                    height: `${tickLength}px`,
                    transform: "translateX(-50%) translateY(-100%)",
                    background: tickColor,
                  }}
                />
              );
            })
        : null}

      {showSubdivisionTicks
        ? Array.from({ length: metrics.width - 1 }, (_, index) => index + 1)
            .filter((value) => value % axisStep !== 0)
            .map((value) => {
              const position = viewport.offsetX + value * metrics.cellSize * viewport.zoom;
              return (
                <span
                  key={`subdivision-bottom-${value}`}
                  style={{
                    position: "absolute",
                    left: `${position}px`,
                    top: `${viewport.offsetY + metrics.surfaceHeight * viewport.zoom}px`,
                    width: `${tickThickness}px`,
                    height: `${tickLength}px`,
                    transform: "translateX(-50%)",
                    background: tickColor,
                  }}
                />
              );
            })
        : null}

      {showSubdivisionTicks
        ? Array.from({ length: metrics.height - 1 }, (_, index) => index + 1)
            .filter((value) => value % axisStep !== 0)
            .map((value) => {
              const position = viewport.offsetY + value * metrics.cellSize * viewport.zoom;
              return (
                <span
                  key={`subdivision-left-${value}`}
                  style={{
                    position: "absolute",
                    left: `${viewport.offsetX}px`,
                    top: `${position}px`,
                    width: `${tickLength}px`,
                    height: `${tickThickness}px`,
                    transform: "translateX(-100%) translateY(-50%)",
                    background: tickColor,
                  }}
                />
              );
            })
        : null}

      {showSubdivisionTicks
        ? Array.from({ length: metrics.height - 1 }, (_, index) => index + 1)
            .filter((value) => value % axisStep !== 0)
            .map((value) => {
              const position = viewport.offsetY + value * metrics.cellSize * viewport.zoom;
              return (
                <span
                  key={`subdivision-right-${value}`}
                  style={{
                    position: "absolute",
                    left: `${viewport.offsetX + metrics.surfaceWidth * viewport.zoom}px`,
                    top: `${position}px`,
                    width: `${tickLength}px`,
                    height: `${tickThickness}px`,
                    transform: "translateY(-50%)",
                    background: tickColor,
                  }}
                />
              );
            })
        : null}
    </div>
  );
}
