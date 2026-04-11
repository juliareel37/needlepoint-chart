"use client";

import type {
  ActiveTool,
  MirrorInteractionState,
  MirrorDirection,
  SelectionState,
} from "@/lib/editor-v2/editor/store";
import { getMirrorTargetRects } from "@/lib/editor-v2/editor/selection/mirrorGeometry";
import type { GridWorldMetrics } from "@/lib/editor-v2/editor/viewport";

interface SelectionOverlayProps {
  activeTool: ActiveTool;
  metrics: GridWorldMetrics;
  mirrorInteraction: MirrorInteractionState;
  selection: SelectionState;
}

export function SelectionOverlay({
  activeTool,
  metrics,
  mirrorInteraction,
  selection,
}: SelectionOverlayProps) {
  const mirrorSession = mirrorInteraction.session;
  const lassoPoints = selection.lassoPoints
    .map((point) => `${point.x * metrics.cellSize},${point.y * metrics.cellSize}`)
    .join(" ");
  const shouldDimCanvas = activeTool === "lasso";
  const hasCommittedLassoSelection =
    selection.mode === "lasso" &&
    !selection.preview &&
    selection.lassoPoints.length >= 3;
  const mirrorTargets = mirrorSession?.sourceRect
    ? getMirrorTargetRects(mirrorSession.sourceRect, metrics.width, metrics.height)
    : [];

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

      {mirrorSession?.sourceRect ? (
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
          <rect
            x={mirrorSession.sourceRect.x * metrics.cellSize}
            y={mirrorSession.sourceRect.y * metrics.cellSize}
            width={mirrorSession.sourceRect.width * metrics.cellSize}
            height={mirrorSession.sourceRect.height * metrics.cellSize}
            fill="rgba(15, 23, 42, 0.12)"
            stroke="#f8fafc"
            strokeWidth="2"
            strokeDasharray={mirrorSession.dragAnchor ? "6 4" : undefined}
          />

          {!mirrorSession.dragAnchor
            ? mirrorTargets.map(({ direction, rect }) => (
                <rect
                  key={direction}
                  x={rect.x * metrics.cellSize}
                  y={rect.y * metrics.cellSize}
                  width={rect.width * metrics.cellSize}
                  height={rect.height * metrics.cellSize}
                  fill={getMirrorTargetFill(direction)}
                  stroke={getMirrorTargetStroke(direction)}
                  strokeWidth={mirrorSession.appliedDirection === direction ? "3" : "2"}
                />
              ))
            : null}
        </svg>
      ) : null}
    </>
  );
}

function getMirrorTargetFill(direction: MirrorDirection): string {
  switch (direction) {
    case "left":
      return "rgba(14, 165, 233, 0.22)";
    case "right":
      return "rgba(34, 197, 94, 0.22)";
    case "top":
      return "rgba(245, 158, 11, 0.22)";
    case "bottom":
      return "rgba(236, 72, 153, 0.22)";
  }
}

function getMirrorTargetStroke(direction: MirrorDirection): string {
  switch (direction) {
    case "left":
      return "#0284c7";
    case "right":
      return "#16a34a";
    case "top":
      return "#d97706";
    case "bottom":
      return "#db2777";
  }
}
