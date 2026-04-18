"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { WorldPoint } from "@/lib/editor-v2/editor/viewport";
import {
  getHandleLeft,
  getHandleTop,
  getPositionedBounds,
  getTransformFromDrag,
  POSITIONING_HANDLES,
  type PositioningDragMode,
  type PositioningDragState,
  type PositioningRect,
  type PositioningTransform,
} from "@/lib/editor-v2/editor/positioning";

interface PositioningBoxOverlayProps {
  ariaLabel: string;
  baseRect: PositioningRect;
  bounds: PositioningRect;
  getWorldPointFromClient: (clientX: number, clientY: number) => WorldPoint | null;
  onClick?: () => void;
  onInteractionEnd?: () => void;
  onInteractionStart?: () => void;
  onTransformCommit?: (
    transform: PositioningTransform,
    transactionKey: string,
  ) => void;
  onTransformPreview?: (transform: PositioningTransform) => void;
  interactive?: boolean;
  previewThrottleMs?: number;
  previewBoundsStrategy?: "live" | "none";
  usePointerCapture?: boolean;
  showHandles?: boolean;
  transform: PositioningTransform;
  transactionKeyPrefix: string;
  zoom: number;
}

interface DragSession {
  pointerId: number;
  mode: PositioningDragMode;
  transactionKey: string;
  drag: PositioningDragState;
  dragged: boolean;
  startClientX: number;
  startClientY: number;
  pendingClientX: number;
  pendingClientY: number;
  rafId: number | null;
  lastPreviewAt: number;
}

const DRAG_THRESHOLD = 4;

export function PositioningBoxOverlay({
  ariaLabel,
  baseRect,
  bounds,
  getWorldPointFromClient,
  onClick,
  onInteractionEnd,
  onInteractionStart,
  onTransformCommit,
  onTransformPreview,
  interactive = true,
  previewThrottleMs = 0,
  previewBoundsStrategy = "live",
  usePointerCapture = true,
  showHandles = true,
  transform,
  transactionKeyPrefix,
  zoom,
}: PositioningBoxOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const handleRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragSequenceRef = useRef(0);
  const dragSessionRef = useRef<DragSession | null>(null);
  const latestBoundsRef = useRef(bounds);
  const latestBaseRectRef = useRef(baseRect);
  const latestTransformRef = useRef(transform);
  const latestGetWorldPointFromClientRef = useRef(getWorldPointFromClient);
  const latestOnClickRef = useRef(onClick);
  const latestOnInteractionStartRef = useRef(onInteractionStart);
  const latestOnInteractionEndRef = useRef(onInteractionEnd);
  const latestOnTransformPreviewRef = useRef(onTransformPreview);
  const latestOnTransformCommitRef = useRef(onTransformCommit);
  const controlScale = zoom > 0 ? 1 / zoom : 1;
  const handleSize = 14 * controlScale;
  const outlineWidth = Math.max(1, 1.5 * controlScale);
  const handleBorderWidth = Math.max(1, 1.25 * controlScale);

  useEffect(() => {
    latestBaseRectRef.current = baseRect;
  }, [baseRect]);

  useEffect(() => {
    latestBoundsRef.current = bounds;
    if (!dragSessionRef.current) {
      applyPreviewBounds(overlayRef.current, handleRefs.current, bounds, handleSize);
    }
  }, [bounds, handleSize]);

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
    return () => {
      const session = dragSessionRef.current;
      if (session && session.rafId !== null) {
        window.cancelAnimationFrame(session.rafId);
      }
    };
  }, []);

  useEffect(() => {
    if (usePointerCapture) {
      return;
    }

    const handleWindowPointerMove = (event: PointerEvent) => {
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
  }, [previewBoundsStrategy, previewThrottleMs, usePointerCapture]);

  function scheduleFrame() {
    const session = dragSessionRef.current;
    if (!session || session.rafId !== null) {
      return;
    }

    session.rafId = window.requestAnimationFrame(() => {
      const activeSession = dragSessionRef.current;
      if (!activeSession) {
        return;
      }

      activeSession.rafId = null;
      flushPreview(activeSession);
    });
  }

  function flushPreview(session: DragSession): PositioningTransform {
    const nextClientX = session.pendingClientX;
    const nextClientY = session.pendingClientY;

    const deltaX = nextClientX - session.startClientX;
    const deltaY = nextClientY - session.startClientY;
    if (!session.dragged && Math.hypot(deltaX, deltaY) >= DRAG_THRESHOLD) {
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
    if (previewBoundsStrategy === "live") {
      const nextBounds = getPositionedBounds(latestBaseRectRef.current, nextTransform);
      latestBoundsRef.current = nextBounds;
      applyPreviewBounds(overlayRef.current, handleRefs.current, nextBounds, handleSize);
    }
    latestOnTransformPreviewRef.current?.(nextTransform);
    session.lastPreviewAt = performance.now();

    return nextTransform;
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

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!usePointerCapture) {
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
  }

  function finalizePointerEnd(pointerId: number, clientX: number, clientY: number) {
    const session = dragSessionRef.current;
    if (!session || pointerId !== session.pointerId) {
      return;
    }

    if (session.rafId !== null) {
      window.cancelAnimationFrame(session.rafId);
      session.rafId = null;
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
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    if (!usePointerCapture) {
      return;
    }

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Ignore release errors during teardown.
    }

    finalizePointerEnd(event.pointerId, event.clientX, event.clientY);
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
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
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

      {showHandles
        ? POSITIONING_HANDLES.map((handle) => (
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
          ))
        : null}
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
