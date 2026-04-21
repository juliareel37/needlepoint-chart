"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
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

const DESKTOP_TRACE_DRAG_PROXY_MODE: "off" | "solid-rect" = "off";
const MOBILE_TRACE_DRAG_PROXY_MODE: "off" | "solid-rect" = "off";
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

interface MobileTraceDragSession {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  pendingClientX: number;
  pendingClientY: number;
  startPoint: WorldPoint;
  startTransform: {
    offsetX: number;
    offsetY: number;
    scale: number;
  };
}

const MOBILE_DRAG_THRESHOLD = 4;

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
  const mobileWrapperRef = useRef<HTMLDivElement | null>(null);
  const mobileProxyRef = useRef<HTMLDivElement | null>(null);
  const mobileDragSessionRef = useRef<MobileTraceDragSession | null>(null);
  const mobileDragRafRef = useRef<number | null>(null);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const [mobilePreviewTransform, setMobilePreviewTransform] = useState<
    typeof traceTransform | null
  >(null);
  const [mobileDragging, setMobileDragging] = useState(false);
  const traceSourceSize = useMemo(() => {
    if (traceAsset?.width && traceAsset?.height) {
      return {
        width: traceAsset.width,
        height: traceAsset.height,
      };
    }

    if (trace.imageWidth && trace.imageHeight) {
      return {
        width: trace.imageWidth,
        height: trace.imageHeight,
      };
    }

    return null;
  }, [trace.imageHeight, trace.imageWidth, traceAsset?.height, traceAsset?.width]);
  const traceBaseRect = useMemo(
    () =>
      traceSourceSize
        ? getContainedRect(
            traceSourceSize.width,
            traceSourceSize.height,
            metrics.surfaceWidth,
            metrics.surfaceHeight,
          )
        : null,
    [metrics.surfaceHeight, metrics.surfaceWidth, traceSourceSize],
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
  const mobileDisplayTransform = mobilePreviewTransform ?? traceTransform;
  const mobileDisplayBounds = useMemo(
    () =>
      traceBaseRect
        ? getPositionedBounds(traceBaseRect, mobileDisplayTransform)
        : null,
    [mobileDisplayTransform, traceBaseRect],
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

    if (!traceAsset?.ready || !imageSource || traceAsset.width <= 0 || traceAsset.height <= 0) {
      if (desktopCanvas) {
        desktopCanvas.width = 0;
        desktopCanvas.height = 0;
      }
      return;
    }

    if (coarsePointer) {
      if (desktopCanvas) {
        desktopCanvas.width = 0;
        desktopCanvas.height = 0;
      }
    } else if (desktopCanvas) {
      drawTraceSourceToCanvas(desktopCanvas, imageSource as CanvasImageSource, {
        width: traceAsset.width,
        height: traceAsset.height,
      });
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

  const handleMobileDragStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!traceBaseRect) {
        return;
      }
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      const worldPoint = getWorldPointFromClient(event.clientX, event.clientY);
      if (!worldPoint) {
        return;
      }

      mobileDragSessionRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        pendingClientX: event.clientX,
        pendingClientY: event.clientY,
        startPoint: worldPoint,
        startTransform: traceTransform,
      };
      setMobileDragging(true);
      setMobilePreviewTransform(traceTransform);

      event.preventDefault();
      event.stopPropagation();
    },
    [getWorldPointFromClient, traceBaseRect, traceTransform],
  );

  useEffect(() => {
    if (!coarsePointer || !positioningEnabled || !traceBaseRect) {
      return;
    }

    const baseRect = traceBaseRect;

    function flushMobilePreview() {
      mobileDragRafRef.current = null;
      const session = mobileDragSessionRef.current;
      if (!session) {
        return;
      }

      const worldPoint = getWorldPointFromClient(
        session.pendingClientX,
        session.pendingClientY,
      );
      if (!worldPoint) {
        return;
      }

      const nextTrace = clampTraceTransformToSurface(
        {
          offsetX:
            session.startTransform.offsetX + (worldPoint.x - session.startPoint.x),
          offsetY:
            session.startTransform.offsetY + (worldPoint.y - session.startPoint.y),
          scale: session.startTransform.scale,
        },
        baseRect,
        metrics,
      );

      setMobilePreviewTransform(nextTrace);
    }

    const handleWindowPointerMove = (event: PointerEvent) => {
      const session = mobileDragSessionRef.current;
      if (!session || event.pointerId !== session.pointerId) {
        return;
      }

      session.pendingClientX = event.clientX;
      session.pendingClientY = event.clientY;

      if (mobileDragRafRef.current === null) {
        mobileDragRafRef.current = window.requestAnimationFrame(flushMobilePreview);
      }
    };

    const handleWindowPointerEnd = (event: PointerEvent) => {
      const session = mobileDragSessionRef.current;
      if (!session || event.pointerId !== session.pointerId) {
        return;
      }

      if (mobileDragRafRef.current !== null) {
        window.cancelAnimationFrame(mobileDragRafRef.current);
        mobileDragRafRef.current = null;
      }

      mobileDragSessionRef.current = null;

      const deltaX = event.clientX - session.startClientX;
      const deltaY = event.clientY - session.startClientY;
      if (Math.hypot(deltaX, deltaY) < MOBILE_DRAG_THRESHOLD) {
        setMobileDragging(false);
        setMobilePreviewTransform(null);
        return;
      }

      const worldPoint = getWorldPointFromClient(event.clientX, event.clientY);
      if (!worldPoint) {
        return;
      }

      const nextTrace = clampTraceTransformToSurface(
        {
          offsetX:
            session.startTransform.offsetX + (worldPoint.x - session.startPoint.x),
          offsetY:
            session.startTransform.offsetY + (worldPoint.y - session.startPoint.y),
          scale: session.startTransform.scale,
        },
        baseRect,
        metrics,
      );

      setMobileDragging(false);
      setMobilePreviewTransform(null);
      dispatch(createPreviewTraceRepositionCommand(nextTrace));
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerEnd);
    window.addEventListener("pointercancel", handleWindowPointerEnd);

    return () => {
      if (mobileDragRafRef.current !== null) {
        window.cancelAnimationFrame(mobileDragRafRef.current);
        mobileDragRafRef.current = null;
      }
      setMobileDragging(false);
      setMobilePreviewTransform(null);
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);
    };
  }, [
    coarsePointer,
    dispatch,
    getWorldPointFromClient,
    metrics,
    positioningEnabled,
    traceBaseRect,
  ]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex,
        overflow: "visible",
        pointerEvents: positioningEnabled ? "auto" : "none",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {coarsePointer && positioningEnabled && mobileDisplayBounds ? (
        <>
          <div
            ref={mobileWrapperRef}
            aria-hidden="true"
            style={{
              position: "absolute",
              top: `${traceBaseRect?.top ?? 0}px`,
              left: `${traceBaseRect?.left ?? 0}px`,
              width: `${traceBaseRect?.width ?? metrics.surfaceWidth}px`,
              height: `${traceBaseRect?.height ?? metrics.surfaceHeight}px`,
              display: "block",
              opacity: imageOpacity,
              transform: getMobileWrapperTransformCss(mobileDisplayTransform),
              transformOrigin: "top left",
              willChange: "transform",
              contain: "layout style size",
              isolation: "isolate",
              overflow: "visible",
              pointerEvents: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          >
            <img
              aria-hidden="true"
              src={trace.previewUrl}
              alt=""
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                imageRendering: "auto",
                objectFit: "fill",
                pointerEvents: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            />
          </div>
          <div
            ref={mobileProxyRef}
            aria-hidden="true"
            style={{
              position: "absolute",
              top: `${traceBaseRect?.top ?? 0}px`,
              left: `${traceBaseRect?.left ?? 0}px`,
              width: `${traceBaseRect?.width ?? metrics.surfaceWidth}px`,
              height: `${traceBaseRect?.height ?? metrics.surfaceHeight}px`,
              display: "none",
              transform: getMobileWrapperTransformCss(mobileDisplayTransform),
              transformOrigin: "top left",
              willChange: "transform",
              contain: "layout style size",
              isolation: "isolate",
              overflow: "visible",
              pointerEvents: "none",
              background: "rgba(37, 99, 235, 0.18)",
              border: "1px solid rgba(37, 99, 235, 0.9)",
              boxSizing: "border-box",
            }}
          />
          <div
            aria-label="Trace image controls"
            role="presentation"
            onPointerDown={handleMobileDragStart}
            style={{
              position: "absolute",
              left: `${mobileDisplayBounds.left}px`,
              top: `${mobileDisplayBounds.top}px`,
              width: `${mobileDisplayBounds.width}px`,
              height: `${mobileDisplayBounds.height}px`,
              touchAction: "none",
              cursor: "grab",
              background: "transparent",
            }}
          />
        </>
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
              showOutline={false}
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
