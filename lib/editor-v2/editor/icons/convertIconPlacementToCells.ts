import type { GridPoint, IconPlacementSession } from "../store/state";
import type { GridWorldMetrics } from "../viewport";
import { findNearestIconColorSlot } from "./iconColorSlots";
import { getContainedRect } from "../positioning";
import { getIconPlacementBounds } from "./iconPlacementGeometry";

export interface IconPlacementPaintGroup {
  colorId: string;
  cells: GridPoint[];
}

export async function convertIconPlacementToPaintGroups(
  placement: IconPlacementSession,
  metrics: GridWorldMetrics,
  fallbackColorId: string | null,
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
  });
  const canvasWidth = Math.max(1, Math.ceil(bounds.width));
  const canvasHeight = Math.max(1, Math.ceil(bounds.height));
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    return [];
  }

  const image = await loadImage(placement.src);
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.drawImage(image, 0, 0, canvasWidth, canvasHeight);

  const pitch = metrics.cellSize + metrics.cellGap;
  const minCellX = Math.max(0, Math.floor(bounds.left / pitch));
  const minCellY = Math.max(0, Math.floor(bounds.top / pitch));
  const maxCellX = Math.min(
    metrics.width - 1,
    Math.ceil((bounds.left + bounds.width) / pitch),
  );
  const maxCellY = Math.min(
    metrics.height - 1,
    Math.ceil((bounds.top + bounds.height) / pitch),
  );

  const groups = new Map<string, GridPoint[]>();
  const seen = new Set<string>();

  for (let y = minCellY; y <= maxCellY; y += 1) {
    for (let x = minCellX; x <= maxCellX; x += 1) {
      const centerWorldX = x * pitch + metrics.cellSize / 2;
      const centerWorldY = y * pitch + metrics.cellSize / 2;

      if (
        centerWorldX < bounds.left ||
        centerWorldY < bounds.top ||
        centerWorldX > bounds.left + bounds.width ||
        centerWorldY > bounds.top + bounds.height
      ) {
        continue;
      }

      const sampleX = Math.floor(centerWorldX - bounds.left);
      const sampleY = Math.floor(centerWorldY - bounds.top);

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
): string | null {
  if (placement.colorSlots.length === 0) {
    return fallbackColorId;
  }

  const slot = findNearestIconColorSlot(placement.colorSlots, pixel);
  return slot?.paletteColorId ?? fallbackColorId;
}
