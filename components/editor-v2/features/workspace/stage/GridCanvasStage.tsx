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
  cells: GridCellValue[];
  colorsById: Record<string, PaletteColor>;
  displayHost: HTMLElement | null;
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
}

export function GridCanvasStage({
  cells,
  colorsById,
  displayHost,
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
}: GridCanvasStageProps) {
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceCanvasSizingRef = useRef<CanvasSizing | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayCanvasSizingRef = useRef<CanvasSizing | null>(null);
  const previousCellsRef = useRef<GridCellValue[] | null>(null);
  const previousColorsRef = useRef<Record<string, PaletteColor> | null>(null);
  const previousThreadViewRef = useRef<boolean | null>(null);
  const stitchCanvasCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const initializedRef = useRef(false);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    const syncBackgroundColor = () => {
      const nextColor = getComputedStyle(root)
        .getPropertyValue("--canvas-display-bg")
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

    const nextConfiguration = configureSourceCanvas(
      canvas,
      context,
      metrics,
      sourceCanvasSizingRef.current,
    );
    sourceCanvasSizingRef.current = nextConfiguration.sizing;
    if (nextConfiguration.sizingChanged) {
      initializedRef.current = false;
    }
  }, [metrics.cellSize, metrics.surfaceHeight, metrics.surfaceWidth]);

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
      previousColorsRef.current = colorsById;
      previousThreadViewRef.current = threadView;
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
    previousColorsRef.current = colorsById;
    previousThreadViewRef.current = threadView;
  }, [
    cells,
    colorsById,
    gridWidth,
    metrics.cellSize,
    metrics.surfaceHeight,
    metrics.surfaceWidth,
    threadView,
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
      stitchCanvasCache: stitchCanvasCacheRef.current,
      symbolAssignments,
      threadView,
      viewport,
    });
  }, [
    backgroundColor,
    cells,
    colorsById,
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
    displayTrace?.assetUrl,
    displayTraceAsset,
    paintOpacity,
    threadView,
    viewport.offsetX,
    viewport.offsetY,
    viewport.zoom,
  ]);

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
        onMouseDown={(event) => {
          const point = getGridPointFromClient(event.clientX, event.clientY);
          const selectionPoint = getSelectionPointFromClient(
            event.clientX,
            event.clientY,
          );

          if (!point || !selectionPoint) {
            return;
          }

          handlePointerDown(point, selectionPoint);
        }}
        onMouseMove={(event) => {
          if ((event.buttons & 1) === 0) {
            return;
          }

          const point = getGridPointFromClient(event.clientX, event.clientY);

          if (!point) {
            return;
          }

          handlePointerEnter(point);
        }}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          background: "transparent",
          cursor: "inherit",
        }}
      />
    </>
  );
}
