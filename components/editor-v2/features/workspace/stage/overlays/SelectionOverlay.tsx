"use client";

import type {
  ActiveTool,
  MirrorInteractionState,
  SelectionState,
  ViewportState,
} from "@/lib/editor-v2/editor/store";
import { getMirrorTargetRects } from "@/lib/editor-v2/editor/selection/mirrorGeometry";
import type { GridWorldMetrics } from "@/lib/editor-v2/editor/viewport";

const DIMMED_CANVAS_FILL = "rgba(15, 23, 42, 0.24)";
const LIVE_SELECTION_FILL = "rgba(34, 211, 238, 0.22)";
const SELECTION_INNER_STROKE = "#f8fafc";
const SELECTION_OUTER_STROKE = "rgba(8, 47, 73, 0.92)";
const SELECTION_STROKE_DASH = "5 3";
const SELECTION_INNER_STROKE_WIDTH = 1.5;
const SELECTION_OUTER_STROKE_WIDTH = 3;

interface SelectionOverlayProps {
  activeTool: ActiveTool;
  metrics: GridWorldMetrics;
  mirrorInteraction: MirrorInteractionState;
  selection: SelectionState;
  viewport: ViewportState;
}

export function SelectionOverlay({
  activeTool,
  metrics,
  mirrorInteraction,
  selection,
  viewport,
}: SelectionOverlayProps) {
  const mirrorSession = mirrorInteraction.session;
  const mirrorSourceRect = mirrorSession?.sourceRect ?? null;
  const projectedCellSize = metrics.cellSize * viewport.zoom;
  const projectedSurfaceWidth = metrics.surfaceWidth * viewport.zoom;
  const projectedSurfaceHeight = metrics.surfaceHeight * viewport.zoom;
  const lassoPoints = selection.lassoPoints
    .map((point) => `${point.x * projectedCellSize},${point.y * projectedCellSize}`)
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
  const isMirrorDragging = Boolean(mirrorSession?.dragAnchor);
  const hasCommittedMirrorSelection = Boolean(mirrorSourceRect && !mirrorSession?.dragAnchor);
  const shouldDimCanvas =
    activeTool === "lasso" ||
    activeTool === "mirror" ||
    Boolean(mirrorSession) ||
    hasCommittedSelection ||
    hasCommittedMirrorSelection;
  const selectionRectPath = selection.rect
    ? buildRectPath(selection.rect, projectedCellSize)
    : null;
  const appliedMirrorDirection = mirrorSession?.appliedDirection ?? null;
  const mirrorTargets = mirrorSourceRect
    ? getMirrorTargetRects(mirrorSourceRect, metrics.width, metrics.height)
    : [];
  const mirrorCutoutPath = mirrorSourceRect
    ? buildRectPath(mirrorSourceRect, projectedCellSize)
    : null;
  const dimmedCanvasCutoutPaths = [
    hasCommittedFreehandSelection ? `M ${lassoPoints} Z` : null,
    hasCommittedRectSelection && selectionRectPath ? selectionRectPath : null,
    hasCommittedCircleSelection && selection.rect
      ? buildEllipsePath(selection.rect, projectedCellSize)
      : null,
    hasCommittedMirrorSelection &&
    mirrorCutoutPath &&
      mirrorCutoutPath !== selectionRectPath
      ? mirrorCutoutPath
      : null,
  ].filter(Boolean);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: viewport.offsetY,
        left: viewport.offsetX,
        width: projectedSurfaceWidth,
        height: projectedSurfaceHeight,
        pointerEvents: "none",
        overflow: "visible",
        zIndex: 4,
      }}
    >
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
              pointerEvents: "none",
              overflow: "visible",
            }}
            width={projectedSurfaceWidth}
            height={projectedSurfaceHeight}
            viewBox={`0 0 ${projectedSurfaceWidth} ${projectedSurfaceHeight}`}
          >
            <path
              fill={DIMMED_CANVAS_FILL}
              fillRule="evenodd"
              d={[
                `M 0 0 H ${projectedSurfaceWidth} V ${projectedSurfaceHeight} H 0 Z`,
                ...dimmedCanvasCutoutPaths,
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
            pointerEvents: "none",
            overflow: "visible",
          }}
          width={projectedSurfaceWidth}
          height={projectedSurfaceHeight}
          viewBox={`0 0 ${projectedSurfaceWidth} ${projectedSurfaceHeight}`}
        >
          {selection.preview ? (
            <>
              <polyline
                fill="none"
                stroke={SELECTION_OUTER_STROKE}
                strokeWidth={SELECTION_OUTER_STROKE_WIDTH}
                strokeDasharray={SELECTION_STROKE_DASH}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                points={lassoPoints}
              />
              <polyline
                fill="none"
                stroke={SELECTION_INNER_STROKE}
                strokeWidth={SELECTION_INNER_STROKE_WIDTH}
                strokeDasharray={SELECTION_STROKE_DASH}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                points={lassoPoints}
              />
            </>
          ) : (
            <>
              <polygon
                fill="none"
                stroke={SELECTION_OUTER_STROKE}
                strokeWidth={SELECTION_OUTER_STROKE_WIDTH}
                strokeDasharray={SELECTION_STROKE_DASH}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                points={lassoPoints}
              />
              <polygon
                fill="none"
                stroke={SELECTION_INNER_STROKE}
                strokeWidth={SELECTION_INNER_STROKE_WIDTH}
                strokeDasharray={SELECTION_STROKE_DASH}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                points={lassoPoints}
              />
            </>
          )}
        </svg>
      ) : null}

      {selection.mode === "rect" && selection.rect ? (
        <svg
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "visible",
          }}
          width={projectedSurfaceWidth}
          height={projectedSurfaceHeight}
          viewBox={`0 0 ${projectedSurfaceWidth} ${projectedSurfaceHeight}`}
        >
          <rect
            x={selection.rect.x * projectedCellSize}
            y={selection.rect.y * projectedCellSize}
            width={selection.rect.width * projectedCellSize}
            height={selection.rect.height * projectedCellSize}
            fill={selection.preview ? LIVE_SELECTION_FILL : "none"}
            stroke={SELECTION_OUTER_STROKE}
            strokeWidth={SELECTION_OUTER_STROKE_WIDTH}
            strokeDasharray={SELECTION_STROKE_DASH}
            vectorEffect="non-scaling-stroke"
          />
          <rect
            x={selection.rect.x * projectedCellSize}
            y={selection.rect.y * projectedCellSize}
            width={selection.rect.width * projectedCellSize}
            height={selection.rect.height * projectedCellSize}
            fill="none"
            stroke={SELECTION_INNER_STROKE}
            strokeWidth={SELECTION_INNER_STROKE_WIDTH}
            strokeDasharray={SELECTION_STROKE_DASH}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ) : null}

      {selection.mode === "circle" && selection.rect ? (
        <svg
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "visible",
          }}
          width={projectedSurfaceWidth}
          height={projectedSurfaceHeight}
          viewBox={`0 0 ${projectedSurfaceWidth} ${projectedSurfaceHeight}`}
        >
          <ellipse
            cx={(selection.rect.x + selection.rect.width / 2) * projectedCellSize}
            cy={(selection.rect.y + selection.rect.height / 2) * projectedCellSize}
            rx={(selection.rect.width * projectedCellSize) / 2}
            ry={(selection.rect.height * projectedCellSize) / 2}
            fill={selection.preview ? LIVE_SELECTION_FILL : "none"}
            stroke={SELECTION_OUTER_STROKE}
            strokeWidth={SELECTION_OUTER_STROKE_WIDTH}
            strokeDasharray={SELECTION_STROKE_DASH}
            vectorEffect="non-scaling-stroke"
          />
          <ellipse
            cx={(selection.rect.x + selection.rect.width / 2) * projectedCellSize}
            cy={(selection.rect.y + selection.rect.height / 2) * projectedCellSize}
            rx={(selection.rect.width * projectedCellSize) / 2}
            ry={(selection.rect.height * projectedCellSize) / 2}
            fill="none"
            stroke={SELECTION_INNER_STROKE}
            strokeWidth={SELECTION_INNER_STROKE_WIDTH}
            strokeDasharray={SELECTION_STROKE_DASH}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ) : null}

      {mirrorSourceRect ? (
        <svg
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "visible",
          }}
          width={projectedSurfaceWidth}
          height={projectedSurfaceHeight}
          viewBox={`0 0 ${projectedSurfaceWidth} ${projectedSurfaceHeight}`}
        >
          <rect
            x={mirrorSourceRect.x * projectedCellSize}
            y={mirrorSourceRect.y * projectedCellSize}
            width={mirrorSourceRect.width * projectedCellSize}
            height={mirrorSourceRect.height * projectedCellSize}
            fill={isMirrorDragging ? LIVE_SELECTION_FILL : "none"}
            stroke={SELECTION_OUTER_STROKE}
            strokeWidth={SELECTION_OUTER_STROKE_WIDTH}
            strokeDasharray={SELECTION_STROKE_DASH}
            vectorEffect="non-scaling-stroke"
          />
          <rect
            x={mirrorSourceRect.x * projectedCellSize}
            y={mirrorSourceRect.y * projectedCellSize}
            width={mirrorSourceRect.width * projectedCellSize}
            height={mirrorSourceRect.height * projectedCellSize}
            fill="none"
            stroke={SELECTION_INNER_STROKE}
            strokeWidth={SELECTION_INNER_STROKE_WIDTH}
            strokeDasharray={SELECTION_STROKE_DASH}
            vectorEffect="non-scaling-stroke"
          />

          {!isMirrorDragging
            ? mirrorTargets.map(({ direction, rect }) => (
                <rect
                  key={direction}
                  x={rect.x * projectedCellSize}
                  y={rect.y * projectedCellSize}
                  width={rect.width * projectedCellSize}
                  height={rect.height * projectedCellSize}
                  // fill={getMirrorTargetFill(direction)}
                  fill="rgba(14, 164, 233, 0.34)"
                  // stroke={getMirrorTargetStroke(direction)}
                  stroke="#0284c7"
                  strokeWidth={appliedMirrorDirection === direction ? "3" : "2"}
                  vectorEffect="non-scaling-stroke"
                />
              ))
            : null}
        </svg>
      ) : null}
    </div>
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
