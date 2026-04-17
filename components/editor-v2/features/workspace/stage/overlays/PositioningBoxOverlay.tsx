"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  disableLivePreview?: boolean;
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
  onTransformChange: (transform: PositioningTransform, transactionKey: string) => void;
  showHandles?: boolean;
  transform: PositioningTransform;
  transactionKeyPrefix: string;
  useImperativePreview?: boolean;
  zoom: number;
}

export function PositioningBoxOverlay({
  ariaLabel,
  baseRect,
  bounds,
  disableLivePreview = false,
  getWorldPointFromClient,
  onClick,
  onInteractionEnd,
  onInteractionStart,
  onTransformCommit,
  onTransformPreview,
  interactive = true,
  onTransformChange,
  showHandles = true,
  transform,
  transactionKeyPrefix,
  useImperativePreview = false,
  zoom,
}: PositioningBoxOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const handleRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragRef = useRef<PositioningDragState | null>(null);
  const pinchRef = useRef<{
    gesture: PositioningPinchState;
    transactionKey: string;
  } | null>(null);
  const dragSequenceRef = useRef(0);
  const [dragMode, setDragMode] = useState<PositioningDragMode | null>(null);
  const pointerDownRef = useRef<{
    clientX: number;
    clientY: number;
    dragged: boolean;
    mode: PositioningDragMode;
  } | null>(null);
  const controlScale = zoom > 0 ? 1 / zoom : 1;
  const handleSize = 14 * controlScale;
  const outlineWidth = Math.max(1, 1.5 * controlScale);
  const handleBorderWidth = Math.max(1, 1.25 * controlScale);
  const dragThreshold = 4;
  const latestTransformRef = useRef(transform);
  const latestBoundsRef = useRef(bounds);
  const latestBaseRectRef = useRef(baseRect);
  const latestGetWorldPointFromClientRef = useRef(getWorldPointFromClient);
  const latestOnTransformCommitRef = useRef(onTransformCommit);
  const latestOnClickRef = useRef(onClick);
  const latestOnInteractionEndRef = useRef(onInteractionEnd);
  const latestOnInteractionStartRef = useRef(onInteractionStart);
  const latestOnTransformPreviewRef = useRef(onTransformPreview);
  const pendingTransformRef = useRef<{
    transactionKey: string;
    transform: PositioningTransform;
  } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [previewBounds, setPreviewBounds] = useState(bounds);

  const applyPreviewBounds = useCallback(
    (nextBounds: PositioningRect) => {
      const overlayElement = overlayRef.current;

      if (!overlayElement) {
        return;
      }

      overlayElement.style.left = `${nextBounds.left}px`;
      overlayElement.style.top = `${nextBounds.top}px`;
      overlayElement.style.width = `${nextBounds.width}px`;
      overlayElement.style.height = `${nextBounds.height}px`;

      for (const handle of POSITIONING_HANDLES) {
        const handleElement = handleRefs.current[handle.id];

        if (!handleElement) {
          continue;
        }

        handleElement.style.left = `${getHandleLeft(handle.id, nextBounds.width, handleSize)}px`;
        handleElement.style.top = `${getHandleTop(handle.id, nextBounds.height, handleSize)}px`;
      }
    },
    [handleSize],
  );

  useEffect(() => {
    latestTransformRef.current = transform;
  }, [transform]);

  useEffect(() => {
    setPreviewBounds(bounds);
  }, [bounds]);

  useEffect(() => {
    if (useImperativePreview) {
      applyPreviewBounds(bounds);
    }
  }, [applyPreviewBounds, bounds, useImperativePreview]);

  useEffect(() => {
    latestBaseRectRef.current = baseRect;
  }, [baseRect]);

  useEffect(() => {
    latestGetWorldPointFromClientRef.current = getWorldPointFromClient;
  }, [getWorldPointFromClient]);

  useEffect(() => {
    latestOnTransformCommitRef.current = onTransformCommit;
  }, [onTransformCommit]);

  useEffect(() => {
    latestOnClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    latestOnInteractionEndRef.current = onInteractionEnd;
  }, [onInteractionEnd]);

  useEffect(() => {
    latestOnInteractionStartRef.current = onInteractionStart;
  }, [onInteractionStart]);

  useEffect(() => {
    latestOnTransformPreviewRef.current = onTransformPreview;
  }, [onTransformPreview]);

  useEffect(() => {
    latestBoundsRef.current = previewBounds;
  }, [previewBounds]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const scheduleTransformChange = useCallback(
    (nextTransform: PositioningTransform, transactionKey: string) => {
      latestTransformRef.current = nextTransform;
      if (!disableLivePreview) {
        const nextBounds = getPositionedBounds(
          latestBaseRectRef.current,
          nextTransform,
        );
        if (useImperativePreview) {
          applyPreviewBounds(nextBounds);
        } else {
          setPreviewBounds(nextBounds);
        }
        latestOnTransformPreviewRef.current?.(nextTransform);
      }
      pendingTransformRef.current = {
        transactionKey,
        transform: nextTransform,
      };

      if (animationFrameRef.current !== null) {
        return;
      }

      animationFrameRef.current = window.requestAnimationFrame(() => {
        animationFrameRef.current = null;
        const pending = pendingTransformRef.current;
        pendingTransformRef.current = null;

        if (!pending) {
          return;
      }

      onTransformChange(pending.transform, pending.transactionKey);
    });
  },
    [applyPreviewBounds, disableLivePreview, onTransformChange, useImperativePreview],
  );

  useEffect(() => {
    const handleWindowPointerMove = (event: PointerEvent) => {
      const dragState = dragRef.current;
      const pointerDown = pointerDownRef.current;

      if (pinchRef.current || !dragState || !pointerDown) {
        return;
      }

      if (!pointerDown.dragged) {
        const deltaX = event.clientX - pointerDown.clientX;
        const deltaY = event.clientY - pointerDown.clientY;
        const distance = Math.hypot(deltaX, deltaY);

        if (distance < dragThreshold) {
          return;
        }

        pointerDown.dragged = true;
        setDragMode(pointerDown.mode);
      }

      const worldPoint = latestGetWorldPointFromClientRef.current(
        event.clientX,
        event.clientY,
      );

      if (!worldPoint) {
        return;
      }

      const nextTransform = getTransformFromDrag(
        dragState,
        worldPoint,
        latestBaseRectRef.current,
      );
      scheduleTransformChange(nextTransform, dragState.transactionKey);
    };

    const handleWindowPointerUp = () => {
      if (pinchRef.current) {
        return;
      }

      const pointerDown = pointerDownRef.current;

      if (interactive && pointerDown && !pointerDown.dragged && pointerDown.mode === "move") {
        latestOnClickRef.current?.();
      }

      if (pointerDown?.dragged && dragRef.current) {
        latestOnTransformCommitRef.current?.(
          latestTransformRef.current,
          dragRef.current.transactionKey,
        );
      }

      if (pointerDown) {
        latestOnInteractionEndRef.current?.();
      }

      pointerDownRef.current = null;
      dragRef.current = null;
      setDragMode(null);
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
    };
  }, [
    interactive,
    scheduleTransformChange,
  ]);

  useEffect(() => {
    const overlayElement = overlayRef.current;

    if (!overlayElement || !interactive) {
      return;
    }

    const getTouchGeometry = (touches: TouchList) => {
      if (touches.length < 2) {
        return null;
      }

      const first = touches[0];
      const second = touches[1];
      const centerClientX = (first.clientX + second.clientX) / 2;
      const centerClientY = (first.clientY + second.clientY) / 2;
      const centerWorld = latestGetWorldPointFromClientRef.current(
        centerClientX,
        centerClientY,
      );

      if (!centerWorld) {
        return null;
      }

      const distance = Math.hypot(
        second.clientX - first.clientX,
        second.clientY - first.clientY,
      );

      if (distance <= 0) {
        return null;
      }

      return { centerWorld, distance };
    };

    const handleTouchStart = (event: TouchEvent) => {
      event.stopPropagation();

      if (event.touches.length !== 2) {
        return;
      }

      const geometry = getTouchGeometry(event.touches);

      if (!geometry) {
        return;
      }

      event.preventDefault();
      dragRef.current = null;
      pointerDownRef.current = null;
      setDragMode(null);
      dragSequenceRef.current += 1;
      pinchRef.current = {
        gesture: {
          anchorX:
            latestBoundsRef.current.width > 0
              ? Math.min(
                  1,
                  Math.max(
                    0,
                    (geometry.centerWorld.x - latestBoundsRef.current.left) /
                      latestBoundsRef.current.width,
                  ),
                )
              : 0.5,
          anchorY:
            latestBoundsRef.current.height > 0
              ? Math.min(
                  1,
                  Math.max(
                    0,
                    (geometry.centerWorld.y - latestBoundsRef.current.top) /
                      latestBoundsRef.current.height,
                  ),
                )
              : 0.5,
          startDistance: geometry.distance,
          startTransform: latestTransformRef.current,
        },
        transactionKey: `${transactionKeyPrefix}-${dragSequenceRef.current}`,
      };
      pendingTransformRef.current = null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const pinch = pinchRef.current;

      if (!pinch) {
        return;
      }

      if (event.touches.length < 2) {
        pinchRef.current = null;
        return;
      }

      const geometry = getTouchGeometry(event.touches);

      if (!geometry) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const nextTransform = getTransformFromPinch(
        pinch.gesture,
        geometry.centerWorld,
        geometry.distance,
        latestBaseRectRef.current,
      );
      scheduleTransformChange(nextTransform, pinch.transactionKey);
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (!pinchRef.current) {
        return;
      }

      event.stopPropagation();

      if (event.touches.length >= 2) {
        return;
      }

      latestOnTransformCommitRef.current?.(
        latestTransformRef.current,
        pinchRef.current.transactionKey,
      );
      latestOnInteractionEndRef.current?.();
      pinchRef.current = null;
    };

    overlayElement.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    overlayElement.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    overlayElement.addEventListener("touchend", handleTouchEnd);
    overlayElement.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      overlayElement.removeEventListener("touchstart", handleTouchStart);
      overlayElement.removeEventListener("touchmove", handleTouchMove);
      overlayElement.removeEventListener("touchend", handleTouchEnd);
      overlayElement.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [
    interactive,
    scheduleTransformChange,
    transactionKeyPrefix,
  ]);

  function beginDrag(mode: PositioningDragMode, clientX: number, clientY: number) {
    const worldPoint = latestGetWorldPointFromClientRef.current(clientX, clientY);

    if (!worldPoint) {
      return;
    }

    dragSequenceRef.current += 1;
    dragRef.current = {
      mode,
      startPoint: worldPoint,
      startTransform: latestTransformRef.current,
      startBounds: latestBoundsRef.current,
      transactionKey: `${transactionKeyPrefix}-${dragSequenceRef.current}`,
    };
    pendingTransformRef.current = null;
    latestOnInteractionStartRef.current?.();
    pointerDownRef.current = {
      clientX,
      clientY,
      dragged: false,
      mode,
    };
    setDragMode(null);
  }

  return (
    <div
      ref={overlayRef}
      aria-label={ariaLabel}
      role="presentation"
      style={{
        position: "absolute",
        left: `${previewBounds.left}px`,
        top: `${previewBounds.top}px`,
        width: `${previewBounds.width}px`,
        height: `${previewBounds.height}px`,
        cursor: interactive ? (dragMode === "move" ? "grabbing" : "grab") : "default",
        userSelect: "none",
        WebkitUserSelect: "none",
        pointerEvents: interactive ? "auto" : "none",
        touchAction: "none",
      }}
      onPointerDown={(event) => {
        if (!interactive) {
          return;
        }
        if (event.pointerType === "mouse" && event.button !== 0) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        beginDrag("move", event.clientX, event.clientY);
      }}
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

      {showHandles ? POSITIONING_HANDLES.map((handle) => {
        const handleLeft = getHandleLeft(handle.id, previewBounds.width, handleSize);
        const handleTop = getHandleTop(handle.id, previewBounds.height, handleSize);

        return (
          <div
            key={handle.id}
            ref={(node) => {
              handleRefs.current[handle.id] = node;
            }}
            role="presentation"
            aria-hidden="true"
            onPointerDown={(event) => {
              if (event.pointerType === "mouse" && event.button !== 0) {
                return;
              }
              event.preventDefault();
              event.stopPropagation();
              event.currentTarget.setPointerCapture(event.pointerId);
              beginDrag(handle.id, event.clientX, event.clientY);
            }}
            style={{
              position: "absolute",
              left: `${handleLeft}px`,
              top: `${handleTop}px`,
              width: `${handleSize}px`,
              height: `${handleSize}px`,
              borderRadius: handle.kind === "edge" ? `${4 * controlScale}px` : "999px",
              background: "#ffffff",
              border: `${handleBorderWidth}px solid #2563eb`,
              cursor: handle.cursor,
            }}
          />
        );
      }) : null}
    </div>
  );
}
