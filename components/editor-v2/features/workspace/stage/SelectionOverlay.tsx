"use client";

import type { ActiveTool, SelectionState } from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics } from "@/lib/editor-v2/editor/viewport";

interface SelectionOverlayProps {
  activeTool: ActiveTool;
  metrics: GridWorldMetrics;
  selection: SelectionState;
}

export function SelectionOverlay({
  activeTool,
  metrics,
  selection,
}: SelectionOverlayProps) {
  const lassoPoints = selection.lassoPoints
    .map((point) => `${point.x * metrics.cellSize},${point.y * metrics.cellSize}`)
    .join(" ");
  const shouldDimCanvas = activeTool === "lasso";
  const hasCommittedLassoSelection =
    selection.mode === "lasso" &&
    !selection.preview &&
    selection.lassoPoints.length >= 3;

  return (
    <>
      {shouldDimCanvas ? (
        hasCommittedLassoSelection ? (
          <svg
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              pointerEvents: "none",
              overflow: "visible",
            }}
            width={metrics.surfaceWidth}
            height={metrics.surfaceHeight}
            viewBox={`0 0 ${metrics.surfaceWidth} ${metrics.surfaceHeight}`}
          >
            <path
              fill="rgba(15, 23, 42, 0.24)"
              fillRule="evenodd"
              d={`M 0 0 H ${metrics.surfaceWidth} V ${metrics.surfaceHeight} H 0 Z M ${lassoPoints} Z`}
            />
          </svg>
        ) : (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              pointerEvents: "none",
              backgroundColor: "rgba(15, 23, 42, 0.24)",
            }}
          />
        )
      ) : null}

      {selection.mode === "lasso" && selection.lassoPoints.length > 0 ? (
        <svg
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 4,
            pointerEvents: "none",
            overflow: "visible",
          }}
          width={metrics.surfaceWidth}
          height={metrics.surfaceHeight}
          viewBox={`0 0 ${metrics.surfaceWidth} ${metrics.surfaceHeight}`}
        >
          {selection.preview ? (
            <polyline
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={lassoPoints}
            />
          ) : (
            <polygon
              fill="rgba(37, 99, 235, 0.08)"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={lassoPoints}
            />
          )}
        </svg>
      ) : null}
    </>
  );
}
