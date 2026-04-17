"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EditorStore, TraceDocument } from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics, WorldPoint } from "@/lib/editor-v2/editor/viewport";
import {
  getContainedRect,
  getPositionedBounds,
  getPositioningTransformCss,
} from "@/lib/editor-v2/editor/positioning";
import { createPreviewTraceRepositionCommand } from "../workspaceCommands";
import { PositioningBoxOverlay } from "./overlays/PositioningBoxOverlay";
import type { LoadedTraceAsset } from "./GridCanvasStage.shared";

interface TraceImageLayerProps {
  dispatch: EditorStore["dispatch"];
  getWorldPointFromClient: (clientX: number, clientY: number) => WorldPoint | null;
  imageOpacity: number;
  metrics: GridWorldMetrics;
  positioningEnabled: boolean;
  trace: TraceDocument;
  traceAsset: LoadedTraceAsset | null;
  zIndex?: number;
  zoom: number;
}

export function TraceImageLayer({
  dispatch,
  getWorldPointFromClient,
  imageOpacity,
  metrics,
  positioningEnabled,
  trace,
  traceAsset,
  zIndex = 3,
  zoom,
}: TraceImageLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const traceBaseRect = useMemo(
    () =>
      traceAsset?.width && traceAsset?.height
        ? getContainedRect(
            traceAsset.width,
            traceAsset.height,
            metrics.surfaceWidth,
            metrics.surfaceHeight,
          )
        : null,
    [metrics.surfaceHeight, metrics.surfaceWidth, traceAsset?.height, traceAsset?.width],
  );
  const traceTransform = useMemo(
    () => ({
      offsetX: trace.offsetX,
      offsetY: trace.offsetY,
      scale: trace.scale,
    }),
    [trace.offsetX, trace.offsetY, trace.scale],
  );
  const [draftTransform, setDraftTransform] = useState(traceTransform);

  useEffect(() => {
    setDraftTransform(traceTransform);
  }, [traceTransform]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const imageSource = traceAsset?.image;

    if (!canvas || !traceAsset?.ready || !imageSource || traceAsset.width <= 0 || traceAsset.height <= 0) {
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
      return;
    }

    canvas.width = traceAsset.width;
    canvas.height = traceAsset.height;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, traceAsset.width, traceAsset.height);
    context.drawImage(
      imageSource as CanvasImageSource,
      0,
      0,
      traceAsset.width,
      traceAsset.height,
    );
  }, [traceAsset]);

  const traceBounds = useMemo(
    () =>
      traceBaseRect
        ? getPositionedBounds(traceBaseRect, draftTransform)
        : null,
    [draftTransform, traceBaseRect],
  );
  const handleTraceTransformChange = useCallback(
    (nextTrace: typeof traceTransform) => {
      setDraftTransform(nextTrace);
    },
    [],
  );
  const handleTraceTransformCommit = useCallback(
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
      <canvas
        ref={canvasRef}
        aria-label="Trace reference"
        role="img"
        style={{
          position: "absolute",
          top: `${traceBaseRect?.top ?? 0}px`,
          left: `${traceBaseRect?.left ?? 0}px`,
          width: `${traceBaseRect?.width ?? metrics.surfaceWidth}px`,
          height: `${traceBaseRect?.height ?? metrics.surfaceHeight}px`,
          opacity: imageOpacity,
          pointerEvents: "none",
          transform: getPositioningTransformCss(draftTransform),
          transformOrigin: "top left",
          willChange: "transform",
          backfaceVisibility: "hidden",
          userSelect: "none",
          WebkitUserSelect: "none",
          imageRendering: "auto",
        }}
      />

      {positioningEnabled && traceBaseRect && traceBounds ? (
        <PositioningBoxOverlay
          ariaLabel="Trace image controls"
          baseRect={traceBaseRect}
          bounds={traceBounds}
          getWorldPointFromClient={getWorldPointFromClient}
          onTransformChange={handleTraceTransformChange}
          onTransformCommit={handleTraceTransformCommit}
          transactionKeyPrefix="trace-drag"
          transform={draftTransform}
          zoom={zoom}
        />
      ) : null}
    </div>
  );
}
