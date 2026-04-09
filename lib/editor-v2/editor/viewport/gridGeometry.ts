import type { GridPoint, TraceDocument, ViewportState } from "../store/state";

export interface GridWorldMetrics {
  width: number;
  height: number;
  cellSize: number;
  cellGap: number;
  surfaceWidth: number;
  surfaceHeight: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface ScreenRect {
  left: number;
  top: number;
}

export interface WorldPoint {
  x: number;
  y: number;
}

export function createGridWorldMetrics(
  width: number,
  height: number,
  cellSize: number,
  cellGap: number,
): GridWorldMetrics {
  return {
    width,
    height,
    cellSize,
    cellGap,
    surfaceWidth: width * cellSize + Math.max(0, width - 1) * cellGap,
    surfaceHeight: height * cellSize + Math.max(0, height - 1) * cellGap,
  };
}

export function getViewportTransform(viewport: ViewportState): string {
  return `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.zoom})`;
}

export function getTraceTransform(trace: TraceDocument): string {
  return `translate(${trace.offsetX}px, ${trace.offsetY}px) scale(${trace.scale})`;
}

export function getGridCellKey(point: GridPoint): string {
  return `${point.x}:${point.y}`;
}

export function worldToScreenPoint(
  point: WorldPoint,
  viewport: ViewportState,
): ScreenPoint {
  return {
    x: viewport.offsetX + point.x * viewport.zoom,
    y: viewport.offsetY + point.y * viewport.zoom,
  };
}

export function screenToWorldPoint(
  point: ScreenPoint,
  viewport: ViewportState,
): WorldPoint {
  return {
    x: (point.x - viewport.offsetX) / viewport.zoom,
    y: (point.y - viewport.offsetY) / viewport.zoom,
  };
}

export function clientToWorldPoint(
  clientPoint: ScreenPoint,
  worldRect: ScreenRect,
  viewport: ViewportState,
): WorldPoint {
  return {
    x: (clientPoint.x - worldRect.left) / viewport.zoom,
    y: (clientPoint.y - worldRect.top) / viewport.zoom,
  };
}

export function getGridCellFromWorldPoint(
  point: WorldPoint,
  metrics: GridWorldMetrics,
): GridPoint | null {
  const pitch = metrics.cellSize + metrics.cellGap;

  if (point.x < 0 || point.y < 0) {
    return null;
  }

  const cellX = Math.floor(point.x / pitch);
  const cellY = Math.floor(point.y / pitch);

  if (cellX < 0 || cellY < 0 || cellX >= metrics.width || cellY >= metrics.height) {
    return null;
  }

  return { x: cellX, y: cellY };
}
