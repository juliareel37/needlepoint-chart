"use client";

import { useCallback, useMemo } from "react";
import type { EditorStore, TraceDocument } from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics, WorldPoint } from "@/lib/editor-v2/editor/viewport";
import {
  getContainedRect,
  getPositionedBounds,
  getPositioningTransformCss,
} from "@/lib/editor-v2/editor/positioning";
import { createPreviewTraceRepositionCommand } from "../workspaceCommands";
import { PositioningBoxOverlay } from "./overlays/PositioningBoxOverlay";

interface TraceImageLayerProps {
  assetHeight: number | null;
  assetWidth: number | null;
  dispatch: EditorStore["dispatch"];
  getWorldPointFromClient: (clientX: number, clientY: number) => WorldPoint | null;
  imageOpacity: number;
  metrics: GridWorldMetrics;
  positioningEnabled: boolean;
  trace: TraceDocument;
  zIndex?: number;
  zoom: number;
}

export function TraceImageLayer({
  assetHeight,
  assetWidth,
  dispatch,
  getWorldPointFromClient,
  imageOpacity,
  metrics,
  positioningEnabled,
  trace,
  zIndex = 3,
  zoom,
}: TraceImageLayerProps) {
  const traceBaseRect = useMemo(
    () =>
      assetWidth && assetHeight
        ? getContainedRect(
            assetWidth,
            assetHeight,
            metrics.surfaceWidth,
            metrics.surfaceHeight,
          )
        : null,
    [assetHeight, assetWidth, metrics.surfaceHeight, metrics.surfaceWidth],
  );
  const traceTransform = useMemo(
    () => ({
      offsetX: trace.offsetX,
      offsetY: trace.offsetY,
      scale: trace.scale,
    }),
    [trace.offsetX, trace.offsetY, trace.scale],
  );
  const traceBounds = useMemo(
    () =>
      traceBaseRect
        ? getPositionedBounds(traceBaseRect, traceTransform)
        : null,
    [traceBaseRect, traceTransform],
  );
  const handleTraceTransformChange = useCallback(
    (nextTrace: typeof traceTransform) => {
      dispatch(
        createPreviewTraceRepositionCommand(nextTrace),
      );
    },
    [dispatch],
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex,
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
        style={{
          position: "absolute",
          top: `${traceBaseRect?.top ?? 0}px`,
          left: `${traceBaseRect?.left ?? 0}px`,
          width: `${traceBaseRect?.width ?? metrics.surfaceWidth}px`,
          height: `${traceBaseRect?.height ?? metrics.surfaceHeight}px`,
          objectFit: "contain",
          opacity: imageOpacity,
          pointerEvents: "none",
          transform: getPositioningTransformCss(traceTransform),
          transformOrigin: "top left",
          willChange: "opacity, transform",
          backfaceVisibility: "hidden",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      />

      {positioningEnabled && traceBaseRect && traceBounds ? (
        <PositioningBoxOverlay
          ariaLabel="Trace image controls"
          baseRect={traceBaseRect}
          bounds={traceBounds}
          getWorldPointFromClient={getWorldPointFromClient}
          onTransformChange={handleTraceTransformChange}
          transactionKeyPrefix="trace-drag"
          transform={traceTransform}
          zoom={zoom}
        />
      ) : null}
    </div>
  );
}
