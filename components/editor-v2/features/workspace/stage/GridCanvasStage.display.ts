"use client";

import type {
  GridCellValue,
  PaletteColor,
  TraceDocument,
  ViewportState,
} from "@/lib/editor-v2/editor/store";
import { getContainedRect, getPositionedBounds } from "@/lib/editor-v2/editor/positioning";
import type { GridWorldMetrics } from "@/lib/editor-v2/editor/viewport";
import {
  getTraceAssetCropRect,
  getTraceDisplaySize,
} from "@/lib/editor-v2/editor/trace/crop";
import { drawMaskedTraceSourceToCanvas } from "@/lib/editor-v2/editor/trace/mask";
import type {
  CanvasSizing,
  LoadedTraceAsset,
  TraceDisplayOverride,
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
  displayTraceOverride?: TraceDisplayOverride;
  frameOrigin: { x: number; y: number };
  gridOverlayStep: number;
  gridWidth: number;
  highlightedCellIndexes?: number[] | null;
  highlightedColorId?: string | null;
  metrics: GridWorldMetrics;
  paintOpacity: number;
  previewMode?: boolean;
  isZoomInteractionActive?: boolean;
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
    displayTraceOverride = null,
    frameOrigin,
    gridOverlayStep,
    gridWidth,
    highlightedCellIndexes = null,
    highlightedColorId = null,
    metrics,
    paintOpacity,
    previewMode = false,
    isZoomInteractionActive = false,
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
  const renderedCellSize = metrics.cellSize * viewport.zoom;

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
    const renderTrace = displayTraceOverride
      ? {
          ...displayTrace,
          ...displayTraceOverride,
        }
      : displayTrace;
    const displaySize = getTraceDisplaySize(
      renderTrace,
      displayTraceAsset.width,
      displayTraceAsset.height,
    );
    const baseRect = getContainedRect(
      displaySize.width,
      displaySize.height,
      metrics.surfaceWidth,
      metrics.surfaceHeight,
    );
    const bounds = getPositionedBounds(baseRect, {
      offsetX: renderTrace.offsetX,
      offsetY: renderTrace.offsetY,
      scale: renderTrace.scale,
      rotation: renderTrace.rotation,
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
    context.globalAlpha = Math.min(Math.max(renderTrace.opacity, 0), 1);
    context.translate(traceRect.x + traceRect.width / 2, traceRect.y + traceRect.height / 2);
    context.rotate((renderTrace.rotation * Math.PI) / 180);
    const maskedTraceCanvas = document.createElement("canvas");
    drawMaskedTraceSourceToCanvas(maskedTraceCanvas, displayTraceAsset.image, {
      trace: renderTrace,
      width: displayTraceAsset.width,
      height: displayTraceAsset.height,
      mask: displayTraceAsset.mask,
    });
    context.drawImage(
      maskedTraceCanvas,
      0,
      0,
      maskedTraceCanvas.width,
      maskedTraceCanvas.height,
      -traceRect.width / 2,
      -traceRect.height / 2,
      traceRect.width,
      traceRect.height,
    );
    context.restore();
  }

  if (!deferPaintUntilTraceReady) {
    context.save();
    context.globalAlpha = Math.min(Math.max(paintOpacity, 0), 1);
    context.imageSmoothingEnabled = previewMode;
    if (previewMode) {
      context.imageSmoothingQuality = isZoomInteractionActive ? "low" : "medium";
    }
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

  const hasHighlightedCells =
    highlightedColorId !== null || Boolean(highlightedCellIndexes?.length);

  if (hasHighlightedCells) {
    context.save();
    context.fillStyle = "rgba(6, 10, 16, 0.84)";
    context.fillRect(drawX, drawY, drawWidth, drawHeight);
    drawHighlightedCells(context, {
      cells,
      colorsById,
      drawX,
      drawY,
      gridWidth,
      highlightedCellIndexes,
      highlightedColorId,
      renderedCellSize: metrics.cellSize * viewport.zoom,
      threadView,
    });

    if (showSymbols && !deferPaintUntilTraceReady) {
      const highlightedCellIndexSet = highlightedCellIndexes?.length
        ? new Set(highlightedCellIndexes)
        : null;

      drawSymbolsOverlay(context, {
        cells,
        cellSize: metrics.cellSize,
        colorsById,
        drawX,
        drawY,
        gridWidth,
        symbolAssignments,
        zoom: viewport.zoom,
        onlyCellIndexes: highlightedCellIndexSet,
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
    highlightedCellIndexes?: number[] | null;
    highlightedColorId?: string | null;
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
    highlightedCellIndexes = null,
    highlightedColorId,
    renderedCellSize,
    threadView,
  } = options;

  if (renderedCellSize <= 0) {
    return;
  }

  const devicePixelRatio = window.devicePixelRatio || 1;
  const highlightedCellIndexSet = highlightedCellIndexes?.length
    ? new Set(highlightedCellIndexes)
    : null;
  const stitchCanvasCache = new Map<string, HTMLCanvasElement>();

  for (let index = 0; index < cells.length; index += 1) {
    if (highlightedColorId && cells[index] !== highlightedColorId) {
      continue;
    }

    if (highlightedCellIndexSet && !highlightedCellIndexSet.has(index)) {
      continue;
    }

    const colorId = cells[index];
    const color = colorId ? colorsById[colorId] : null;

    if (!color) {
      continue;
    }

    const x = index % gridWidth;
    const y = Math.floor(index / gridWidth);
    const cellRect = snapRectToDevicePixels(
      {
        x: drawX + x * renderedCellSize,
        y: drawY + y * renderedCellSize,
        width: renderedCellSize,
        height: renderedCellSize,
      },
      devicePixelRatio,
    );

    if (cellRect.width <= 0 || cellRect.height <= 0) {
      continue;
    }

    context.fillStyle = color.hex;
    context.fillRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height);

    if (threadView) {
      const stitchCanvas = getThreadStitchCanvas(
        color.hex,
        Math.max(1, Math.round(renderedCellSize)),
        stitchCanvasCache,
        1,
      );

      context.drawImage(
        stitchCanvas,
        cellRect.x,
        cellRect.y,
        cellRect.width,
        cellRect.height,
      );
    }

    const highlightLiftAlpha = getHighlightLiftAlpha(color.hex);

    if (highlightLiftAlpha > 0) {
      context.fillStyle = `rgba(255, 255, 255, ${highlightLiftAlpha})`;
      context.fillRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height);
    }
  }
}

function getHighlightLiftAlpha(hex: string): number {
  const rgb = parseHexColor(hex);

  if (!rgb) {
    return 0.22;
  }

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  if (luminance <= 0.14) {
    return 0.68;
  }

  if (luminance <= 0.24) {
    return 0.56;
  }

  if (luminance <= 0.36) {
    return 0.42;
  }

  if (luminance <= 0.5) {
    return 0.28;
  }

  if (luminance <= 0.68) {
    return 0.14;
  }

  return 0.04;
}

function parseHexColor(hex: string) {
  const normalizedHex = hex.replace("#", "");
  if (normalizedHex.length !== 6) {
    return null;
  }

  const red = Number.parseInt(normalizedHex.slice(0, 2), 16);
  const green = Number.parseInt(normalizedHex.slice(2, 4), 16);
  const blue = Number.parseInt(normalizedHex.slice(4, 6), 16);

  if ([red, green, blue].some((channel) => Number.isNaN(channel))) {
    return null;
  }

  return { r: red, g: green, b: blue };
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
