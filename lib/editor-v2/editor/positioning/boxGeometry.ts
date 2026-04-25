import type { WorldPoint } from "../viewport";

export type PositioningHandleId =
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "nw";

export type PositioningDragMode = PositioningHandleId | "move" | "rotate";

export interface PositioningRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface PositioningTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;
}

export interface PositioningDragState {
  mode: PositioningDragMode;
  startPoint: WorldPoint;
  startTransform: PositioningTransform;
  startBounds: PositioningRect;
  transactionKey: string;
}

export interface PositioningPinchState {
  anchorX: number;
  anchorY: number;
  startDistance: number;
  startAngle: number;
  startTransform: PositioningTransform;
  snapRotation: number | null;
}

export const ROTATION_SNAP_DEGREES = 3;
export const ROTATION_UNSNAP_DEGREES = 5;

export const POSITIONING_HANDLES: Array<{
  id: PositioningHandleId;
  kind: "corner" | "edge";
  cursor: string;
}> = [
  { id: "nw", kind: "corner", cursor: "nwse-resize" },
  { id: "n", kind: "edge", cursor: "ns-resize" },
  { id: "ne", kind: "corner", cursor: "nesw-resize" },
  { id: "e", kind: "edge", cursor: "ew-resize" },
  { id: "se", kind: "corner", cursor: "nwse-resize" },
  { id: "s", kind: "edge", cursor: "ns-resize" },
  { id: "sw", kind: "corner", cursor: "nesw-resize" },
  { id: "w", kind: "edge", cursor: "ew-resize" },
];

export function getContainedRect(
  sourceWidth: number,
  sourceHeight: number,
  frameWidth: number,
  frameHeight: number,
): PositioningRect {
  if (sourceWidth <= 0 || sourceHeight <= 0 || frameWidth <= 0 || frameHeight <= 0) {
    return {
      left: 0,
      top: 0,
      width: Math.max(frameWidth, 0),
      height: Math.max(frameHeight, 0),
    };
  }

  const scale = Math.min(frameWidth / sourceWidth, frameHeight / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;

  return {
    left: (frameWidth - width) / 2,
    top: (frameHeight - height) / 2,
    width,
    height,
  };
}

export function getPositionedBounds(
  baseRect: PositioningRect,
  transform: PositioningTransform,
): PositioningRect {
  return {
    left: baseRect.left + transform.offsetX,
    top: baseRect.top + transform.offsetY,
    width: baseRect.width * transform.scale,
    height: baseRect.height * transform.scale,
  };
}

export function getPositioningTransformCss(transform: PositioningTransform): string {
  return `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scale})`;
}

export function getRotationCss(rotation: number): string {
  return `rotate(${normalizeRotationDegrees(rotation)}deg)`;
}

export function getHandleLeft(
  handle: PositioningHandleId,
  width: number,
  size: number,
): number {
  if (handle === "nw" || handle === "w" || handle === "sw") {
    return -size / 2;
  }

  if (handle === "n" || handle === "s") {
    return width / 2 - size / 2;
  }

  return width - size / 2;
}

export function getHandleTop(
  handle: PositioningHandleId,
  height: number,
  size: number,
): number {
  if (handle === "nw" || handle === "n" || handle === "ne") {
    return -size / 2;
  }

  if (handle === "e" || handle === "w") {
    return height / 2 - size / 2;
  }

  return height - size / 2;
}

export function getTransformFromDrag(
  dragState: PositioningDragState,
  point: WorldPoint,
  baseRect: PositioningRect,
): PositioningTransform {
  if (dragState.mode === "rotate") {
    const centerX = dragState.startBounds.left + dragState.startBounds.width / 2;
    const centerY = dragState.startBounds.top + dragState.startBounds.height / 2;
    const startAngle = Math.atan2(
      dragState.startPoint.y - centerY,
      dragState.startPoint.x - centerX,
    );
    const nextAngle = Math.atan2(point.y - centerY, point.x - centerX);

    return {
      offsetX: dragState.startTransform.offsetX,
      offsetY: dragState.startTransform.offsetY,
      scale: dragState.startTransform.scale,
      rotation: normalizeRotationDegrees(
        dragState.startTransform.rotation +
          ((nextAngle - startAngle) * 180) / Math.PI,
      ),
    };
  }

  if (dragState.mode === "move") {
    return {
      offsetX: dragState.startTransform.offsetX + (point.x - dragState.startPoint.x),
      offsetY: dragState.startTransform.offsetY + (point.y - dragState.startPoint.y),
      scale: dragState.startTransform.scale,
      rotation: dragState.startTransform.rotation,
    };
  }

  const nextBounds = getBoundsFromHandleDrag(
    dragState.startBounds,
    dragState.mode,
    point,
  );
  const nextScale = clampPositioningScale(nextBounds.width / baseRect.width);

  return {
    offsetX: nextBounds.left - baseRect.left,
    offsetY: nextBounds.top - baseRect.top,
    scale: nextScale,
    rotation: dragState.startTransform.rotation,
  };
}

export function getTransformFromPinch(
  pinchState: PositioningPinchState,
  nextCenter: WorldPoint,
  nextDistance: number,
  nextAngle: number,
  baseRect: PositioningRect,
): PositioningTransform {
  const distanceRatio = nextDistance / Math.max(pinchState.startDistance, 0.0001);
  const nextScale = clampPositioningScale(
    pinchState.startTransform.scale * distanceRatio,
  );
  const nextWidth = baseRect.width * nextScale;
  const nextHeight = baseRect.height * nextScale;
  const nextLeft = nextCenter.x - pinchState.anchorX * nextWidth;
  const nextTop = nextCenter.y - pinchState.anchorY * nextHeight;

  return {
    offsetX: nextLeft - baseRect.left,
    offsetY: nextTop - baseRect.top,
    scale: nextScale,
    rotation: getSnappedRotationDegrees(
      pinchState.startTransform.rotation +
        ((nextAngle - pinchState.startAngle) * 180) / Math.PI,
      pinchState.snapRotation,
    ),
  };
}

export function getRotatedBounds(
  bounds: PositioningRect,
  rotation: number,
): PositioningRect {
  if (Math.abs(normalizeRotationDegrees(rotation)) < 0.0001) {
    return bounds;
  }

  const radians = (rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;
  const halfWidth = bounds.width / 2;
  const halfHeight = bounds.height / 2;
  const corners = [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight },
  ].map((corner) => ({
    x: centerX + corner.x * cos - corner.y * sin,
    y: centerY + corner.x * sin + corner.y * cos,
  }));
  const xs = corners.map((corner) => corner.x);
  const ys = corners.map((corner) => corner.y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const right = Math.max(...xs);
  const bottom = Math.max(...ys);

  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
}

export function getLocalPointWithinRotatedBounds(
  point: WorldPoint,
  bounds: PositioningRect,
  rotation: number,
): WorldPoint {
  if (Math.abs(normalizeRotationDegrees(rotation)) < 0.0001) {
    return {
      x: point.x - bounds.left,
      y: point.y - bounds.top,
    };
  }

  const radians = (-rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;
  const dx = point.x - centerX;
  const dy = point.y - centerY;

  return {
    x: dx * cos - dy * sin + bounds.width / 2,
    y: dx * sin + dy * cos + bounds.height / 2,
  };
}

export function getBoundsFromHandleDrag(
  startBounds: PositioningRect,
  handle: PositioningHandleId,
  point: WorldPoint,
): PositioningRect {
  const minScale = 0.1;
  const minWidth = startBounds.width * minScale;
  const minHeight = startBounds.height * minScale;
  const left = startBounds.left;
  const right = startBounds.left + startBounds.width;
  const top = startBounds.top;
  const bottom = startBounds.top + startBounds.height;
  const centerX = left + startBounds.width / 2;
  const centerY = top + startBounds.height / 2;

  switch (handle) {
    case "e": {
      const scale = clampPositioningScale((point.x - left) / startBounds.width);
      const width = startBounds.width * scale;
      const height = startBounds.height * scale;
      return { left, top: centerY - height / 2, width, height };
    }
    case "w": {
      const scale = clampPositioningScale((right - point.x) / startBounds.width);
      const width = startBounds.width * scale;
      const height = startBounds.height * scale;
      return { left: right - width, top: centerY - height / 2, width, height };
    }
    case "s": {
      const scale = clampPositioningScale((point.y - top) / startBounds.height);
      const width = startBounds.width * scale;
      const height = startBounds.height * scale;
      return { left: centerX - width / 2, top, width, height };
    }
    case "n": {
      const scale = clampPositioningScale((bottom - point.y) / startBounds.height);
      const width = startBounds.width * scale;
      const height = startBounds.height * scale;
      return { left: centerX - width / 2, top: bottom - height, width, height };
    }
    case "se": {
      const scale = clampPositioningScale(
        Math.max(
          (point.x - left) / startBounds.width,
          (point.y - top) / startBounds.height,
        ),
      );
      return {
        left,
        top,
        width: Math.max(minWidth, startBounds.width * scale),
        height: Math.max(minHeight, startBounds.height * scale),
      };
    }
    case "sw": {
      const scale = clampPositioningScale(
        Math.max(
          (right - point.x) / startBounds.width,
          (point.y - top) / startBounds.height,
        ),
      );
      const width = startBounds.width * scale;
      const height = startBounds.height * scale;
      return { left: right - width, top, width, height };
    }
    case "ne": {
      const scale = clampPositioningScale(
        Math.max(
          (point.x - left) / startBounds.width,
          (bottom - point.y) / startBounds.height,
        ),
      );
      const width = startBounds.width * scale;
      const height = startBounds.height * scale;
      return { left, top: bottom - height, width, height };
    }
    case "nw":
    default: {
      const scale = clampPositioningScale(
        Math.max(
          (right - point.x) / startBounds.width,
          (bottom - point.y) / startBounds.height,
        ),
      );
      const width = startBounds.width * scale;
      const height = startBounds.height * scale;
      return { left: right - width, top: bottom - height, width, height };
    }
  }
}

export function clampPositioningScale(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(4, Math.max(0.1, Number(value.toFixed(4))));
}

export function normalizeRotationDegrees(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const normalized = ((((value + 180) % 360) + 360) % 360) - 180;
  return Number(normalized.toFixed(4));
}

export function getRotationSnapTarget(
  rotation: number,
  currentSnapRotation: number | null,
): number | null {
  const normalizedRotation = normalizeRotationDegrees(rotation);

  if (
    currentSnapRotation !== null &&
    getRotationDeltaDegrees(normalizedRotation, currentSnapRotation) <=
      ROTATION_UNSNAP_DEGREES
  ) {
    return currentSnapRotation;
  }

  const nearestQuarterTurn = normalizeRotationDegrees(
    Math.round(normalizedRotation / 90) * 90,
  );
  return getRotationDeltaDegrees(normalizedRotation, nearestQuarterTurn) <=
    ROTATION_SNAP_DEGREES
    ? nearestQuarterTurn
    : null;
}

export function getSnappedRotationDegrees(
  rotation: number,
  snapRotation: number | null,
): number {
  return snapRotation ?? normalizeRotationDegrees(rotation);
}

function getRotationDeltaDegrees(a: number, b: number): number {
  return Math.abs(normalizeRotationDegrees(a - b));
}
