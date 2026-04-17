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
  const previewTransformRef = useRef(traceTransform);
  const [interactionActive, setInteractionActive] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);

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
    previewTransformRef.current = traceTransform;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.transform = getPositioningTransformCss(traceTransform);
    }
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
        ? getPositionedBounds(traceBaseRect, traceTransform)
        : null,
    [traceBaseRect, traceTransform],
  );
  const handleTraceTransformPreview = useCallback((nextTrace: typeof traceTransform) => {
    previewTransformRef.current = nextTrace;
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.style.transform = getPositioningTransformCss(nextTrace);
  }, []);
  const handleTraceTransformChange = useCallback(() => {}, []);
  const handleTraceTransformCommit = useCallback(
    (nextTrace: typeof traceTransform) => {
      previewTransformRef.current = nextTrace;
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
          opacity: coarsePointer && interactionActive ? 0 : imageOpacity,
          pointerEvents: "none",
          transform: getPositioningTransformCss(traceTransform),
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
          disableLivePreview={coarsePointer}
          getWorldPointFromClient={getWorldPointFromClient}
          onInteractionEnd={() => setInteractionActive(false)}
          onInteractionStart={() => setInteractionActive(true)}
          onTransformChange={handleTraceTransformChange}
          onTransformCommit={handleTraceTransformCommit}
          onTransformPreview={handleTraceTransformPreview}
          transactionKeyPrefix="trace-drag"
          transform={traceTransform}
          zoom={zoom}
        />
      ) : null}
    </div>
  );
}
