"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { EditorStore, TraceDocument } from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics, WorldPoint } from "@/lib/editor-v2/editor/viewport";
import { getTraceTransform } from "@/lib/editor-v2/editor/viewport";
import { createUpdateTraceCommand } from "../workspaceCommands";

interface TraceImageLayerProps {
  dispatch: EditorStore["dispatch"];
  getWorldPointFromClient: (clientX: number, clientY: number) => WorldPoint | null;
  imageOpacity: number;
  metrics: GridWorldMetrics;
  positioningEnabled: boolean;
  trace: TraceDocument;
  zoom: number;
}

export function TraceImageLayer({
  dispatch,
  getWorldPointFromClient,
  imageOpacity,
  metrics,
  positioningEnabled,
  trace,
  zoom,
}: TraceImageLayerProps) {
  const [traceAssetSize, setTraceAssetSize] = useState<{
    assetUrl: string;
    width: number;
    height: number;
  } | null>(null);
  const traceDragRef = useRef<TraceDragState | null>(null);
  const traceDragSequenceRef = useRef(0);
  const [traceDragMode, setTraceDragMode] = useState<TraceHandleId | "move" | null>(null);
  const activeTraceAssetSize =
    traceAssetSize?.assetUrl === trace.assetUrl ? traceAssetSize : null;
  const traceBaseRect = useMemo(
    () =>
      activeTraceAssetSize
        ? getContainedTraceRect(
            activeTraceAssetSize.width,
            activeTraceAssetSize.height,
            metrics.surfaceWidth,
            metrics.surfaceHeight,
          )
        : null,
    [activeTraceAssetSize, metrics.surfaceHeight, metrics.surfaceWidth],
  );
  const traceBounds = useMemo(
    () =>
      traceBaseRect
        ? {
            left: traceBaseRect.left + trace.offsetX,
            top: traceBaseRect.top + trace.offsetY,
            width: traceBaseRect.width * trace.scale,
            height: traceBaseRect.height * trace.scale,
          }
        : null,
    [trace, traceBaseRect],
  );
  const traceControlScale = zoom > 0 ? 1 / zoom : 1;
  const traceHandleSize = 14 * traceControlScale;
  const traceOutlineWidth = Math.max(1, 1.5 * traceControlScale);
  const traceHandleBorderWidth = Math.max(1, 1.25 * traceControlScale);

  useEffect(() => {
    const handleWindowMouseMove = (event: MouseEvent) => {
      const traceDragState = traceDragRef.current;

      if (!traceDragState || !traceBaseRect) {
        return;
      }

      const worldPoint = getWorldPointFromClient(event.clientX, event.clientY);

      if (!worldPoint) {
        return;
      }

      const nextTrace = getTraceTransformFromDrag(traceDragState, worldPoint, traceBaseRect);
      dispatch(
        createUpdateTraceCommand(nextTrace, {
          source: "canvas",
          transactionKey: traceDragState.transactionKey,
        }),
      );
    };

    const handleWindowMouseUp = () => {
      traceDragRef.current = null;
      setTraceDragMode(null);
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [dispatch, getWorldPointFromClient, traceBaseRect]);

  function beginTraceDrag(mode: TraceHandleId | "move", clientX: number, clientY: number) {
    if (!(positioningEnabled && traceBaseRect && traceBounds)) {
      return;
    }

    const worldPoint = getWorldPointFromClient(clientX, clientY);

    if (!worldPoint) {
      return;
    }

    traceDragSequenceRef.current += 1;
    traceDragRef.current = {
      mode,
      startPoint: worldPoint,
      startTrace: {
        offsetX: trace.offsetX,
        offsetY: trace.offsetY,
        scale: trace.scale,
      },
      startBounds: traceBounds,
      transactionKey: `trace-drag-${traceDragSequenceRef.current}`,
    };
    setTraceDragMode(mode);
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 3,
        overflow: positioningEnabled ? "visible" : "hidden",
        pointerEvents: positioningEnabled ? "auto" : "none",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <img
        src={trace.assetUrl}
        alt="Trace reference"
        draggable={false}
        onDragStart={(event) => event.preventDefault()}
        onLoad={(event) => {
          const { naturalWidth, naturalHeight } = event.currentTarget;

          if (naturalWidth > 0 && naturalHeight > 0) {
            setTraceAssetSize({
              assetUrl: trace.assetUrl,
              width: naturalWidth,
              height: naturalHeight,
            });
          }
        }}
        style={{
          position: "absolute",
          top: `${traceBaseRect?.top ?? 0}px`,
          left: `${traceBaseRect?.left ?? 0}px`,
          width: `${traceBaseRect?.width ?? metrics.surfaceWidth}px`,
          height: `${traceBaseRect?.height ?? metrics.surfaceHeight}px`,
          opacity: imageOpacity,
          pointerEvents: "none",
          transform: getTraceTransform(trace),
          transformOrigin: "top left",
          willChange: "opacity, transform",
          backfaceVisibility: "hidden",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      />

      {positioningEnabled && traceBounds ? (
        <div
          aria-label="Trace image controls"
          role="presentation"
          style={{
            position: "absolute",
            left: `${traceBounds.left}px`,
            top: `${traceBounds.top}px`,
            width: `${traceBounds.width}px`,
            height: `${traceBounds.height}px`,
            cursor: traceDragMode === "move" ? "grabbing" : "grab",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            beginTraceDrag("move", event.clientX, event.clientY);
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              border: `${traceOutlineWidth}px solid rgba(37, 99, 235, 0.95)`,
              boxShadow: "0 0 0 9999px rgba(37, 99, 235, 0.06)",
              background: "rgba(37, 99, 235, 0.04)",
            }}
          />

          {TRACE_HANDLE_POSITIONS.map((handle) => {
            const handleLeft = getTraceHandleLeft(handle.id, traceBounds.width, traceHandleSize);
            const handleTop = getTraceHandleTop(handle.id, traceBounds.height, traceHandleSize);

            return (
              <div
                key={handle.id}
                role="presentation"
                aria-hidden="true"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  beginTraceDrag(handle.id, event.clientX, event.clientY);
                }}
                style={{
                  position: "absolute",
                  left: `${handleLeft}px`,
                  top: `${handleTop}px`,
                  width: `${traceHandleSize}px`,
                  height: `${traceHandleSize}px`,
                  borderRadius: handle.kind === "edge" ? `${4 * traceControlScale}px` : "999px",
                  background: "#ffffff",
                  border: `${traceHandleBorderWidth}px solid #2563eb`,
                  boxShadow: "0 4px 10px rgba(15, 23, 42, 0.18)",
                  cursor: handle.cursor,
                }}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

type TraceHandleId =
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "nw";

interface TraceDragState {
  mode: TraceHandleId | "move";
  startPoint: { x: number; y: number };
  startTrace: {
    offsetX: number;
    offsetY: number;
    scale: number;
  };
  startBounds: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  transactionKey: string;
}

const TRACE_HANDLE_POSITIONS: Array<{
  id: TraceHandleId;
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

function getContainedTraceRect(
  sourceWidth: number,
  sourceHeight: number,
  frameWidth: number,
  frameHeight: number,
) {
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

function getTraceHandleLeft(handle: TraceHandleId, width: number, size: number): number {
  if (handle === "nw" || handle === "w" || handle === "sw") {
    return -size / 2;
  }

  if (handle === "n" || handle === "s") {
    return width / 2 - size / 2;
  }

  return width - size / 2;
}

function getTraceHandleTop(handle: TraceHandleId, height: number, size: number): number {
  if (handle === "nw" || handle === "n" || handle === "ne") {
    return -size / 2;
  }

  if (handle === "e" || handle === "w") {
    return height / 2 - size / 2;
  }

  return height - size / 2;
}

function getTraceTransformFromDrag(
  dragState: TraceDragState,
  point: { x: number; y: number },
  traceBaseRect: { left: number; top: number; width: number; height: number },
) {
  if (dragState.mode === "move") {
    return {
      offsetX: dragState.startTrace.offsetX + (point.x - dragState.startPoint.x),
      offsetY: dragState.startTrace.offsetY + (point.y - dragState.startPoint.y),
      scale: dragState.startTrace.scale,
    };
  }

  const nextBounds = getTraceBoundsFromHandleDrag(dragState.startBounds, dragState.mode, point);
  const nextScale = clampTraceScale(nextBounds.width / traceBaseRect.width);

  return {
    offsetX: nextBounds.left - traceBaseRect.left,
    offsetY: nextBounds.top - traceBaseRect.top,
    scale: nextScale,
  };
}

function getTraceBoundsFromHandleDrag(
  startBounds: { left: number; top: number; width: number; height: number },
  handle: TraceHandleId,
  point: { x: number; y: number },
) {
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
      const scale = clampTraceScale((point.x - left) / startBounds.width);
      const width = startBounds.width * scale;
      const height = startBounds.height * scale;
      return { left, top: centerY - height / 2, width, height };
    }
    case "w": {
      const scale = clampTraceScale((right - point.x) / startBounds.width);
      const width = startBounds.width * scale;
      const height = startBounds.height * scale;
      return { left: right - width, top: centerY - height / 2, width, height };
    }
    case "s": {
      const scale = clampTraceScale((point.y - top) / startBounds.height);
      const width = startBounds.width * scale;
      const height = startBounds.height * scale;
      return { left: centerX - width / 2, top, width, height };
    }
    case "n": {
      const scale = clampTraceScale((bottom - point.y) / startBounds.height);
      const width = startBounds.width * scale;
      const height = startBounds.height * scale;
      return { left: centerX - width / 2, top: bottom - height, width, height };
    }
    case "se": {
      const scale = clampTraceScale(
        Math.max((point.x - left) / startBounds.width, (point.y - top) / startBounds.height),
      );
      return {
        left,
        top,
        width: Math.max(minWidth, startBounds.width * scale),
        height: Math.max(minHeight, startBounds.height * scale),
      };
    }
    case "sw": {
      const scale = clampTraceScale(
        Math.max((right - point.x) / startBounds.width, (point.y - top) / startBounds.height),
      );
      const width = startBounds.width * scale;
      const height = startBounds.height * scale;
      return { left: right - width, top, width, height };
    }
    case "ne": {
      const scale = clampTraceScale(
        Math.max((point.x - left) / startBounds.width, (bottom - point.y) / startBounds.height),
      );
      const width = startBounds.width * scale;
      const height = startBounds.height * scale;
      return { left, top: bottom - height, width, height };
    }
    case "nw":
    default: {
      const scale = clampTraceScale(
        Math.max((right - point.x) / startBounds.width, (bottom - point.y) / startBounds.height),
      );
      const width = startBounds.width * scale;
      const height = startBounds.height * scale;
      return { left: right - width, top: bottom - height, width, height };
    }
  }
}

function clampTraceScale(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(4, Math.max(0.1, Number(value.toFixed(4))));
}
