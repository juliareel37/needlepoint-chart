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

interface MobileDragState {
  moved: boolean;
  pointerId: number;
  startPoint: WorldPoint;
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
    const canvases = [desktopCanvasRef.current, mobileCanvasRef.current];

    for (const canvas of canvases) {
      if (!canvas || !traceAsset?.ready || !imageSource || traceAsset.width <= 0 || traceAsset.height <= 0) {
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
        }
        continue;
      }

      canvas.width = traceAsset.width;
      canvas.height = traceAsset.height;

      const context = canvas.getContext("2d");
      if (!context) {
        continue;
      }

      context.clearRect(0, 0, traceAsset.width, traceAsset.height);
      context.drawImage(
        imageSource as CanvasImageSource,
        0,
        0,
        traceAsset.width,
        traceAsset.height,
      );
    }
  }, [traceAsset, coarsePointer]);

  useEffect(() => {
    if (!coarsePointer || !positioningEnabled) {
      mobileDragStateRef.current = null;
      return;
    }

    const handleWindowPointerMove = (event: PointerEvent) => {
      const dragState = mobileDragStateRef.current;

      if (!dragState || event.pointerId !== dragState.pointerId) {
        return;
      }

      const worldPoint = getWorldPointFromClient(event.clientX, event.clientY);

      if (!worldPoint) {
        return;
      }

      const deltaX = worldPoint.x - dragState.startPoint.x;
      const deltaY = worldPoint.y - dragState.startPoint.y;
      dragState.moved = dragState.moved || Math.hypot(deltaX, deltaY) >= 1;
      const nextTransform = {
        offsetX: dragState.startTransform.offsetX + deltaX,
        offsetY: dragState.startTransform.offsetY + deltaY,
        scale: dragState.startTransform.scale,
      };

      mobilePreviewTransformRef.current = nextTransform;
      applyMobileWrapperTransform(mobileWrapperRef.current, nextTransform);
    };

    const handleWindowPointerUp = (event: PointerEvent) => {
      const dragState = mobileDragStateRef.current;

      if (!dragState || event.pointerId !== dragState.pointerId) {
        return;
      }

      const wrapper = mobileWrapperRef.current;
      if (wrapper?.hasPointerCapture(event.pointerId)) {
        wrapper.releasePointerCapture(event.pointerId);
      }

      if (dragState.moved) {
        dispatch(
          createPreviewTraceRepositionCommand(mobilePreviewTransformRef.current),
        );
      } else {
        applyMobileWrapperTransform(wrapper, traceTransform);
      }

      mobileDragStateRef.current = null;
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
    };
  }, [coarsePointer, dispatch, getWorldPointFromClient, positioningEnabled, traceTransform]);

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

      const worldPoint = getWorldPointFromClient(event.clientX, event.clientY);

      if (!worldPoint) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      mobileDragStateRef.current = {
        moved: false,
        pointerId: event.pointerId,
        startPoint: worldPoint,
        startTransform: mobilePreviewTransformRef.current,
      };
    },
    [coarsePointer, getWorldPointFromClient, positioningEnabled],
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
