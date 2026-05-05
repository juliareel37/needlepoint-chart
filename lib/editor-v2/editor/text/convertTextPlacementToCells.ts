import type { GridPoint, PaletteColor, TextPlacementSession } from "../store/state";
import type { GridWorldMetrics } from "../viewport";
import { hexToRgb } from "../color-utils";
import {
  getContainedRect,
  getLocalPointWithinRotatedBounds,
  getPositionedBounds,
  getRotatedBounds,
} from "../positioning";
import { renderTextPlacementPreview } from "./renderTextPlacementPreview";

export interface TextPlacementPaintGroup {
  colorId: string;
  cells: GridPoint[];
}

export function convertTextPlacementToCells(
  placement: TextPlacementSession,
  metrics: GridWorldMetrics,
): GridPoint[] {
  const groups = getPlacementPaintGroupsFromCanvas(
    placement,
    metrics,
    null,
    {},
    false,
  );

  return groups.flatMap((group) => group.cells);
}

export async function convertTextPlacementToPaintGroups(
  placement: TextPlacementSession,
  metrics: GridWorldMetrics,
  fallbackColorId: string | null,
  paletteById: Record<string, PaletteColor>,
  previewColor: string,
): Promise<TextPlacementPaintGroup[]> {
  const previewSrc = renderTextPlacementPreviewForConversion(placement, metrics, previewColor);
  if (!previewSrc) {
    return [];
  }

  const image = await loadImage(previewSrc);
  const groups = getPlacementPaintGroupsFromCanvas(
    placement,
    metrics,
    fallbackColorId,
    paletteById,
    true,
    image,
  );

  return groups;
}

function getPlacementPaintGroupsFromCanvas(
  placement: TextPlacementSession,
  metrics: GridWorldMetrics,
  fallbackColorId: string | null,
  paletteById: Record<string, PaletteColor>,
  mapSampledColors: boolean,
  sourceImage?: HTMLImageElement,
): TextPlacementPaintGroup[] {
  const baseRect = getContainedRect(
    placement.intrinsicWidth,
    placement.intrinsicHeight,
    metrics.surfaceWidth,
    metrics.surfaceHeight,
  );
  const baseFontScale = baseRect.width / Math.max(placement.intrinsicWidth, 1);
  const bounds = getPositionedBounds(baseRect, {
    offsetX: placement.offsetX,
    offsetY: placement.offsetY,
    scale: placement.scale,
    rotation: placement.rotation,
  });
  const rotatedBounds = getRotatedBounds(bounds, placement.rotation);
  const canvasWidth = Math.max(1, Math.ceil(bounds.width));
  const canvasHeight = Math.max(1, Math.ceil(bounds.height));
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return [];
  }

  const effectiveFontSize = placement.baseFontSize * baseFontScale * placement.scale;
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  if (sourceImage) {
    context.drawImage(sourceImage, 0, 0, canvasWidth, canvasHeight);
  } else {
    context.fillStyle = "#000000";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `${placement.fontWeight} ${placement.fontStyle} ${effectiveFontSize}px ${placement.fontFamily}, sans-serif`;

    const lines = placement.text.split("\n");
    const lineHeight = effectiveFontSize * 1.1;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const firstLineY = centerY - (lines.length - 1) * lineHeight / 2;

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? "";
      const y = firstLineY + index * lineHeight;
      context.fillText(line, centerX, y);

      if (placement.underline) {
        const textMetrics = context.measureText(line);
        const underlineWidth = Math.max(0, textMetrics.width);
        const underlineLeft = centerX - underlineWidth / 2;
        const underlineY = y + effectiveFontSize * 0.42;
        context.beginPath();
        context.moveTo(underlineLeft, underlineY);
        context.lineTo(underlineLeft + underlineWidth, underlineY);
        context.lineWidth = Math.max(1, effectiveFontSize * 0.06);
        context.strokeStyle = "#000000";
        context.stroke();
      }
    }
  }

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
      const colorId = mapSampledColors
        ? resolvePlacementColorId(
            {
              r: pixel[0] ?? 0,
              g: pixel[1] ?? 0,
              b: pixel[2] ?? 0,
            },
            fallbackColorId,
            paletteById,
          )
        : fallbackColorId ?? "__mask__";

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

function renderTextPlacementPreviewForConversion(
  placement: TextPlacementSession,
  metrics: GridWorldMetrics,
  previewColor: string,
): string {
  const baseRect = getContainedRect(
    placement.intrinsicWidth,
    placement.intrinsicHeight,
    metrics.surfaceWidth,
    metrics.surfaceHeight,
  );
  const bounds = getPositionedBounds(baseRect, {
    offsetX: placement.offsetX,
    offsetY: placement.offsetY,
    scale: placement.scale,
    rotation: placement.rotation,
  });
  const baseFontScale = baseRect.width / Math.max(placement.intrinsicWidth, 1);

  return renderTextPlacementPreview({
    text: placement.text,
    width: bounds.width,
    height: bounds.height,
    fontSize: placement.baseFontSize * baseFontScale * placement.scale,
    fontFamily: placement.fontFamily,
    fontWeight: placement.fontWeight,
    fontStyle: placement.fontStyle,
    underline: placement.underline,
    color: previewColor,
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load text preview: ${src}`));
    image.src = src;
  });
}

function resolvePlacementColorId(
  pixel: { r: number; g: number; b: number },
  fallbackColorId: string | null,
  paletteById: Record<string, PaletteColor>,
): string | null {
  const palette = Object.values(paletteById);
  if (palette.length === 0) {
    return fallbackColorId;
  }

  let bestColorId = fallbackColorId ?? palette[0]?.id ?? null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const color of palette) {
    const rgb = hexToRgb(color.hex);
    if (!rgb) {
      continue;
    }

    const dr = rgb.r - pixel.r;
    const dg = rgb.g - pixel.g;
    const db = rgb.b - pixel.b;
    const distance = dr * dr + dg * dg + db * db;

    if (distance < bestDistance) {
      bestDistance = distance;
      bestColorId = color.id;
    }
  }

  return bestColorId;
}
