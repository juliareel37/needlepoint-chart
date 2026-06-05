"use client";

import type {
  GridCellValue,
  PaletteColor,
} from "@/lib/editor-v2/editor/store";
import { getThreadStitchCanvas } from "@/lib/stitchUtils";

export function drawGridOverlay(
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

  const majorLineColor = "rgba(3, 62, 164, 0.52)";
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

export function drawSymbolsOverlay(
  context: CanvasRenderingContext2D,
  options: {
    cells: GridCellValue[];
    cellSize: number;
    colorsById: Record<string, PaletteColor>;
    drawX: number;
    drawY: number;
    gridWidth: number;
    onlyCellIndexes?: Set<number> | null;
    onlyColorId?: string | null;
    symbolAssignments: Record<string, string>;
    zoom: number;
  },
) {
  const {
    cells,
    cellSize,
    colorsById,
    drawX,
    drawY,
    gridWidth,
    onlyCellIndexes = null,
    onlyColorId = null,
    symbolAssignments,
    zoom,
  } = options;
  const renderedCellSize = cellSize * zoom;
  const minSymbolCellSize = 8;

  if (renderedCellSize < minSymbolCellSize) {
    return;
  }

  const fontSize = Math.max(9, Math.min(renderedCellSize * 0.62, renderedCellSize - 4));
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `600 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;

  for (let index = 0; index < cells.length; index += 1) {
    const colorId = cells[index];

    if (!colorId) {
      continue;
    }

    if (onlyCellIndexes && !onlyCellIndexes.has(index)) {
      continue;
    }

    if (onlyColorId && colorId !== onlyColorId) {
      continue;
    }

    const symbol = symbolAssignments[colorId];
    const color = colorsById[colorId];

    if (!symbol || !color) {
      continue;
    }

    const x = index % gridWidth;
    const y = Math.floor(index / gridWidth);
    const centerX = drawX + (x + 0.5) * renderedCellSize;
    const centerY = drawY + (y + 0.5) * renderedCellSize;

    context.fillStyle = getSymbolColor(color.hex);
    context.fillText(symbol, centerX, centerY);
  }
}

export function drawThreadOverlay(
  context: CanvasRenderingContext2D,
  options: {
    cells: GridCellValue[];
    colorsById: Record<string, PaletteColor>;
    drawX: number;
    drawY: number;
    gridWidth: number;
    renderedCellSize: number;
    stitchCanvasCache: Map<string, HTMLCanvasElement>;
  },
) {
  const {
    cells,
    colorsById,
    drawX,
    drawY,
    gridWidth,
    renderedCellSize,
    stitchCanvasCache,
  } = options;

  const oversampleFactor =
    renderedCellSize >= 18 ? 1 : renderedCellSize >= 12 ? 1.5 : 2;
  const stitchSize = Math.max(1, Math.round(renderedCellSize * oversampleFactor));
  const previousImageSmoothingEnabled = context.imageSmoothingEnabled;
  const previousImageSmoothingQuality = context.imageSmoothingQuality;

  context.imageSmoothingEnabled = oversampleFactor > 1;
  if (oversampleFactor > 1) {
    context.imageSmoothingQuality = "high";
  }

  for (let index = 0; index < cells.length; index += 1) {
    const colorId = cells[index];

    if (!colorId) {
      continue;
    }

    const color = colorsById[colorId];

    if (!color) {
      continue;
    }

    const x = index % gridWidth;
    const y = Math.floor(index / gridWidth);
    const stitchCanvas = getThreadStitchCanvas(
      color.hex,
      stitchSize,
      stitchCanvasCache,
      1,
    );

    context.drawImage(
      stitchCanvas,
      drawX + x * renderedCellSize,
      drawY + y * renderedCellSize,
      renderedCellSize,
      renderedCellSize,
    );
  }

  context.imageSmoothingEnabled = previousImageSmoothingEnabled;
  context.imageSmoothingQuality = previousImageSmoothingQuality;
}

function getSymbolColor(hex: string): string {
  const normalizedHex = hex.replace("#", "");
  const expandedHex =
    normalizedHex.length === 3
      ? normalizedHex
          .split("")
          .map((character) => character + character)
          .join("")
      : normalizedHex;

  if (expandedHex.length !== 6) {
    return "#111827";
  }

  const red = Number.parseInt(expandedHex.slice(0, 2), 16);
  const green = Number.parseInt(expandedHex.slice(2, 4), 16);
  const blue = Number.parseInt(expandedHex.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.68 ? "#111827" : "#f8fafc";
}
