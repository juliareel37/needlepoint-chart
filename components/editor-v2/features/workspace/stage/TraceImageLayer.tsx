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

const MOBILE_TRACE_DRAG_PREVIEW_MAX_DIMENSION = 1024;

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

interface MobileDragState {
  moved: boolean;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startTransform: {
    offsetX: number;
    offsetY: number;
    scale: number;
  };
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
  const desktopCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mobileCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mobileWrapperRef = useRef<HTMLDivElement | null>(null);
  const mobileDragStateRef = useRef<MobileDragState | null>(null);
  const mobilePreviewTransformRef = useRef({
    offsetX: trace.offsetX,
    offsetY: trace.offsetY,
    scale: trace.scale,
  });
  const [coarsePointer, setCoarsePointer] = useState(false);
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
  const traceBounds = useMemo(
    () =>
      traceBaseRect
        ? getPositionedBounds(traceBaseRect, traceTransform)
        : null,
    [traceBaseRect, traceTransform],
  );

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
    mobilePreviewTransformRef.current = traceTransform;

    const desktopCanvas = desktopCanvasRef.current;
    if (desktopCanvas) {
      desktopCanvas.style.transform = getPositioningTransformCss(traceTransform);
    }

    if (!mobileDragStateRef.current) {
      applyMobileWrapperTransform(mobileWrapperRef.current, traceTransform);
    }
  }, [traceTransform]);

  useEffect(() => {
    const imageSource = traceAsset?.image;
    const desktopCanvas = desktopCanvasRef.current;
    const mobileCanvas = mobileCanvasRef.current;

    if (!traceAsset?.ready || !imageSource || traceAsset.width <= 0 || traceAsset.height <= 0) {
      if (desktopCanvas) {
        desktopCanvas.width = 0;
        desktopCanvas.height = 0;
      }
      if (mobileCanvas) {
        mobileCanvas.width = 0;
        mobileCanvas.height = 0;
      }
      return;
    }

    if (desktopCanvas) {
      drawTraceSourceToCanvas(desktopCanvas, imageSource as CanvasImageSource, {
        width: traceAsset.width,
        height: traceAsset.height,
      });
    }

    if (mobileCanvas) {
      drawTraceSourceToCanvas(
        mobileCanvas,
        imageSource as CanvasImageSource,
        getMobileTracePreviewSize(traceAsset.width, traceAsset.height),
      );
    }
  }, [traceAsset, coarsePointer]);

  const handleDesktopTransformPreview = useCallback((nextTrace: typeof traceTransform) => {
    const canvas = desktopCanvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.style.transform = getPositioningTransformCss(nextTrace);
  }, []);

  const handleDesktopTransformChange = useCallback(() => {}, []);

  const handleDesktopTransformCommit = useCallback(
    (nextTrace: typeof traceTransform) => {
      dispatch(createPreviewTraceRepositionCommand(nextTrace));
    },
    [dispatch],
  );

  const handleMobilePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!coarsePointer || !positioningEnabled) {
        return;
      }

      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      mobileDragStateRef.current = {
        moved: false,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startTransform: mobilePreviewTransformRef.current,
      };
    },
    [coarsePointer, positioningEnabled],
  );

  const handleMobilePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const dragState = mobileDragStateRef.current;

      if (!coarsePointer || !dragState || event.pointerId !== dragState.pointerId) {
        return;
      }

      const deltaClientX = event.clientX - dragState.startClientX;
      const deltaClientY = event.clientY - dragState.startClientY;
      const viewportScale = Math.max(zoom, 0.001);
      const deltaX = deltaClientX / viewportScale;
      const deltaY = deltaClientY / viewportScale;

      dragState.moved = dragState.moved || Math.hypot(deltaClientX, deltaClientY) >= 3;

      const nextTransform = {
        offsetX: dragState.startTransform.offsetX + deltaX,
        offsetY: dragState.startTransform.offsetY + deltaY,
        scale: dragState.startTransform.scale,
      };

      mobilePreviewTransformRef.current = nextTransform;
      applyMobileWrapperTransform(mobileWrapperRef.current, nextTransform);
    },
    [coarsePointer, zoom],
  );

  const handleMobilePointerEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const dragState = mobileDragStateRef.current;

      if (!coarsePointer || !dragState || event.pointerId !== dragState.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (dragState.moved) {
        dispatch(
          createPreviewTraceRepositionCommand(mobilePreviewTransformRef.current),
        );
      } else {
        applyMobileWrapperTransform(event.currentTarget, traceTransform);
      }

      mobileDragStateRef.current = null;
    },
    [coarsePointer, dispatch, traceTransform],
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
      {coarsePointer && positioningEnabled && traceBaseRect ? (
        <div
          ref={mobileWrapperRef}
          aria-label="Trace image controls"
          role="presentation"
          onPointerDown={handleMobilePointerDown}
          onPointerMove={handleMobilePointerMove}
          onPointerUp={handleMobilePointerEnd}
          onPointerCancel={handleMobilePointerEnd}
          style={{
            position: "absolute",
            top: `${traceBaseRect.top}px`,
            left: `${traceBaseRect.left}px`,
            width: `${traceBaseRect.width}px`,
            height: `${traceBaseRect.height}px`,
            transform: getMobileWrapperTransformCss(traceTransform),
            transformOrigin: "top left",
            willChange: "transform",
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          <canvas
            ref={mobileCanvasRef}
            aria-label="Trace reference"
            role="img"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              opacity: imageOpacity,
              pointerEvents: "none",
              backfaceVisibility: "hidden",
              imageRendering: "auto",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              border: `${Math.max(1, 1.5 / Math.max(zoom, 0.001))}px solid rgba(37, 99, 235, 0.95)`,
              pointerEvents: "none",
            }}
          />
        </div>
      ) : (
        <>
          <canvas
            ref={desktopCanvasRef}
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
              getWorldPointFromClient={getWorldPointFromClient}
              onTransformChange={handleDesktopTransformChange}
              onTransformCommit={handleDesktopTransformCommit}
              onTransformPreview={handleDesktopTransformPreview}
              transactionKeyPrefix="trace-drag"
              transform={traceTransform}
              zoom={zoom}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

function applyMobileWrapperTransform(
  element: HTMLDivElement | null,
  transform: { offsetX: number; offsetY: number; scale: number },
): void {
  if (!element) {
    return;
  }

  element.style.transform = getMobileWrapperTransformCss(transform);
}

function getMobileWrapperTransformCss(transform: {
  offsetX: number;
  offsetY: number;
  scale: number;
}): string {
  return `translate3d(${transform.offsetX}px, ${transform.offsetY}px, 0) scale(${transform.scale})`;
}

function getMobileTracePreviewSize(width: number, height: number): {
  width: number;
  height: number;
} {
  const scale = Math.min(
    1,
    MOBILE_TRACE_DRAG_PREVIEW_MAX_DIMENSION / Math.max(width, height),
  );

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function drawTraceSourceToCanvas(
  canvas: HTMLCanvasElement,
  imageSource: CanvasImageSource,
  size: { width: number; height: number },
): void {
  canvas.width = size.width;
  canvas.height = size.height;

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.clearRect(0, 0, size.width, size.height);
  context.drawImage(imageSource, 0, 0, size.width, size.height);
}
