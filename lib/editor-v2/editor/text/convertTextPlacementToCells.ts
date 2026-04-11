import type { GridPoint, TextPlacementSession } from "../store/state";
import type { GridWorldMetrics } from "../viewport";
import { getContainedRect, getPositionedBounds } from "../positioning";

export function convertTextPlacementToCells(
  placement: TextPlacementSession,
  metrics: GridWorldMetrics,
): GridPoint[] {
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

  const effectiveFontSize = placement.baseFontSize * baseFontScale * placement.scale;
  context.clearRect(0, 0, canvasWidth, canvasHeight);
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

  const cells: GridPoint[] = [];
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

      const alpha = context.getImageData(sampleX, sampleY, 1, 1).data[3] ?? 0;
      if (alpha <= 1) {
        continue;
      }

      const key = `${x}:${y}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      cells.push({ x, y });
    }
  }

  return cells;
}
