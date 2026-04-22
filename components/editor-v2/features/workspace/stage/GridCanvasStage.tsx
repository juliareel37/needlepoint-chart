"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type {
  GridPoint,
  GridCellValue,
  PaletteColor,
  SelectionPoint,
  TraceDocument,
  ViewportState,
} from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics } from "@/lib/editor-v2/editor/viewport";
import {
  configureDisplayCanvas,
  renderDisplayCanvas,
} from "./GridCanvasStage.display";
import type {
  CanvasSizing,
  LoadedTraceAsset,
} from "./GridCanvasStage.shared";
import {
  configureSourceCanvas,
  drawChangedSourceCells,
  redrawSourceCanvas,
} from "./GridCanvasStage.source";

interface GridCanvasStageProps {
  cancelPaintStroke: () => void;
  cells: GridCellValue[];
  colorsById: Record<string, PaletteColor>;
  deferPaintUntilTraceReady?: boolean;
  displayHost: HTMLElement | null;
  onDisplayRendered?: () => void;
  displayTraceAsset: LoadedTraceAsset | null;
  paintOpacity?: number;
  displayTrace?: TraceDocument | null;
  frameOrigin: { x: number; y: number };
  getGridPointFromClient: (clientX: number, clientY: number) => GridPoint | null;
  getSelectionPointFromClient: (clientX: number, clientY: number) => SelectionPoint | null;
  gridWidth: number;
  handlePointerDown: (point: GridPoint, selectionPoint: SelectionPoint) => void;
  handlePointerEnter: (point: GridPoint) => void;
  gridOverlayStep: number;
  showGridlines: boolean;
  showSymbols: boolean;
  metrics: GridWorldMetrics;
  stageSize: { width: number; height: number };
  symbolAssignments: Record<string, string>;
  threadView: boolean;
  viewport: ViewportState;
  isZoomInteractionActive: boolean;
}

export function GridCanvasStage({
  cancelPaintStroke,
  cells,
  colorsById,
  deferPaintUntilTraceReady = false,
  displayHost,
  onDisplayRendered,
  displayTraceAsset,
  paintOpacity = 1,
  displayTrace = null,
  frameOrigin,
  getGridPointFromClient,
  getSelectionPointFromClient,
  gridWidth,
  handlePointerDown,
  handlePointerEnter,
  gridOverlayStep,
  showGridlines,
  showSymbols,
  metrics,
  stageSize,
  symbolAssignments,
  threadView,
  viewport,
  isZoomInteractionActive,
}: GridCanvasStageProps) {
  const TOUCH_PAINT_ACTIVATION_DISTANCE_PX = 8;
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceCanvasSizingRef = useRef<CanvasSizing | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayCanvasSizingRef = useRef<CanvasSizing | null>(null);
  const previousCellsRef = useRef<GridCellValue[] | null>(null);
  const previousCellsInputRef = useRef<GridCellValue[] | null>(null);
  const previousColorsRef = useRef<Record<string, PaletteColor> | null>(null);
  const previousColorsInputRef = useRef<Record<string, PaletteColor> | null>(null);
  const previousThreadViewRef = useRef<boolean | null>(null);
  const previousThreadViewInputRef = useRef<boolean | null>(null);
  const previousZoomInteractionActiveRef = useRef<boolean>(false);
  const stitchCanvasCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const initializedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const activeTouchPointerIdsRef = useRef<Set<number>>(new Set());
  const touchGestureLockedRef = useRef(false);
  const pendingTouchPaintRef = useRef<{
    clientX: number;
    clientY: number;
    point: GridPoint;
    pointerId: number;
    selectionPoint: SelectionPoint;
  } | null>(null);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    const syncBackgroundColor = () => {
      const nextColor = getComputedStyle(root)
        .getPropertyValue("--canvas-bg")
        .trim();
      setBackgroundColor(nextColor || "#ffffff");
    };

    syncBackgroundColor();

    const observer = new MutationObserver(syncBackgroundColor);
    observer.observe(root, {
      attributeFilter: ["data-theme"],
      attributes: true,
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let canvas = sourceCanvasRef.current;

    if (!canvas && typeof document !== "undefined") {
      canvas = document.createElement("canvas");
      sourceCanvasRef.current = canvas;
    }

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const justEnteredZoomInteraction =
      isZoomInteractionActive && !previousZoomInteractionActiveRef.current;
    const isContinuingZoomInteraction =
      isZoomInteractionActive && previousZoomInteractionActiveRef.current;

    previousZoomInteractionActiveRef.current = isZoomInteractionActive;

    if (isContinuingZoomInteraction && sourceCanvasSizingRef.current) {
      return;
    }

    const nextConfiguration = configureSourceCanvas(
      canvas,
      context,
      metrics,
      viewport.zoom,
      stageSize,
      { isZoomInteractionActive },
      sourceCanvasSizingRef.current,
    );
    sourceCanvasSizingRef.current = nextConfiguration.sizing;
    if (nextConfiguration.sizingChanged || justEnteredZoomInteraction) {
      initializedRef.current = false;
    }
  }, [
    isZoomInteractionActive,
    metrics.cellSize,
    metrics.surfaceHeight,
    metrics.surfaceWidth,
    stageSize.height,
    stageSize.width,
    viewport.zoom,
  ]);

  useEffect(() => {
    const canvas = sourceCanvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const previousCells = previousCellsRef.current;
    const previousColors = previousColorsRef.current;
    const previousThreadView = previousThreadViewRef.current;
    const inputsUnchangedSinceLastRender =
      previousCellsInputRef.current === cells &&
      previousColorsInputRef.current === colorsById &&
      previousThreadViewInputRef.current === threadView;

    if (isZoomInteractionActive && initializedRef.current && inputsUnchangedSinceLastRender) {
      return;
    }

    const shouldRedrawAll =
      !initializedRef.current ||
      !previousCells ||
      previousCells.length !== cells.length ||
      previousColors !== colorsById ||
      previousThreadView !== threadView;

    if (shouldRedrawAll) {
      redrawSourceCanvas({
        context,
        cells,
        colorsById,
        gridWidth,
        metrics,
        threadView,
        stitchCanvasCache: stitchCanvasCacheRef.current,
      });

      initializedRef.current = true;
      previousCellsRef.current = cells.slice();
      previousCellsInputRef.current = cells;
      previousColorsRef.current = colorsById;
      previousColorsInputRef.current = colorsById;
      previousThreadViewRef.current = threadView;
      previousThreadViewInputRef.current = threadView;
      return;
    }

    drawChangedSourceCells({
      context,
      cells,
      previousCells,
      colorsById,
      gridWidth,
      cellSize: metrics.cellSize,
      threadView,
      stitchCanvasCache: stitchCanvasCacheRef.current,
    });

    previousCellsRef.current = cells.slice();
    previousCellsInputRef.current = cells;
    previousColorsRef.current = colorsById;
    previousColorsInputRef.current = colorsById;
    previousThreadViewRef.current = threadView;
    previousThreadViewInputRef.current = threadView;
  }, [
    cells,
    colorsById,
    gridWidth,
    isZoomInteractionActive,
    metrics.cellSize,
    metrics.surfaceHeight,
    metrics.surfaceWidth,
    stageSize.height,
    stageSize.width,
    threadView,
    viewport.zoom,
  ]);

  useEffect(() => {
    const canvas = displayCanvasRef.current;
    const sourceCanvas = sourceCanvasRef.current;

    if (!canvas || !sourceCanvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    displayCanvasSizingRef.current = configureDisplayCanvas(
      canvas,
      context,
      stageSize,
      displayCanvasSizingRef.current,
    );
    renderDisplayCanvas({
      backgroundColor,
      context,
      sourceCanvas,
      cells,
      colorsById,
      deferPaintUntilTraceReady,
      displayTrace,
      displayTraceAsset,
      frameOrigin,
      gridOverlayStep,
      gridWidth,
      metrics,
      paintOpacity,
      showGridlines,
      showSymbols,
      stageSize,
      symbolAssignments,
      viewport,
    });

    let frameId = window.requestAnimationFrame(() => {
      onDisplayRendered?.();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [
    backgroundColor,
    cells,
    colorsById,
    deferPaintUntilTraceReady,
    onDisplayRendered,
    frameOrigin.x,
    frameOrigin.y,
    gridOverlayStep,
    gridWidth,
    metrics.surfaceHeight,
    metrics.surfaceWidth,
    metrics.cellSize,
    metrics.height,
    showGridlines,
    showSymbols,
    stageSize.height,
    stageSize.width,
    symbolAssignments,
    displayTrace?.offsetX,
    displayTrace?.offsetY,
    displayTrace?.opacity,
    displayTrace?.scale,
    displayTrace?.previewUrl,
    displayTraceAsset,
    paintOpacity,
    threadView,
    viewport.offsetX,
    viewport.offsetY,
    viewport.zoom,
  ]);

  const clearPendingTouchPaint = () => {
    pendingTouchPaintRef.current = null;
  };

  const activatePendingTouchPaint = () => {
    const pendingTouchPaint = pendingTouchPaintRef.current;

    if (!pendingTouchPaint) {
      return false;
    }

    handlePointerDown(pendingTouchPaint.point, pendingTouchPaint.selectionPoint);
    pendingTouchPaintRef.current = null;
    return true;
  };

  return (
    <>
      {displayHost
        ? createPortal(
            <canvas
              ref={displayCanvasRef}
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 0,
                pointerEvents: "none",
                imageRendering: "pixelated",
              }}
            />,
            displayHost,
          )
        : null}

      <div
        aria-label="Grid canvas"
        onPointerDown={(event) => {
          if (event.pointerType === "touch") {
            activeTouchPointerIdsRef.current.add(event.pointerId);

            if (activeTouchPointerIdsRef.current.size > 1) {
              touchGestureLockedRef.current = true;
              clearPendingTouchPaint();
              cancelPaintStroke();

              const activePointerId = activePointerIdRef.current;
              if (
                activePointerId !== null &&
                event.currentTarget.hasPointerCapture(activePointerId)
              ) {
                event.currentTarget.releasePointerCapture(activePointerId);
              }

              activePointerIdRef.current = null;
              return;
            }

            if (touchGestureLockedRef.current) {
              return;
            }
          }

          if (event.pointerType === "mouse" && event.button !== 0) {
            return;
          }

          const point = getGridPointFromClient(event.clientX, event.clientY);
          const selectionPoint = getSelectionPointFromClient(
            event.clientX,
            event.clientY,
          );

          if (!point || !selectionPoint) {
            return;
          }

          activePointerIdRef.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          event.preventDefault();

          if (event.pointerType === "touch") {
            pendingTouchPaintRef.current = {
              clientX: event.clientX,
              clientY: event.clientY,
              point,
              pointerId: event.pointerId,
              selectionPoint,
            };
            return;
          }

          handlePointerDown(point, selectionPoint);
        }}
        onPointerMove={(event) => {
          if (
            event.pointerType === "touch" &&
            (touchGestureLockedRef.current || activeTouchPointerIdsRef.current.size > 1)
          ) {
            clearPendingTouchPaint();
            return;
          }

          const isActivePointer = activePointerIdRef.current === event.pointerId;
          const isPressed =
            event.pointerType === "mouse" ? (event.buttons & 1) !== 0 : isActivePointer;

          if (!isPressed) {
            return;
          }

          const point = getGridPointFromClient(event.clientX, event.clientY);

          if (!point) {
            return;
          }

          if (isActivePointer) {
            event.preventDefault();
          }

          if (event.pointerType === "touch") {
            const pendingTouchPaint = pendingTouchPaintRef.current;

            if (pendingTouchPaint?.pointerId === event.pointerId) {
              const distance = Math.hypot(
                event.clientX - pendingTouchPaint.clientX,
                event.clientY - pendingTouchPaint.clientY,
              );

              if (distance < TOUCH_PAINT_ACTIVATION_DISTANCE_PX) {
                return;
              }

              activatePendingTouchPaint();
            }
          }

          handlePointerEnter(point);
        }}
        onPointerUp={(event) => {
          if (event.pointerType === "touch") {
            activeTouchPointerIdsRef.current.delete(event.pointerId);

            if (activeTouchPointerIdsRef.current.size === 0) {
              touchGestureLockedRef.current = false;
            }
          }

          if (
            event.pointerType === "touch" &&
            pendingTouchPaintRef.current?.pointerId === event.pointerId &&
            !touchGestureLockedRef.current
          ) {
            activatePendingTouchPaint();
          }

          if (activePointerIdRef.current !== event.pointerId) {
            return;
          }

          activePointerIdRef.current = null;
          clearPendingTouchPaint();
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={(event) => {
          if (event.pointerType === "touch") {
            activeTouchPointerIdsRef.current.delete(event.pointerId);

            if (activeTouchPointerIdsRef.current.size === 0) {
              touchGestureLockedRef.current = false;
            }
          }

          if (pendingTouchPaintRef.current?.pointerId === event.pointerId) {
            clearPendingTouchPaint();
          }

          if (activePointerIdRef.current !== event.pointerId) {
            return;
          }

          activePointerIdRef.current = null;
          clearPendingTouchPaint();
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          background: "transparent",
          cursor: "inherit",
          touchAction: "none",
        }}
      />
    </>
  );
}
