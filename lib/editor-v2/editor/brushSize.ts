const MAX_DYNAMIC_BRUSH_SIZE = 200;
const BRUSH_GRID_DIVISOR = 5;

export function getGridBrushSizeMax(gridWidth: number, gridHeight: number): number {
  const shortestSide = Math.min(gridWidth, gridHeight);

  if (!Number.isFinite(shortestSide) || shortestSide <= 0) {
    return 1;
  }

  return Math.min(
    Math.max(Math.ceil(shortestSide / BRUSH_GRID_DIVISOR), 1),
    MAX_DYNAMIC_BRUSH_SIZE,
  );
}

export function clampGridBrushSize(
  brushSize: number,
  gridWidth: number,
  gridHeight: number,
): number {
  const maxBrushSize = getGridBrushSizeMax(gridWidth, gridHeight);

  if (!Number.isFinite(brushSize)) {
    return 1;
  }

  return Math.min(Math.max(Math.round(brushSize), 1), maxBrushSize);
}
