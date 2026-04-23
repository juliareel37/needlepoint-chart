"use client";

import type {
  ActiveTool,
  MirrorInteractionState,
  SelectionState,
} from "@/lib/editor-v2/editor/store";
import { getMirrorTargetRects } from "@/lib/editor-v2/editor/selection/mirrorGeometry";
import type { GridWorldMetrics } from "@/lib/editor-v2/editor/viewport";

const DIMMED_CANVAS_FILL = "rgba(15, 23, 42, 0.24)";
const SELECTION_STROKE = "#f8fafc";
const SELECTION_STROKE_DASH = "6 4";
const SELECTION_STROKE_WIDTH = 2;

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
  const mirrorSourceRect = mirrorSession?.sourceRect ?? null;
  const lassoPoints = selection.lassoPoints
    .map((point) => `${point.x * metrics.cellSize},${point.y * metrics.cellSize}`)
    .join(" ");
  const hasCommittedFreehandSelection =
    selection.mode === "lasso" &&
    !selection.preview &&
    selection.lassoPoints.length >= 3;
  const hasCommittedRectSelection =
    selection.mode === "rect" &&
    !selection.preview &&
    Boolean(selection.rect);
  const hasCommittedCircleSelection =
    selection.mode === "circle" &&
    !selection.preview &&
    Boolean(selection.rect);
  const hasCommittedSelection =
    hasCommittedFreehandSelection ||
    hasCommittedRectSelection ||
    hasCommittedCircleSelection;
  const shouldDimCanvas =
    activeTool === "lasso" ||
    activeTool === "mirror" ||
    Boolean(mirrorSession) ||
    ((activeTool === "fill" || activeTool === "erase") && hasCommittedSelection);
  const selectionRectPath = selection.rect
    ? buildRectPath(selection.rect, metrics.cellSize)
    : null;
  const isMirrorDragging = Boolean(mirrorSession?.dragAnchor);
  const appliedMirrorDirection = mirrorSession?.appliedDirection ?? null;
  const hasCommittedMirrorSelection = Boolean(mirrorSourceRect && !mirrorSession?.dragAnchor);
  const mirrorTargets = mirrorSourceRect
    ? getMirrorTargetRects(mirrorSourceRect, metrics.width, metrics.height)
    : [];
  const mirrorCutoutPath = mirrorSourceRect
    ? buildRectPath(mirrorSourceRect, metrics.cellSize)
    : null;

  return (
    <>
      {shouldDimCanvas ? (
        hasCommittedFreehandSelection ||
        hasCommittedRectSelection ||
        hasCommittedCircleSelection ||
        hasCommittedMirrorSelection ? (
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
              fill={DIMMED_CANVAS_FILL}
              fillRule="evenodd"
              d={[
                `M 0 0 H ${metrics.surfaceWidth} V ${metrics.surfaceHeight} H 0 Z`,
                hasCommittedFreehandSelection ? `M ${lassoPoints} Z` : null,
                hasCommittedRectSelection && selectionRectPath ? selectionRectPath : null,
                hasCommittedCircleSelection && selection.rect
                  ? buildEllipsePath(selection.rect, metrics.cellSize)
                  : null,
                hasCommittedMirrorSelection && mirrorCutoutPath ? mirrorCutoutPath : null,
              ]
                .filter(Boolean)
                .join(" ")}
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
              backgroundColor: DIMMED_CANVAS_FILL,
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
              stroke={SELECTION_STROKE}
              strokeWidth={SELECTION_STROKE_WIDTH}
              strokeDasharray={SELECTION_STROKE_DASH}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={lassoPoints}
            />
          ) : (
            <polygon
              fill="none"
              stroke={SELECTION_STROKE}
              strokeWidth={SELECTION_STROKE_WIDTH}
              strokeDasharray={SELECTION_STROKE_DASH}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={lassoPoints}
            />
          )}
        </svg>
      ) : null}

      {selection.mode === "rect" && selection.rect ? (
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
            x={selection.rect.x * metrics.cellSize}
            y={selection.rect.y * metrics.cellSize}
            width={selection.rect.width * metrics.cellSize}
            height={selection.rect.height * metrics.cellSize}
            fill={selection.preview ? "rgba(15, 23, 42, 0.12)" : "none"}
            stroke={SELECTION_STROKE}
            strokeWidth={SELECTION_STROKE_WIDTH}
            strokeDasharray={SELECTION_STROKE_DASH}
          />
        </svg>
      ) : null}

      {selection.mode === "circle" && selection.rect ? (
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
          <ellipse
            cx={(selection.rect.x + selection.rect.width / 2) * metrics.cellSize}
            cy={(selection.rect.y + selection.rect.height / 2) * metrics.cellSize}
            rx={(selection.rect.width * metrics.cellSize) / 2}
            ry={(selection.rect.height * metrics.cellSize) / 2}
            fill={selection.preview ? "rgba(15, 23, 42, 0.12)" : "none"}
            stroke={SELECTION_STROKE}
            strokeWidth={SELECTION_STROKE_WIDTH}
            strokeDasharray={SELECTION_STROKE_DASH}
          />
        </svg>
      ) : null}

      {mirrorSourceRect ? (
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
            x={mirrorSourceRect.x * metrics.cellSize}
            y={mirrorSourceRect.y * metrics.cellSize}
            width={mirrorSourceRect.width * metrics.cellSize}
            height={mirrorSourceRect.height * metrics.cellSize}
            fill={isMirrorDragging ? "rgba(15, 23, 42, 0.12)" : "none"}
            stroke={SELECTION_STROKE}
            strokeWidth={SELECTION_STROKE_WIDTH}
            strokeDasharray={SELECTION_STROKE_DASH}
          />

          {!isMirrorDragging
            ? mirrorTargets.map(({ direction, rect }) => (
                <rect
                  key={direction}
                  x={rect.x * metrics.cellSize}
                  y={rect.y * metrics.cellSize}
                  width={rect.width * metrics.cellSize}
                  height={rect.height * metrics.cellSize}
                  // fill={getMirrorTargetFill(direction)}
                  fill="rgba(14, 164, 233, 0.34)"
                  // stroke={getMirrorTargetStroke(direction)}
                  stroke="#0284c7"
                  strokeWidth={appliedMirrorDirection === direction ? "3" : "2"}
                />
              ))
            : null}
        </svg>
      ) : null}
    </>
  );
}

function buildRectPath(
  rect: { x: number; y: number; width: number; height: number },
  cellSize: number,
): string {
  const x = rect.x * cellSize;
  const y = rect.y * cellSize;
  const width = rect.width * cellSize;
  const height = rect.height * cellSize;

  return `M ${x} ${y} H ${x + width} V ${y + height} H ${x} Z`;
}

function buildEllipsePath(
  rect: { x: number; y: number; width: number; height: number },
  cellSize: number,
): string {
  const cx = (rect.x + rect.width / 2) * cellSize;
  const cy = (rect.y + rect.height / 2) * cellSize;
  const rx = (rect.width * cellSize) / 2;
  const ry = (rect.height * cellSize) / 2;

  return `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0`;
}
