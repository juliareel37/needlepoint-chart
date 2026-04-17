"use client";

import { useEffect, useRef, useState } from "react";
import type { WorldPoint } from "@/lib/editor-v2/editor/viewport";
import {
  getHandleLeft,
  getHandleTop,
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
  interactive?: boolean;
  onTransformChange: (transform: PositioningTransform, transactionKey: string) => void;
  showHandles?: boolean;
  transform: PositioningTransform;
  transactionKeyPrefix: string;
  zoom: number;
}

export function PositioningBoxOverlay({
  ariaLabel,
  baseRect,
  bounds,
  getWorldPointFromClient,
  onClick,
  interactive = true,
  onTransformChange,
  showHandles = true,
  transform,
  transactionKeyPrefix,
  zoom,
}: PositioningBoxOverlayProps) {
  const dragRef = useRef<PositioningDragState | null>(null);
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

  useEffect(() => {
    const handleWindowPointerMove = (event: PointerEvent) => {
      const dragState = dragRef.current;
      const pointerDown = pointerDownRef.current;

      if (!dragState || !pointerDown) {
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

      const worldPoint = getWorldPointFromClient(event.clientX, event.clientY);

      if (!worldPoint) {
        return;
      }

      const nextTransform = getTransformFromDrag(dragState, worldPoint, baseRect);
      onTransformChange(nextTransform, dragState.transactionKey);
    };

    const handleWindowPointerUp = () => {
      const pointerDown = pointerDownRef.current;

      if (interactive && pointerDown && !pointerDown.dragged && pointerDown.mode === "move") {
        onClick?.();
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
  }, [baseRect, getWorldPointFromClient, interactive, onClick, onTransformChange]);

  function beginDrag(mode: PositioningDragMode, clientX: number, clientY: number) {
    const worldPoint = getWorldPointFromClient(clientX, clientY);

    if (!worldPoint) {
      return;
    }

    dragSequenceRef.current += 1;
    dragRef.current = {
      mode,
      startPoint: worldPoint,
      startTransform: transform,
      startBounds: bounds,
      transactionKey: `${transactionKeyPrefix}-${dragSequenceRef.current}`,
    };
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
      aria-label={ariaLabel}
      role="presentation"
      style={{
        position: "absolute",
        left: `${bounds.left}px`,
        top: `${bounds.top}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
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
          boxShadow: "0 0 0 9999px rgba(37, 99, 235, 0.06)",
          background: "rgba(37, 99, 235, 0.04)",
        }}
      />

      {showHandles ? POSITIONING_HANDLES.map((handle) => {
        const handleLeft = getHandleLeft(handle.id, bounds.width, handleSize);
        const handleTop = getHandleTop(handle.id, bounds.height, handleSize);

        return (
          <div
            key={handle.id}
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
              boxShadow: "0 4px 10px rgba(15, 23, 42, 0.18)",
              cursor: handle.cursor,
            }}
          />
        );
      }) : null}
    </div>
  );
}
