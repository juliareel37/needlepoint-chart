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
  onTransformChange: (transform: PositioningTransform, transactionKey: string) => void;
  transform: PositioningTransform;
  transactionKeyPrefix: string;
  zoom: number;
}

export function PositioningBoxOverlay({
  ariaLabel,
  baseRect,
  bounds,
  getWorldPointFromClient,
  onTransformChange,
  transform,
  transactionKeyPrefix,
  zoom,
}: PositioningBoxOverlayProps) {
  const dragRef = useRef<PositioningDragState | null>(null);
  const dragSequenceRef = useRef(0);
  const [dragMode, setDragMode] = useState<PositioningDragMode | null>(null);
  const controlScale = zoom > 0 ? 1 / zoom : 1;
  const handleSize = 14 * controlScale;
  const outlineWidth = Math.max(1, 1.5 * controlScale);
  const handleBorderWidth = Math.max(1, 1.25 * controlScale);

  useEffect(() => {
    const handleWindowMouseMove = (event: MouseEvent) => {
      const dragState = dragRef.current;

      if (!dragState) {
        return;
      }

      const worldPoint = getWorldPointFromClient(event.clientX, event.clientY);

      if (!worldPoint) {
        return;
      }

      const nextTransform = getTransformFromDrag(dragState, worldPoint, baseRect);
      onTransformChange(nextTransform, dragState.transactionKey);
    };

    const handleWindowMouseUp = () => {
      dragRef.current = null;
      setDragMode(null);
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [baseRect, getWorldPointFromClient, onTransformChange]);

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
    setDragMode(mode);
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
        cursor: dragMode === "move" ? "grabbing" : "grab",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
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

      {POSITIONING_HANDLES.map((handle) => {
        const handleLeft = getHandleLeft(handle.id, bounds.width, handleSize);
        const handleTop = getHandleTop(handle.id, bounds.height, handleSize);

        return (
          <div
            key={handle.id}
            role="presentation"
            aria-hidden="true"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
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
      })}
    </div>
  );
}
