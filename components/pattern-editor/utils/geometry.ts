export type Point = { x: number; y: number };
export type FilterRect = { x0: number; y0: number; x1: number; y1: number };
export type MirrorDirection = "top" | "right" | "bottom" | "left";

export function clampFilterRect(rect: FilterRect, width: number, height: number): FilterRect {
  const x0 = Math.max(0, Math.min(width - 1, rect.x0));
  const y0 = Math.max(0, Math.min(height - 1, rect.y0));
  const x1 = Math.max(0, Math.min(width - 1, rect.x1));
  const y1 = Math.max(0, Math.min(height - 1, rect.y1));
  return {
    x0: Math.min(x0, x1),
    y0: Math.min(y0, y1),
    x1: Math.max(x0, x1),
    y1: Math.max(y0, y1),
  };
}

export function pointInPolygon(point: Point, polygon: Point[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function getMirrorTargetRect(
  source: FilterRect,
  direction: MirrorDirection,
): FilterRect {
  const rectW = Math.max(1, source.x1 - source.x0 + 1);
  const rectH = Math.max(1, source.y1 - source.y0 + 1);
  let x0 = source.x0;
  let y0 = source.y0;
  let x1 = source.x1;
  let y1 = source.y1;

  if (direction === "top") {
    y1 = source.y0 - 1;
    y0 = y1 - rectH + 1;
  } else if (direction === "bottom") {
    y0 = source.y1 + 1;
    y1 = y0 + rectH - 1;
  } else if (direction === "left") {
    x1 = source.x0 - 1;
    x0 = x1 - rectW + 1;
  } else {
    x0 = source.x1 + 1;
    x1 = x0 + rectW - 1;
  }

  return { x0, y0, x1, y1 };
}
