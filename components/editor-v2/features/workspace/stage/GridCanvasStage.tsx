"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type {
  GridPoint,
  GridCellValue,
  PaletteColor,
  SelectionPoint,
  TraceDocument,
  ViewportState,
} from "@/lib/editor-v2/editor/store";
import { getContainedRect, getPositionedBounds } from "@/lib/editor-v2/editor/positioning";
import type { GridWorldMetrics } from "@/lib/editor-v2/editor/viewport";

const MAX_CANVAS_BACKING_DIMENSION = 16384;

interface LoadedTraceAsset {
  assetUrl: string;
  height: number;
  image: HTMLImageElement | null;
  ready: boolean;
  width: number;
}

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
  metrics: GridWorldMetrics;
  stageSize: { width: number; height: number };
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
  metrics,
  stageSize,
  viewport,
}: GridCanvasStageProps) {
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceCanvasSizingRef = useRef<{
    width: number;
    height: number;
    pixelRatio: number;
  } | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayCanvasSizingRef = useRef<{
    width: number;
    height: number;
    pixelRatio: number;
  } | null>(null);
  const previousCellsRef = useRef<GridCellValue[] | null>(null);
  const previousColorsRef = useRef<Record<string, PaletteColor> | null>(null);
  const initializedRef = useRef(false);

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

    const width = metrics.surfaceWidth;
    const height = metrics.surfaceHeight;
    const devicePixelRatio = window.devicePixelRatio || 1;
    const maxRenderableScale = Math.min(
      MAX_CANVAS_BACKING_DIMENSION / Math.max(width, 1),
      MAX_CANVAS_BACKING_DIMENSION / Math.max(height, 1),
    );
    // Fractional backing ratios can bake anti-aliased gutters into the source
    // bitmap itself, which then scale up into visible seams at high zoom.
    const effectivePixelRatio = Math.max(
      1,
      Math.floor(Math.min(devicePixelRatio, maxRenderableScale)),
    );

    const nextCanvasWidth = Math.max(1, Math.round(width * effectivePixelRatio));
    const nextCanvasHeight = Math.max(1, Math.round(height * effectivePixelRatio));
    const previousSizing = sourceCanvasSizingRef.current;
    const sizingChanged =
      !previousSizing ||
      previousSizing.width !== nextCanvasWidth ||
      previousSizing.height !== nextCanvasHeight ||
      previousSizing.pixelRatio !== effectivePixelRatio;

    if (sizingChanged) {
      canvas.width = nextCanvasWidth;
      canvas.height = nextCanvasHeight;
      context.setTransform(effectivePixelRatio, 0, 0, effectivePixelRatio, 0, 0);
      context.imageSmoothingEnabled = false;
      sourceCanvasSizingRef.current = {
        width: nextCanvasWidth,
        height: nextCanvasHeight,
        pixelRatio: effectivePixelRatio,
      };
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
    const shouldRedrawAll =
      !initializedRef.current ||
      !previousCells ||
      previousCells.length !== cells.length ||
      previousColors !== colorsById;

    if (shouldRedrawAll) {
      context.clearRect(0, 0, metrics.surfaceWidth, metrics.surfaceHeight);

      for (let index = 0; index < cells.length; index += 1) {
        drawCell(context, {
          cellSize: metrics.cellSize,
          colorId: cells[index],
          colorsById,
          gridWidth,
          index,
        });
      }

      initializedRef.current = true;
      previousCellsRef.current = cells.slice();
      previousColorsRef.current = colorsById;
      return;
    }

    for (let index = 0; index < cells.length; index += 1) {
      if (previousCells[index] === cells[index]) {
        continue;
      }

      clearCell(context, index, gridWidth, metrics.cellSize);
      drawCell(context, {
        cellSize: metrics.cellSize,
        colorId: cells[index],
        colorsById,
        gridWidth,
        index,
      });
    }

    previousCellsRef.current = cells.slice();
    previousColorsRef.current = colorsById;
  }, [
    cells,
    colorsById,
    gridWidth,
    metrics.cellSize,
    metrics.surfaceHeight,
    metrics.surfaceWidth,
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

    const width = Math.max(stageSize.width, 1);
    const height = Math.max(stageSize.height, 1);
    const devicePixelRatio = window.devicePixelRatio || 1;
    const nextCanvasWidth = Math.max(1, Math.round(width * devicePixelRatio));
    const nextCanvasHeight = Math.max(1, Math.round(height * devicePixelRatio));
    const previousSizing = displayCanvasSizingRef.current;
    const sizingChanged =
      !previousSizing ||
      previousSizing.width !== nextCanvasWidth ||
      previousSizing.height !== nextCanvasHeight ||
      previousSizing.pixelRatio !== devicePixelRatio;

    if (sizingChanged) {
      canvas.width = nextCanvasWidth;
      canvas.height = nextCanvasHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      displayCanvasSizingRef.current = {
        width: nextCanvasWidth,
        height: nextCanvasHeight,
        pixelRatio: devicePixelRatio,
      };
    }

    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, width, height);

    const drawX = frameOrigin.x + viewport.offsetX;
    const drawY = frameOrigin.y + viewport.offsetY;
    const drawWidth = metrics.surfaceWidth * viewport.zoom;
    const drawHeight = metrics.surfaceHeight * viewport.zoom;

    context.fillStyle = "#ffffff";
    context.fillRect(drawX, drawY, drawWidth, drawHeight);
    context.save();
    context.beginPath();
    context.rect(drawX, drawY, drawWidth, drawHeight);
    context.clip();

    if (
      displayTrace &&
      displayTraceAsset?.assetUrl === displayTrace.assetUrl &&
      displayTraceAsset.ready &&
      displayTraceAsset.image &&
      displayTraceAsset.width > 0 &&
      displayTraceAsset.height > 0
    ) {
      const baseRect = getContainedRect(
        displayTraceAsset.width,
        displayTraceAsset.height,
        metrics.surfaceWidth,
        metrics.surfaceHeight,
      );
      const bounds = getPositionedBounds(baseRect, {
        offsetX: displayTrace.offsetX,
        offsetY: displayTrace.offsetY,
        scale: displayTrace.scale,
      });

      context.save();
      context.globalAlpha = Math.min(Math.max(displayTrace.opacity, 0), 1);
      context.drawImage(
        displayTraceAsset.image,
        drawX + bounds.left * viewport.zoom,
        drawY + bounds.top * viewport.zoom,
        bounds.width * viewport.zoom,
        bounds.height * viewport.zoom,
      );
      context.restore();
    }

    context.save();
    context.globalAlpha = Math.min(Math.max(paintOpacity, 0), 1);
    context.drawImage(
      sourceCanvas,
      0,
      0,
      sourceCanvas.width,
      sourceCanvas.height,
      drawX,
      drawY,
      drawWidth,
      drawHeight,
    );
    context.restore();

    if (showGridlines) {
      drawGridOverlay(context, {
        cellSize: metrics.cellSize,
        drawHeight,
        drawWidth,
        drawX,
        drawY,
        gridHeight: metrics.height,
        gridOverlayStep,
        gridWidth,
        zoom: viewport.zoom,
      });
    }

    context.restore();
  }, [
    cells,
    frameOrigin.x,
    frameOrigin.y,
    gridOverlayStep,
    gridWidth,
    metrics.surfaceHeight,
    metrics.surfaceWidth,
    metrics.cellSize,
    metrics.height,
    showGridlines,
    stageSize.height,
    stageSize.width,
    displayTrace?.offsetX,
    displayTrace?.offsetY,
    displayTrace?.opacity,
    displayTrace?.scale,
    displayTrace?.assetUrl,
    displayTraceAsset,
    paintOpacity,
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

function clearCell(
  context: CanvasRenderingContext2D,
  index: number,
  gridWidth: number,
  cellSize: number,
): void {
  const { x0, y0, width, height } = getCellRect(index, gridWidth, cellSize);

  context.clearRect(x0, y0, width, height);
}

function drawCell(
  context: CanvasRenderingContext2D,
  options: {
    cellSize: number;
    colorId: GridCellValue;
    colorsById: Record<string, PaletteColor>;
    gridWidth: number;
    index: number;
  },
): void {
  const { cellSize, colorId, colorsById, gridWidth, index } = options;

  if (!colorId) {
    return;
  }

  const color = colorsById[colorId];

  if (!color) {
    return;
  }

  const { x0, y0, width, height } = getCellRect(index, gridWidth, cellSize);

  context.fillStyle = color.hex;
  context.fillRect(x0, y0, width, height);
}

function getCellRect(index: number, gridWidth: number, cellSize: number) {
  const x = index % gridWidth;
  const y = Math.floor(index / gridWidth);
  const x0 = Math.round(x * cellSize);
  const y0 = Math.round(y * cellSize);
  const x1 = Math.round((x + 1) * cellSize);
  const y1 = Math.round((y + 1) * cellSize);

  return {
    x0,
    y0,
    width: Math.max(1, x1 - x0),
    height: Math.max(1, y1 - y0),
  };
}

function drawGridOverlay(
  context: CanvasRenderingContext2D,
  options: {
    cellSize: number;
    drawHeight: number;
    drawWidth: number;
    drawX: number;
    drawY: number;
    gridHeight: number;
    gridOverlayStep: number;
    gridWidth: number;
    zoom: number;
  },
) {
  const {
    cellSize,
    drawHeight,
    drawWidth,
    drawX,
    drawY,
    gridHeight,
    gridOverlayStep,
    gridWidth,
    zoom,
  } = options;

  // Minor lines represent the physical mesh, so keep them neutral and quiet.
  // Major lines are app-level helpers, so give them a subtle brand tint.
  const majorLineColor = "rgba(179, 109, 200, 0.52)";
  const minorLineColor = "rgba(120, 113, 108, 0.3)";
  const highlightMajorColor = "rgba(252, 247, 255, 0.24)";
  const highlightMinorColor = "rgba(255, 255, 255, 0.08)";
  const renderedCellSize = cellSize * zoom;
  const shouldShowMinorLines = gridOverlayStep > 1 && renderedCellSize >= 6;
  const minorLineWidth = 1.25;
  const majorLineWidth = gridOverlayStep > 1 && renderedCellSize >= 18 ? 2.5 : 1.5;
  const left = Math.round(drawX);
  const top = Math.round(drawY);
  const right = Math.round(drawX + drawWidth);
  const bottom = Math.round(drawY + drawHeight);

  const drawLineSet = (
    step: number,
    strokeColor: string,
    currentLineWidth: number,
    includeOuterBorder: boolean,
  ) => {
    const stepSize = cellSize * step * zoom;

    if (stepSize <= 0) {
      return;
    }

    context.fillStyle = strokeColor;

    for (let column = includeOuterBorder ? 0 : step; column < gridWidth; column += step) {
      const x = Math.round(drawX + column * cellSize * zoom);
      context.fillRect(x, top, currentLineWidth, Math.max(bottom - top, 1));
    }

    for (let row = includeOuterBorder ? 0 : step; row < gridHeight; row += step) {
      const y = Math.round(drawY + row * cellSize * zoom);
      context.fillRect(left, y, Math.max(right - left, 1), currentLineWidth);
    }

    if (includeOuterBorder) {
      context.fillRect(
        right - currentLineWidth,
        top,
        currentLineWidth,
        Math.max(bottom - top, 1),
      );
      context.fillRect(
        left,
        bottom - currentLineWidth,
        Math.max(right - left, 1),
        currentLineWidth,
      );
    }
  };

  if (shouldShowMinorLines) {
    drawLineSet(1, minorLineColor, minorLineWidth, false);
    context.save();
    context.globalCompositeOperation = "screen";
    drawLineSet(1, highlightMinorColor, minorLineWidth, false);
    context.restore();
  }

  drawLineSet(
    gridOverlayStep,
    gridOverlayStep > 1 ? majorLineColor : minorLineColor,
    gridOverlayStep > 1 ? majorLineWidth : minorLineWidth,
    true,
  );
  context.save();
  context.globalCompositeOperation = "screen";
  drawLineSet(
    gridOverlayStep,
    gridOverlayStep > 1 ? highlightMajorColor : highlightMinorColor,
    gridOverlayStep > 1 ? majorLineWidth : minorLineWidth,
    true,
  );
  context.restore();
}
