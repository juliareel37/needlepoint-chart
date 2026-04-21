"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
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
  getBoundsFromHandleDrag,
  getContainedRect,
  getHandleLeft,
  getHandleTop,
  getPositionedBounds,
  getPositioningTransformCss,
  POSITIONING_HANDLES,
  type PositioningDragMode,
} from "@/lib/editor-v2/editor/positioning";
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

interface MobileTraceDragSession {
  pointerId: number;
  mode: PositioningDragMode;
  startTransform: {
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
  startStageX: number;
  startStageY: number;
  pendingClientX: number;
  pendingClientY: number;
}

interface MobileTracePinchSession {
  pointerIds: [number, number];
  startTransform: {
    offsetX: number;
    offsetY: number;
    scale: number;
  };
  anchorX: number;
  anchorY: number;
  startBounds: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  startDistance: number;
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
  const mobileDragSessionRef = useRef<MobileTraceDragSession | null>(null);
  const mobilePinchSessionRef = useRef<MobileTracePinchSession | null>(null);
  const mobileTouchPointsRef = useRef<Map<number, { clientX: number; clientY: number }>>(
    new Map(),
  );
  const mobileDragRafRef = useRef<number | null>(null);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const [mobilePreviewSize, setMobilePreviewSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [mobilePreviewTransform, setMobilePreviewTransform] = useState<
    typeof traceTransform | null
  >(null);
  const traceSourceSize = useMemo(() => {
    if (traceAsset?.width && traceAsset?.height) {
      return {
        width: traceAsset.width,
        height: traceAsset.height,
      };
    }

    if (mobilePreviewSize?.width && mobilePreviewSize?.height) {
      return mobilePreviewSize;
    }

    if (trace.imageWidth && trace.imageHeight) {
      return {
        width: trace.imageWidth,
        height: trace.imageHeight,
      };
    }

    return null;
  }, [
    mobilePreviewSize,
    trace.imageHeight,
    trace.imageWidth,
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
  const mobileDisplayStageBounds = useMemo(() => {
    if (!mobileDisplayBounds) {
      return null;
    }

    return {
      left: worldBounds.left - stageBounds.left + mobileDisplayBounds.left * viewport.zoom,
      top: worldBounds.top - stageBounds.top + mobileDisplayBounds.top * viewport.zoom,
      width: mobileDisplayBounds.width * viewport.zoom,
      height: mobileDisplayBounds.height * viewport.zoom,
    };
  }, [
    mobileDisplayBounds,
    stageBounds.left,
    stageBounds.top,
    viewport.zoom,
    worldBounds.left,
    worldBounds.top,
  ]);
  const mobileBaseStageBounds = useMemo(() => {
    if (!traceBaseRect) {
      return null;
    }

    return {
      left: worldBounds.left - stageBounds.left + traceBaseRect.left * viewport.zoom,
      top: worldBounds.top - stageBounds.top + traceBaseRect.top * viewport.zoom,
      width: traceBaseRect.width * viewport.zoom,
      height: traceBaseRect.height * viewport.zoom,
    };
  }, [
    stageBounds.left,
    stageBounds.top,
    traceBaseRect,
    viewport.zoom,
    worldBounds.left,
    worldBounds.top,
  ]);
  const mobileSurfaceStageBounds = useMemo(
    () => ({
      left: worldBounds.left - stageBounds.left,
      top: worldBounds.top - stageBounds.top,
      width: metrics.surfaceWidth * viewport.zoom,
      height: metrics.surfaceHeight * viewport.zoom,
    }),
    [
      metrics.surfaceHeight,
      metrics.surfaceWidth,
      stageBounds.left,
      stageBounds.top,
      viewport.zoom,
      worldBounds.left,
      worldBounds.top,
    ],
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
    if (desktopCanvas) {
      desktopCanvas.style.transform = getPositioningTransformCss(traceTransform);
    }
    applyDesktopProxyTransform(desktopProxyRef.current, traceTransform);
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
  const handleDesktopInteractionStart = useCallback(() => {
    setDesktopProxyActive(desktopCanvasRef.current, desktopProxyRef.current, true);
  }, []);

  const handleDesktopInteractionEnd = useCallback(() => {
    setDesktopProxyActive(desktopCanvasRef.current, desktopProxyRef.current, false);
  }, []);

  const beginMobileDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, mode: PositioningDragMode) => {
      if (!traceBaseRect) {
        return;
      }
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      if (event.pointerType === "touch") {
        mobileTouchPointsRef.current.set(event.pointerId, {
          clientX: event.clientX,
          clientY: event.clientY,
        });

        const activeTouches = Array.from(mobileTouchPointsRef.current.entries());
        if (activeTouches.length === 2 && mobileDisplayStageBounds) {
          if (mobileDragRafRef.current !== null) {
            window.cancelAnimationFrame(mobileDragRafRef.current);
            mobileDragRafRef.current = null;
          }
          mobileDragSessionRef.current = null;

          const [[firstPointerId, firstTouch], [secondPointerId, secondTouch]] =
            activeTouches;
          const centerClientX = (firstTouch.clientX + secondTouch.clientX) / 2;
          const centerClientY = (firstTouch.clientY + secondTouch.clientY) / 2;
          const centerStagePoint = getStagePointFromClient(
            centerClientX,
            centerClientY,
            stageBounds,
          );

          mobilePinchSessionRef.current = {
            pointerIds: [firstPointerId, secondPointerId],
            startTransform: mobileDisplayTransform,
            anchorX:
              (centerStagePoint.x - mobileDisplayStageBounds.left) /
              Math.max(mobileDisplayStageBounds.width, 0.0001),
            anchorY:
              (centerStagePoint.y - mobileDisplayStageBounds.top) /
              Math.max(mobileDisplayStageBounds.height, 0.0001),
            startBounds: mobileDisplayStageBounds,
            startDistance: Math.hypot(
              secondTouch.clientX - firstTouch.clientX,
              secondTouch.clientY - firstTouch.clientY,
            ),
          };
          setMobilePreviewTransform(mobileDisplayTransform);

          event.preventDefault();
          event.stopPropagation();
          return;
        }
      }

      const startStagePoint = getStagePointFromClient(
        event.clientX,
        event.clientY,
        stageBounds,
      );

      mobileDragSessionRef.current = {
        pointerId: event.pointerId,
        mode,
        startTransform: mobileDisplayTransform,
        startBounds: mobileDisplayStageBounds ?? mobileBaseStageBounds ?? {
          left: 0,
          top: 0,
          width: 0,
          height: 0,
        },
        startStageX: startStagePoint.x,
        startStageY: startStagePoint.y,
        pendingClientX: event.clientX,
        pendingClientY: event.clientY,
      };
      setMobilePreviewTransform(mobileDisplayTransform);

      event.preventDefault();
      event.stopPropagation();
    },
    [
      mobileBaseStageBounds,
      mobileDisplayStageBounds,
      mobileDisplayTransform,
      stageBounds,
      traceBaseRect,
    ],
  );

  useEffect(() => {
    if (!coarsePointer || !positioningEnabled || !traceBaseRect) {
      return;
    }

    function flushMobilePreview() {
      mobileDragRafRef.current = null;
      const pinchSession = mobilePinchSessionRef.current;
      if (pinchSession) {
        const firstTouch = mobileTouchPointsRef.current.get(pinchSession.pointerIds[0]);
        const secondTouch = mobileTouchPointsRef.current.get(pinchSession.pointerIds[1]);
        if (!firstTouch || !secondTouch) {
          return;
        }

        const centerClientX = (firstTouch.clientX + secondTouch.clientX) / 2;
        const centerClientY = (firstTouch.clientY + secondTouch.clientY) / 2;
        const centerStagePoint = getStagePointFromClient(
          centerClientX,
          centerClientY,
          stageBounds,
        );

        const nextBounds = clampStageBoundsToSurface(
          getStageBoundsFromPinch({
            anchorX: pinchSession.anchorX,
            anchorY: pinchSession.anchorY,
            centerX: centerStagePoint.x,
            centerY: centerStagePoint.y,
            startBounds: pinchSession.startBounds,
            distance: Math.hypot(
              secondTouch.clientX - firstTouch.clientX,
              secondTouch.clientY - firstTouch.clientY,
            ),
            startDistance: pinchSession.startDistance,
          }),
          mobileSurfaceStageBounds,
          MIN_VISIBLE_TRACE_PX * viewport.zoom,
        );

        setMobilePreviewTransform(
          getTraceTransformFromStageBounds(nextBounds, mobileBaseStageBounds ?? {
            left: 0,
            top: 0,
            width: 1,
            height: 1,
          }, viewport.zoom),
        );
        return;
      }

      const session = mobileDragSessionRef.current;
      if (!session) {
        return;
      }

      const nextBounds = getStageBoundsFromDrag(
        session,
        getStagePointFromClient(
          session.pendingClientX,
          session.pendingClientY,
          stageBounds,
        ),
      );
      const clampedBounds = clampStageBoundsToSurface(
        nextBounds,
        mobileSurfaceStageBounds,
        MIN_VISIBLE_TRACE_PX * viewport.zoom,
      );

      setMobilePreviewTransform(
        getTraceTransformFromStageBounds(
          clampedBounds,
          mobileBaseStageBounds ?? {
            left: 0,
            top: 0,
            width: 1,
            height: 1,
          },
          viewport.zoom,
        ),
      );
    }

    const handleWindowPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" && mobileTouchPointsRef.current.has(event.pointerId)) {
        mobileTouchPointsRef.current.set(event.pointerId, {
          clientX: event.clientX,
          clientY: event.clientY,
        });
      }

      if (mobilePinchSessionRef.current) {
        if (mobileDragRafRef.current === null) {
          mobileDragRafRef.current = window.requestAnimationFrame(flushMobilePreview);
        }
        return;
      }

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
      if (event.pointerType === "touch" && mobileTouchPointsRef.current.has(event.pointerId)) {
        mobileTouchPointsRef.current.set(event.pointerId, {
          clientX: event.clientX,
          clientY: event.clientY,
        });
      }

      const pinchSession = mobilePinchSessionRef.current;
      if (pinchSession && pinchSession.pointerIds.includes(event.pointerId)) {
        if (mobileDragRafRef.current !== null) {
          window.cancelAnimationFrame(mobileDragRafRef.current);
          mobileDragRafRef.current = null;
        }

        const firstTouch = mobileTouchPointsRef.current.get(pinchSession.pointerIds[0]);
        const secondTouch = mobileTouchPointsRef.current.get(pinchSession.pointerIds[1]);
        mobilePinchSessionRef.current = null;
        mobileTouchPointsRef.current.delete(event.pointerId);

        if (!firstTouch || !secondTouch) {
          setMobilePreviewTransform(null);
          return;
        }

        const centerStagePoint = getStagePointFromClient(
          (firstTouch.clientX + secondTouch.clientX) / 2,
          (firstTouch.clientY + secondTouch.clientY) / 2,
          stageBounds,
        );
        const nextBounds = clampStageBoundsToSurface(
          getStageBoundsFromPinch({
            anchorX: pinchSession.anchorX,
            anchorY: pinchSession.anchorY,
            centerX: centerStagePoint.x,
            centerY: centerStagePoint.y,
            startBounds: pinchSession.startBounds,
            distance: Math.hypot(
              secondTouch.clientX - firstTouch.clientX,
              secondTouch.clientY - firstTouch.clientY,
            ),
            startDistance: pinchSession.startDistance,
          }),
          mobileSurfaceStageBounds,
          MIN_VISIBLE_TRACE_PX * viewport.zoom,
        );
        const nextTrace = getTraceTransformFromStageBounds(
          nextBounds,
          mobileBaseStageBounds ?? {
            left: 0,
            top: 0,
            width: 1,
            height: 1,
          },
          viewport.zoom,
        );

        setMobilePreviewTransform(null);
        if (hasMeaningfulTraceTransformChange(nextTrace, pinchSession.startTransform)) {
          dispatch(createPreviewTraceRepositionCommand(nextTrace));
        }
        return;
      }

      const session = mobileDragSessionRef.current;
      if (!session || event.pointerId !== session.pointerId) {
        if (event.pointerType === "touch") {
          mobileTouchPointsRef.current.delete(event.pointerId);
        }
        return;
      }

      if (mobileDragRafRef.current !== null) {
        window.cancelAnimationFrame(mobileDragRafRef.current);
        mobileDragRafRef.current = null;
      }

      mobileDragSessionRef.current = null;
      if (event.pointerType === "touch") {
        mobileTouchPointsRef.current.delete(event.pointerId);
      }

      const nextBounds = clampStageBoundsToSurface(
        getStageBoundsFromDrag(
          session,
          getStagePointFromClient(event.clientX, event.clientY, stageBounds),
        ),
        mobileSurfaceStageBounds,
        MIN_VISIBLE_TRACE_PX * viewport.zoom,
      );
      const nextTrace = getTraceTransformFromStageBounds(
        nextBounds,
        mobileBaseStageBounds ?? {
          left: 0,
          top: 0,
          width: 1,
          height: 1,
        },
        viewport.zoom,
      );

      setMobilePreviewTransform(null);
      if (hasMeaningfulTraceTransformChange(nextTrace, session.startTransform)) {
        dispatch(createPreviewTraceRepositionCommand(nextTrace));
      }
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerEnd);
    window.addEventListener("pointercancel", handleWindowPointerEnd);

    return () => {
      if (mobileDragRafRef.current !== null) {
        window.cancelAnimationFrame(mobileDragRafRef.current);
        mobileDragRafRef.current = null;
      }
      mobileDragSessionRef.current = null;
      mobilePinchSessionRef.current = null;
      mobileTouchPointsRef.current.clear();
      setMobilePreviewTransform(null);
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);
    };
  }, [
    coarsePointer,
    dispatch,
    metrics,
    mobileBaseStageBounds,
    mobileDisplayTransform,
    mobileSurfaceStageBounds,
    positioningEnabled,
    stageBounds,
    traceBaseRect,
    viewport.zoom,
  ]);

  const mobileOverlay =
    coarsePointer &&
    positioningEnabled &&
    mobileDisplayStageBounds &&
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
                left: `${mobileDisplayStageBounds.left}px`,
                top: `${mobileDisplayStageBounds.top}px`,
                width: `${mobileDisplayStageBounds.width}px`,
                height: `${mobileDisplayStageBounds.height}px`,
                display: "block",
                opacity: imageOpacity,
                willChange: "left, top, width, height",
                contain: "layout style size",
                isolation: "isolate",
                overflow: "hidden",
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
              aria-label="Trace image controls"
              role="presentation"
              onPointerDown={(event) => beginMobileDrag(event, "move")}
              style={{
                position: "absolute",
                left: `${mobileDisplayStageBounds.left}px`,
                top: `${mobileDisplayStageBounds.top}px`,
                width: `${mobileDisplayStageBounds.width}px`,
                height: `${mobileDisplayStageBounds.height}px`,
                overflow: "visible",
                touchAction: "none",
                cursor: "grab",
                background: "transparent",
                pointerEvents: "auto",
              }}
            >
              <TracePositioningChrome
                bounds={mobileDisplayStageBounds}
                onHandlePointerDown={beginMobileDrag}
              />
            </div>
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
              handleShape="circle"
              onInteractionEnd={handleDesktopInteractionEnd}
              onInteractionStart={handleDesktopInteractionStart}
              onTransformCommit={handleDesktopTransformCommit}
              onTransformPreview={handleDesktopTransformPreview}
              previewBoundsStrategy="live"
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

function getStagePointFromClient(
  clientX: number,
  clientY: number,
  stageBounds: { left: number; top: number },
) {
  return {
    x: clientX - stageBounds.left,
    y: clientY - stageBounds.top,
  };
}

function getStageBoundsFromDrag(
  session: MobileTraceDragSession,
  point: { x: number; y: number },
) {
  if (session.mode === "move") {
    return {
      left: session.startBounds.left + (point.x - session.startStageX),
      top: session.startBounds.top + (point.y - session.startStageY),
      width: session.startBounds.width,
      height: session.startBounds.height,
    };
  }

  return getBoundsFromHandleDrag(session.startBounds, session.mode, point);
}

function getStageBoundsFromPinch(options: {
  anchorX: number;
  anchorY: number;
  centerX: number;
  centerY: number;
  distance: number;
  startBounds: { left: number; top: number; width: number; height: number };
  startDistance: number;
}) {
  const distanceRatio = options.distance / Math.max(options.startDistance, 0.0001);
  const scale = clamp(distanceRatio, 0.1, 4);
  const width = options.startBounds.width * scale;
  const height = options.startBounds.height * scale;

  return {
    left: options.centerX - options.anchorX * width,
    top: options.centerY - options.anchorY * height,
    width,
    height,
  };
}

function clampStageBoundsToSurface(
  bounds: { left: number; top: number; width: number; height: number },
  surfaceBounds: { left: number; top: number; width: number; height: number },
  minVisiblePx: number,
) {
  return {
    left: clamp(
      bounds.left,
      surfaceBounds.left + minVisiblePx - bounds.width,
      surfaceBounds.left + surfaceBounds.width - minVisiblePx,
    ),
    top: clamp(
      bounds.top,
      surfaceBounds.top + minVisiblePx - bounds.height,
      surfaceBounds.top + surfaceBounds.height - minVisiblePx,
    ),
    width: bounds.width,
    height: bounds.height,
  };
}

function getTraceTransformFromStageBounds(
  bounds: { left: number; top: number; width: number; height: number },
  baseBounds: { left: number; top: number; width: number; height: number },
  zoom: number,
) {
  return {
    offsetX: (bounds.left - baseBounds.left) / Math.max(zoom, 0.0001),
    offsetY: (bounds.top - baseBounds.top) / Math.max(zoom, 0.0001),
    scale: bounds.width / Math.max(baseBounds.width, 0.0001),
  };
}

function hasMeaningfulTraceTransformChange(
  nextTransform: { offsetX: number; offsetY: number; scale: number },
  previousTransform: { offsetX: number; offsetY: number; scale: number },
) {
  return (
    Math.abs(nextTransform.offsetX - previousTransform.offsetX) > 0.01 ||
    Math.abs(nextTransform.offsetY - previousTransform.offsetY) > 0.01 ||
    Math.abs(nextTransform.scale - previousTransform.scale) > 0.001
  );
}

function TracePositioningChrome({
  bounds,
  onHandlePointerDown,
}: {
  bounds: { width: number; height: number };
  onHandlePointerDown: (
    event: ReactPointerEvent<HTMLDivElement>,
    mode: PositioningDragMode,
  ) => void;
}) {
  const handleSize = 14;
  const outlineWidth = 1.5;
  const handleBorderWidth = 1.25;

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          border: `${outlineWidth}px solid rgba(37, 99, 235, 0.95)`,
          background: "transparent",
          pointerEvents: "none",
          boxSizing: "border-box",
        }}
      />
      {POSITIONING_HANDLES.map((handle) => (
        <div
          key={handle.id}
          aria-label={`Resize trace image from ${handle.id} handle`}
          role="presentation"
          onPointerDown={(event) => onHandlePointerDown(event, handle.id)}
          style={{
            position: "absolute",
            left: `${getHandleLeft(handle.id, bounds.width, handleSize)}px`,
            top: `${getHandleTop(handle.id, bounds.height, handleSize)}px`,
            width: `${handleSize}px`,
            height: `${handleSize}px`,
            borderRadius: "999px",
            background: "#ffffff",
            border: `${handleBorderWidth}px solid #2563eb`,
            touchAction: "none",
            cursor: handle.cursor,
            boxSizing: "border-box",
          }}
        />
      ))}
    </>
  );
}
