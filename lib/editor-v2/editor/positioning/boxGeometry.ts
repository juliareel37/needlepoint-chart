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

export interface PositioningMoveSnapState {
  left: number | null;
  right: number | null;
  top: number | null;
  bottom: number | null;
  centerX: number | null;
  centerY: number | null;
}

export interface PositioningMoveSnapResult {
  offsetX: number;
  offsetY: number;
  snap: PositioningMoveSnapState;
}

export interface PositioningResizeSnapResult {
  bounds: PositioningRect;
  snap: PositioningMoveSnapState;
}

export interface PositioningPinchSnapResult {
  bounds: PositioningRect;
  snap: PositioningMoveSnapState;
}

export const ROTATION_SNAP_DEGREES = 3;
export const ROTATION_UNSNAP_DEGREES = 5;
export const MOVE_CENTER_SNAP_PX = 8;
export const MOVE_CENTER_UNSNAP_PX = 12;

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

export function getCenterSnappedPosition(
  bounds: PositioningRect,
  containerBounds: PositioningRect,
  currentSnap: PositioningMoveSnapState,
  zoom: number,
): PositioningMoveSnapResult {
  const safeZoom = Math.max(zoom, 0.0001);
  const snapTolerance = MOVE_CENTER_SNAP_PX / safeZoom;
  const unsnapTolerance = MOVE_CENTER_UNSNAP_PX / safeZoom;
  const containerLeft = containerBounds.left;
  const containerTop = containerBounds.top;
  const containerRight = containerBounds.left + containerBounds.width;
  const containerBottom = containerBounds.top + containerBounds.height;
  const containerCenterX = containerBounds.left + containerBounds.width / 2;
  const containerCenterY = containerBounds.top + containerBounds.height / 2;
  const boundsLeft = bounds.left;
  const boundsTop = bounds.top;
  const boundsRight = bounds.left + bounds.width;
  const boundsBottom = bounds.top + bounds.height;
  const boundsCenterX = bounds.left + bounds.width / 2;
  const boundsCenterY = bounds.top + bounds.height / 2;
  const snappedX = getAxisSnapTarget(
    [
      {
        key: "left",
        currentValue: currentSnap.left,
        value: boundsLeft,
        target: containerLeft,
      },
      {
        key: "centerX",
        currentValue: currentSnap.centerX,
        value: boundsCenterX,
        target: containerCenterX,
      },
      {
        key: "right",
        currentValue: currentSnap.right,
        value: boundsRight,
        target: containerRight,
      },
    ],
    snapTolerance,
    unsnapTolerance,
  );
  const snappedY = getAxisSnapTarget(
    [
      {
        key: "top",
        currentValue: currentSnap.top,
        value: boundsTop,
        target: containerTop,
      },
      {
        key: "centerY",
        currentValue: currentSnap.centerY,
        value: boundsCenterY,
        target: containerCenterY,
      },
      {
        key: "bottom",
        currentValue: currentSnap.bottom,
        value: boundsBottom,
        target: containerBottom,
      },
    ],
    snapTolerance,
    unsnapTolerance,
  );

  return {
    offsetX: snappedX?.offset ?? 0,
    offsetY: snappedY?.offset ?? 0,
    snap: {
      left: snappedX?.key === "left" ? containerLeft : null,
      right: snappedX?.key === "right" ? containerRight : null,
      centerX: snappedX?.key === "centerX" ? containerCenterX : null,
      top: snappedY?.key === "top" ? containerTop : null,
      bottom: snappedY?.key === "bottom" ? containerBottom : null,
      centerY: snappedY?.key === "centerY" ? containerCenterY : null,
    },
  };
}

export function getResizeSnappedBounds(
  startBounds: PositioningRect,
  resizedBounds: PositioningRect,
  handle: PositioningHandleId,
  containerBounds: PositioningRect,
  currentSnap: PositioningMoveSnapState,
  zoom: number,
): PositioningResizeSnapResult {
  const safeZoom = Math.max(zoom, 0.0001);
  const snapTolerance = MOVE_CENTER_SNAP_PX / safeZoom;
  const unsnapTolerance = MOVE_CENTER_UNSNAP_PX / safeZoom;
  const rawScale = clampPositioningScale(resizedBounds.width / Math.max(startBounds.width, 0.0001));
  const horizontalCandidates = getResizeAxisCandidates(
    startBounds,
    resizedBounds,
    handle,
    containerBounds,
    "x",
    currentSnap,
  );
  const verticalCandidates = getResizeAxisCandidates(
    startBounds,
    resizedBounds,
    handle,
    containerBounds,
    "y",
    currentSnap,
  );
  const snappedX = getResizeSnapTarget(
    horizontalCandidates,
    snapTolerance,
    unsnapTolerance,
  );
  const snappedY = getResizeSnapTarget(
    verticalCandidates,
    snapTolerance,
    unsnapTolerance,
  );

  const nextScale = chooseResizeSnapScale(rawScale, snappedX, snappedY);
  if (nextScale === null) {
    return {
      bounds: resizedBounds,
      snap: emptySnapState(),
    };
  }

  const bounds = getBoundsForHandleScale(startBounds, handle, nextScale);
  const horizontalSnap =
    snappedX && Math.abs(snappedX.scale - nextScale) <= 0.0001 ? snappedX : null;
  const verticalSnap =
    snappedY && Math.abs(snappedY.scale - nextScale) <= 0.0001 ? snappedY : null;

  return {
    bounds,
    snap: {
      left: horizontalSnap?.key === "left" ? horizontalSnap.target : null,
      right: horizontalSnap?.key === "right" ? horizontalSnap.target : null,
      centerX: horizontalSnap?.key === "centerX" ? horizontalSnap.target : null,
      top: verticalSnap?.key === "top" ? verticalSnap.target : null,
      bottom: verticalSnap?.key === "bottom" ? verticalSnap.target : null,
      centerY: verticalSnap?.key === "centerY" ? verticalSnap.target : null,
    },
  };
}

export function getPinchSnappedBounds(
  bounds: PositioningRect,
  containerBounds: PositioningRect,
  currentSnap: PositioningMoveSnapState,
  zoom: number,
): PositioningPinchSnapResult {
  const snappedPosition = getCenterSnappedPosition(
    bounds,
    containerBounds,
    currentSnap,
    zoom,
  );

  return {
    bounds: {
      ...bounds,
      left: bounds.left + snappedPosition.offsetX,
      top: bounds.top + snappedPosition.offsetY,
    },
    snap: snappedPosition.snap,
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

function getAxisSnapTarget(
  candidates: Array<{
    key: "left" | "right" | "top" | "bottom" | "centerX" | "centerY";
    currentValue: number | null;
    value: number;
    target: number;
  }>,
  snapTolerance: number,
  unsnapTolerance: number,
): {
  key: "left" | "right" | "top" | "bottom" | "centerX" | "centerY";
  offset: number;
} | null {
  const latchedCandidate = candidates.find((candidate) => candidate.currentValue !== null);
  if (
    latchedCandidate &&
    Math.abs(latchedCandidate.value - latchedCandidate.target) <= unsnapTolerance
  ) {
    return {
      key: latchedCandidate.key,
      offset: latchedCandidate.target - latchedCandidate.value,
    };
  }

  const snappedCandidate = candidates
    .map((candidate) => ({
      ...candidate,
      delta: candidate.target - candidate.value,
      distance: Math.abs(candidate.target - candidate.value),
    }))
    .filter((candidate) => candidate.distance <= snapTolerance)
    .sort((a, b) => a.distance - b.distance)[0];

  if (!snappedCandidate) {
    return null;
  }

  return {
    key: snappedCandidate.key,
    offset: snappedCandidate.delta,
  };
}

function getBoundsForHandleScale(
  startBounds: PositioningRect,
  handle: PositioningHandleId,
  scale: number,
): PositioningRect {
  const width = startBounds.width * scale;
  const height = startBounds.height * scale;
  const left = startBounds.left;
  const right = startBounds.left + startBounds.width;
  const top = startBounds.top;
  const bottom = startBounds.top + startBounds.height;
  const centerX = left + startBounds.width / 2;
  const centerY = top + startBounds.height / 2;

  switch (handle) {
    case "e":
      return { left, top: centerY - height / 2, width, height };
    case "w":
      return { left: right - width, top: centerY - height / 2, width, height };
    case "s":
      return { left: centerX - width / 2, top, width, height };
    case "n":
      return { left: centerX - width / 2, top: bottom - height, width, height };
    case "se":
      return { left, top, width, height };
    case "sw":
      return { left: right - width, top, width, height };
    case "ne":
      return { left, top: bottom - height, width, height };
    case "nw":
    default:
      return { left: right - width, top: bottom - height, width, height };
  }
}

function getResizeAxisCandidates(
  startBounds: PositioningRect,
  currentBounds: PositioningRect,
  handle: PositioningHandleId,
  containerBounds: PositioningRect,
  axis: "x" | "y",
  currentSnap: PositioningMoveSnapState,
): Array<ResizeSnapCandidate> {
  const containerStart = axis === "x" ? containerBounds.left : containerBounds.top;
  const containerSize = axis === "x" ? containerBounds.width : containerBounds.height;
  const containerCenter = containerStart + containerSize / 2;
  const containerEnd = containerStart + containerSize;
  const size = axis === "x" ? startBounds.width : startBounds.height;
  const candidateSpecs =
    axis === "x"
      ? getResizeHorizontalCandidateSpecs(
          startBounds,
          handle,
          currentBounds,
          currentSnap,
          containerStart,
          containerCenter,
          containerEnd,
        )
      : getResizeVerticalCandidateSpecs(
          startBounds,
          handle,
          currentBounds,
          currentSnap,
          containerStart,
          containerCenter,
          containerEnd,
        );
  const candidates = candidateSpecs.map((candidate) =>
    createResizeSnapCandidate(
      handle,
      candidate.key,
      candidate.currentValue,
      candidate.rawValue,
      candidate.target,
      size,
      candidate.constraint,
    ),
  );

  return candidates.filter((candidate): candidate is ResizeSnapCandidate => candidate !== null);
}

function getResizeConstraintForKey(
  startBounds: PositioningRect,
  handle: PositioningHandleId,
  key: ResizeSnapCandidate["key"],
): ResizeSnapConstraint {
  const left = startBounds.left;
  const right = startBounds.left + startBounds.width;
  const top = startBounds.top;
  const bottom = startBounds.top + startBounds.height;
  const centerX = left + startBounds.width / 2;
  const centerY = top + startBounds.height / 2;

  switch (handle) {
    case "e":
      switch (key) {
        case "left":
          return { kind: "fixed", value: left };
        case "centerX":
          return { kind: "fromStart", start: left, factor: 0.5 };
        case "right":
          return { kind: "fromStart", start: left, factor: 1 };
        case "top":
          return { kind: "fromCenter", center: centerY, factor: 0.5, sign: -1 };
        case "centerY":
          return { kind: "fixed", value: centerY };
        case "bottom":
          return { kind: "fromCenter", center: centerY, factor: 0.5, sign: 1 };
      }
    case "w":
      switch (key) {
        case "left":
          return { kind: "fromEnd", end: right, factor: 1 };
        case "centerX":
          return { kind: "fromEnd", end: right, factor: 0.5 };
        case "right":
          return { kind: "fixed", value: right };
        case "top":
          return { kind: "fromCenter", center: centerY, factor: 0.5, sign: -1 };
        case "centerY":
          return { kind: "fixed", value: centerY };
        case "bottom":
          return { kind: "fromCenter", center: centerY, factor: 0.5, sign: 1 };
      }
    case "s":
      switch (key) {
        case "left":
          return { kind: "fromCenter", center: centerX, factor: 0.5, sign: -1 };
        case "centerX":
          return { kind: "fixed", value: centerX };
        case "right":
          return { kind: "fromCenter", center: centerX, factor: 0.5, sign: 1 };
        case "top":
          return { kind: "fixed", value: top };
        case "centerY":
          return { kind: "fromStart", start: top, factor: 0.5 };
        case "bottom":
          return { kind: "fromStart", start: top, factor: 1 };
      }
    case "n":
      switch (key) {
        case "left":
          return { kind: "fromCenter", center: centerX, factor: 0.5, sign: -1 };
        case "centerX":
          return { kind: "fixed", value: centerX };
        case "right":
          return { kind: "fromCenter", center: centerX, factor: 0.5, sign: 1 };
        case "top":
          return { kind: "fromEnd", end: bottom, factor: 1 };
        case "centerY":
          return { kind: "fromEnd", end: bottom, factor: 0.5 };
        case "bottom":
          return { kind: "fixed", value: bottom };
      }
    case "se":
      switch (key) {
        case "left":
          return { kind: "fixed", value: left };
        case "centerX":
          return { kind: "fromStart", start: left, factor: 0.5 };
        case "right":
          return { kind: "fromStart", start: left, factor: 1 };
        case "top":
          return { kind: "fixed", value: top };
        case "centerY":
          return { kind: "fromStart", start: top, factor: 0.5 };
        case "bottom":
          return { kind: "fromStart", start: top, factor: 1 };
      }
    case "sw":
      switch (key) {
        case "left":
          return { kind: "fromEnd", end: right, factor: 1 };
        case "centerX":
          return { kind: "fromEnd", end: right, factor: 0.5 };
        case "right":
          return { kind: "fixed", value: right };
        case "top":
          return { kind: "fixed", value: top };
        case "centerY":
          return { kind: "fromStart", start: top, factor: 0.5 };
        case "bottom":
          return { kind: "fromStart", start: top, factor: 1 };
      }
    case "ne":
      switch (key) {
        case "left":
          return { kind: "fixed", value: left };
        case "centerX":
          return { kind: "fromStart", start: left, factor: 0.5 };
        case "right":
          return { kind: "fromStart", start: left, factor: 1 };
        case "top":
          return { kind: "fromEnd", end: bottom, factor: 1 };
        case "centerY":
          return { kind: "fromEnd", end: bottom, factor: 0.5 };
        case "bottom":
          return { kind: "fixed", value: bottom };
      }
    case "nw":
    default:
      switch (key) {
        case "left":
          return { kind: "fromEnd", end: right, factor: 1 };
        case "centerX":
          return { kind: "fromEnd", end: right, factor: 0.5 };
        case "right":
          return { kind: "fixed", value: right };
        case "top":
          return { kind: "fromEnd", end: bottom, factor: 1 };
        case "centerY":
          return { kind: "fromEnd", end: bottom, factor: 0.5 };
        case "bottom":
          return { kind: "fixed", value: bottom };
      }
  }
}

type ResizeSnapConstraint =
  | { kind: "fixed"; value: number }
  | { kind: "fromStart"; start: number; factor: number }
  | { kind: "fromEnd"; end: number; factor: number }
  | { kind: "fromCenter"; center: number; factor: number; sign: -1 | 1 };

interface ResizeSnapCandidate {
  key: "left" | "right" | "top" | "bottom" | "centerX" | "centerY";
  currentValue: number | null;
  startValue: number;
  value: number;
  target: number;
  scale: number | null;
  priority: number;
}

interface ResizeSnapCandidateSpec {
  key: "left" | "right" | "top" | "bottom" | "centerX" | "centerY";
  currentValue: number | null;
  rawValue: number;
  target: number;
  constraint: ResizeSnapConstraint;
}

function createResizeSnapCandidate(
  handle: PositioningHandleId,
  key: ResizeSnapCandidate["key"],
  currentValue: number | null,
  rawValue: number,
  target: number,
  size: number,
  constraint: ResizeSnapConstraint,
): ResizeSnapCandidate | null {
  const scale = getResizeConstraintScale(handle, key, target, size, constraint);
  const value = getResizeConstraintValue(constraint, scale, size);
  const startValue = getResizeConstraintValue(constraint, 1, size);

  if (scale === null || value === null || startValue === null) {
    return null;
  }

  return {
    key,
    currentValue,
    startValue,
    value: rawValue,
    target,
    scale,
    priority: getResizeSnapPriority(handle, key),
  };
}

function getResizeConstraintScale(
  handle: PositioningHandleId,
  key: ResizeSnapCandidate["key"],
  target: number,
  size: number,
  constraint: ResizeSnapConstraint,
): number | null {
  void handle;
  void key;

  if (constraint.kind === "fixed") {
    return null;
  }

  if (constraint.kind === "fromStart") {
    return clampPositioningScale((target - constraint.start) / (size * constraint.factor));
  }

  if (constraint.kind === "fromCenter") {
    return clampPositioningScale(
      ((target - constraint.center) * constraint.sign) / (size * constraint.factor),
    );
  }

  return clampPositioningScale((constraint.end - target) / (size * constraint.factor));
}

function getResizeConstraintValue(
  constraint: ResizeSnapConstraint,
  scale: number | null,
  size: number,
): number | null {
  if (constraint.kind === "fixed") {
    return constraint.value;
  }

  if (scale === null) {
    return null;
  }

  if (constraint.kind === "fromStart") {
    return constraint.start + size * constraint.factor * scale;
  }

  if (constraint.kind === "fromCenter") {
    return constraint.center + size * constraint.factor * scale * constraint.sign;
  }

  return constraint.end - size * constraint.factor * scale;
}

function getResizeSnapTarget(
  candidates: ResizeSnapCandidate[],
  snapTolerance: number,
  unsnapTolerance: number,
): (ResizeSnapCandidate & { scale: number }) | null {
  const scaledCandidates = candidates.filter(
    (candidate): candidate is ResizeSnapCandidate & { scale: number } => candidate.scale !== null,
  );
  const latchedCandidate = scaledCandidates.find((candidate) => candidate.currentValue !== null);
  if (
    latchedCandidate &&
    Math.abs(latchedCandidate.value - latchedCandidate.target) <= unsnapTolerance
  ) {
    return latchedCandidate;
  }

  return (
    scaledCandidates
      .map((candidate) => ({
        ...candidate,
        distance: Math.abs(candidate.target - candidate.value),
        startDistance: Math.abs(candidate.target - candidate.startValue),
      }))
      .filter(
        (candidate) =>
          candidate.distance <= snapTolerance && candidate.distance < candidate.startDistance,
      )
      .sort((a, b) => a.priority - b.priority || a.distance - b.distance)[0] ?? null
  );
}

function chooseResizeSnapScale(
  rawScale: number,
  snappedX: (ResizeSnapCandidate & { scale: number }) | null,
  snappedY: (ResizeSnapCandidate & { scale: number }) | null,
): number | null {
  if (!snappedX && !snappedY) {
    return null;
  }

  if (snappedX && snappedY) {
    const xLatched = snappedX.currentValue !== null;
    const yLatched = snappedY.currentValue !== null;

    if (xLatched && !yLatched) {
      return snappedX.scale;
    }

    if (yLatched && !xLatched) {
      return snappedY.scale;
    }

    return Math.abs(snappedX.scale - rawScale) <= Math.abs(snappedY.scale - rawScale)
      ? snappedX.scale
      : snappedY.scale;
  }

  return snappedX?.scale ?? snappedY?.scale ?? null;
}

function emptySnapState(): PositioningMoveSnapState {
  return {
    left: null,
    right: null,
    top: null,
    bottom: null,
    centerX: null,
    centerY: null,
  };
}

function getResizeSnapPriority(
  handle: PositioningHandleId,
  key: ResizeSnapCandidate["key"],
): number {
  switch (handle) {
    case "e":
      return key === "right" ? 0 : key === "centerX" ? 1 : 2;
    case "w":
      return key === "left" ? 0 : key === "centerX" ? 1 : 2;
    case "s":
      return key === "bottom" ? 0 : key === "centerY" ? 1 : 2;
    case "n":
      return key === "top" ? 0 : key === "centerY" ? 1 : 2;
    case "se":
      return key === "right" || key === "bottom" ? 0 : 1;
    case "sw":
      return key === "left" || key === "bottom" ? 0 : 1;
    case "ne":
      return key === "right" || key === "top" ? 0 : 1;
    case "nw":
    default:
      return key === "left" || key === "top" ? 0 : 1;
  }
}

function getResizeHorizontalCandidateSpecs(
  startBounds: PositioningRect,
  handle: PositioningHandleId,
  currentBounds: PositioningRect,
  currentSnap: PositioningMoveSnapState,
  containerLeft: number,
  containerCenterX: number,
  containerRight: number,
): ResizeSnapCandidateSpec[] {
  const specs: ResizeSnapCandidateSpec[] = [];

  switch (handle) {
    case "w":
    case "sw":
    case "nw":
      specs.push({
        key: "left" as const,
        currentValue: currentSnap.left,
        rawValue: currentBounds.left,
        target: containerLeft,
        constraint: getResizeConstraintForKey(startBounds, handle, "left"),
      });
      break;
    case "e":
    case "se":
    case "ne":
      specs.push({
        key: "right" as const,
        currentValue: currentSnap.right,
        rawValue: currentBounds.left + currentBounds.width,
        target: containerRight,
        constraint: getResizeConstraintForKey(startBounds, handle, "right"),
      });
      break;
    default:
      break;
  }

  specs.push({
    key: "centerX" as const,
    currentValue: currentSnap.centerX,
    rawValue: currentBounds.left + currentBounds.width / 2,
    target: containerCenterX,
    constraint: getResizeConstraintForKey(startBounds, handle, "centerX"),
  });

  return specs;
}

function getResizeVerticalCandidateSpecs(
  startBounds: PositioningRect,
  handle: PositioningHandleId,
  currentBounds: PositioningRect,
  currentSnap: PositioningMoveSnapState,
  containerTop: number,
  containerCenterY: number,
  containerBottom: number,
): ResizeSnapCandidateSpec[] {
  const specs: ResizeSnapCandidateSpec[] = [];

  switch (handle) {
    case "n":
    case "ne":
    case "nw":
      specs.push({
        key: "top" as const,
        currentValue: currentSnap.top,
        rawValue: currentBounds.top,
        target: containerTop,
        constraint: getResizeConstraintForKey(startBounds, handle, "top"),
      });
      break;
    case "s":
    case "se":
    case "sw":
      specs.push({
        key: "bottom" as const,
        currentValue: currentSnap.bottom,
        rawValue: currentBounds.top + currentBounds.height,
        target: containerBottom,
        constraint: getResizeConstraintForKey(startBounds, handle, "bottom"),
      });
      break;
    default:
      break;
  }

  specs.push({
    key: "centerY" as const,
    currentValue: currentSnap.centerY,
    rawValue: currentBounds.top + currentBounds.height / 2,
    target: containerCenterY,
    constraint: getResizeConstraintForKey(startBounds, handle, "centerY"),
  });

  return specs;
}
