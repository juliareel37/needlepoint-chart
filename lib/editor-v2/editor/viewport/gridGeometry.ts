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

export interface StageSize {
  width: number;
  height: number;
}

export interface ViewportOffsetBounds {
  minOffsetX: number;
  maxOffsetX: number;
  minOffsetY: number;
  maxOffsetY: number;
}

const MIN_VISIBLE_CANVAS_PX = 24;

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

export function clampWorldPointToSurface(
  point: WorldPoint,
  metrics: Pick<GridWorldMetrics, "surfaceWidth" | "surfaceHeight">,
): WorldPoint {
  const maxX = Math.max(metrics.surfaceWidth, 0);
  const maxY = Math.max(metrics.surfaceHeight, 0);

  return {
    x: Math.min(Math.max(point.x, 0), maxX),
    y: Math.min(Math.max(point.y, 0), maxY),
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

export function getViewportOffsetBounds(
  stageSize: StageSize,
  metrics: GridWorldMetrics,
  zoom: number,
): ViewportOffsetBounds {
  const frameOriginX = (stageSize.width - metrics.surfaceWidth) / 2;
  const frameOriginY = (stageSize.height - metrics.surfaceHeight) / 2;
  const renderedWidth = metrics.surfaceWidth * zoom;
  const renderedHeight = metrics.surfaceHeight * zoom;
  const minOffsetX = MIN_VISIBLE_CANVAS_PX - frameOriginX - renderedWidth;
  const maxOffsetX = stageSize.width - MIN_VISIBLE_CANVAS_PX - frameOriginX;
  const minOffsetY = MIN_VISIBLE_CANVAS_PX - frameOriginY - renderedHeight;
  const maxOffsetY = stageSize.height - MIN_VISIBLE_CANVAS_PX - frameOriginY;

  return {
    minOffsetX,
    maxOffsetX,
    minOffsetY,
    maxOffsetY,
  };
}

export function clampViewportOffsets(
  viewport: ViewportState,
  stageSize: StageSize,
  metrics: GridWorldMetrics,
): ViewportState {
  const bounds = getViewportOffsetBounds(stageSize, metrics, viewport.zoom);

  return {
    ...viewport,
    offsetX: clamp(viewport.offsetX, bounds.minOffsetX, bounds.maxOffsetX),
    offsetY: clamp(viewport.offsetY, bounds.minOffsetY, bounds.maxOffsetY),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
