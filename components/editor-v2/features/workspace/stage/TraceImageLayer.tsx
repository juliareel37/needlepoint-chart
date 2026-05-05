"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type {
  EditorStore,
  TraceDocument,
  ViewportState,
} from "@/lib/editor-v2/editor/store";
import type {
  GridWorldMetrics,
  WorldPoint,
} from "@/lib/editor-v2/editor/viewport";
import {
  getContainedRect,
  getPositionedBounds,
  getRotationCss,
} from "@/lib/editor-v2/editor/positioning";
import {
  getTraceAssetCropRect,
  getTraceDisplaySize,
} from "@/lib/editor-v2/editor/trace/crop";
import { createPreviewTraceRepositionCommand } from "../workspaceCommands";
import { PositioningBoxOverlay } from "./overlays/PositioningBoxOverlay";
import type { LoadedTraceAsset } from "./GridCanvasStage.shared";

const DESKTOP_TRACE_DRAG_PROXY_MODE: "off" | "solid-rect" = "off";
const MIN_VISIBLE_TRACE_PX = 24;

interface TraceImageLayerProps {
  dispatch: EditorStore["dispatch"];
  getWorldPointFromClient: (clientX: number, clientY: number) => WorldPoint | null;
  imageOpacity: number;
  metrics: GridWorldMetrics;
  positioningEnabled: boolean;
  portalHost?: HTMLElement | null;
  stageBounds: { left: number; top: number; width: number; height: number };
  trace: TraceDocument;
  traceAsset: LoadedTraceAsset | null;
  viewport: ViewportState;
  worldBounds: { left: number; top: number; width: number; height: number };
  zIndex?: number;
  zoom: number;
}

export function TraceImageLayer({
  dispatch,
  getWorldPointFromClient,
  imageOpacity,
  metrics,
  positioningEnabled,
  portalHost = null,
  stageBounds,
  trace,
  traceAsset,
  viewport,
  worldBounds,
  zIndex = 3,
  zoom,
}: TraceImageLayerProps) {
  const desktopCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const desktopProxyRef = useRef<HTMLDivElement | null>(null);
  const snapContainerBounds = useMemo(
    () => ({
      left: 0,
      top: 0,
      width: metrics.surfaceWidth,
      height: metrics.surfaceHeight,
    }),
    [metrics.surfaceHeight, metrics.surfaceWidth],
  );
  const mobileSnapGuideContainerBounds = useMemo(
    () => ({
      left: worldBounds.left - stageBounds.left,
      top: worldBounds.top - stageBounds.top,
      width: worldBounds.width,
      height: worldBounds.height,
    }),
    [
      stageBounds.left,
      stageBounds.top,
      worldBounds.height,
      worldBounds.left,
      worldBounds.top,
      worldBounds.width,
    ],
  );
  const [coarsePointer, setCoarsePointer] = useState(false);
  const [mobilePreviewSize, setMobilePreviewSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [mobilePreviewTransform, setMobilePreviewTransform] = useState<
    typeof traceTransform | null
  >(null);
  const traceSourceSize = useMemo(() => {
    const fallbackWidth = traceAsset?.width ?? mobilePreviewSize?.width ?? null;
    const fallbackHeight = traceAsset?.height ?? mobilePreviewSize?.height ?? null;
    const displaySize = getTraceDisplaySize(trace, fallbackWidth, fallbackHeight);

    return displaySize.width > 0 && displaySize.height > 0
      ? displaySize
      : null;
  }, [
    mobilePreviewSize,
    trace,
    traceAsset?.height,
    traceAsset?.width,
  ]);
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
      rotation: trace.rotation,
    }),
    [trace.offsetX, trace.offsetY, trace.rotation, trace.scale],
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
  const mobileDisplayStageBounds = useMemo(() => {
    if (!mobileDisplayBounds) {
      return null;
    }

    return {
      left: worldBounds.left + mobileDisplayBounds.left * viewport.zoom,
      top: worldBounds.top + mobileDisplayBounds.top * viewport.zoom,
      width: mobileDisplayBounds.width * viewport.zoom,
      height: mobileDisplayBounds.height * viewport.zoom,
    };
  }, [mobileDisplayBounds, viewport.zoom, worldBounds.left, worldBounds.top]);
  const mobileOverlayBounds = useMemo(() => {
    if (!mobileDisplayStageBounds) {
      return null;
    }

    return {
      left: mobileDisplayStageBounds.left - stageBounds.left,
      top: mobileDisplayStageBounds.top - stageBounds.top,
      width: mobileDisplayStageBounds.width,
      height: mobileDisplayStageBounds.height,
    };
  }, [mobileDisplayStageBounds, stageBounds.left, stageBounds.top]);

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
    setMobilePreviewSize(null);
  }, [trace.previewUrl]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let cancelled = false;
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (cancelled) {
        return;
      }

      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        setMobilePreviewSize({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      }
    };
    image.src = trace.previewUrl;

    if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
      setMobilePreviewSize({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    }

    return () => {
      cancelled = true;
      image.onload = null;
    };
  }, [trace.previewUrl]);

  useEffect(() => {
    const desktopCanvas = desktopCanvasRef.current;
    applyDesktopTransform(desktopCanvas, traceTransform, traceBaseRect);
    applyDesktopProxyTransform(desktopProxyRef.current, traceTransform, traceBaseRect);
  }, [traceBaseRect, traceTransform]);

  useEffect(() => {
    setMobilePreviewTransform(null);
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
        trace,
        width: traceAsset.width,
        height: traceAsset.height,
      });
    }
  }, [coarsePointer, trace, traceAsset]);

  const handleDesktopTransformPreview = useCallback((nextTrace: typeof traceTransform) => {
    const clampedTrace = traceBaseRect
      ? clampTraceTransformToSurface(nextTrace, traceBaseRect, metrics)
      : nextTrace;
    applyDesktopDragTransform(
      desktopCanvasRef.current,
      desktopProxyRef.current,
      clampedTrace,
      traceBaseRect,
      DESKTOP_TRACE_DRAG_PROXY_MODE,
    );
  }, [metrics, traceBaseRect]);

  const handleDesktopTransformCommit = useCallback(
    (nextTrace: typeof traceTransform) => {
      const clampedTrace = traceBaseRect
        ? clampTraceTransformToSurface(nextTrace, traceBaseRect, metrics)
        : nextTrace;
      applyDesktopTransform(desktopCanvasRef.current, clampedTrace, traceBaseRect);
      applyDesktopProxyTransform(desktopProxyRef.current, clampedTrace, traceBaseRect);
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
      setMobilePreviewTransform(clampedTrace);
      dispatch(createPreviewTraceRepositionCommand(clampedTrace));
    },
    [dispatch, metrics, traceBaseRect],
  );
  const handleMobileTransformPreview = useCallback((nextTrace: typeof traceTransform) => {
    const clampedTrace = traceBaseRect
      ? clampTraceTransformToSurface(nextTrace, traceBaseRect, metrics)
      : nextTrace;
    setMobilePreviewTransform(clampedTrace);
  }, [metrics, traceBaseRect]);

  const handleDesktopInteractionStart = useCallback(() => {
    setDesktopProxyActive(desktopCanvasRef.current, desktopProxyRef.current, true);
  }, []);

  const handleDesktopInteractionEnd = useCallback(() => {
    setDesktopProxyActive(desktopCanvasRef.current, desktopProxyRef.current, false);
  }, []);
  const projectMobileStageBounds = useCallback(
    (
      nextTrace: {
        offsetX: number;
        offsetY: number;
        scale: number;
        rotation: number;
      },
      baseRect: { left: number; top: number; width: number; height: number },
    ) => {
      const clampedTrace = clampTraceTransformToSurface(nextTrace, baseRect, metrics);
      const projectedBounds = getPositionedBounds(baseRect, clampedTrace);

      return {
        left: worldBounds.left - stageBounds.left + projectedBounds.left * viewport.zoom,
        top: worldBounds.top - stageBounds.top + projectedBounds.top * viewport.zoom,
        width: projectedBounds.width * viewport.zoom,
        height: projectedBounds.height * viewport.zoom,
      };
    },
    [
      metrics,
      stageBounds.left,
      stageBounds.top,
      viewport.zoom,
      worldBounds.left,
      worldBounds.top,
    ],
  );

  const mobileOverlay =
    coarsePointer &&
    positioningEnabled &&
    mobileOverlayBounds &&
    traceBaseRect &&
    portalHost
      ? createPortal(
          <div
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              pointerEvents: "none",
              zIndex,
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: `${mobileOverlayBounds.left}px`,
                top: `${mobileOverlayBounds.top}px`,
                width: `${mobileOverlayBounds.width}px`,
                height: `${mobileOverlayBounds.height}px`,
                transform: getRotationCss(mobileDisplayTransform.rotation),
                transformOrigin: "center center",
                display: "block",
                opacity: imageOpacity,
                willChange: "left, top, width, height, transform",
                contain: "layout style size",
                isolation: "isolate",
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
                  objectFit: "cover",
                  objectPosition: getObjectPositionPercent(
                    trace,
                    mobilePreviewSize?.width ?? trace.imageWidth ?? 1,
                    mobilePreviewSize?.height ?? trace.imageHeight ?? 1,
                  ),
                  pointerEvents: "none",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              />
            </div>
            <PositioningBoxOverlay
              ariaLabel="Trace image controls"
              baseRect={traceBaseRect}
              bounds={mobileOverlayBounds}
              interactionBounds={mobileDisplayBounds ?? traceBounds ?? traceBaseRect}
              getWorldPointFromClient={getWorldPointFromClient}
              handleShape="circle"
              onTransformCommit={handleMobileTransformCommit}
              onTransformPreview={handleMobileTransformPreview}
              projectBoundsForPreview={projectMobileStageBounds}
              previewBoundsStrategy="live"
              snapContainerBounds={snapContainerBounds}
              snapGuideContainerBounds={mobileSnapGuideContainerBounds}
              snapGuideZoom={1}
              snapZoom={viewport.zoom}
              showOutline
              showHandles
              transactionKeyPrefix="trace-drag-mobile"
              transform={traceTransform}
              zoom={1}
            />
          </div>,
          portalHost,
        )
      : null;

  return (
    <>
      {mobileOverlay}
      {!coarsePointer || !positioningEnabled ? (
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
              transform: getRotationCss(traceTransform.rotation),
              transformOrigin: "center center",
              willChange: "left, top, width, height, transform",
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
              transform: getRotationCss(traceTransform.rotation),
              transformOrigin: "center center",
              willChange: "left, top, width, height, transform",
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
              handleShape="circle"
              onInteractionEnd={handleDesktopInteractionEnd}
              onInteractionStart={handleDesktopInteractionStart}
              onTransformCommit={handleDesktopTransformCommit}
              onTransformPreview={handleDesktopTransformPreview}
              previewBoundsStrategy="live"
              snapContainerBounds={snapContainerBounds}
              snapGuideContainerBounds={snapContainerBounds}
              snapGuideZoom={zoom}
              snapZoom={viewport.zoom}
              showOutline
              showHandles
              transactionKeyPrefix="trace-drag"
              transform={traceTransform}
              zoom={zoom}
            />
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function applyDesktopTransform(
  element: HTMLCanvasElement | null,
  transform: { offsetX: number; offsetY: number; scale: number; rotation: number },
  baseRect: { left: number; top: number; width: number; height: number } | null,
): void {
  if (!element || !baseRect) {
    return;
  }

  const bounds = getPositionedBounds(baseRect, transform);
  element.style.left = `${bounds.left}px`;
  element.style.top = `${bounds.top}px`;
  element.style.width = `${bounds.width}px`;
  element.style.height = `${bounds.height}px`;
  element.style.transform = getRotationCss(transform.rotation);
}

function applyDesktopProxyTransform(
  element: HTMLDivElement | null,
  transform: { offsetX: number; offsetY: number; scale: number; rotation: number },
  baseRect: { left: number; top: number; width: number; height: number } | null,
): void {
  if (!element || !baseRect) {
    return;
  }

  const bounds = getPositionedBounds(baseRect, transform);
  element.style.left = `${bounds.left}px`;
  element.style.top = `${bounds.top}px`;
  element.style.width = `${bounds.width}px`;
  element.style.height = `${bounds.height}px`;
  element.style.transform = getRotationCss(transform.rotation);
}

function applyDesktopDragTransform(
  canvas: HTMLCanvasElement | null,
  proxy: HTMLDivElement | null,
  transform: { offsetX: number; offsetY: number; scale: number; rotation: number },
  baseRect: { left: number; top: number; width: number; height: number } | null,
  proxyMode: "off" | "solid-rect",
): void {
  if (proxyMode === "solid-rect") {
    applyDesktopProxyTransform(proxy, transform, baseRect);
    return;
  }

  applyDesktopTransform(canvas, transform, baseRect);
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


function drawTraceSourceToCanvas(
  canvas: HTMLCanvasElement,
  imageSource: CanvasImageSource,
  size: { trace: TraceDocument; width: number; height: number },
): void {
  const cropRect = getTraceAssetCropRect(size.trace, size.width, size.height);

  canvas.width = Math.max(1, Math.round(cropRect.cropWidth));
  canvas.height = Math.max(1, Math.round(cropRect.cropHeight));

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    imageSource,
    cropRect.cropX,
    cropRect.cropY,
    cropRect.cropWidth,
    cropRect.cropHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );
}

function getObjectPositionPercent(
  trace: TraceDocument,
  assetWidth: number,
  assetHeight: number,
): string {
  const cropRect = getTraceAssetCropRect(trace, assetWidth, assetHeight);
  const x = getAxisObjectPositionPercent(
    cropRect.cropX,
    cropRect.cropWidth,
    assetWidth,
  );
  const y = getAxisObjectPositionPercent(
    cropRect.cropY,
    cropRect.cropHeight,
    assetHeight,
  );

  return `${x}% ${y}%`;
}

function getAxisObjectPositionPercent(
  cropStart: number,
  cropSize: number,
  assetSize: number,
): number {
  const availableOffset = assetSize - cropSize;

  if (availableOffset <= 0) {
    return 50;
  }

  return clamp((cropStart / availableOffset) * 100, 0, 100);
}

function clampTraceTransformToSurface(
  transform: { offsetX: number; offsetY: number; scale: number; rotation: number },
  baseRect: { left: number; top: number; width: number; height: number },
  metrics: Pick<GridWorldMetrics, "surfaceWidth" | "surfaceHeight">,
): { offsetX: number; offsetY: number; scale: number; rotation: number } {
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
    rotation: transform.rotation,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
