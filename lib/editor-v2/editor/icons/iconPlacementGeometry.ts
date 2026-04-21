import type {
  PositioningDragMode,
  PositioningHandleId,
  PositioningPinchState,
  PositioningRect,
} from "../positioning";
import type { WorldPoint } from "../viewport";

export interface IconPlacementTransform {
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
  lockAspectRatio?: boolean;
}

export interface IconPlacementDragState {
  mode: PositioningDragMode;
  startPoint: WorldPoint;
  startTransform: IconPlacementTransform;
  startBounds: PositioningRect;
  transactionKey: string;
}

const MIN_SCALE = 0.1;

export function getIconPlacementBounds(
  baseRect: PositioningRect,
  transform: IconPlacementTransform,
): PositioningRect {
  return {
    left: baseRect.left + transform.offsetX,
    top: baseRect.top + transform.offsetY,
    width: baseRect.width * transform.scaleX,
    height: baseRect.height * transform.scaleY,
  };
}

export function getIconPlacementTransformCss(
  transform: IconPlacementTransform,
): string {
  return `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scaleX}, ${transform.scaleY})`;
}

export function getIconPlacementTransformFromDrag(
  dragState: IconPlacementDragState,
  point: WorldPoint,
  baseRect: PositioningRect,
): IconPlacementTransform {
  if (dragState.mode === "move") {
    return {
      offsetX: dragState.startTransform.offsetX + (point.x - dragState.startPoint.x),
      offsetY: dragState.startTransform.offsetY + (point.y - dragState.startPoint.y),
      scaleX: dragState.startTransform.scaleX,
      scaleY: dragState.startTransform.scaleY,
    };
  }

  const nextBounds = getIconPlacementBoundsFromHandleDrag(
    dragState.startBounds,
    dragState.mode,
    point,
    baseRect,
    dragState.startTransform.lockAspectRatio ?? false,
  );

  return {
    offsetX: nextBounds.left - baseRect.left,
    offsetY: nextBounds.top - baseRect.top,
    scaleX: clampScale(nextBounds.width / Math.max(baseRect.width, 0.0001)),
    scaleY: clampScale(nextBounds.height / Math.max(baseRect.height, 0.0001)),
  };
}

export function getIconPlacementTransformFromPinch(
  pinchState: PositioningPinchState,
  nextCenter: WorldPoint,
  nextDistance: number,
  baseRect: PositioningRect,
  startTransform: IconPlacementTransform,
): IconPlacementTransform {
  const distanceRatio = nextDistance / Math.max(pinchState.startDistance, 0.0001);
  const nextScaleX = clampScale(startTransform.scaleX * distanceRatio);
  const nextScaleY = clampScale(startTransform.scaleY * distanceRatio);
  const nextWidth = baseRect.width * nextScaleX;
  const nextHeight = baseRect.height * nextScaleY;
  const nextLeft = nextCenter.x - pinchState.anchorX * nextWidth;
  const nextTop = nextCenter.y - pinchState.anchorY * nextHeight;

  return {
    offsetX: nextLeft - baseRect.left,
    offsetY: nextTop - baseRect.top,
    scaleX: nextScaleX,
    scaleY: nextScaleY,
    lockAspectRatio: startTransform.lockAspectRatio,
  };
}

function getIconPlacementBoundsFromHandleDrag(
  startBounds: PositioningRect,
  handle: PositioningHandleId,
  point: WorldPoint,
  baseRect: PositioningRect,
  lockAspectRatio: boolean,
): PositioningRect {
  const minWidth = Math.max(baseRect.width * MIN_SCALE, 1);
  const minHeight = Math.max(baseRect.height * MIN_SCALE, 1);
  const startLeft = startBounds.left;
  const startRight = startBounds.left + startBounds.width;
  const startTop = startBounds.top;
  const startBottom = startBounds.top + startBounds.height;
  const preserveAspectRatio =
    lockAspectRatio ||
    handle === "nw" || handle === "ne" || handle === "se" || handle === "sw";

  if (preserveAspectRatio) {
    return getAspectRatioPreservingBounds(
      startBounds,
      handle,
      point,
      minWidth,
      minHeight,
    );
  }

  let left = startLeft;
  let right = startRight;
  let top = startTop;
  let bottom = startBottom;

  if (handle.includes("w")) {
    left = Math.min(point.x, startRight - minWidth);
  }
  if (handle.includes("e")) {
    right = Math.max(point.x, startLeft + minWidth);
  }
  if (handle.includes("n")) {
    top = Math.min(point.y, startBottom - minHeight);
  }
  if (handle.includes("s")) {
    bottom = Math.max(point.y, startTop + minHeight);
  }

  return {
    left,
    top,
    width: Math.max(minWidth, right - left),
    height: Math.max(minHeight, bottom - top),
  };
}

function getAspectRatioPreservingBounds(
  startBounds: PositioningRect,
  handle: PositioningHandleId,
  point: WorldPoint,
  minWidth: number,
  minHeight: number,
): PositioningRect {
  const startLeft = startBounds.left;
  const startRight = startBounds.left + startBounds.width;
  const startTop = startBounds.top;
  const startBottom = startBounds.top + startBounds.height;

  const nextScale = clampScale(
    Math.max(
      getHorizontalScale(handle, point.x, startLeft, startRight, startBounds.width),
      getVerticalScale(handle, point.y, startTop, startBottom, startBounds.height),
    ),
  );

  const width = Math.max(minWidth, startBounds.width * nextScale);
  const height = Math.max(minHeight, startBounds.height * nextScale);

  switch (handle) {
    case "se":
      return {
        left: startLeft,
        top: startTop,
        width,
        height,
      };
    case "sw":
      return {
        left: startRight - width,
        top: startTop,
        width,
        height,
      };
    case "ne":
      return {
        left: startLeft,
        top: startBottom - height,
        width,
        height,
      };
    case "nw":
    default:
      return {
        left: startRight - width,
        top: startBottom - height,
        width,
        height,
      };
  }
}

function getHorizontalScale(
  handle: PositioningHandleId,
  pointX: number,
  startLeft: number,
  startRight: number,
  startWidth: number,
): number {
  if (handle === "ne" || handle === "se") {
    return (pointX - startLeft) / Math.max(startWidth, 0.0001);
  }

  return (startRight - pointX) / Math.max(startWidth, 0.0001);
}

function getVerticalScale(
  handle: PositioningHandleId,
  pointY: number,
  startTop: number,
  startBottom: number,
  startHeight: number,
): number {
  if (handle === "sw" || handle === "se") {
    return (pointY - startTop) / Math.max(startHeight, 0.0001);
  }

  return (startBottom - pointY) / Math.max(startHeight, 0.0001);
}

function clampScale(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(MIN_SCALE, value);
}
