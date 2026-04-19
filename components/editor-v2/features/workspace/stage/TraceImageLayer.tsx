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
import {
  estimateTraceSurface,
  formatTraceSurfaceForLog,
  TRACE_MEMORY_DEBUG_ENABLED,
} from "./traceMemoryDebug";

const MOBILE_TRACE_DRAG_PREVIEW_MAX_DIMENSION = 1024;
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
  rafId: number | null;
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
  const mobileCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mobileWrapperRef = useRef<HTMLDivElement | null>(null);
  const mobileProxyRef = useRef<HTMLDivElement | null>(null);
  const mobileDragSessionRef = useRef<MobileTraceDragSession | null>(null);
  const lastSurfaceMemoryLogKeyRef = useRef<string | null>(null);
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

    if (TRACE_MEMORY_DEBUG_ENABLED) {
      const preparedSource = estimateTraceSurface(traceAsset.width, traceAsset.height);
      const desktopSurface =
        desktopCanvas && desktopCanvas.width > 0 && desktopCanvas.height > 0
          ? estimateTraceSurface(desktopCanvas.width, desktopCanvas.height)
          : null;
      const mobileSurface =
        mobileCanvas && mobileCanvas.width > 0 && mobileCanvas.height > 0
          ? estimateTraceSurface(mobileCanvas.width, mobileCanvas.height)
          : null;
      const logKey = [
        trace.assetUrl,
        preparedSource.width,
        preparedSource.height,
        desktopSurface?.width ?? 0,
        desktopSurface?.height ?? 0,
        mobileSurface?.width ?? 0,
        mobileSurface?.height ?? 0,
        coarsePointer ? "coarse" : "fine",
      ].join(":");

      if (lastSurfaceMemoryLogKeyRef.current !== logKey) {
        lastSurfaceMemoryLogKeyRef.current = logKey;
        const surfaces = [
          formatTraceSurfaceForLog("prepared trace source", preparedSource),
        ];
        let estimatedKnownOverlapMiB = preparedSource.mebibytes;

        if (desktopSurface) {
          surfaces.push(formatTraceSurfaceForLog("desktop trace canvas", desktopSurface));
          estimatedKnownOverlapMiB += desktopSurface.mebibytes;
        }

        if (mobileSurface) {
          surfaces.push(formatTraceSurfaceForLog("mobile preview canvas", mobileSurface));
          estimatedKnownOverlapMiB += mobileSurface.mebibytes;
        }

        console.groupCollapsed("[trace-memory] trace layer surfaces");
        console.log({
          assetUrl: trace.assetUrl,
          coarsePointer,
          estimatedKnownOverlapMiB: Number(
            estimatedKnownOverlapMiB.toFixed(2),
          ),
        });
        console.table(surfaces);
        console.log(
          "This is a lower bound for live trace-layer surfaces and does not include decoded-image overlap from load time, GPU textures, or compositor copies.",
        );
        console.groupEnd();
      }
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
        rafId: null,
        startPoint: worldPoint,
        startTransform: traceTransform,
      };

      handleMobileInteractionStart();
      event.preventDefault();
      event.stopPropagation();
    },
    [
      getWorldPointFromClient,
      handleMobileInteractionStart,
      traceBaseRect,
      traceTransform,
    ],
  );

  useEffect(() => {
    if (!coarsePointer || !positioningEnabled || !traceBaseRect) {
      return;
    }

    const flushMobilePreview = (session: MobileTraceDragSession) => {
      const deltaX = session.pendingClientX - session.startClientX;
      const deltaY = session.pendingClientY - session.startClientY;
      if (Math.hypot(deltaX, deltaY) < MOBILE_DRAG_THRESHOLD) {
        return null;
      }

      const worldPoint = getWorldPointFromClient(
        session.pendingClientX,
        session.pendingClientY,
      );
      if (!worldPoint) {
        return null;
      }

      const nextTrace = clampTraceTransformToSurface(
        {
          offsetX:
            session.startTransform.offsetX + (worldPoint.x - session.startPoint.x),
          offsetY:
            session.startTransform.offsetY + (worldPoint.y - session.startPoint.y),
          scale: session.startTransform.scale,
        },
        traceBaseRect,
        metrics,
      );

      applyMobileDragTransform(
        mobileWrapperRef.current,
        mobileProxyRef.current,
        nextTrace,
        MOBILE_TRACE_DRAG_PROXY_MODE,
      );
      return nextTrace;
    };

    const scheduleMobilePreview = () => {
      const session = mobileDragSessionRef.current;
      if (!session || session.rafId !== null) {
        return;
      }

      session.rafId = window.requestAnimationFrame(() => {
        const activeSession = mobileDragSessionRef.current;
        if (!activeSession) {
          return;
        }

        activeSession.rafId = null;
        flushMobilePreview(activeSession);
      });
    };

    const handleWindowPointerMove = (event: PointerEvent) => {
      const session = mobileDragSessionRef.current;
      if (!session || event.pointerId !== session.pointerId) {
        return;
      }

      session.pendingClientX = event.clientX;
      session.pendingClientY = event.clientY;
      scheduleMobilePreview();
    };

    const handleWindowPointerEnd = (event: PointerEvent) => {
      const session = mobileDragSessionRef.current;
      if (!session || event.pointerId !== session.pointerId) {
        return;
      }

      if (session.rafId !== null) {
        window.cancelAnimationFrame(session.rafId);
        session.rafId = null;
      }

      session.pendingClientX = event.clientX;
      session.pendingClientY = event.clientY;
      const nextTrace = flushMobilePreview(session);
      mobileDragSessionRef.current = null;

      if (nextTrace) {
        handleMobileTransformCommit(nextTrace);
      } else {
        applyMobileWrapperTransform(mobileWrapperRef.current, traceTransform);
        setMobileProxyActive(mobileWrapperRef.current, mobileProxyRef.current, false);
      }

      handleMobileInteractionEnd();
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerEnd);
    window.addEventListener("pointercancel", handleWindowPointerEnd);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);
    };
  }, [
    coarsePointer,
    getWorldPointFromClient,
    handleMobileInteractionEnd,
    handleMobileTransformCommit,
    metrics,
    positioningEnabled,
    traceBaseRect,
    traceTransform,
  ]);

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
      {coarsePointer && positioningEnabled && traceBounds ? (
        <>
          <div
            ref={mobileWrapperRef}
            style={{
              position: "absolute",
              top: `${traceBaseRect?.top ?? 0}px`,
              left: `${traceBaseRect?.left ?? 0}px`,
              width: `${traceBaseRect?.width ?? metrics.surfaceWidth}px`,
              height: `${traceBaseRect?.height ?? metrics.surfaceHeight}px`,
              opacity: imageOpacity,
              pointerEvents: "none",
              transform: getMobileWrapperTransformCss(traceTransform),
              transformOrigin: "top left",
              willChange: "transform",
              backfaceVisibility: "hidden",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          >
            <canvas
              ref={mobileCanvasRef}
              aria-label="Trace reference"
              role="img"
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                pointerEvents: "none",
                imageRendering: "auto",
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
              transform: getMobileWrapperTransformCss(traceTransform),
              transformOrigin: "top left",
              willChange: "transform",
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
              left: `${traceBounds.left}px`,
              top: `${traceBounds.top}px`,
              width: `${traceBounds.width}px`,
              height: `${traceBounds.height}px`,
              border: `${Math.max(1, 1.5 * (zoom > 0 ? 1 / zoom : 1))}px solid rgba(37, 99, 235, 0.95)`,
              background: "transparent",
              boxSizing: "border-box",
              touchAction: "none",
              cursor: "grab",
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
