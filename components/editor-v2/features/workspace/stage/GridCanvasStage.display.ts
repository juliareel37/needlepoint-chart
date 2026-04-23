"use client";

import type {
  GridCellValue,
  PaletteColor,
  TraceDocument,
  ViewportState,
} from "@/lib/editor-v2/editor/store";
import { getContainedRect, getPositionedBounds } from "@/lib/editor-v2/editor/positioning";
import type { GridWorldMetrics } from "@/lib/editor-v2/editor/viewport";
import type {
  CanvasSizing,
  LoadedTraceAsset,
} from "./GridCanvasStage.shared";
import {
  drawGridOverlay,
  drawSymbolsOverlay,
} from "./overlays/GridCanvasStage.overlays";
import { getThreadStitchCanvas } from "@/lib/stitchUtils";

export function configureDisplayCanvas(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  stageSize: { width: number; height: number },
  previousSizing: CanvasSizing | null,
): CanvasSizing {
  const width = Math.max(stageSize.width, 1);
  const height = Math.max(stageSize.height, 1);
  const devicePixelRatio = window.devicePixelRatio || 1;
  const nextCanvasWidth = Math.max(1, Math.round(width * devicePixelRatio));
  const nextCanvasHeight = Math.max(1, Math.round(height * devicePixelRatio));
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
  }

  return {
    width: nextCanvasWidth,
    height: nextCanvasHeight,
    pixelRatio: devicePixelRatio,
  };
}

export function renderDisplayCanvas(options: {
  backgroundColor: string;
  context: CanvasRenderingContext2D;
  sourceCanvas: HTMLCanvasElement;
  cells: GridCellValue[];
  colorsById: Record<string, PaletteColor>;
  deferPaintUntilTraceReady?: boolean;
  displayTrace?: TraceDocument | null;
  displayTraceAsset: LoadedTraceAsset | null;
  frameOrigin: { x: number; y: number };
  gridOverlayStep: number;
  gridWidth: number;
  highlightedColorId?: string | null;
  metrics: GridWorldMetrics;
  paintOpacity: number;
  showGridlines: boolean;
  showSymbols: boolean;
  stageSize: { width: number; height: number };
  symbolAssignments: Record<string, string>;
  threadView: boolean;
  viewport: ViewportState;
}) {
  const {
    backgroundColor,
    context,
    sourceCanvas,
    cells,
    colorsById,
    deferPaintUntilTraceReady = false,
    displayTrace = null,
    displayTraceAsset,
    frameOrigin,
    gridOverlayStep,
    gridWidth,
    highlightedColorId = null,
    metrics,
    paintOpacity,
    showGridlines,
    showSymbols,
    stageSize,
    symbolAssignments,
    threadView,
    viewport,
  } = options;
  const width = Math.max(stageSize.width, 1);
  const height = Math.max(stageSize.height, 1);
  const devicePixelRatio = window.devicePixelRatio || 1;

  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, width, height);

  const drawRect = snapRectToDevicePixels(
    {
      x: frameOrigin.x + viewport.offsetX,
      y: frameOrigin.y + viewport.offsetY,
      width: metrics.surfaceWidth * viewport.zoom,
      height: metrics.surfaceHeight * viewport.zoom,
    },
    devicePixelRatio,
  );
  const drawX = drawRect.x;
  const drawY = drawRect.y;
  const drawWidth = drawRect.width;
  const drawHeight = drawRect.height;

  context.fillStyle = backgroundColor;
  context.fillRect(drawX, drawY, drawWidth, drawHeight);
  context.save();
  context.beginPath();
  context.rect(drawX, drawY, drawWidth, drawHeight);
  context.clip();

  if (
    displayTrace &&
    displayTraceAsset?.previewUrl === displayTrace.previewUrl &&
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
    const traceRect = snapRectToDevicePixels(
      {
        x: drawX + bounds.left * viewport.zoom,
        y: drawY + bounds.top * viewport.zoom,
        width: bounds.width * viewport.zoom,
        height: bounds.height * viewport.zoom,
      },
      devicePixelRatio,
    );

    context.save();
    context.globalAlpha = Math.min(Math.max(displayTrace.opacity, 0), 1);
    context.drawImage(
      displayTraceAsset.image,
      traceRect.x,
      traceRect.y,
      traceRect.width,
      traceRect.height,
    );
    context.restore();
  }

  if (!deferPaintUntilTraceReady) {
    context.save();
    context.globalAlpha = Math.min(Math.max(paintOpacity, 0), 1);
    context.drawImage(sourceCanvas, drawX, drawY, drawWidth, drawHeight);
    context.restore();
  }

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

  if (showSymbols && !deferPaintUntilTraceReady) {
    context.save();
    context.globalAlpha = Math.min(Math.max(paintOpacity, 0), 1);
    drawSymbolsOverlay(context, {
      cells,
      cellSize: metrics.cellSize,
      colorsById,
      drawX,
      drawY,
      gridWidth,
      symbolAssignments,
      zoom: viewport.zoom,
    });
    context.restore();
  }

  if (highlightedColorId) {
    context.save();
    context.fillStyle = "rgba(6, 10, 16, 0.84)";
    context.fillRect(drawX, drawY, drawWidth, drawHeight);
    drawHighlightedCells(context, {
      cells,
      colorsById,
      drawX,
      drawY,
      gridWidth,
      highlightedColorId,
      renderedCellSize: metrics.cellSize * viewport.zoom,
      threadView,
    });

    if (showSymbols && !deferPaintUntilTraceReady) {
      drawSymbolsOverlay(context, {
        cells,
        cellSize: metrics.cellSize,
        colorsById,
        drawX,
        drawY,
        gridWidth,
        symbolAssignments,
        zoom: viewport.zoom,
        onlyColorId: highlightedColorId,
      });
    }
    context.restore();
  }

  context.restore();
}

function drawHighlightedCells(
  context: CanvasRenderingContext2D,
  options: {
    cells: GridCellValue[];
    colorsById: Record<string, PaletteColor>;
    drawX: number;
    drawY: number;
    gridWidth: number;
    highlightedColorId: string;
    renderedCellSize: number;
    threadView: boolean;
  },
) {
  const {
    cells,
    colorsById,
    drawX,
    drawY,
    gridWidth,
    highlightedColorId,
    renderedCellSize,
    threadView,
  } = options;
  const color = colorsById[highlightedColorId];

  if (!color || renderedCellSize <= 0) {
    return;
  }

  const stitchCanvasCache = new Map<string, HTMLCanvasElement>();
  const stitchCanvas = threadView
    ? getThreadStitchCanvas(
        color.hex,
        Math.max(1, Math.round(renderedCellSize)),
        stitchCanvasCache,
        1,
      )
    : null;

  for (let index = 0; index < cells.length; index += 1) {
    if (cells[index] !== highlightedColorId) {
      continue;
    }

    const x = index % gridWidth;
    const y = Math.floor(index / gridWidth);
    const cellX = drawX + x * renderedCellSize;
    const cellY = drawY + y * renderedCellSize;

    context.fillStyle = color.hex;
    context.fillRect(cellX, cellY, renderedCellSize, renderedCellSize);

    if (threadView && stitchCanvas) {
      context.drawImage(
        stitchCanvas,
        cellX,
        cellY,
        renderedCellSize,
        renderedCellSize,
      );
    }
  }
}

function snapRectToDevicePixels(
  rect: { x: number; y: number; width: number; height: number },
  devicePixelRatio: number,
) {
  const left = snapToDevicePixel(rect.x, devicePixelRatio);
  const top = snapToDevicePixel(rect.y, devicePixelRatio);
  const right = snapToDevicePixel(rect.x + rect.width, devicePixelRatio);
  const bottom = snapToDevicePixel(rect.y + rect.height, devicePixelRatio);

  return {
    x: left,
    y: top,
    width: Math.max(right - left, 0),
    height: Math.max(bottom - top, 0),
  };
}

function snapToDevicePixel(value: number, devicePixelRatio: number): number {
  return Math.round(value * devicePixelRatio) / devicePixelRatio;
}
