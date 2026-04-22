"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { PositioningDragMode, PositioningRect } from "@/lib/editor-v2/editor/positioning";
import {
  getHandleLeft,
  getHandleTop,
  POSITIONING_HANDLES,
  type PositioningPinchState,
} from "@/lib/editor-v2/editor/positioning";
import type { WorldPoint } from "@/lib/editor-v2/editor/viewport";
import {
  getIconPlacementBounds,
  getIconPlacementTransformFromDrag,
  getIconPlacementTransformFromPinch,
  type IconPlacementDragState,
  type IconPlacementTransform,
} from "@/lib/editor-v2/editor/icons/iconPlacementGeometry";

interface IconPlacementBoxOverlayProps {
  ariaLabel: string;
  baseRect: PositioningRect;
  bounds: PositioningRect;
  interactionBounds?: PositioningRect;
  getWorldPointFromClient: (clientX: number, clientY: number) => WorldPoint | null;
  onTransformCommit?: (
    transform: IconPlacementTransform,
    transactionKey: string,
  ) => void;
  onTransformPreview?: (transform: IconPlacementTransform) => void;
  projectBoundsForPreview?: (
    transform: IconPlacementTransform,
    baseRect: PositioningRect,
  ) => PositioningRect;
  transform: IconPlacementTransform;
  transactionKeyPrefix: string;
  zoom: number;
}

interface DragSession {
  pointerId: number;
  mode: PositioningDragMode;
  transactionKey: string;
  drag: IconPlacementDragState;
  dragged: boolean;
  startClientX: number;
  startClientY: number;
  pendingClientX: number;
  pendingClientY: number;
  rafId: number | null;
}

interface PinchSession {
  pinch: PositioningPinchState;
  pointerIds: [number, number];
  startClientDistance: number;
  startTransform: IconPlacementTransform;
}

const DRAG_THRESHOLD = 4;

export function IconPlacementBoxOverlay({
  ariaLabel,
  baseRect,
  bounds,
  interactionBounds,
  getWorldPointFromClient,
  onTransformCommit,
  onTransformPreview,
  projectBoundsForPreview,
  transform,
  transactionKeyPrefix,
  zoom,
}: IconPlacementBoxOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const handleRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragSequenceRef = useRef(0);
  const dragSessionRef = useRef<DragSession | null>(null);
  const pinchSessionRef = useRef<PinchSession | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const touchPointsRef = useRef<Map<number, { clientX: number; clientY: number }>>(new Map());
  const latestBoundsRef = useRef(interactionBounds ?? bounds);
  const latestBaseRectRef = useRef(baseRect);
  const latestTransformRef = useRef(transform);
  const latestGetWorldPointFromClientRef = useRef(getWorldPointFromClient);
  const latestOnTransformPreviewRef = useRef(onTransformPreview);
  const latestOnTransformCommitRef = useRef(onTransformCommit);
  const latestProjectBoundsForPreviewRef = useRef(projectBoundsForPreview);
  const controlScale = zoom > 0 ? 1 / zoom : 1;
  const handleSize = 14 * controlScale;
  const outlineWidth = Math.max(1, 1.5 * controlScale);
  const handleBorderWidth = Math.max(1, 1.25 * controlScale);

  useEffect(() => {
    latestBaseRectRef.current = baseRect;
  }, [baseRect]);

  useEffect(() => {
    latestBoundsRef.current = interactionBounds ?? bounds;
    if (!dragSessionRef.current) {
      applyPreviewBounds(overlayRef.current, handleRefs.current, bounds, handleSize);
    }
  }, [bounds, handleSize, interactionBounds]);

  useEffect(() => {
    latestTransformRef.current = transform;
  }, [transform]);

  useEffect(() => {
    latestGetWorldPointFromClientRef.current = getWorldPointFromClient;
  }, [getWorldPointFromClient]);

  useEffect(() => {
    latestOnTransformPreviewRef.current = onTransformPreview;
  }, [onTransformPreview]);

  useEffect(() => {
    latestOnTransformCommitRef.current = onTransformCommit;
  }, [onTransformCommit]);

  useEffect(() => {
    latestProjectBoundsForPreviewRef.current = projectBoundsForPreview;
  }, [projectBoundsForPreview]);

  useEffect(() => {
    return () => {
      if (frameIdRef.current !== null) {
        window.cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleWindowPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" && touchPointsRef.current.has(event.pointerId)) {
        touchPointsRef.current.set(event.pointerId, {
          clientX: event.clientX,
          clientY: event.clientY,
        });
      }

      if (pinchSessionRef.current?.pointerIds.includes(event.pointerId)) {
        scheduleFrame();
        return;
      }

      const session = dragSessionRef.current;
      if (!session || event.pointerId !== session.pointerId) {
        return;
      }

      session.pendingClientX = event.clientX;
      session.pendingClientY = event.clientY;
      scheduleFrame();
    };

    const handleWindowPointerEnd = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        touchPointsRef.current.set(event.pointerId, {
          clientX: event.clientX,
          clientY: event.clientY,
        });
      }

      if (pinchSessionRef.current?.pointerIds.includes(event.pointerId)) {
        finalizePinch(event.pointerId);
        return;
      }

      if (event.pointerType === "touch") {
        touchPointsRef.current.delete(event.pointerId);
      }

      finalizePointerEnd(event.pointerId, event.clientX, event.clientY);
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerEnd);
    window.addEventListener("pointercancel", handleWindowPointerEnd);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);
    };
  }, []);

  function scheduleFrame() {
    if (frameIdRef.current !== null) {
      return;
    }

    frameIdRef.current = window.requestAnimationFrame(() => {
      frameIdRef.current = null;

      const activeSession = dragSessionRef.current;
      if (activeSession) {
        flushPreview(activeSession);
        return;
      }

      flushPinchPreview();
    });
  }

  function flushPreview(session: DragSession): IconPlacementTransform {
    const nextClientX = session.pendingClientX;
    const nextClientY = session.pendingClientY;

    if (
      !session.dragged &&
      Math.hypot(nextClientX - session.startClientX, nextClientY - session.startClientY) >=
        DRAG_THRESHOLD
    ) {
      session.dragged = true;
      if (session.mode === "move" && overlayRef.current) {
        overlayRef.current.style.cursor = "grabbing";
      }
    }

    const worldPoint = latestGetWorldPointFromClientRef.current(nextClientX, nextClientY);
    if (!worldPoint) {
      return latestTransformRef.current;
    }

    const nextTransform = getIconPlacementTransformFromDrag(
      session.drag,
      worldPoint,
      latestBaseRectRef.current,
    );
    const nextInteractionBounds = getIconPlacementBounds(
      latestBaseRectRef.current,
      nextTransform,
    );
    const nextBounds =
      latestProjectBoundsForPreviewRef.current?.(
        nextTransform,
        latestBaseRectRef.current,
      ) ?? nextInteractionBounds;

    latestTransformRef.current = nextTransform;
    latestBoundsRef.current = nextInteractionBounds;
    applyPreviewBounds(overlayRef.current, handleRefs.current, nextBounds, handleSize);
    latestOnTransformPreviewRef.current?.(nextTransform);

    return nextTransform;
  }

  function flushPinchPreview(): IconPlacementTransform | null {
    const pinchSession = pinchSessionRef.current;
    if (!pinchSession) {
      return null;
    }

    const firstTouch = touchPointsRef.current.get(pinchSession.pointerIds[0]);
    const secondTouch = touchPointsRef.current.get(pinchSession.pointerIds[1]);
    if (!firstTouch || !secondTouch) {
      return latestTransformRef.current;
    }

    const centerClientX = (firstTouch.clientX + secondTouch.clientX) / 2;
    const centerClientY = (firstTouch.clientY + secondTouch.clientY) / 2;
    const worldCenter = latestGetWorldPointFromClientRef.current(centerClientX, centerClientY);
    if (!worldCenter) {
      return latestTransformRef.current;
    }

    const nextDistance = Math.hypot(
      secondTouch.clientX - firstTouch.clientX,
      secondTouch.clientY - firstTouch.clientY,
    );
    const nextTransform = getIconPlacementTransformFromPinch(
      {
        ...pinchSession.pinch,
        startDistance: pinchSession.startClientDistance,
      },
      worldCenter,
      nextDistance,
      latestBaseRectRef.current,
      pinchSession.startTransform,
    );
    const nextInteractionBounds = getIconPlacementBounds(
      latestBaseRectRef.current,
      nextTransform,
    );
    const nextBounds =
      latestProjectBoundsForPreviewRef.current?.(
        nextTransform,
        latestBaseRectRef.current,
      ) ?? nextInteractionBounds;

    latestTransformRef.current = nextTransform;
    latestBoundsRef.current = nextInteractionBounds;
    applyPreviewBounds(overlayRef.current, handleRefs.current, nextBounds, handleSize);
    latestOnTransformPreviewRef.current?.(nextTransform);

    return nextTransform;
  }

  function beginPinch(overlayElement: HTMLDivElement) {
    const activeTouches = Array.from(touchPointsRef.current.entries());
    if (activeTouches.length < 2) {
      return;
    }

    const [[firstPointerId, firstTouch], [secondPointerId, secondTouch]] = activeTouches;
    const centerClientX = (firstTouch.clientX + secondTouch.clientX) / 2;
    const centerClientY = (firstTouch.clientY + secondTouch.clientY) / 2;
    const worldCenter = latestGetWorldPointFromClientRef.current(centerClientX, centerClientY);
    if (!worldCenter) {
      return;
    }

    const startBounds = latestBoundsRef.current;
    const width = Math.max(startBounds.width, 0.0001);
    const height = Math.max(startBounds.height, 0.0001);
    const startClientDistance = Math.hypot(
      secondTouch.clientX - firstTouch.clientX,
      secondTouch.clientY - firstTouch.clientY,
    );

    pinchSessionRef.current = {
      pinch: {
        anchorX: (worldCenter.x - startBounds.left) / width,
        anchorY: (worldCenter.y - startBounds.top) / height,
        startDistance: startClientDistance,
        startTransform: {
          offsetX: latestTransformRef.current.offsetX,
          offsetY: latestTransformRef.current.offsetY,
          scale: 1,
        },
      },
      pointerIds: [firstPointerId, secondPointerId],
      startClientDistance,
      startTransform: latestTransformRef.current,
    };

    const activeDragSession = dragSessionRef.current;
    if (frameIdRef.current !== null) {
      window.cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }
    dragSessionRef.current = null;
    overlayElement.style.cursor = "grab";
  }

  function beginDrag(event: ReactPointerEvent<HTMLDivElement>, mode: PositioningDragMode) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const worldPoint = latestGetWorldPointFromClientRef.current(event.clientX, event.clientY);
    if (!worldPoint) {
      return;
    }

    const overlayElement = overlayRef.current;
    if (!overlayElement) {
      return;
    }

    if (event.pointerType === "touch") {
      touchPointsRef.current.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
      });

      if (touchPointsRef.current.size === 2) {
        overlayElement.setPointerCapture(event.pointerId);
        beginPinch(overlayElement);
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }

    dragSequenceRef.current += 1;
    const transactionKey = `${transactionKeyPrefix}-${dragSequenceRef.current}`;
    dragSessionRef.current = {
      pointerId: event.pointerId,
      mode,
      transactionKey,
      drag: {
        mode,
        startPoint: worldPoint,
        startTransform: latestTransformRef.current,
        startBounds: latestBoundsRef.current,
        transactionKey,
      },
      dragged: false,
      startClientX: event.clientX,
      startClientY: event.clientY,
      pendingClientX: event.clientX,
      pendingClientY: event.clientY,
      rafId: null,
    };

    overlayElement.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  }

  function finalizePointerEnd(pointerId: number, clientX: number, clientY: number) {
    const session = dragSessionRef.current;
    if (!session || pointerId !== session.pointerId) {
      return;
    }

    if (frameIdRef.current !== null) {
      window.cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }

    session.pendingClientX = clientX;
    session.pendingClientY = clientY;
    const committedTransform = flushPreview(session);

    if (session.dragged) {
      latestOnTransformCommitRef.current?.(committedTransform, session.transactionKey);
    }

    if (overlayRef.current) {
      overlayRef.current.style.cursor = "grab";
    }

    dragSessionRef.current = null;
    try {
      if (overlayRef.current?.hasPointerCapture(pointerId)) {
        overlayRef.current.releasePointerCapture(pointerId);
      }
    } catch {
      // Ignore release errors during teardown.
    }
  }

  function finalizePinch(pointerId: number) {
    const pinchSession = pinchSessionRef.current;
    if (!pinchSession || !pinchSession.pointerIds.includes(pointerId)) {
      return;
    }

    const committedTransform = flushPinchPreview();
    pinchSessionRef.current = null;
    touchPointsRef.current.clear();
    try {
      if (overlayRef.current?.hasPointerCapture(pointerId)) {
        overlayRef.current.releasePointerCapture(pointerId);
      }
    } catch {
      // Ignore release errors during teardown.
    }

    if (committedTransform) {
      latestOnTransformCommitRef.current?.(
        committedTransform,
        `${transactionKeyPrefix}-pinch-${dragSequenceRef.current + 1}`,
      );
      dragSequenceRef.current += 1;
    }
  }

  return (
    <div
      ref={overlayRef}
      aria-label={ariaLabel}
      role="presentation"
      style={{
        position: "absolute",
        left: `${bounds.left}px`,
        top: `${bounds.top}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
        cursor: "grab",
        userSelect: "none",
        WebkitUserSelect: "none",
        pointerEvents: "auto",
        touchAction: "none",
      }}
      onPointerDown={(event) => beginDrag(event, "move")}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          border: `${outlineWidth}px solid rgba(37, 99, 235, 0.95)`,
          background: "transparent",
        }}
      />

      {POSITIONING_HANDLES.map((handle) => (
        <div
          key={handle.id}
          ref={(node) => {
            handleRefs.current[handle.id] = node;
          }}
          role="presentation"
          aria-hidden="true"
          onPointerDown={(event) => beginDrag(event, handle.id)}
          style={{
            position: "absolute",
            left: `${getHandleLeft(handle.id, bounds.width, handleSize)}px`,
            top: `${getHandleTop(handle.id, bounds.height, handleSize)}px`,
            width: `${handleSize}px`,
            height: `${handleSize}px`,
            borderRadius: handle.kind === "edge" ? `${4 * controlScale}px` : "999px",
            background: "#ffffff",
            border: `${handleBorderWidth}px solid #2563eb`,
            cursor: handle.cursor,
          }}
        />
      ))}
    </div>
  );
}

function applyPreviewBounds(
  overlayElement: HTMLDivElement | null,
  handleRefs: Record<string, HTMLDivElement | null>,
  bounds: PositioningRect,
  handleSize: number,
) {
  if (!overlayElement) {
    return;
  }

  overlayElement.style.left = `${bounds.left}px`;
  overlayElement.style.top = `${bounds.top}px`;
  overlayElement.style.width = `${bounds.width}px`;
  overlayElement.style.height = `${bounds.height}px`;

  for (const handle of POSITIONING_HANDLES) {
    const handleElement = handleRefs[handle.id];
    if (!handleElement) {
      continue;
    }

    handleElement.style.left = `${getHandleLeft(handle.id, bounds.width, handleSize)}px`;
    handleElement.style.top = `${getHandleTop(handle.id, bounds.height, handleSize)}px`;
  }
}
