"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarIcon,
} from "@/components/design-system";
import type {
  DuplicatePlacementSession,
  EditorStore,
  PaletteColor,
  ViewportState,
} from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics, WorldPoint } from "@/lib/editor-v2/editor/viewport";
import {
  createCancelDuplicatePlacementCommand,
  createCommitDuplicatePlacementCommand,
} from "../workspaceCommands";
import styles from "../shell/EditorV2Shell.module.css";

interface DuplicatePlacementLayerProps {
  colorsById: Record<string, PaletteColor>;
  dispatch: EditorStore["dispatch"];
  getWorldPointFromClient: (clientX: number, clientY: number) => WorldPoint | null;
  metrics: GridWorldMetrics;
  offsetCells: { x: number; y: number };
  onOffsetCellsChange: (offset: { x: number; y: number }) => void;
  portalHost?: HTMLElement | null;
  session: DuplicatePlacementSession;
  stageBounds: { left: number; top: number; width: number; height: number };
  viewport: ViewportState;
  worldBounds: { left: number; top: number; width: number; height: number };
}

interface DragSession {
  pointerId: number;
  startOffset: { x: number; y: number };
  startPoint: WorldPoint;
}

export function DuplicatePlacementLayer({
  colorsById,
  dispatch,
  getWorldPointFromClient,
  metrics,
  offsetCells,
  onOffsetCellsChange,
  portalHost = null,
  session,
  stageBounds,
  viewport,
  worldBounds,
}: DuplicatePlacementLayerProps) {
  const pitch = metrics.cellSize + metrics.cellGap;
  const projectedCellSize = metrics.cellSize * viewport.zoom;
  const projectedPitch = pitch * viewport.zoom;
  const [isDragging, setIsDragging] = useState(false);
  const dragSessionRef = useRef<DragSession | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bounds = useMemo(() => {
    return {
      left: (session.sourceRect.x + offsetCells.x) * pitch,
      top: (session.sourceRect.y + offsetCells.y) * pitch,
      width:
        session.sourceRect.width * metrics.cellSize +
        Math.max(0, session.sourceRect.width - 1) * metrics.cellGap,
      height:
        session.sourceRect.height * metrics.cellSize +
        Math.max(0, session.sourceRect.height - 1) * metrics.cellGap,
    };
  }, [
    metrics.cellGap,
    metrics.cellSize,
    offsetCells.x,
    offsetCells.y,
    pitch,
    session.sourceRect.height,
    session.sourceRect.width,
    session.sourceRect.x,
    session.sourceRect.y,
  ]);
  const floatingBarPosition = useMemo(() => {
    const stageLeft = worldBounds.left - stageBounds.left + bounds.left * viewport.zoom;
    const stageTop = worldBounds.top - stageBounds.top + bounds.top * viewport.zoom;

    return {
      left: stageLeft + (bounds.width * viewport.zoom) / 2,
      top: stageTop - 40,
    };
  }, [
    bounds.height,
    bounds.left,
    bounds.top,
    bounds.width,
    stageBounds.left,
    stageBounds.top,
    viewport.zoom,
    worldBounds.left,
    worldBounds.top,
  ]);
  const stageBoxPosition = useMemo(() => {
    return {
      left: worldBounds.left - stageBounds.left + bounds.left * viewport.zoom,
      top: worldBounds.top - stageBounds.top + bounds.top * viewport.zoom,
      width: bounds.width * viewport.zoom,
      height: bounds.height * viewport.zoom,
    };
  }, [
    bounds.height,
    bounds.left,
    bounds.top,
    bounds.width,
    stageBounds.left,
    stageBounds.top,
    viewport.zoom,
    worldBounds.left,
    worldBounds.top,
  ]);
  const projectedOutlinePoints = useMemo(
    () =>
      session.outlinePoints
        .map((point) => `${point.x * projectedPitch},${point.y * projectedPitch}`)
        .join(" "),
    [projectedPitch, session.outlinePoints],
  );

  useEffect(() => {
    setIsDragging(false);
  }, [session]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const width = Math.max(1, Math.round(stageBoxPosition.width));
    const height = Math.max(1, Math.round(stageBoxPosition.height));
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${stageBoxPosition.width}px`;
    canvas.style.height = `${stageBoxPosition.height}px`;

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, width, height);

    for (const cell of session.cells) {
      const color = colorsById[cell.colorId];

      if (!color) {
        continue;
      }

      context.fillStyle = color.hex;
      const cellRect = getProjectedCellRect(
        cell.x,
        cell.y,
        projectedPitch,
        projectedCellSize,
      );
      context.fillRect(
        cellRect.x0,
        cellRect.y0,
        cellRect.width,
        cellRect.height,
      );
    }
  }, [
    colorsById,
    projectedCellSize,
    projectedPitch,
    session.cells,
    stageBoxPosition.height,
    stageBoxPosition.width,
  ]);

  useEffect(() => {
    function handleWindowPointerMove(event: PointerEvent) {
      const dragSession = dragSessionRef.current;

      if (!dragSession || dragSession.pointerId !== event.pointerId) {
        return;
      }

      const point = getWorldPointFromClient(event.clientX, event.clientY);

      if (!point) {
        return;
      }

      onOffsetCellsChange({
        x: dragSession.startOffset.x + Math.round((point.x - dragSession.startPoint.x) / pitch),
        y: dragSession.startOffset.y + Math.round((point.y - dragSession.startPoint.y) / pitch),
      });
    }

    function handleWindowPointerEnd(event: PointerEvent) {
      if (dragSessionRef.current?.pointerId !== event.pointerId) {
        return;
      }

      dragSessionRef.current = null;
      setIsDragging(false);
    }

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerEnd);
    window.addEventListener("pointercancel", handleWindowPointerEnd);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);
    };
  }, [getWorldPointFromClient, onOffsetCellsChange, pitch]);

  return (
    <>
      {portalHost
        ? createPortal(
            <>
              <div
                style={{
                  position: "absolute",
                  left: `${stageBoxPosition.left}px`,
                  top: `${stageBoxPosition.top}px`,
                  width: `${stageBoxPosition.width}px`,
                  height: `${stageBoxPosition.height}px`,
                  zIndex: 10,
                  cursor: isDragging ? "grabbing" : "grab",
                  touchAction: "none",
                }}
                onPointerDown={(event) => {
                  if (event.button !== 0 && event.pointerType === "mouse") {
                    return;
                  }

                  const point = getWorldPointFromClient(event.clientX, event.clientY);

                  if (!point) {
                    return;
                  }

                  dragSessionRef.current = {
                    pointerId: event.pointerId,
                    startOffset: offsetCells,
                    startPoint: point,
                  };
                  setIsDragging(true);

                  event.preventDefault();
                  event.stopPropagation();
                }}
              >
                <canvas
                  ref={canvasRef}
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    imageRendering: "pixelated",
                    opacity: 0.92,
                  }}
                />
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                  }}
                >
                  <svg
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      overflow: "visible",
                    }}
                    width={stageBoxPosition.width}
                    height={stageBoxPosition.height}
                    viewBox={`0 0 ${stageBoxPosition.width} ${stageBoxPosition.height}`}
                  >
                    {renderDuplicateOutline({
                      bounds: stageBoxPosition,
                      projectedOutlinePoints,
                      selectionMode: session.selectionMode,
                    })}
                  </svg>
                </div>
              </div>

            <div
              style={{
                position: "absolute",
                left: floatingBarPosition.left,
                top: floatingBarPosition.top,
                transform: "translateX(-50%)",
                zIndex: 14,
              }}
            >
              <Toolbar className={styles.floatingToolbar}>
                <ToolbarGroup>
                  <ToolbarButton
                    type="button"
                    variant="secondary"
                    iconOnly
                    className={styles.duplicatePlacementActionButton}
                    aria-label="Cancel duplicate placement"
                    title="Cancel duplicate placement"
                    onClick={() => {
                      dispatch(createCancelDuplicatePlacementCommand());
                    }}
                  >
                    <ToolbarIcon
                      icon="/icons/lucide/x.svg"
                      style={{ transform: "scale(0.875)" }}
                    />
                  </ToolbarButton>

                  <ToolbarButton
                    type="button"
                    variant="primary"
                    iconOnly
                    className={styles.duplicatePlacementActionButton}
                    aria-label="Place duplicate"
                    title="Place duplicate"
                    onClick={() => {
                      dispatch(
                        createCommitDuplicatePlacementCommand(
                          offsetCells.x,
                          offsetCells.y,
                        ),
                      );
                    }}
                  >
                    <ToolbarIcon
                      icon="/icons/lucide/check.svg"
                      style={{ transform: "scale(0.875)" }}
                    />
                  </ToolbarButton>
                </ToolbarGroup>
              </Toolbar>
            </div>
            </>,
            portalHost,
          )
        : null}
    </>
  );
}

function getProjectedCellRect(
  cellX: number,
  cellY: number,
  projectedPitch: number,
  projectedCellSize: number,
) {
  const x0 = Math.round(cellX * projectedPitch);
  const y0 = Math.round(cellY * projectedPitch);
  const x1 = Math.round(cellX * projectedPitch + projectedCellSize);
  const y1 = Math.round(cellY * projectedPitch + projectedCellSize);

  return {
    x0,
    y0,
    width: Math.max(1, x1 - x0),
    height: Math.max(1, y1 - y0),
  };
}

function renderDuplicateOutline(options: {
  bounds: { width: number; height: number };
  projectedOutlinePoints: string;
  selectionMode: DuplicatePlacementSession["selectionMode"];
}) {
  const commonStrokeProps = {
    stroke: "rgba(37, 99, 235, 0.95)",
    strokeWidth: 2,
    vectorEffect: "non-scaling-stroke" as const,
  };
  const commonHighlightProps = {
    stroke: "rgba(255,255,255,0.72)",
    strokeWidth: 1,
    vectorEffect: "non-scaling-stroke" as const,
  };

  if (options.selectionMode === "circle") {
    return (
      <>
        <ellipse
          cx={options.bounds.width / 2}
          cy={options.bounds.height / 2}
          rx={options.bounds.width / 2}
          ry={options.bounds.height / 2}
          fill="none"
          {...commonStrokeProps}
        />
        <ellipse
          cx={options.bounds.width / 2}
          cy={options.bounds.height / 2}
          rx={options.bounds.width / 2}
          ry={options.bounds.height / 2}
          fill="none"
          {...commonHighlightProps}
        />
      </>
    );
  }

  if (options.selectionMode === "lasso" && options.projectedOutlinePoints.length > 0) {
    return (
      <>
        <polygon
          points={options.projectedOutlinePoints}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
          {...commonStrokeProps}
        />
        <polygon
          points={options.projectedOutlinePoints}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
          {...commonHighlightProps}
        />
      </>
    );
  }

  return (
    <>
      <rect
        x={0}
        y={0}
        width={options.bounds.width}
        height={options.bounds.height}
        fill="none"
        {...commonStrokeProps}
      />
      <rect
        x={0}
        y={0}
        width={options.bounds.width}
        height={options.bounds.height}
        fill="none"
        {...commonHighlightProps}
      />
    </>
  );
}
