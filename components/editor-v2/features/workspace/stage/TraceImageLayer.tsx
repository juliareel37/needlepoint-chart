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
const DESKTOP_TRACE_DRAG_PROXY_MODE: "off" | "solid-rect" = "off";
const MOBILE_TRACE_DRAG_PROXY_MODE: "off" | "solid-rect" = "solid-rect";
const MIN_VISIBLE_TRACE_PX = 24;

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
  const desktopCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const desktopProxyRef = useRef<HTMLDivElement | null>(null);
  const mobileCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mobileWrapperRef = useRef<HTMLDivElement | null>(null);
  const mobileProxyRef = useRef<HTMLDivElement | null>(null);
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
    const desktopCanvas = desktopCanvasRef.current;
    if (desktopCanvas) {
      desktopCanvas.style.transform = getPositioningTransformCss(traceTransform);
    }
    applyMobileWrapperTransform(mobileWrapperRef.current, traceTransform);
    applyDesktopProxyTransform(desktopProxyRef.current, traceTransform);
    applyMobileWrapperTransform(mobileProxyRef.current, traceTransform);
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
    const clampedTrace = traceBaseRect
      ? clampTraceTransformToSurface(nextTrace, traceBaseRect, metrics)
      : nextTrace;
    applyDesktopDragTransform(
      desktopCanvasRef.current,
      desktopProxyRef.current,
      clampedTrace,
      DESKTOP_TRACE_DRAG_PROXY_MODE,
    );
  }, [metrics, traceBaseRect]);

  const handleDesktopTransformCommit = useCallback(
    (nextTrace: typeof traceTransform) => {
      const clampedTrace = traceBaseRect
        ? clampTraceTransformToSurface(nextTrace, traceBaseRect, metrics)
        : nextTrace;
      applyDesktopTransform(desktopCanvasRef.current, clampedTrace);
      applyDesktopProxyTransform(desktopProxyRef.current, clampedTrace);
      setDesktopProxyActive(desktopCanvasRef.current, desktopProxyRef.current, false);
      dispatch(createPreviewTraceRepositionCommand(clampedTrace));
    },
    [dispatch, metrics, traceBaseRect],
  );
  const handleMobileTransformCommit = useCallback(
    (nextTrace: typeof traceTransform) => {
      const clampedTrace = traceBaseRect
        ? clampTraceTransformToSurface(nextTrace, traceBaseRect, metrics)
        : nextTrace;
      applyMobileWrapperTransform(mobileWrapperRef.current, clampedTrace);
      applyMobileWrapperTransform(mobileProxyRef.current, clampedTrace);
      setMobileProxyActive(mobileWrapperRef.current, mobileProxyRef.current, false);
      dispatch(createPreviewTraceRepositionCommand(clampedTrace));
    },
    [dispatch, metrics, traceBaseRect],
  );

  const handleDesktopInteractionStart = useCallback(() => {
    setDesktopProxyActive(desktopCanvasRef.current, desktopProxyRef.current, true);
  }, []);

  const handleDesktopInteractionEnd = useCallback(() => {
    setDesktopProxyActive(desktopCanvasRef.current, desktopProxyRef.current, false);
  }, []);

  const handleMobileInteractionStart = useCallback(() => {
    setMobileProxyActive(mobileWrapperRef.current, mobileProxyRef.current, true);
  }, []);

  const handleMobileInteractionEnd = useCallback(() => {
    setMobileProxyActive(mobileWrapperRef.current, mobileProxyRef.current, false);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex,
        overflow: "hidden",
        pointerEvents: positioningEnabled ? "auto" : "none",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {coarsePointer && positioningEnabled && traceBaseRect ? (
        <>
          <div
            ref={mobileWrapperRef}
            aria-label="Trace image controls"
            role="presentation"
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
              pointerEvents: "none",
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
          </div>
          <div
            ref={mobileProxyRef}
            aria-hidden="true"
            style={{
              position: "absolute",
              top: `${traceBaseRect.top}px`,
              left: `${traceBaseRect.left}px`,
              width: `${traceBaseRect.width}px`,
              height: `${traceBaseRect.height}px`,
              display: "none",
              transform: getMobileWrapperTransformCss(traceTransform),
              transformOrigin: "top left",
              willChange: "transform",
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              pointerEvents: "none",
              background: "rgba(37, 99, 235, 0.18)",
              border: "1px solid rgba(37, 99, 235, 0.9)",
              boxSizing: "border-box",
            }}
          />
        </>
      ) : null}

      {coarsePointer && positioningEnabled && traceBaseRect && traceBounds ? (
        <PositioningBoxOverlay
          ariaLabel="Trace image controls"
          baseRect={traceBaseRect}
          bounds={traceBounds}
          getWorldPointFromClient={getWorldPointFromClient}
          onTransformCommit={handleMobileTransformCommit}
          previewBoundsStrategy="none"
          showHandles={false}
          transactionKeyPrefix="trace-drag"
          transform={traceTransform}
          usePointerCapture={false}
          zoom={zoom}
        />
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
          <div
            ref={desktopProxyRef}
            aria-hidden="true"
            style={{
              position: "absolute",
              top: `${traceBaseRect?.top ?? 0}px`,
              left: `${traceBaseRect?.left ?? 0}px`,
              width: `${traceBaseRect?.width ?? metrics.surfaceWidth}px`,
              height: `${traceBaseRect?.height ?? metrics.surfaceHeight}px`,
              display: "none",
              transform: getPositioningTransformCss(traceTransform),
              transformOrigin: "top left",
              willChange: "transform",
              pointerEvents: "none",
              background: "rgba(37, 99, 235, 0.18)",
              border: "1px solid rgba(37, 99, 235, 0.9)",
              boxSizing: "border-box",
            }}
          />

          {positioningEnabled && traceBaseRect && traceBounds ? (
            <PositioningBoxOverlay
              ariaLabel="Trace image controls"
              baseRect={traceBaseRect}
              bounds={traceBounds}
              getWorldPointFromClient={getWorldPointFromClient}
              onInteractionEnd={handleDesktopInteractionEnd}
              onInteractionStart={handleDesktopInteractionStart}
              onTransformCommit={handleDesktopTransformCommit}
              onTransformPreview={handleDesktopTransformPreview}
              previewBoundsStrategy="none"
              showHandles={false}
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

function applyDesktopTransform(
  element: HTMLCanvasElement | null,
  transform: { offsetX: number; offsetY: number; scale: number },
): void {
  if (!element) {
    return;
  }

  element.style.transform = getPositioningTransformCss(transform);
}

function applyDesktopProxyTransform(
  element: HTMLDivElement | null,
  transform: { offsetX: number; offsetY: number; scale: number },
): void {
  if (!element) {
    return;
  }

  element.style.transform = getPositioningTransformCss(transform);
}

function applyDesktopDragTransform(
  canvas: HTMLCanvasElement | null,
  proxy: HTMLDivElement | null,
  transform: { offsetX: number; offsetY: number; scale: number },
  proxyMode: "off" | "solid-rect",
): void {
  if (proxyMode === "solid-rect") {
    applyDesktopProxyTransform(proxy, transform);
    return;
  }

  applyDesktopTransform(canvas, transform);
}

function applyMobileDragTransform(
  wrapper: HTMLDivElement | null,
  proxy: HTMLDivElement | null,
  transform: { offsetX: number; offsetY: number; scale: number },
  proxyMode: "off" | "solid-rect",
): void {
  if (proxyMode === "solid-rect") {
    applyMobileWrapperTransform(proxy, transform);
    return;
  }

  applyMobileWrapperTransform(wrapper, transform);
}

function setDesktopProxyActive(
  canvas: HTMLCanvasElement | null,
  proxy: HTMLDivElement | null,
  dragging: boolean,
): void {
  if (!canvas || !proxy) {
    return;
  }

  const showProxy = dragging && DESKTOP_TRACE_DRAG_PROXY_MODE === "solid-rect";
  canvas.style.visibility = showProxy ? "hidden" : "visible";
  proxy.style.display = showProxy ? "block" : "none";
}

function setMobileProxyActive(
  wrapper: HTMLDivElement | null,
  proxy: HTMLDivElement | null,
  dragging: boolean,
): void {
  if (!wrapper || !proxy) {
    return;
  }

  const showProxy = dragging && MOBILE_TRACE_DRAG_PROXY_MODE === "solid-rect";
  wrapper.style.display = showProxy ? "none" : "block";
  proxy.style.display = showProxy ? "block" : "none";
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

function clampTraceTransformToSurface(
  transform: { offsetX: number; offsetY: number; scale: number },
  baseRect: { left: number; top: number; width: number; height: number },
  metrics: Pick<GridWorldMetrics, "surfaceWidth" | "surfaceHeight">,
): { offsetX: number; offsetY: number; scale: number } {
  const width = baseRect.width * transform.scale;
  const height = baseRect.height * transform.scale;
  const minLeft = MIN_VISIBLE_TRACE_PX - width;
  const maxLeft = metrics.surfaceWidth - MIN_VISIBLE_TRACE_PX;
  const minTop = MIN_VISIBLE_TRACE_PX - height;
  const maxTop = metrics.surfaceHeight - MIN_VISIBLE_TRACE_PX;
  const nextLeft = clamp(transform.offsetX + baseRect.left, minLeft, maxLeft);
  const nextTop = clamp(transform.offsetY + baseRect.top, minTop, maxTop);

  return {
    offsetX: nextLeft - baseRect.left,
    offsetY: nextTop - baseRect.top,
    scale: transform.scale,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
