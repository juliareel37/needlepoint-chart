"use client";

import type {
  GridCellValue,
  PaletteColor,
} from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics } from "@/lib/editor-v2/editor/viewport";
import { getThreadStitchCanvas } from "@/lib/stitchUtils";
import type { CanvasSizing } from "./GridCanvasStage.shared";

const MOBILE_LAYOUT_MAX_WIDTH_PX = 768;
const DESKTOP_MAX_CANVAS_BACKING_DIMENSION = 16384;
const DESKTOP_MAX_CANVAS_BACKING_AREA = 16_777_216;
const MOBILE_MAX_CANVAS_BACKING_DIMENSION = 2048;
const MOBILE_MAX_CANVAS_BACKING_AREA = 4_194_304;
const MOBILE_INTERACTION_TARGET_PIXEL_RATIO = 0.35;
const MIN_CANVAS_PIXEL_RATIO = 0.125;

export function getEffectiveSourceCanvasPixelRatio(
  width: number,
  height: number,
  targetPixelRatio: number,
  options?: {
    isMobile?: boolean;
  },
): number {
  const safeWidth = Math.max(width, 1);
  const safeHeight = Math.max(height, 1);
  const safeTargetPixelRatio = Number.isFinite(targetPixelRatio)
    ? Math.max(targetPixelRatio, MIN_CANVAS_PIXEL_RATIO)
    : 1;
  const maxBackingDimension = options?.isMobile
    ? MOBILE_MAX_CANVAS_BACKING_DIMENSION
    : DESKTOP_MAX_CANVAS_BACKING_DIMENSION;
  const maxBackingArea = options?.isMobile
    ? MOBILE_MAX_CANVAS_BACKING_AREA
    : DESKTOP_MAX_CANVAS_BACKING_AREA;
  const maxDimensionScale = Math.min(
    maxBackingDimension / safeWidth,
    maxBackingDimension / safeHeight,
  );
  const maxAreaScale = Math.sqrt(
    maxBackingArea / Math.max(safeWidth * safeHeight, 1),
  );
  const limitedPixelRatio = Math.min(
    safeTargetPixelRatio,
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
  viewportZoom: number,
  stageSize: { width: number; height: number },
  options: {
    isZoomInteractionActive?: boolean;
  },
  previousSizing: CanvasSizing | null,
): { sizingChanged: boolean; sizing: CanvasSizing } {
  const width = metrics.surfaceWidth;
  const height = metrics.surfaceHeight;
  const isMobileLayout =
    (typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia(`(max-width: ${MOBILE_LAYOUT_MAX_WIDTH_PX}px)`).matches) ||
    stageSize.width <= MOBILE_LAYOUT_MAX_WIDTH_PX;
  const targetPixelRatio = options.isZoomInteractionActive && isMobileLayout
    ? MOBILE_INTERACTION_TARGET_PIXEL_RATIO
    : (window.devicePixelRatio || 1) * Math.max(viewportZoom, MIN_CANVAS_PIXEL_RATIO);
  const effectivePixelRatio = getEffectiveSourceCanvasPixelRatio(
    width,
    height,
    targetPixelRatio,
    { isMobile: isMobileLayout },
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
    colorsById,
    gridWidth,
    cellSize,
    threadView,
    stitchCanvasCache,
  } = options;
  const gridHeight = Math.ceil(cells.length / Math.max(gridWidth, 1));
  const changedIndices: number[] = [];

  for (let index = 0; index < cells.length; index += 1) {
    if (options.previousCells[index] !== cells[index]) {
      changedIndices.push(index);
    }
  }

  if (changedIndices.length === 0) {
    return;
  }

  const affectedIndices = new Set<number>();

  for (const index of changedIndices) {
    clearCell(context, index, gridWidth, cellSize, 1);

    const cellX = index % gridWidth;
    const cellY = Math.floor(index / gridWidth);

    for (let deltaY = -1; deltaY <= 1; deltaY += 1) {
      for (let deltaX = -1; deltaX <= 1; deltaX += 1) {
        const neighborX = cellX + deltaX;
        const neighborY = cellY + deltaY;

        if (
          neighborX < 0 ||
          neighborY < 0 ||
          neighborX >= gridWidth ||
          neighborY >= gridHeight
        ) {
          continue;
        }

        affectedIndices.add(neighborY * gridWidth + neighborX);
      }
    }
  }

  for (const index of affectedIndices) {
    drawCell(context, {
      cellSize,
      colorId: cells[index] ?? null,
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
  bleed = 0,
): void {
  const { x0, y0, width, height } = getCellRect(index, gridWidth, cellSize);

  context.clearRect(x0 - bleed, y0 - bleed, width + bleed * 2, height + bleed * 2);
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
