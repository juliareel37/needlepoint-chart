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
const MIN_ALIGNED_CELL_PIXELS = 4;

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
    : window.devicePixelRatio || 1;
  const effectivePixelRatio = getEffectiveSourceCanvasPixelRatio(
    width,
    height,
    targetPixelRatio,
    { isMobile: isMobileLayout },
  );
  const alignedPixelRatio = alignSourcePixelRatioToCellSize(
    effectivePixelRatio,
    metrics.cellSize,
  );

  const nextCanvasWidth = Math.max(1, Math.round(width * alignedPixelRatio));
  const nextCanvasHeight = Math.max(1, Math.round(height * alignedPixelRatio));
  const sizingChanged =
    !previousSizing ||
    previousSizing.width !== nextCanvasWidth ||
    previousSizing.height !== nextCanvasHeight ||
    previousSizing.pixelRatio !== alignedPixelRatio;

  if (sizingChanged) {
    canvas.width = nextCanvasWidth;
    canvas.height = nextCanvasHeight;
    context.setTransform(alignedPixelRatio, 0, 0, alignedPixelRatio, 0, 0);
    context.imageSmoothingEnabled = false;
  }

  return {
    sizingChanged,
    sizing: {
      width: nextCanvasWidth,
      height: nextCanvasHeight,
      pixelRatio: alignedPixelRatio,
    },
  };
}

export function alignSourcePixelRatioToCellSize(
  pixelRatio: number,
  cellSize: number,
): number {
  const safeCellSize = Math.max(cellSize, 1);
  const pixelsPerCell = safeCellSize * pixelRatio;

  if (!Number.isFinite(pixelRatio) || pixelsPerCell < MIN_ALIGNED_CELL_PIXELS) {
    return pixelRatio;
  }

  return Math.max(
    MIN_CANVAS_PIXEL_RATIO,
    Math.floor(pixelsPerCell) / safeCellSize,
  );
}

export function redrawSourceCanvas(options: {
  context: CanvasRenderingContext2D;
  cells: GridCellValue[];
  colorsById: Record<string, PaletteColor>;
  gridWidth: number;
  metrics: GridWorldMetrics;
  stitchStyleVersion: number;
  threadView: boolean;
  stitchCanvasCache: Map<string, HTMLCanvasElement>;
}) {
  const {
    context,
    cells,
    colorsById,
    gridWidth,
    metrics,
    stitchStyleVersion,
    threadView,
    stitchCanvasCache,
  } = options;

  context.clearRect(0, 0, metrics.surfaceWidth, metrics.surfaceHeight);

  for (let index = 0; index < cells.length; index += 1) {
    drawCell(context, {
      cells,
      cellSize: metrics.cellSize,
      colorId: cells[index],
      colorsById,
      gridWidth,
      index,
      stitchStyleVersion,
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
  stitchStyleVersion: number;
  threadView: boolean;
  stitchCanvasCache: Map<string, HTMLCanvasElement>;
}) {
  const {
    context,
    cells,
    colorsById,
    gridWidth,
    cellSize,
    stitchStyleVersion,
    threadView,
    stitchCanvasCache,
  } = options;
  const changedIndices: number[] = [];

  for (let index = 0; index < cells.length; index += 1) {
    if (options.previousCells[index] !== cells[index]) {
      changedIndices.push(index);
    }
  }

  if (changedIndices.length === 0) {
    return;
  }

  drawSourceCellsForChangedIndexes({
    context,
    cells,
    changedIndices,
    colorsById,
    gridWidth,
    cellSize,
    stitchStyleVersion,
    threadView,
    stitchCanvasCache,
  });
}

export function drawKnownChangedSourceCells(options: {
  context: CanvasRenderingContext2D;
  cells: GridCellValue[];
  changedIndices: readonly number[];
  colorsById: Record<string, PaletteColor>;
  gridWidth: number;
  cellSize: number;
  stitchStyleVersion: number;
  threadView: boolean;
  stitchCanvasCache: Map<string, HTMLCanvasElement>;
}) {
  if (options.changedIndices.length === 0) {
    return;
  }

  drawSourceCellsForChangedIndexes(options);
}

function drawSourceCellsForChangedIndexes(options: {
  context: CanvasRenderingContext2D;
  cells: GridCellValue[];
  changedIndices: readonly number[];
  colorsById: Record<string, PaletteColor>;
  gridWidth: number;
  cellSize: number;
  stitchStyleVersion: number;
  threadView: boolean;
  stitchCanvasCache: Map<string, HTMLCanvasElement>;
}) {
  const {
    context,
    cells,
    changedIndices,
    colorsById,
    gridWidth,
    cellSize,
    stitchStyleVersion,
    threadView,
    stitchCanvasCache,
  } = options;
  const gridHeight = Math.ceil(cells.length / Math.max(gridWidth, 1));
  let minAffectedX = gridWidth;
  let maxAffectedX = -1;
  let minAffectedY = gridHeight;
  let maxAffectedY = -1;

  for (const index of changedIndices) {
    if (index < 0 || index >= cells.length) {
      continue;
    }

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

        minAffectedX = Math.min(minAffectedX, neighborX);
        maxAffectedX = Math.max(maxAffectedX, neighborX);
        minAffectedY = Math.min(minAffectedY, neighborY);
        maxAffectedY = Math.max(maxAffectedY, neighborY);
      }
    }
  }

  if (maxAffectedX >= minAffectedX && maxAffectedY >= minAffectedY) {
    clearCellRect(
      context,
      minAffectedX,
      minAffectedY,
      maxAffectedX,
      maxAffectedY,
      cellSize,
      0,
    );

    for (let cellY = minAffectedY; cellY <= maxAffectedY; cellY += 1) {
      for (let cellX = minAffectedX; cellX <= maxAffectedX; cellX += 1) {
        const index = cellY * gridWidth + cellX;
        drawCell(context, {
          cells,
          cellSize,
          colorId: cells[index] ?? null,
          colorsById,
          gridWidth,
          index,
          stitchStyleVersion,
          stitchCanvasCache,
          threadView,
        });
      }
    }
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

function clearCellRect(
  context: CanvasRenderingContext2D,
  minCellX: number,
  minCellY: number,
  maxCellX: number,
  maxCellY: number,
  cellSize: number,
  bleed = 0,
): void {
  const left = Math.round(minCellX * cellSize);
  const top = Math.round(minCellY * cellSize);
  const right = Math.round((maxCellX + 1) * cellSize);
  const bottom = Math.round((maxCellY + 1) * cellSize);

  context.clearRect(
    left - bleed,
    top - bleed,
    Math.max(right - left, 1) + bleed * 2,
    Math.max(bottom - top, 1) + bleed * 2,
  );
}

function drawCell(
  context: CanvasRenderingContext2D,
  options: {
    cells: GridCellValue[];
    cellSize: number;
    colorId: GridCellValue;
    colorsById: Record<string, PaletteColor>;
    gridWidth: number;
    index: number;
    stitchStyleVersion: number;
    stitchCanvasCache: Map<string, HTMLCanvasElement>;
    threadView: boolean;
  },
): void {
  const {
    cells,
    cellSize,
    colorId,
    colorsById,
    gridWidth,
    index,
    stitchStyleVersion,
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
    const hasTopNeighbor = hasPaintedNeighbor(cells, index - gridWidth);
    const hasLeftNeighbor =
      index % gridWidth > 0 && hasPaintedNeighbor(cells, index - 1);
    const hasBottomNeighbor = hasPaintedNeighbor(cells, index + gridWidth);
    const hasRightNeighbor =
      index % gridWidth < gridWidth - 1 && hasPaintedNeighbor(cells, index + 1);
    const stitchCanvas = getThreadStitchCanvas(
      color.hex,
      Math.max(width, height),
      stitchCanvasCache,
      stitchStyleVersion,
      {
        showBottomRightShadow: hasBottomNeighbor && hasRightNeighbor,
        showTopLeftShadow: hasTopNeighbor && hasLeftNeighbor,
      },
    );
    context.drawImage(stitchCanvas, x0, y0, width, height);
    return;
  }

  context.fillStyle = color.hex;
  context.fillRect(x0, y0, width, height);
}

function hasPaintedNeighbor(cells: GridCellValue[], index: number): boolean {
  return index >= 0 && index < cells.length && cells[index] !== null;
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
