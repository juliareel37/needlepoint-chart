import type { GridPoint, GridRect, MirrorDirection } from "../store/state";

export interface MirrorTargetRect {
  direction: MirrorDirection;
  rect: GridRect;
}

export function buildMirrorRect(anchor: GridPoint, point: GridPoint): GridRect {
  const left = Math.min(anchor.x, point.x);
  const top = Math.min(anchor.y, point.y);
  const right = Math.max(anchor.x, point.x);
  const bottom = Math.max(anchor.y, point.y);

  return {
    x: left,
    y: top,
    width: right - left + 1,
    height: bottom - top + 1,
  };
}

export function getMirrorTargetRects(
  sourceRect: GridRect,
  gridWidth: number,
  gridHeight: number,
): MirrorTargetRect[] {
  return ([
    {
      direction: "left",
      rect: {
        x: sourceRect.x - sourceRect.width,
        y: sourceRect.y,
        width: sourceRect.width,
        height: sourceRect.height,
      },
    },
    {
      direction: "right",
      rect: {
        x: sourceRect.x + sourceRect.width,
        y: sourceRect.y,
        width: sourceRect.width,
        height: sourceRect.height,
      },
    },
    {
      direction: "top",
      rect: {
        x: sourceRect.x,
        y: sourceRect.y - sourceRect.height,
        width: sourceRect.width,
        height: sourceRect.height,
      },
    },
    {
      direction: "bottom",
      rect: {
        x: sourceRect.x,
        y: sourceRect.y + sourceRect.height,
        width: sourceRect.width,
        height: sourceRect.height,
      },
    },
  ] as MirrorTargetRect[])
    .map((target) => ({
      ...target,
      rect: clipGridRect(target.rect, gridWidth, gridHeight),
    }))
    .filter((target) => target.rect.width > 0 && target.rect.height > 0);
}

export function getMirrorDirectionAtPoint(
  point: GridPoint,
  sourceRect: GridRect,
  gridWidth: number,
  gridHeight: number,
): MirrorDirection | null {
  const target = getMirrorTargetRects(sourceRect, gridWidth, gridHeight).find(({ rect }) =>
    isPointInRect(point, rect),
  );

  return target?.direction ?? null;
}

function clipGridRect(rect: GridRect, gridWidth: number, gridHeight: number): GridRect {
  const left = Math.max(rect.x, 0);
  const top = Math.max(rect.y, 0);
  const right = Math.min(rect.x + rect.width, gridWidth);
  const bottom = Math.min(rect.y + rect.height, gridHeight);

  return {
    x: left,
    y: top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

function isPointInRect(point: GridPoint, rect: GridRect): boolean {
  return (
    point.x >= rect.x &&
    point.y >= rect.y &&
    point.x < rect.x + rect.width &&
    point.y < rect.y + rect.height
  );
}
