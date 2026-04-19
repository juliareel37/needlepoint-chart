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
  getUsedJsHeapMiB,
  measureTotalPageMemory,
  TRACE_MEMORY_DEBUG_ENABLED,
} from "./traceMemoryDebug";

const MOBILE_TRACE_DRAG_PREVIEW_MAX_DIMENSION = 512;
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

interface MobileTraceDragSession {
  debugId: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  pendingClientX: number;
  pendingClientY: number;
  peakKnownOverlapMiB: number;
  peakUsedJsHeapMiB: number | null;
  rafId: number | null;
  sampleCount: number;
  startKnownOverlapMiB: number;
  startUsedJsHeapMiB: number | null;
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
  const mobileDragSettleTimeoutRef = useRef<number | null>(null);
  const lastAppliedMobilePreviewTransformRef = useRef<{
    offsetX: number;
    offsetY: number;
    scale: number;
  } | null>(null);
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

  const captureCurrentMobileDragMemory = useCallback(() => {
    const preparedSource =
      traceAsset?.width && traceAsset.height
        ? estimateTraceSurface(traceAsset.width, traceAsset.height)
        : null;
    const mobileCanvas = mobileCanvasRef.current;
    const mobileSurface =
      mobileCanvas && mobileCanvas.width > 0 && mobileCanvas.height > 0
        ? estimateTraceSurface(mobileCanvas.width, mobileCanvas.height)
        : null;
    const knownOverlapMiB =
      (preparedSource?.mebibytes ?? 0) + (mobileSurface?.mebibytes ?? 0);

    return {
      knownOverlapMiB,
      mobileSurface,
      preparedSource,
      usedJsHeapMiB: getUsedJsHeapMiB(),
    };
  }, [traceAsset]);

  const logMobileTotalMemorySample = useCallback(
    async (
      phase: "start" | "end" | "settled",
      debugId: string,
      knownOverlapMiB: number,
    ) => {
      if (!TRACE_MEMORY_DEBUG_ENABLED) {
        return;
      }

      const totalMemory = await measureTotalPageMemory();

      if (mobileDragSessionRef.current?.debugId !== debugId && phase === "start") {
        return;
      }

      console.groupCollapsed(`[trace-memory] mobile drag total (${phase})`);
      console.log({
        assetUrl: trace.assetUrl,
        debugId,
        phase,
        knownOverlapMiB: Number(knownOverlapMiB.toFixed(2)),
        totalMemoryMiB:
          totalMemory.mebibytes === null
            ? null
            : Number(totalMemory.mebibytes.toFixed(2)),
        totalMemorySource: totalMemory.source,
      });
      console.log(
        "Total memory is best-effort: it uses measureUserAgentSpecificMemory when available, otherwise falls back to JS heap only.",
      );
      console.groupEnd();
    },
    [trace.assetUrl],
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
    lastAppliedMobilePreviewTransformRef.current = traceTransform;
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

      if (areTransformsEqual(clampedTrace, traceTransform)) {
        applyMobileWrapperTransform(mobileWrapperRef.current, clampedTrace);
        applyMobileWrapperTransform(mobileProxyRef.current, clampedTrace);
        setMobileProxyActive(mobileWrapperRef.current, mobileProxyRef.current, false);
        lastAppliedMobilePreviewTransformRef.current = clampedTrace;
        return;
      }

      applyMobileWrapperTransform(mobileWrapperRef.current, clampedTrace);
      applyMobileWrapperTransform(mobileProxyRef.current, clampedTrace);
      setMobileProxyActive(mobileWrapperRef.current, mobileProxyRef.current, false);
      lastAppliedMobilePreviewTransformRef.current = clampedTrace;
      dispatch(createPreviewTraceRepositionCommand(clampedTrace));
    },
    [dispatch, metrics, traceBaseRect, traceTransform],
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

      const memorySnapshot = TRACE_MEMORY_DEBUG_ENABLED
        ? captureCurrentMobileDragMemory()
        : {
            knownOverlapMiB: 0,
            usedJsHeapMiB: null,
          };

      mobileDragSessionRef.current = {
        debugId: `${event.pointerId}-${Date.now()}`,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        pendingClientX: event.clientX,
        pendingClientY: event.clientY,
        peakKnownOverlapMiB: memorySnapshot.knownOverlapMiB,
        peakUsedJsHeapMiB: memorySnapshot.usedJsHeapMiB,
        rafId: null,
        sampleCount: 1,
        startKnownOverlapMiB: memorySnapshot.knownOverlapMiB,
        startUsedJsHeapMiB: memorySnapshot.usedJsHeapMiB,
        startPoint: worldPoint,
        startTransform: traceTransform,
      };

      void logMobileTotalMemorySample(
        "start",
        mobileDragSessionRef.current.debugId,
        memorySnapshot.knownOverlapMiB,
      );

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
      if (TRACE_MEMORY_DEBUG_ENABLED) {
        const memorySnapshot = captureCurrentMobileDragMemory();
        session.sampleCount += 1;
        session.peakKnownOverlapMiB = Math.max(
          session.peakKnownOverlapMiB,
          memorySnapshot.knownOverlapMiB,
        );
        if (memorySnapshot.usedJsHeapMiB !== null) {
          session.peakUsedJsHeapMiB =
            session.peakUsedJsHeapMiB === null
              ? memorySnapshot.usedJsHeapMiB
              : Math.max(session.peakUsedJsHeapMiB, memorySnapshot.usedJsHeapMiB);
        }
      }

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

      if (
        lastAppliedMobilePreviewTransformRef.current &&
        areTransformsEqual(
          lastAppliedMobilePreviewTransformRef.current,
          nextTrace,
        )
      ) {
        return nextTrace;
      }

      applyMobileDragTransform(
        mobileWrapperRef.current,
        mobileProxyRef.current,
        nextTrace,
        MOBILE_TRACE_DRAG_PROXY_MODE,
      );
      lastAppliedMobilePreviewTransformRef.current = nextTrace;
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

      if (TRACE_MEMORY_DEBUG_ENABLED) {
        const finalMemorySnapshot = captureCurrentMobileDragMemory();
        const peakKnownOverlapMiB = Math.max(
          session.peakKnownOverlapMiB,
          finalMemorySnapshot.knownOverlapMiB,
        );
        const peakUsedJsHeapMiB =
          finalMemorySnapshot.usedJsHeapMiB === null
            ? session.peakUsedJsHeapMiB
            : session.peakUsedJsHeapMiB === null
              ? finalMemorySnapshot.usedJsHeapMiB
              : Math.max(session.peakUsedJsHeapMiB, finalMemorySnapshot.usedJsHeapMiB);

        console.groupCollapsed("[trace-memory] mobile drag peak");
        console.log({
          assetUrl: trace.assetUrl,
          dragCommitted: Boolean(nextTrace),
          samples: session.sampleCount,
          startKnownOverlapMiB: Number(session.startKnownOverlapMiB.toFixed(2)),
          peakKnownOverlapMiB: Number(peakKnownOverlapMiB.toFixed(2)),
          peakKnownOverlapDeltaMiB: Number(
            (peakKnownOverlapMiB - session.startKnownOverlapMiB).toFixed(2),
          ),
          startUsedJsHeapMiB:
            session.startUsedJsHeapMiB === null
              ? null
              : Number(session.startUsedJsHeapMiB.toFixed(2)),
          peakUsedJsHeapMiB:
            peakUsedJsHeapMiB === null
              ? null
              : Number(peakUsedJsHeapMiB.toFixed(2)),
          peakUsedJsHeapDeltaMiB:
            peakUsedJsHeapMiB === null || session.startUsedJsHeapMiB === null
              ? null
              : Number(
                  (peakUsedJsHeapMiB - session.startUsedJsHeapMiB).toFixed(2),
                ),
        });

        if (finalMemorySnapshot.preparedSource) {
          console.table([
            formatTraceSurfaceForLog(
              "prepared trace source",
              finalMemorySnapshot.preparedSource,
            ),
            ...(finalMemorySnapshot.mobileSurface
              ? [
                  formatTraceSurfaceForLog(
                    "mobile preview canvas",
                    finalMemorySnapshot.mobileSurface,
                  ),
                ]
              : []),
          ]);
        }

        console.log(
          "Known overlap is a lower bound based on the prepared source plus the mobile preview canvas. JS heap is only included when the browser exposes performance.memory.",
        );
        console.groupEnd();

        void logMobileTotalMemorySample(
          "end",
          session.debugId,
          peakKnownOverlapMiB,
        );

        if (mobileDragSettleTimeoutRef.current !== null) {
          window.clearTimeout(mobileDragSettleTimeoutRef.current);
        }
        mobileDragSettleTimeoutRef.current = window.setTimeout(() => {
          void logMobileTotalMemorySample(
            "settled",
            session.debugId,
            finalMemorySnapshot.knownOverlapMiB,
          );
          mobileDragSettleTimeoutRef.current = null;
        }, 350);
      }

      if (nextTrace) {
        handleMobileTransformCommit(nextTrace);
      } else {
        applyMobileWrapperTransform(mobileWrapperRef.current, traceTransform);
        setMobileProxyActive(mobileWrapperRef.current, mobileProxyRef.current, false);
        lastAppliedMobilePreviewTransformRef.current = traceTransform;
      }

      handleMobileInteractionEnd();
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerEnd);
    window.addEventListener("pointercancel", handleWindowPointerEnd);

    return () => {
      if (mobileDragSettleTimeoutRef.current !== null) {
        window.clearTimeout(mobileDragSettleTimeoutRef.current);
        mobileDragSettleTimeoutRef.current = null;
      }
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);
    };
  }, [
    coarsePointer,
    captureCurrentMobileDragMemory,
    getWorldPointFromClient,
    handleMobileInteractionEnd,
    handleMobileTransformCommit,
    logMobileTotalMemorySample,
    metrics,
    positioningEnabled,
    traceBaseRect,
    trace.assetUrl,
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

function areTransformsEqual(
  left: { offsetX: number; offsetY: number; scale: number },
  right: { offsetX: number; offsetY: number; scale: number },
): boolean {
  return (
    left.offsetX === right.offsetX &&
    left.offsetY === right.offsetY &&
    left.scale === right.scale
  );
}
