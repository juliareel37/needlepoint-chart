import type { GridPoint, IconPlacementSession, PaletteColor } from "../store/state";
import type { GridWorldMetrics } from "../viewport";
import { findClosestPaletteColorId, hexToRgb } from "../color-utils";
import {
  getContainedRect,
  getLocalPointWithinRotatedBounds,
  getRotatedBounds,
} from "../positioning";
import { getIconPlacementBounds } from "./iconPlacementGeometry";
import {
  buildPrimitiveIconDataUrl,
  resolvePrimitiveColorSlots,
} from "./primitiveIcon";
import { renderIconPlacementPreview } from "./renderIconPlacementPreview";

export interface IconPlacementPaintGroup {
  colorId: string;
  cells: GridPoint[];
}

export interface CellSampledPreviewCell {
  alpha: number;
  color: { r: number; g: number; b: number };
  x: number;
  y: number;
}

export async function renderCellSampledPlacementPreview(options: {
  bounds: { left: number; top: number; width: number; height: number };
  metrics: GridWorldMetrics;
  src: string;
}): Promise<string> {
  const canvasWidth = Math.max(1, Math.ceil(options.bounds.width));
  const canvasHeight = Math.max(1, Math.ceil(options.bounds.height));
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = canvasWidth;
  sourceCanvas.height = canvasHeight;
  const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
  if (!sourceContext) {
    return options.src;
  }

  const previewCanvas = document.createElement("canvas");
  previewCanvas.width = canvasWidth;
  previewCanvas.height = canvasHeight;
  const previewContext = previewCanvas.getContext("2d");
  if (!previewContext) {
    return options.src;
  }

  const image = await loadImage(options.src);
  sourceContext.clearRect(0, 0, canvasWidth, canvasHeight);
  sourceContext.drawImage(image, 0, 0, canvasWidth, canvasHeight);
  previewContext.clearRect(0, 0, canvasWidth, canvasHeight);

  const sampledCells = sampleCellSampledPlacementPreview({
    bounds: options.bounds,
    metrics: options.metrics,
    sourceContext,
  });

  for (const cell of sampledCells) {
    const cellLeft = cell.x * (options.metrics.cellSize + options.metrics.cellGap) - options.bounds.left;
    const cellTop = cell.y * (options.metrics.cellSize + options.metrics.cellGap) - options.bounds.top;
    const paintLeft = Math.max(0, cellLeft - Math.max(0, options.metrics.cellGap / 2));
    const paintTop = Math.max(0, cellTop - Math.max(0, options.metrics.cellGap / 2));
    const paintRight = Math.min(
      canvasWidth,
      cellLeft + options.metrics.cellSize + Math.max(0, options.metrics.cellGap / 2),
    );
    const paintBottom = Math.min(
      canvasHeight,
      cellTop + options.metrics.cellSize + Math.max(0, options.metrics.cellGap / 2),
    );
    previewContext.fillStyle = `rgba(${cell.color.r}, ${cell.color.g}, ${cell.color.b}, ${cell.alpha})`;
    previewContext.fillRect(
      paintLeft,
      paintTop,
      Math.max(1, paintRight - paintLeft),
      Math.max(1, paintBottom - paintTop),
    );
  }

  return previewCanvas.toDataURL();
}

export function sampleCellSampledPlacementPreview(options: {
  bounds: { left: number; top: number; width: number; height: number };
  metrics: GridWorldMetrics;
  sourceContext: CanvasRenderingContext2D;
}): CellSampledPreviewCell[] {
  const canvasWidth = options.sourceContext.canvas.width;
  const canvasHeight = options.sourceContext.canvas.height;
  const pitch = options.metrics.cellSize + options.metrics.cellGap;
  const minCellX = Math.max(0, Math.floor(options.bounds.left / pitch));
  const minCellY = Math.max(0, Math.floor(options.bounds.top / pitch));
  const maxCellX = Math.min(
    options.metrics.width - 1,
    Math.ceil((options.bounds.left + options.bounds.width) / pitch),
  );
  const maxCellY = Math.min(
    options.metrics.height - 1,
    Math.ceil((options.bounds.top + options.bounds.height) / pitch),
  );
  const sampledCells: CellSampledPreviewCell[] = [];

  for (let y = minCellY; y <= maxCellY; y += 1) {
    for (let x = minCellX; x <= maxCellX; x += 1) {
      const centerWorldX = x * pitch + options.metrics.cellSize / 2;
      const centerWorldY = y * pitch + options.metrics.cellSize / 2;

      if (
        centerWorldX < options.bounds.left ||
        centerWorldY < options.bounds.top ||
        centerWorldX > options.bounds.left + options.bounds.width ||
        centerWorldY > options.bounds.top + options.bounds.height
      ) {
        continue;
      }

      const normalizedX =
        (centerWorldX - options.bounds.left) / Math.max(options.bounds.width, 0.0001);
      const normalizedY =
        (centerWorldY - options.bounds.top) / Math.max(options.bounds.height, 0.0001);
      const sampleX = Math.min(
        canvasWidth - 1,
        Math.max(0, Math.floor(normalizedX * canvasWidth)),
      );
      const sampleY = Math.min(
        canvasHeight - 1,
        Math.max(0, Math.floor(normalizedY * canvasHeight)),
      );
      if (sampleX < 0 || sampleY < 0 || sampleX >= canvasWidth || sampleY >= canvasHeight) {
        continue;
      }

      const pixel = options.sourceContext.getImageData(sampleX, sampleY, 1, 1).data;
      const alpha = pixel[3] ?? 0;
      if (alpha <= 1) {
        continue;
      }

      sampledCells.push({
        alpha: alpha / 255,
        color: {
          r: pixel[0] ?? 0,
          g: pixel[1] ?? 0,
          b: pixel[2] ?? 0,
        },
        x,
        y,
      });
    }
  }

  return sampledCells;
}

export async function convertIconPlacementToPaintGroups(
  placement: IconPlacementSession,
  metrics: GridWorldMetrics,
  fallbackColorId: string | null,
  paletteById: Record<string, PaletteColor>,
): Promise<IconPlacementPaintGroup[]> {
  const baseRect = getContainedRect(
    placement.intrinsicWidth,
    placement.intrinsicHeight,
    metrics.surfaceWidth,
    metrics.surfaceHeight,
  );
  const bounds = getIconPlacementBounds(baseRect, {
    offsetX: placement.offsetX,
    offsetY: placement.offsetY,
    scaleX: placement.scaleX,
    scaleY: placement.scaleY,
    rotation: placement.rotation,
  });
  const rotatedBounds = getRotatedBounds(bounds, placement.rotation);
  const canvasWidth = Math.max(1, Math.ceil(bounds.width));
  const canvasHeight = Math.max(1, Math.ceil(bounds.height));
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    return [];
  }

  const renderSrc = placement.primitiveKind
    ? (() => {
        const primitiveColors = resolvePrimitiveColorSlots(
          placement.colorSlots,
          paletteById,
          null,
        );
        return buildPrimitiveIconDataUrl({
          kind: placement.primitiveKind,
          width: canvasWidth,
          height: canvasHeight,
          strokeColor: primitiveColors.primary,
          secondaryStrokeColor: primitiveColors.secondary,
          fillColor: primitiveColors.fill,
          strokeReferenceSize: placement.primitiveStrokeReferenceSize,
          strokeWidthScale:
            placement.primitiveKind === "linked-circle-frame"
              ? 1
              : placement.strokeWidthScale,
          patternScale: placement.primitivePatternScale,
          spacingScale: placement.primitiveSpacingScale,
        });
      })()
    : await renderIconPlacementPreview(
        placement.src,
        placement.intrinsicWidth,
        placement.intrinsicHeight,
        placement.colorSlots,
        paletteById,
        {
          strokeWidthScale: placement.strokeWidthScale,
          supportsStrokeWidth: placement.supportsStrokeWidth,
        },
      );
  const image = await loadImage(renderSrc);
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.drawImage(image, 0, 0, canvasWidth, canvasHeight);

  const pitch = metrics.cellSize + metrics.cellGap;
  const minCellX = Math.max(0, Math.floor(rotatedBounds.left / pitch));
  const minCellY = Math.max(0, Math.floor(rotatedBounds.top / pitch));
  const maxCellX = Math.min(
    metrics.width - 1,
    Math.ceil((rotatedBounds.left + rotatedBounds.width) / pitch),
  );
  const maxCellY = Math.min(
    metrics.height - 1,
    Math.ceil((rotatedBounds.top + rotatedBounds.height) / pitch),
  );

  const groups = new Map<string, GridPoint[]>();
  const seen = new Set<string>();

  for (let y = minCellY; y <= maxCellY; y += 1) {
    for (let x = minCellX; x <= maxCellX; x += 1) {
      const centerWorldX = x * pitch + metrics.cellSize / 2;
      const centerWorldY = y * pitch + metrics.cellSize / 2;
      const localPoint = getLocalPointWithinRotatedBounds(
        { x: centerWorldX, y: centerWorldY },
        bounds,
        placement.rotation,
      );
      const sampleX = Math.floor(localPoint.x);
      const sampleY = Math.floor(localPoint.y);

      if (sampleX < 0 || sampleY < 0 || sampleX >= canvasWidth || sampleY >= canvasHeight) {
        continue;
      }

      const pixel = context.getImageData(sampleX, sampleY, 1, 1).data;
      const alpha = pixel[3] ?? 0;
      if (alpha <= 1) {
        continue;
      }

      const key = `${x}:${y}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      const colorId = resolvePlacementColorId(
        placement,
        {
          r: pixel[0] ?? 0,
          g: pixel[1] ?? 0,
          b: pixel[2] ?? 0,
        },
        fallbackColorId,
        paletteById,
      );
      if (!colorId) {
        continue;
      }

      const group = groups.get(colorId);
      if (group) {
        group.push({ x, y });
      } else {
        groups.set(colorId, [{ x, y }]);
      }
    }
  }

  return Array.from(groups.entries()).map(([colorId, cells]) => ({
    colorId,
    cells,
  }));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load icon asset: ${src}`));
    image.src = src;
  });
}

function resolvePlacementColorId(
  placement: IconPlacementSession,
  pixel: { r: number; g: number; b: number },
  fallbackColorId: string | null,
  paletteById: Record<string, PaletteColor>,
): string | null {
  if (placement.colorSlots.length === 0) {
    return resolveRasterPlacementColorId(pixel, fallbackColorId, paletteById);
  }

  const slot = findNearestResolvedIconColorSlot(
    placement.colorSlots,
    pixel,
    paletteById,
  );
  return slot?.paletteColorId ?? fallbackColorId;
}

export function resolveRasterPlacementColorId(
  pixel: { r: number; g: number; b: number },
  fallbackColorId: string | null,
  paletteById: Record<string, PaletteColor>,
): string | null {
  const closestColorId = findClosestPaletteColorId(paletteById, pixel);
  return closestColorId ?? fallbackColorId;
}

function findNearestResolvedIconColorSlot(
  slots: IconPlacementSession["colorSlots"],
  pixel: { r: number; g: number; b: number },
  paletteById: Record<string, PaletteColor>,
) {
  let bestSlot = slots[0] ?? null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const slot of slots) {
    const resolvedHex = slot.paletteColorId
      ? paletteById[slot.paletteColorId]?.hex ?? slot.sourceHex
      : slot.sourceHex;
    const resolvedRgb = hexToRgb(resolvedHex);
    if (!resolvedRgb) {
      continue;
    }

    const dr = resolvedRgb.r - pixel.r;
    const dg = resolvedRgb.g - pixel.g;
    const db = resolvedRgb.b - pixel.b;
    const distance = dr * dr + dg * dg + db * db;

    if (distance < bestDistance) {
      bestDistance = distance;
      bestSlot = slot;
    }
  }

  return bestSlot;
}
