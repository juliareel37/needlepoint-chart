"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { PositioningDragMode, PositioningRect } from "@/lib/editor-v2/editor/positioning";
import {
  getHandleLeft,
  getHandleTop,
  POSITIONING_HANDLES,
} from "@/lib/editor-v2/editor/positioning";
import type { WorldPoint } from "@/lib/editor-v2/editor/viewport";
import {
  getIconPlacementBounds,
  getIconPlacementTransformFromDrag,
  type IconPlacementDragState,
  type IconPlacementTransform,
} from "@/lib/editor-v2/editor/icons/iconPlacementGeometry";

interface IconPlacementBoxOverlayProps {
  ariaLabel: string;
  baseRect: PositioningRect;
  bounds: PositioningRect;
  getWorldPointFromClient: (clientX: number, clientY: number) => WorldPoint | null;
  onTransformCommit?: (
    transform: IconPlacementTransform,
    transactionKey: string,
  ) => void;
  onTransformPreview?: (transform: IconPlacementTransform) => void;
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

const DRAG_THRESHOLD = 4;

export function IconPlacementBoxOverlay({
  ariaLabel,
  baseRect,
  bounds,
  getWorldPointFromClient,
  onTransformCommit,
  onTransformPreview,
  transform,
  transactionKeyPrefix,
  zoom,
}: IconPlacementBoxOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const handleRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragSequenceRef = useRef(0);
  const dragSessionRef = useRef<DragSession | null>(null);
  const latestBoundsRef = useRef(bounds);
  const latestBaseRectRef = useRef(baseRect);
  const latestTransformRef = useRef(transform);
  const latestGetWorldPointFromClientRef = useRef(getWorldPointFromClient);
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
    const nextBounds = getIconPlacementBounds(latestBaseRectRef.current, nextTransform);

    latestTransformRef.current = nextTransform;
    latestBoundsRef.current = nextBounds;
    applyPreviewBounds(overlayRef.current, handleRefs.current, nextBounds, handleSize);
    latestOnTransformPreviewRef.current?.(nextTransform);

    return nextTransform;
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

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const session = dragSessionRef.current;
    if (!session || event.pointerId !== session.pointerId) {
      return;
    }

    session.pendingClientX = event.clientX;
    session.pendingClientY = event.clientY;
    scheduleFrame();
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    const session = dragSessionRef.current;
    if (!session || event.pointerId !== session.pointerId) {
      return;
    }

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Ignore release errors during teardown.
    }

    if (session.rafId !== null) {
      window.cancelAnimationFrame(session.rafId);
      session.rafId = null;
    }

    session.pendingClientX = event.clientX;
    session.pendingClientY = event.clientY;
    const committedTransform = flushPreview(session);

    if (session.dragged) {
      latestOnTransformCommitRef.current?.(committedTransform, session.transactionKey);
    }

    if (overlayRef.current) {
      overlayRef.current.style.cursor = "grab";
    }

    dragSessionRef.current = null;
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
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
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
