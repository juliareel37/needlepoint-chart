"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { WorldPoint } from "@/lib/editor-v2/editor/viewport";
import {
  getHandleLeft,
  getHandleTop,
  getPositionedBounds,
  getTransformFromDrag,
  getTransformFromPinch,
  POSITIONING_HANDLES,
  type PositioningDragMode,
  type PositioningDragState,
  type PositioningPinchState,
  type PositioningRect,
  type PositioningTransform,
} from "@/lib/editor-v2/editor/positioning";

interface PositioningBoxOverlayProps {
  ariaLabel: string;
  baseRect: PositioningRect;
  bounds: PositioningRect;
  interactionBounds?: PositioningRect;
  getWorldPointFromClient: (clientX: number, clientY: number) => WorldPoint | null;
  handleShape?: "mixed" | "circle";
  onClick?: () => void;
  onInteractionEnd?: () => void;
  onInteractionStart?: () => void;
  onTransformCommit?: (
    transform: PositioningTransform,
    transactionKey: string,
  ) => void;
  onTransformPreview?: (transform: PositioningTransform) => void;
  projectBoundsForPreview?: (
    transform: PositioningTransform,
    baseRect: PositioningRect,
  ) => PositioningRect;
  interactive?: boolean;
  previewThrottleMs?: number;
  previewBoundsStrategy?: "live" | "none";
  usePointerCapture?: boolean;
  showHandles?: boolean;
  showOutline?: boolean;
  transform: PositioningTransform;
  transactionKeyPrefix: string;
  zoom: number;
}

interface DragSession {
  pointerId: number;
  mode: PositioningDragMode;
  transactionKey: string;
  drag: PositioningDragState;
  dragThreshold: number;
  dragged: boolean;
  startClientX: number;
  startClientY: number;
  pendingClientX: number;
  pendingClientY: number;
  rafId: number | null;
  lastPreviewAt: number;
}

interface HandleElements {
  hit: HTMLDivElement | null;
  visible: HTMLDivElement | null;
}

interface PinchSession {
  pinch: PositioningPinchState;
  pointerIds: [number, number];
  startClientDistance: number;
}

const DRAG_THRESHOLD = 4;
const TOUCH_HANDLE_TARGET_SIZE = 36;
const TOUCH_HANDLE_DRAG_THRESHOLD = 2;

export function PositioningBoxOverlay({
  ariaLabel,
  baseRect,
  bounds,
  interactionBounds,
  getWorldPointFromClient,
  onClick,
  onInteractionEnd,
  onInteractionStart,
  onTransformCommit,
  onTransformPreview,
  projectBoundsForPreview,
  interactive = true,
  handleShape = "mixed",
  previewThrottleMs = 0,
  previewBoundsStrategy = "live",
  usePointerCapture = true,
  showHandles = true,
  showOutline = true,
  transform,
  transactionKeyPrefix,
  zoom,
}: PositioningBoxOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const handleRefs = useRef<Record<string, HandleElements>>({});
  const dragSequenceRef = useRef(0);
  const dragSessionRef = useRef<DragSession | null>(null);
  const pinchSessionRef = useRef<PinchSession | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const touchPointsRef = useRef<Map<number, { clientX: number; clientY: number }>>(new Map());
  const [coarsePointer, setCoarsePointer] = useState(false);
  const latestBoundsRef = useRef(interactionBounds ?? bounds);
  const latestBaseRectRef = useRef(baseRect);
  const latestTransformRef = useRef(transform);
  const latestGetWorldPointFromClientRef = useRef(getWorldPointFromClient);
  const latestOnClickRef = useRef(onClick);
  const latestOnInteractionStartRef = useRef(onInteractionStart);
  const latestOnInteractionEndRef = useRef(onInteractionEnd);
  const latestOnTransformPreviewRef = useRef(onTransformPreview);
  const latestOnTransformCommitRef = useRef(onTransformCommit);
  const latestProjectBoundsForPreviewRef = useRef(projectBoundsForPreview);
  const controlScale = zoom > 0 ? 1 / zoom : 1;
  const handleSize = 14 * controlScale;
  const handleHitSize = coarsePointer
    ? Math.max(handleSize, TOUCH_HANDLE_TARGET_SIZE)
    : handleSize;
  const outlineWidth = Math.max(1, 1.5 * controlScale);
  const handleBorderWidth = Math.max(1, 1.25 * controlScale);

  useEffect(() => {
    latestBaseRectRef.current = baseRect;
  }, [baseRect]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarsePointer(mediaQuery.matches);

    update();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }

    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  useEffect(() => {
    latestBoundsRef.current = interactionBounds ?? bounds;
    if (!dragSessionRef.current) {
      applyPreviewBounds(
        overlayRef.current,
        handleRefs.current,
        bounds,
        handleSize,
        handleHitSize,
      );
    }
  }, [bounds, handleHitSize, handleSize, interactionBounds]);

  useEffect(() => {
    latestTransformRef.current = transform;
  }, [transform]);

  useEffect(() => {
    latestGetWorldPointFromClientRef.current = getWorldPointFromClient;
  }, [getWorldPointFromClient]);

  useEffect(() => {
    latestOnClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    latestOnInteractionStartRef.current = onInteractionStart;
  }, [onInteractionStart]);

  useEffect(() => {
    latestOnInteractionEndRef.current = onInteractionEnd;
  }, [onInteractionEnd]);

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

      const hasLivePreview =
        previewBoundsStrategy === "live" || Boolean(latestOnTransformPreviewRef.current);
      if (!hasLivePreview) {
        return;
      }

      if (
        previewThrottleMs > 0 &&
        session.lastPreviewAt > 0 &&
        performance.now() - session.lastPreviewAt < previewThrottleMs
      ) {
        return;
      }

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
  }, [previewBoundsStrategy, previewThrottleMs]);

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

  function flushPreview(session: DragSession): PositioningTransform {
    const nextClientX = session.pendingClientX;
    const nextClientY = session.pendingClientY;

    const deltaX = nextClientX - session.startClientX;
    const deltaY = nextClientY - session.startClientY;
    if (!session.dragged && Math.hypot(deltaX, deltaY) >= session.dragThreshold) {
      session.dragged = true;
      if (session.mode === "move" && overlayRef.current) {
        overlayRef.current.style.cursor = "grabbing";
      }
    }

    const worldPoint = latestGetWorldPointFromClientRef.current(nextClientX, nextClientY);
    if (!worldPoint) {
      return latestTransformRef.current;
    }

    const nextTransform = getTransformFromDrag(
      session.drag,
      worldPoint,
      latestBaseRectRef.current,
    );

    latestTransformRef.current = nextTransform;
    const nextInteractionBounds = getPositionedBounds(
      latestBaseRectRef.current,
      nextTransform,
    );
    latestBoundsRef.current = nextInteractionBounds;
    if (previewBoundsStrategy === "live") {
      const nextBounds =
        latestProjectBoundsForPreviewRef.current?.(
          nextTransform,
          latestBaseRectRef.current,
        ) ?? nextInteractionBounds;
      applyPreviewBounds(
        overlayRef.current,
        handleRefs.current,
        nextBounds,
        handleSize,
        handleHitSize,
      );
    }
    latestOnTransformPreviewRef.current?.(nextTransform);
    session.lastPreviewAt = performance.now();

    return nextTransform;
  }

  function flushPinchPreview(): PositioningTransform | null {
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
    const nextTransform = getTransformFromPinch(
      {
        ...pinchSession.pinch,
        startDistance: pinchSession.startClientDistance,
      },
      worldCenter,
      nextDistance,
      latestBaseRectRef.current,
    );

    latestTransformRef.current = nextTransform;
    const nextInteractionBounds = getPositionedBounds(
      latestBaseRectRef.current,
      nextTransform,
    );
    latestBoundsRef.current = nextInteractionBounds;
    if (previewBoundsStrategy === "live") {
      const nextBounds =
        latestProjectBoundsForPreviewRef.current?.(
          nextTransform,
          latestBaseRectRef.current,
        ) ?? nextInteractionBounds;
      applyPreviewBounds(
        overlayRef.current,
        handleRefs.current,
        nextBounds,
        handleSize,
        handleHitSize,
      );
    }
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

    pinchSessionRef.current = {
      pinch: {
        anchorX: (worldCenter.x - startBounds.left) / width,
        anchorY: (worldCenter.y - startBounds.top) / height,
        startDistance: Math.hypot(
          secondTouch.clientX - firstTouch.clientX,
          secondTouch.clientY - firstTouch.clientY,
        ),
        startTransform: latestTransformRef.current,
      },
      pointerIds: [firstPointerId, secondPointerId],
      startClientDistance: Math.hypot(
        secondTouch.clientX - firstTouch.clientX,
        secondTouch.clientY - firstTouch.clientY,
      ),
    };

    const activeDragSession = dragSessionRef.current;
    if (frameIdRef.current !== null) {
      window.cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }
    dragSessionRef.current = null;
    overlayElement.style.cursor = interactive ? "grab" : "default";
    latestOnInteractionStartRef.current?.();
  }

  function beginDrag(event: ReactPointerEvent<HTMLDivElement>, mode: PositioningDragMode) {
    if (!interactive) {
      return;
    }
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
    dragSessionRef.current = {
      pointerId: event.pointerId,
      mode,
      transactionKey: `${transactionKeyPrefix}-${dragSequenceRef.current}`,
      drag: {
        mode,
        startPoint: worldPoint,
        startTransform: latestTransformRef.current,
        startBounds: latestBoundsRef.current,
        transactionKey: `${transactionKeyPrefix}-${dragSequenceRef.current}`,
      },
      dragThreshold:
        event.pointerType === "touch" && mode !== "move"
          ? TOUCH_HANDLE_DRAG_THRESHOLD
          : DRAG_THRESHOLD,
      dragged: false,
      startClientX: event.clientX,
      startClientY: event.clientY,
      pendingClientX: event.clientX,
      pendingClientY: event.clientY,
      rafId: null,
      lastPreviewAt: 0,
    };

    if (usePointerCapture) {
      overlayElement.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    event.stopPropagation();
    latestOnInteractionStartRef.current?.();
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

    if (session.mode === "move" && !session.dragged) {
      latestOnClickRef.current?.();
    } else if (session.dragged) {
      latestOnTransformCommitRef.current?.(committedTransform, session.transactionKey);
    }

    if (overlayRef.current) {
      overlayRef.current.style.cursor = interactive ? "grab" : "default";
    }

    latestOnInteractionEndRef.current?.();
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
    latestOnInteractionEndRef.current?.();
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
        cursor: interactive ? "grab" : "default",
        userSelect: "none",
        WebkitUserSelect: "none",
        pointerEvents: interactive ? "auto" : "none",
        touchAction: "none",
      }}
      onPointerDown={(event) => beginDrag(event, "move")}
    >
      {showOutline ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            border: `${outlineWidth}px solid rgba(37, 99, 235, 0.95)`,
            background: "transparent",
          }}
        />
      ) : null}

      {showHandles
        ? POSITIONING_HANDLES.map((handle) => (
            <div key={handle.id}>
              <div
                ref={(node) => {
                  const existing = handleRefs.current[handle.id] ?? {
                    hit: null,
                    visible: null,
                  };
                  handleRefs.current[handle.id] = { ...existing, hit: node };
                }}
                role="presentation"
                aria-hidden="true"
                onPointerDown={(event) => beginDrag(event, handle.id)}
                style={{
                  position: "absolute",
                  left: `${getHandleLeft(handle.id, bounds.width, handleSize) - (handleHitSize - handleSize) / 2}px`,
                  top: `${getHandleTop(handle.id, bounds.height, handleSize) - (handleHitSize - handleSize) / 2}px`,
                  width: `${handleHitSize}px`,
                  height: `${handleHitSize}px`,
                  cursor: handle.cursor,
                  WebkitTapHighlightColor: "transparent",
                  background: "transparent",
                }}
              />
              <div
                ref={(node) => {
                  const existing = handleRefs.current[handle.id] ?? {
                    hit: null,
                    visible: null,
                  };
                  handleRefs.current[handle.id] = { ...existing, visible: node };
                }}
                role="presentation"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: `${getHandleLeft(handle.id, bounds.width, handleSize)}px`,
                  top: `${getHandleTop(handle.id, bounds.height, handleSize)}px`,
                  width: `${handleSize}px`,
                  height: `${handleSize}px`,
                  borderRadius:
                    handleShape === "circle"
                      ? "999px"
                      : handle.kind === "edge"
                        ? `${4 * controlScale}px`
                        : "999px",
                  background: "#ffffff",
                  border: `${handleBorderWidth}px solid #2563eb`,
                  cursor: handle.cursor,
                  pointerEvents: "none",
                }}
              />
            </div>
          ))
        : null}
    </div>
  );
}

function applyPreviewBounds(
  overlayElement: HTMLDivElement | null,
  handleRefs: Record<string, HandleElements>,
  bounds: PositioningRect,
  handleSize: number,
  handleHitSize: number,
) {
  if (!overlayElement) {
    return;
  }

  overlayElement.style.left = `${bounds.left}px`;
  overlayElement.style.top = `${bounds.top}px`;
  overlayElement.style.width = `${bounds.width}px`;
  overlayElement.style.height = `${bounds.height}px`;

  for (const handle of POSITIONING_HANDLES) {
    const handleElements = handleRefs[handle.id];
    const visibleElement = handleElements?.visible;
    const hitElement = handleElements?.hit;
    const visibleLeft = getHandleLeft(handle.id, bounds.width, handleSize);
    const visibleTop = getHandleTop(handle.id, bounds.height, handleSize);
    const hitInset = (handleHitSize - handleSize) / 2;

    if (visibleElement) {
      visibleElement.style.left = `${visibleLeft}px`;
      visibleElement.style.top = `${visibleTop}px`;
    }

    if (hitElement) {
      hitElement.style.left = `${visibleLeft - hitInset}px`;
      hitElement.style.top = `${visibleTop - hitInset}px`;
    }
  }
}
