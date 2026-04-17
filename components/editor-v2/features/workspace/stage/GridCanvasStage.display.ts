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
  drawThreadOverlay,
} from "./overlays/GridCanvasStage.overlays";

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
  metrics: GridWorldMetrics;
  paintOpacity: number;
  showGridlines: boolean;
  showSymbols: boolean;
  stageSize: { width: number; height: number };
  stitchCanvasCache: Map<string, HTMLCanvasElement>;
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
    metrics,
    paintOpacity,
    showGridlines,
    showSymbols,
    stageSize,
    stitchCanvasCache,
    symbolAssignments,
    threadView,
    viewport,
  } = options;
  const width = Math.max(stageSize.width, 1);
  const height = Math.max(stageSize.height, 1);

  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, width, height);

  const drawX = frameOrigin.x + viewport.offsetX;
  const drawY = frameOrigin.y + viewport.offsetY;
  const drawWidth = metrics.surfaceWidth * viewport.zoom;
  const drawHeight = metrics.surfaceHeight * viewport.zoom;

  context.fillStyle = backgroundColor;
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

  if (!deferPaintUntilTraceReady) {
    context.save();
    context.globalAlpha = Math.min(Math.max(paintOpacity, 0), 1);
    if (threadView) {
      drawThreadOverlay(context, {
        cells,
        colorsById,
        drawX,
        drawY,
        gridWidth,
        renderedCellSize: metrics.cellSize * viewport.zoom,
        stitchCanvasCache,
      });
    } else {
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
    }
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

  context.restore();
}
