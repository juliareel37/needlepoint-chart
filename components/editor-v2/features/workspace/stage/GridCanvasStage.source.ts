"use client";

import type {
  GridCellValue,
  PaletteColor,
} from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics } from "@/lib/editor-v2/editor/viewport";
import { getThreadStitchCanvas } from "@/lib/stitchUtils";
import type { CanvasSizing } from "./GridCanvasStage.shared";

const MAX_CANVAS_BACKING_DIMENSION = 16384;
const MAX_CANVAS_BACKING_AREA = 16_777_216;
const MIN_CANVAS_PIXEL_RATIO = 0.125;

export function getEffectiveSourceCanvasPixelRatio(
  width: number,
  height: number,
  devicePixelRatio: number,
): number {
  const safeWidth = Math.max(width, 1);
  const safeHeight = Math.max(height, 1);
  const safeDevicePixelRatio = Number.isFinite(devicePixelRatio)
    ? Math.max(devicePixelRatio, 1)
    : 1;
  const maxDimensionScale = Math.min(
    MAX_CANVAS_BACKING_DIMENSION / safeWidth,
    MAX_CANVAS_BACKING_DIMENSION / safeHeight,
  );
  const maxAreaScale = Math.sqrt(
    MAX_CANVAS_BACKING_AREA / Math.max(safeWidth * safeHeight, 1),
  );
  const limitedPixelRatio = Math.min(
    safeDevicePixelRatio,
    maxDimensionScale,
    maxAreaScale,
  );

  return Math.max(
    MIN_CANVAS_PIXEL_RATIO,
    Number.isFinite(limitedPixelRatio) ? limitedPixelRatio : 1,
  );
}

export function configureSourceCanvas(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  metrics: GridWorldMetrics,
  previousSizing: CanvasSizing | null,
): { sizingChanged: boolean; sizing: CanvasSizing } {
  const width = metrics.surfaceWidth;
  const height = metrics.surfaceHeight;
  const effectivePixelRatio = getEffectiveSourceCanvasPixelRatio(
    width,
    height,
    window.devicePixelRatio || 1,
  );

  const nextCanvasWidth = Math.max(1, Math.round(width * effectivePixelRatio));
  const nextCanvasHeight = Math.max(1, Math.round(height * effectivePixelRatio));
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
  }

  return {
    sizingChanged,
    sizing: {
      width: nextCanvasWidth,
      height: nextCanvasHeight,
      pixelRatio: effectivePixelRatio,
    },
  };
}

export function redrawSourceCanvas(options: {
  context: CanvasRenderingContext2D;
  cells: GridCellValue[];
  colorsById: Record<string, PaletteColor>;
  gridWidth: number;
  metrics: GridWorldMetrics;
  threadView: boolean;
  stitchCanvasCache: Map<string, HTMLCanvasElement>;
}) {
  const {
    context,
    cells,
    colorsById,
    gridWidth,
    metrics,
    threadView,
    stitchCanvasCache,
  } = options;

  context.clearRect(0, 0, metrics.surfaceWidth, metrics.surfaceHeight);

  for (let index = 0; index < cells.length; index += 1) {
    drawCell(context, {
      cellSize: metrics.cellSize,
      colorId: cells[index],
      colorsById,
      gridWidth,
      index,
      stitchCanvasCache,
      threadView,
    });
  }
}

export function drawChangedSourceCells(options: {
  context: CanvasRenderingContext2D;
  cells: GridCellValue[];
  previousCells: GridCellValue[];
  colorsById: Record<string, PaletteColor>;
  gridWidth: number;
  cellSize: number;
  threadView: boolean;
  stitchCanvasCache: Map<string, HTMLCanvasElement>;
}) {
  const {
    context,
    cells,
    previousCells,
    colorsById,
    gridWidth,
    cellSize,
    threadView,
    stitchCanvasCache,
  } = options;

  for (let index = 0; index < cells.length; index += 1) {
    if (previousCells[index] === cells[index]) {
      continue;
    }

    clearCell(context, index, gridWidth, cellSize);
    drawCell(context, {
      cellSize,
      colorId: cells[index],
      colorsById,
      gridWidth,
      index,
      stitchCanvasCache,
      threadView,
    });
  }
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
    stitchCanvasCache: Map<string, HTMLCanvasElement>;
    threadView: boolean;
  },
): void {
  const {
    cellSize,
    colorId,
    colorsById,
    gridWidth,
    index,
    stitchCanvasCache,
    threadView,
  } = options;

  if (!colorId) {
    return;
  }

  const color = colorsById[colorId];

  if (!color) {
    return;
  }

  const { x0, y0, width, height } = getCellRect(index, gridWidth, cellSize);

  if (threadView) {
    const stitchCanvas = getThreadStitchCanvas(
      color.hex,
      Math.max(width, height),
      stitchCanvasCache,
      1,
    );
    context.drawImage(stitchCanvas, x0, y0, width, height);
    return;
  }

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
