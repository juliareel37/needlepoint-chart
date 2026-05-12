"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
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
  getLocalPointWithinRotatedBounds,
  getPositionedBounds,
  getRotationCss,
} from "@/lib/editor-v2/editor/positioning";
import {
  getNormalizedTraceCrop,
  getTraceAssetCropRect,
  getTraceDisplaySize,
} from "@/lib/editor-v2/editor/trace/crop";
import {
  drawMaskedTraceSourceToCanvas as drawTraceSourceToCanvas,
  isMaskCanvasFullyVisible,
} from "@/lib/editor-v2/editor/trace/mask";
import type { ConnectedMagicSelection, EraserEditMode, EraserMode } from "@/lib/editor-v2/editor/magicWand";
import {
  applyMagicSelectionToMaskCanvas,
  createConnectedMagicSelection,
  getMagicWandToleranceFromDragDistance,
} from "@/lib/editor-v2/editor/magicWand";
import { createPreviewTraceRepositionCommand } from "../workspaceCommands";
import { PositioningBoxOverlay } from "./overlays/PositioningBoxOverlay";
import type { LoadedTraceAsset } from "./GridCanvasStage.shared";
import type { TraceDisplayOverride } from "./GridCanvasStage.shared";

const DESKTOP_TRACE_DRAG_PROXY_MODE: "off" | "solid-rect" = "off";
const MIN_VISIBLE_TRACE_PX = 24;
const TRACE_ERASER_MIN_IMAGE_FRACTION = 0.01;
const TRACE_ERASER_MAX_IMAGE_FRACTION = 0.35;

function traceEraserDebugEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const debugWindow = window as typeof window & { __TRACE_ERASER_DEBUG__?: boolean };
  if (debugWindow.__TRACE_ERASER_DEBUG__) {
    return true;
  }

  return new URLSearchParams(window.location.search).get("traceEraserDebug") === "1";
}

function traceEraserDebugLog(event: string, payload: Record<string, unknown>): void {
  if (!traceEraserDebugEnabled()) {
    return;
  }

  console.debug(`[trace-eraser:overlay:${event}]`, payload);
}

function getTraceEraserBrushDiameter(
  sliderValue: number,
  trace: Pick<TraceDocument, "cropWidth" | "cropHeight" | "imageWidth" | "imageHeight">,
): number {
  const normalizedSliderValue = Number.isFinite(sliderValue)
    ? Math.min(Math.max(sliderValue, 1), 10)
    : 1;
  const normalizedPercent = (normalizedSliderValue - 1) / 9;
  const imageFraction =
    TRACE_ERASER_MIN_IMAGE_FRACTION +
    normalizedPercent * (TRACE_ERASER_MAX_IMAGE_FRACTION - TRACE_ERASER_MIN_IMAGE_FRACTION);
  const maxImageDimension = Math.max(
    trace.cropWidth,
    trace.cropHeight,
    trace.imageWidth ?? 0,
    trace.imageHeight ?? 0,
    1,
  );

  return Math.max(4, Math.round(maxImageDimension * imageFraction));
}

interface TraceImageLayerProps {
  cropAspectRatio?: number | null;
  cropBase?: TraceDisplayOverride;
  cropEditing?: boolean;
  dispatch: EditorStore["dispatch"];
  eraserBrushSize?: number;
  eraserBrushPreviewVisible?: boolean;
  eraserDraftRevision?: number;
  eraserEditing?: boolean;
  eraserMaskUrl?: string | null;
  eraserEditMode?: EraserEditMode;
  eraserMode?: EraserMode;
  getWorldPointFromClient: (clientX: number, clientY: number) => WorldPoint | null;
  imageOpacity: number;
  metrics: GridWorldMetrics;
  onCropPreviewChange?: (crop: TraceDisplayOverride) => void;
  onEraserDraftChange?: (nextMaskUrl: string | null, isFullyVisible: boolean) => void;
  positioningEnabled: boolean;
  portalHost?: HTMLElement | null;
  stageBounds: { left: number; top: number; width: number; height: number };
  trace: TraceDocument;
  traceAsset: LoadedTraceAsset | null;
  traceDisplayOverride?: TraceDisplayOverride;
  touchSnappingEnabled: boolean;
  viewport: ViewportState;
  worldBounds: { left: number; top: number; width: number; height: number };
  zIndex?: number;
  zoom: number;
}

export function TraceImageLayer({
  cropAspectRatio = null,
  cropBase = null,
  cropEditing = false,
  dispatch,
  eraserBrushSize = 1,
  eraserBrushPreviewVisible = false,
  eraserDraftRevision = 0,
  eraserEditing = false,
  eraserMaskUrl = null,
  eraserEditMode = "brush",
  eraserMode = "erase",
  getWorldPointFromClient,
  imageOpacity,
  metrics,
  onCropPreviewChange,
  onEraserDraftChange,
  positioningEnabled,
  portalHost = null,
  stageBounds,
  trace,
  traceAsset,
  traceDisplayOverride = null,
  touchSnappingEnabled,
  viewport,
  worldBounds,
  zIndex = 3,
  zoom,
}: TraceImageLayerProps) {
  const renderTrace = useMemo(
    () => (traceDisplayOverride ? { ...trace, ...traceDisplayOverride } : trace),
    [trace, traceDisplayOverride],
  );
  const desktopCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const desktopProxyRef = useRef<HTMLDivElement | null>(null);
  const mobilePreviewImageRef = useRef<HTMLImageElement | null>(null);
  const mobileCanvasRef = useRef<HTMLCanvasElement | null>(null);
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
    const displaySize = getTraceDisplaySize(renderTrace, fallbackWidth, fallbackHeight);

    return displaySize.width > 0 && displaySize.height > 0
      ? displaySize
      : null;
  }, [
    mobilePreviewSize,
    renderTrace,
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
      offsetX: renderTrace.offsetX,
      offsetY: renderTrace.offsetY,
      scale: renderTrace.scale,
      rotation: renderTrace.rotation,
    }),
    [renderTrace.offsetX, renderTrace.offsetY, renderTrace.rotation, renderTrace.scale],
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
  const desktopTraceStageBounds = useMemo(() => {
    if (!traceBounds) {
      return null;
    }

    return {
      left: worldBounds.left - stageBounds.left + traceBounds.left * viewport.zoom,
      top: worldBounds.top - stageBounds.top + traceBounds.top * viewport.zoom,
      width: traceBounds.width * viewport.zoom,
      height: traceBounds.height * viewport.zoom,
    };
  }, [
    stageBounds.left,
    stageBounds.top,
    traceBounds,
    viewport.zoom,
    worldBounds.left,
    worldBounds.top,
  ]);
  const cropAssetWidth = traceAsset?.width ?? mobilePreviewSize?.width ?? trace.imageWidth ?? 0;
  const cropAssetHeight = traceAsset?.height ?? mobilePreviewSize?.height ?? trace.imageHeight ?? 0;

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
    mobilePreviewImageRef.current = null;
  }, [renderTrace.previewUrl]);

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
        mobilePreviewImageRef.current = image;
        setMobilePreviewSize({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      }
    };
    image.src = renderTrace.previewUrl;

    if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
      mobilePreviewImageRef.current = image;
      setMobilePreviewSize({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    }

    return () => {
      cancelled = true;
      image.onload = null;
      if (mobilePreviewImageRef.current === image) {
        mobilePreviewImageRef.current = null;
      }
    };
  }, [renderTrace.previewUrl]);

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
    const mobileCanvas = mobileCanvasRef.current;
    const mobilePreviewImage = mobilePreviewImageRef.current;

    if (!traceAsset?.ready || !imageSource || traceAsset.width <= 0 || traceAsset.height <= 0) {
      if (desktopCanvas) {
        desktopCanvas.width = 0;
        desktopCanvas.height = 0;
      }
      if (
        coarsePointer &&
        mobileCanvas &&
        mobilePreviewImage &&
        mobilePreviewSize &&
        mobilePreviewSize.width > 0 &&
        mobilePreviewSize.height > 0
      ) {
        drawTraceSourceToCanvas(mobileCanvas, mobilePreviewImage, {
          trace: renderTrace,
          width: mobilePreviewSize.width,
          height: mobilePreviewSize.height,
          mask: traceAsset?.mask ?? null,
        });
      } else if (mobileCanvas) {
        mobileCanvas.width = 0;
        mobileCanvas.height = 0;
      }
      return;
    }

    if (coarsePointer) {
      if (desktopCanvas) {
        desktopCanvas.width = 0;
        desktopCanvas.height = 0;
      }
      if (
        mobileCanvas &&
        mobilePreviewImage &&
        mobilePreviewSize &&
        mobilePreviewSize.width > 0 &&
        mobilePreviewSize.height > 0
      ) {
        drawTraceSourceToCanvas(mobileCanvas, mobilePreviewImage, {
          trace: renderTrace,
          width: mobilePreviewSize.width,
          height: mobilePreviewSize.height,
          mask: traceAsset?.mask ?? null,
        });
      } else if (mobileCanvas) {
        mobileCanvas.width = 0;
        mobileCanvas.height = 0;
      }
    } else {
      if (desktopCanvas) {
        drawTraceSourceToCanvas(desktopCanvas, imageSource as CanvasImageSource, {
          trace: renderTrace,
          width: traceAsset.width,
          height: traceAsset.height,
          mask: traceAsset.mask,
        });
      }
      if (mobileCanvas) {
        mobileCanvas.width = 0;
        mobileCanvas.height = 0;
      }
    }
  }, [coarsePointer, mobilePreviewSize, renderTrace, traceAsset]);

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
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  overflow: "hidden",
                }}
              >
                <canvas
                  ref={mobileCanvasRef}
                  aria-hidden="true"
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    imageRendering: "auto",
                    pointerEvents: "none",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                />
              </div>
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
              touchSnappingEnabled={touchSnappingEnabled}
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

  const cropOverlay =
    cropEditing &&
    cropAssetWidth > 0 &&
    cropAssetHeight > 0 &&
    onCropPreviewChange
      ? (
          <TraceCropEditorOverlay
            assetHeight={cropAssetHeight}
            assetWidth={cropAssetWidth}
            cropAspectRatio={cropAspectRatio}
            cropBase={getNormalizedTraceCrop(cropBase ? { ...trace, ...cropBase } : renderTrace, cropAssetWidth, cropAssetHeight)}
            crop={getNormalizedTraceCrop(renderTrace, cropAssetWidth, cropAssetHeight)}
            getWorldPointFromClient={getWorldPointFromClient}
            imageOpacity={imageOpacity}
            onCropPreviewChange={onCropPreviewChange}
            trace={renderTrace}
            traceTransform={traceTransform}
            surfaceHeight={metrics.surfaceHeight}
            surfaceWidth={metrics.surfaceWidth}
            zoom={zoom}
          />
        )
      : null;
  const eraserOverlay =
    eraserEditing &&
    traceBaseRect &&
    traceBounds &&
    trace.imageWidth &&
    trace.imageHeight &&
    onEraserDraftChange
      ? portalHost
        ? createPortal(
            <div
              style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                zIndex,
              }}
            >
              <TraceEraserEditorOverlay
                assetHeight={trace.imageHeight}
                assetWidth={trace.imageWidth}
                bounds={desktopTraceStageBounds ?? traceBounds}
                brushSize={eraserBrushSize}
                brushPreviewVisible={eraserBrushPreviewVisible}
                draftRevision={eraserDraftRevision}
                draftMaskUrl={eraserMaskUrl}
                editMode={eraserEditMode}
                imageOpacity={imageOpacity}
                mode={eraserMode}
                onMaskChange={onEraserDraftChange}
                stageHeight={stageBounds.height}
                stageWidth={stageBounds.width}
                trace={renderTrace}
                traceAsset={traceAsset}
              />
            </div>,
            portalHost,
          )
        : (
          <TraceEraserEditorOverlay
            assetHeight={trace.imageHeight}
            assetWidth={trace.imageWidth}
            bounds={traceBounds}
            brushSize={eraserBrushSize}
            brushPreviewVisible={eraserBrushPreviewVisible}
            draftRevision={eraserDraftRevision}
            draftMaskUrl={eraserMaskUrl}
            editMode={eraserEditMode}
            imageOpacity={imageOpacity}
            mode={eraserMode}
            onMaskChange={onEraserDraftChange}
            stageHeight={metrics.surfaceHeight}
            stageWidth={metrics.surfaceWidth}
            trace={renderTrace}
            traceAsset={traceAsset}
          />
        )
      : null;

  return (
    <>
      {eraserOverlay}
      {cropOverlay}
      {cropEditing || eraserEditing ? null : mobileOverlay}
      {!cropEditing && !eraserEditing && (!coarsePointer || !positioningEnabled) ? (
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
              touchSnappingEnabled={touchSnappingEnabled}
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

interface TraceEraserEditorOverlayProps {
  assetHeight: number;
  assetWidth: number;
  bounds: { left: number; top: number; width: number; height: number };
  brushSize: number;
  brushPreviewVisible: boolean;
  draftRevision: number;
  draftMaskUrl: string | null;
  editMode: EraserEditMode;
  imageOpacity: number;
  mode: EraserMode;
  onMaskChange: (nextMaskUrl: string | null, isFullyVisible: boolean) => void;
  stageHeight: number;
  stageWidth: number;
  trace: TraceDocument;
  traceAsset: LoadedTraceAsset | null;
}

function TraceEraserEditorOverlay({
  assetHeight,
  assetWidth,
  bounds,
  brushSize,
  brushPreviewVisible,
  draftRevision,
  draftMaskUrl,
  editMode,
  imageOpacity,
  mode,
  onMaskChange,
  stageHeight,
  stageWidth,
  trace,
  traceAsset,
}: TraceEraserEditorOverlayProps) {
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const combinedMaskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const composedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceSampleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceImageDataRef = useRef<ImageData | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const magicSessionRef = useRef<{
    seedMaskPoint: { x: number; y: number };
    seedStagePoint: { x: number; y: number };
  } | null>(null);
  const previewSelectionRef = useRef<ConnectedMagicSelection | null>(null);
  const hasUserEditedMaskRef = useRef(false);
  const [maskSeeded, setMaskSeeded] = useState(false);
  const [maskSeedSourceKey, setMaskSeedSourceKey] = useState<string | null>(null);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const [brushPreviewPoint, setBrushPreviewPoint] = useState<{ x: number; y: number } | null>(null);
  const matchingLoadedMask =
    traceAsset?.mask && traceAsset.mask.url === draftMaskUrl ? traceAsset.mask : null;

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
    hasUserEditedMaskRef.current = false;
    magicSessionRef.current = null;
    previewSelectionRef.current = null;
    setMaskSeedSourceKey(null);
    setMaskSeeded(false);
  }, [draftRevision]);

  useEffect(() => {
    if (!traceAsset?.ready || !traceAsset.image || assetWidth <= 0 || assetHeight <= 0) {
      sourceImageDataRef.current = null;
      return;
    }

    const sampleCanvas = sourceSampleCanvasRef.current ?? document.createElement("canvas");
    sourceSampleCanvasRef.current = sampleCanvas;
    sampleCanvas.width = assetWidth;
    sampleCanvas.height = assetHeight;

    const context = sampleCanvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      sourceImageDataRef.current = null;
      return;
    }

    context.clearRect(0, 0, assetWidth, assetHeight);
    context.drawImage(traceAsset.image, 0, 0, assetWidth, assetHeight);
    sourceImageDataRef.current = context.getImageData(0, 0, assetWidth, assetHeight);
  }, [assetHeight, assetWidth, traceAsset]);

  useEffect(() => {
    traceEraserDebugLog("mount-state", {
      draftMaskUrl,
      loadedMaskUrl: traceAsset?.mask?.url ?? null,
      matchingLoadedMaskUrl: matchingLoadedMask?.url ?? null,
      maskSeeded,
      maskSeedSourceKey,
    });
  }, [draftMaskUrl, maskSeedSourceKey, maskSeeded, matchingLoadedMask?.url, traceAsset?.mask?.url]);

  const renderOverlay = useCallback(() => {
    const overlayCanvas = overlayCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;

    if (!overlayCanvas || !maskCanvas) {
      return;
    }

    const context = overlayCanvas.getContext("2d");
    if (!context) {
      return;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    const canvasWidth = Math.max(1, Math.round(stageWidth * devicePixelRatio));
    const canvasHeight = Math.max(1, Math.round(stageHeight * devicePixelRatio));

    if (overlayCanvas.width !== canvasWidth || overlayCanvas.height !== canvasHeight) {
      overlayCanvas.width = canvasWidth;
      overlayCanvas.height = canvasHeight;
      overlayCanvas.style.width = `${stageWidth}px`;
      overlayCanvas.style.height = `${stageHeight}px`;
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    } else {
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    context.clearRect(0, 0, stageWidth, stageHeight);
    context.fillStyle = "rgba(190, 24, 24, 0.28)";
    context.fillRect(0, 0, stageWidth, stageHeight);

    if (!traceAsset?.ready || !traceAsset.image) {
      return;
    }

    const composedCanvas = composedCanvasRef.current ?? document.createElement("canvas");
    composedCanvasRef.current = composedCanvas;
    if (!maskSeeded && draftMaskUrl && !matchingLoadedMask) {
      traceEraserDebugLog("render-waiting-for-mask", {
        draftMaskUrl,
        loadedMaskUrl: traceAsset?.mask?.url ?? null,
      });
      return;
    }

    let effectiveMaskCanvas = maskCanvas;
    if (previewSelectionRef.current?.selectedPixelCount) {
      const combinedMaskCanvas =
        combinedMaskCanvasRef.current ?? document.createElement("canvas");
      combinedMaskCanvasRef.current = combinedMaskCanvas;
      combinedMaskCanvas.width = assetWidth;
      combinedMaskCanvas.height = assetHeight;
      const combinedContext = combinedMaskCanvas.getContext("2d");
      if (combinedContext) {
        combinedContext.clearRect(0, 0, assetWidth, assetHeight);
        combinedContext.drawImage(maskCanvas, 0, 0, assetWidth, assetHeight);
        applyMagicSelectionToMaskCanvas({
          maskCanvas: combinedMaskCanvas,
          selection: previewSelectionRef.current,
        });
        effectiveMaskCanvas = combinedMaskCanvas;
      }
    }

    const maskSource =
      !maskSeeded && matchingLoadedMask
        ? matchingLoadedMask
        : {
            image: effectiveMaskCanvas,
            width: assetWidth,
            height: assetHeight,
          };
    drawTraceSourceToCanvas(composedCanvas, traceAsset.image, {
      trace,
      width: traceAsset.width,
      height: traceAsset.height,
      mask: maskSource,
    });

    context.save();
    context.globalCompositeOperation = "destination-out";
    context.translate(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    context.rotate((trace.rotation * Math.PI) / 180);
    context.drawImage(
      composedCanvas,
      0,
      0,
      composedCanvas.width,
      composedCanvas.height,
      -bounds.width / 2,
      -bounds.height / 2,
      bounds.width,
      bounds.height,
    );
    context.restore();

    context.save();
    context.globalAlpha = Math.min(Math.max(imageOpacity, 0), 1);
    context.translate(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    context.rotate((trace.rotation * Math.PI) / 180);
    context.drawImage(
      composedCanvas,
      0,
      0,
      composedCanvas.width,
      composedCanvas.height,
      -bounds.width / 2,
      -bounds.height / 2,
      bounds.width,
      bounds.height,
    );
    context.restore();
  }, [
    assetHeight,
    assetWidth,
    bounds.height,
    bounds.left,
    bounds.top,
    bounds.width,
    imageOpacity,
    matchingLoadedMask,
    maskSeeded,
    stageHeight,
    stageWidth,
    trace,
    traceAsset,
  ]);

  useEffect(() => {
    magicSessionRef.current = null;
    previewSelectionRef.current = null;
    renderOverlay();
  }, [editMode, renderOverlay]);

  useEffect(() => {
    const maskCanvas = maskCanvasRef.current ?? document.createElement("canvas");
    maskCanvasRef.current = maskCanvas;

    if (maskCanvas.width !== assetWidth || maskCanvas.height !== assetHeight) {
      maskCanvas.width = assetWidth;
      maskCanvas.height = assetHeight;
      hasUserEditedMaskRef.current = false;
      setMaskSeedSourceKey(null);
      if (maskSeeded) {
        setMaskSeeded(false);
        return;
      }
    }

    const preferredSeedSourceKey =
      matchingLoadedMask?.url ?? draftMaskUrl ?? "__fully-visible__";
    const shouldReseedFromLoadedMask =
      matchingLoadedMask !== null &&
      !hasUserEditedMaskRef.current &&
      maskSeedSourceKey !== matchingLoadedMask.url;

    traceEraserDebugLog("seed-check", {
      draftMaskUrl,
      loadedMaskUrl: traceAsset?.mask?.url ?? null,
      matchingLoadedMaskUrl: matchingLoadedMask?.url ?? null,
      preferredSeedSourceKey,
      maskSeedSourceKey,
      maskSeeded,
      shouldReseedFromLoadedMask,
      hasUserEditedMask: hasUserEditedMaskRef.current,
    });

    if (maskSeeded && !shouldReseedFromLoadedMask) {
      renderOverlay();
      return;
    }

    const context = maskCanvas.getContext("2d");
    if (!context) {
      return;
    }

    if (!draftMaskUrl) {
      context.clearRect(0, 0, assetWidth, assetHeight);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, assetWidth, assetHeight);
      traceEraserDebugLog("seed-fully-visible", {
        preferredSeedSourceKey,
      });
      hasUserEditedMaskRef.current = false;
      setMaskSeedSourceKey(preferredSeedSourceKey);
      setMaskSeeded(true);
      renderOverlay();
      return;
    }

    if (matchingLoadedMask) {
      context.clearRect(0, 0, assetWidth, assetHeight);
      traceEraserDebugLog("seed-loaded-mask", {
        preferredSeedSourceKey,
        loadedMaskUrl: matchingLoadedMask.url,
      });
      context.drawImage(matchingLoadedMask.image, 0, 0, assetWidth, assetHeight);
      hasUserEditedMaskRef.current = false;
      setMaskSeedSourceKey(preferredSeedSourceKey);
      setMaskSeeded(true);
      renderOverlay();
      return;
    }

    traceEraserDebugLog("seed-from-draft-url", {
      preferredSeedSourceKey,
      draftMaskUrl,
    });
    let cancelled = false;
    const image = new Image();
    image.decoding = "async";
    if (/^https?:\/\//i.test(draftMaskUrl)) {
      image.crossOrigin = "anonymous";
    }
    image.onload = () => {
      if (cancelled) {
        return;
      }

      context.clearRect(0, 0, assetWidth, assetHeight);
      context.drawImage(image, 0, 0, assetWidth, assetHeight);
      hasUserEditedMaskRef.current = false;
      setMaskSeedSourceKey(preferredSeedSourceKey);
      setMaskSeeded(true);
      traceEraserDebugLog("seed-from-draft-url-loaded", {
        draftMaskUrl,
        preferredSeedSourceKey,
      });
      renderOverlay();
    };
    image.onerror = () => {
      if (cancelled) {
        return;
      }

      setMaskSeedSourceKey(preferredSeedSourceKey);
      setMaskSeeded(true);
      traceEraserDebugLog("seed-from-draft-url-error", {
        draftMaskUrl,
        preferredSeedSourceKey,
      });
      renderOverlay();
    };
    image.src = draftMaskUrl;

    if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
      context.clearRect(0, 0, assetWidth, assetHeight);
      context.drawImage(image, 0, 0, assetWidth, assetHeight);
      hasUserEditedMaskRef.current = false;
      setMaskSeedSourceKey(preferredSeedSourceKey);
      setMaskSeeded(true);
      traceEraserDebugLog("seed-from-draft-url-sync", {
        draftMaskUrl,
        preferredSeedSourceKey,
      });
      renderOverlay();
    }

    return () => {
      cancelled = true;
      image.onload = null;
      image.onerror = null;
    };
  }, [
    assetHeight,
    assetWidth,
    draftMaskUrl,
    maskSeedSourceKey,
    maskSeeded,
    matchingLoadedMask,
    renderOverlay,
  ]);

  useEffect(() => {
    renderOverlay();
  }, [renderOverlay]);

  const commitDraft = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) {
      traceEraserDebugLog("commit-no-canvas", {});
      onMaskChange(null, true);
      return;
    }

    const isFullyVisible = isMaskCanvasFullyVisible(maskCanvas);
    const nextMaskUrl = isFullyVisible ? null : maskCanvas.toDataURL("image/png");
    traceEraserDebugLog("commit", {
      isFullyVisible,
      nextMaskUrl,
      maskSeedSourceKey,
      hasUserEditedMask: hasUserEditedMaskRef.current,
    });
    onMaskChange(
      nextMaskUrl,
      isFullyVisible,
    );
  }, [maskSeedSourceKey, onMaskChange]);

  const getMaskPointFromStagePoint = useCallback(
    (stageX: number, stageY: number) => {
      const localPoint = getLocalPointWithinRotatedBounds(
        { x: stageX, y: stageY },
        bounds,
        trace.rotation,
      );

      if (
        localPoint.x < 0 ||
        localPoint.y < 0 ||
        localPoint.x > bounds.width ||
        localPoint.y > bounds.height
      ) {
        return null;
      }

      const scaleX = trace.cropWidth / Math.max(bounds.width, 1);
      const scaleY = trace.cropHeight / Math.max(bounds.height, 1);
      return {
        x: trace.cropX + localPoint.x * scaleX,
        y: trace.cropY + localPoint.y * scaleY,
      };
    },
    [bounds, trace.cropHeight, trace.cropWidth, trace.cropX, trace.cropY, trace.rotation],
  );

  const drawAtClientPoint = useCallback(
    (stageX: number, stageY: number, connectFromLast: boolean) => {
      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas) {
        traceEraserDebugLog("paint-blocked-no-canvas", {});
        return false;
      }

      if (!maskSeeded) {
        traceEraserDebugLog("paint-blocked-unseeded", {
          draftMaskUrl,
          loadedMaskUrl: traceAsset?.mask?.url ?? null,
          matchingLoadedMaskUrl: matchingLoadedMask?.url ?? null,
        });
        return false;
      }

      const context = maskCanvas.getContext("2d");
      if (!context) {
        return false;
      }

      const point = getMaskPointFromStagePoint(stageX, stageY);
      if (!point) {
        return false;
      }

      const scaleX = trace.cropWidth / Math.max(bounds.width, 1);
      const scaleY = trace.cropHeight / Math.max(bounds.height, 1);
      const brushDiameter = getTraceEraserBrushDiameter(brushSize, trace);
      const brushRadius = (brushDiameter * Math.max(scaleX, scaleY)) / 2;

      context.save();
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = Math.max(1, brushRadius * 2);
      context.strokeStyle = "#ffffff";
      context.fillStyle = "#ffffff";
      context.globalCompositeOperation = mode === "erase" ? "destination-out" : "source-over";

      if (connectFromLast && lastPointRef.current) {
        context.beginPath();
        context.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        context.lineTo(point.x, point.y);
        context.stroke();
      } else {
        context.beginPath();
        context.arc(point.x, point.y, Math.max(0.5, brushRadius), 0, Math.PI * 2);
        context.fill();
      }

      context.restore();
      hasUserEditedMaskRef.current = true;
      lastPointRef.current = point;
      traceEraserDebugLog("paint", {
        mode,
        pointX: point.x,
        pointY: point.y,
        brushRadius,
        brushDiameter,
        draftMaskUrl,
        maskSeedSourceKey,
      });
      renderOverlay();
      return true;
    },
    [
      brushSize,
      draftMaskUrl,
      getMaskPointFromStagePoint,
      maskSeedSourceKey,
      maskSeeded,
      matchingLoadedMask?.url,
      mode,
      renderOverlay,
      trace,
      traceAsset?.mask?.url,
    ],
  );

  const updateMagicPreview = useCallback(
    (stageX: number, stageY: number) => {
      const sourceImageData = sourceImageDataRef.current;
      const magicSession = magicSessionRef.current;
      if (!maskSeeded || !sourceImageData || !magicSession) {
        return false;
      }

      const tolerance = getMagicWandToleranceFromDragDistance(
        Math.hypot(
          stageX - magicSession.seedStagePoint.x,
          stageY - magicSession.seedStagePoint.y,
        ),
      );
      previewSelectionRef.current = createConnectedMagicSelection({
        imageData: sourceImageData,
        seedX: magicSession.seedMaskPoint.x,
        seedY: magicSession.seedMaskPoint.y,
        tolerance,
      });
      renderOverlay();
      return true;
    },
    [maskSeeded, renderOverlay],
  );

  const commitMagicPreview = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    const previewSelection = previewSelectionRef.current;
    if (!maskCanvas || !previewSelection?.selectedPixelCount) {
      previewSelectionRef.current = null;
      magicSessionRef.current = null;
      renderOverlay();
      commitDraft();
      return;
    }

    applyMagicSelectionToMaskCanvas({
      maskCanvas,
      selection: previewSelection,
    });
    hasUserEditedMaskRef.current = true;
    previewSelectionRef.current = null;
    magicSessionRef.current = null;
    renderOverlay();
    commitDraft();
  }, [commitDraft, renderOverlay]);

  const clearMagicPreview = useCallback(() => {
    previewSelectionRef.current = null;
    magicSessionRef.current = null;
    renderOverlay();
  }, [renderOverlay]);
  const brushPreviewRadius = getTraceEraserBrushDiameter(brushSize, trace) / 2;

  return (
    <>
      <canvas
        ref={overlayCanvasRef}
        onPointerDown={(event) => {
          activePointerIdRef.current = event.pointerId;
          lastPointRef.current = null;
          setBrushPreviewPoint({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY });
          event.currentTarget.setPointerCapture(event.pointerId);
          if (editMode === "magic") {
            const seedMaskPoint = getMaskPointFromStagePoint(
              event.nativeEvent.offsetX,
              event.nativeEvent.offsetY,
            );
            if (!seedMaskPoint) {
              return;
            }

            magicSessionRef.current = {
              seedMaskPoint,
              seedStagePoint: {
                x: event.nativeEvent.offsetX,
                y: event.nativeEvent.offsetY,
              },
            };
            updateMagicPreview(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
            return;
          }

          drawAtClientPoint(event.nativeEvent.offsetX, event.nativeEvent.offsetY, false);
        }}
        onPointerMove={(event) => {
          setBrushPreviewPoint({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY });
          if (activePointerIdRef.current !== event.pointerId) {
            return;
          }

          if (editMode === "magic") {
            updateMagicPreview(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
            return;
          }

          drawAtClientPoint(event.nativeEvent.offsetX, event.nativeEvent.offsetY, true);
        }}
        onPointerEnter={(event) => {
          setBrushPreviewPoint({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY });
        }}
        onPointerLeave={() => {
          if (activePointerIdRef.current === null) {
            setBrushPreviewPoint(null);
          }
        }}
        onPointerUp={(event) => {
          if (activePointerIdRef.current !== event.pointerId) {
            return;
          }

          activePointerIdRef.current = null;
          lastPointRef.current = null;
          setBrushPreviewPoint({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY });
          event.currentTarget.releasePointerCapture(event.pointerId);
          if (editMode === "magic") {
            commitMagicPreview();
            return;
          }

          commitDraft();
        }}
        onPointerCancel={(event) => {
          if (activePointerIdRef.current !== event.pointerId) {
            return;
          }

          activePointerIdRef.current = null;
          lastPointRef.current = null;
          setBrushPreviewPoint(null);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          if (editMode === "magic") {
            clearMagicPreview();
            return;
          }

          commitDraft();
        }}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 4,
          width: `${stageWidth}px`,
          height: `${stageHeight}px`,
          touchAction: "none",
          cursor:
            editMode === "brush"
              ? coarsePointer
                ? "url('/paint-brush-cursor.cur') 0 24, crosshair"
                : "none"
              : "crosshair",
        }}
      />
      {editMode === "brush" && !coarsePointer && brushPreviewPoint ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: `${brushPreviewPoint.x}px`,
            top: `${brushPreviewPoint.y}px`,
            width: `${brushPreviewRadius * 2}px`,
            height: `${brushPreviewRadius * 2}px`,
            transform: "translate(-50%, -50%)",
            borderRadius: "999px",
            border: "1.5px solid rgba(255, 255, 255, 0.96)",
            boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.42)",
            background: "rgba(255, 255, 255, 0.08)",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />
      ) : null}
      {editMode === "brush" && brushPreviewVisible ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: `${brushPreviewRadius * 2}px`,
            height: `${brushPreviewRadius * 2}px`,
            transform: "translate(-50%, -50%)",
            borderRadius: "999px",
            border: "2px solid rgba(255, 255, 255, 0.98)",
            boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.52)",
            background: "rgba(255, 255, 255, 0.12)",
            pointerEvents: "none",
            zIndex: 6,
          }}
        />
      ) : null}
    </>
  );
}

type TraceCropDragMode = "move" | "nw" | "ne" | "se" | "sw";

interface TraceCropEditorOverlayProps {
  assetHeight: number;
  assetWidth: number;
  cropAspectRatio: number | null;
  cropBase: NonNullable<TraceDisplayOverride>;
  crop: NonNullable<TraceDisplayOverride>;
  getWorldPointFromClient: (clientX: number, clientY: number) => WorldPoint | null;
  imageOpacity: number;
  onCropPreviewChange: (crop: TraceDisplayOverride) => void;
  surfaceHeight: number;
  surfaceWidth: number;
  trace: TraceDocument;
  traceTransform: { offsetX: number; offsetY: number; scale: number; rotation: number };
  zoom: number;
}

function TraceCropEditorOverlay({
  assetHeight,
  assetWidth,
  cropAspectRatio,
  cropBase,
  crop,
  getWorldPointFromClient,
  imageOpacity,
  onCropPreviewChange,
  surfaceHeight,
  surfaceWidth,
  trace,
  traceTransform,
  zoom,
}: TraceCropEditorOverlayProps) {
  const dragSessionRef = useRef<{
    mode: TraceCropDragMode;
    frameBounds: { left: number; top: number; width: number; height: number };
    imageBounds: { left: number; top: number; width: number; height: number };
    pointerId: number;
    startLocalPoint: WorldPoint;
  } | null>(null);
  const handleSize = Math.max(14 / Math.max(zoom, 0.0001), 14);
  const baseDisplaySize = getTraceDisplaySize(
    {
      ...trace,
      ...cropBase,
    },
    assetWidth,
    assetHeight,
  );
  const baseRect = getContainedRect(
    baseDisplaySize.width,
    baseDisplaySize.height,
    surfaceWidth,
    surfaceHeight,
  );
  const baseFrameBounds = getPositionedBounds(baseRect, traceTransform);
  const imageScaleX = baseFrameBounds.width / Math.max(cropBase.cropWidth, 1);
  const imageScaleY = baseFrameBounds.height / Math.max(cropBase.cropHeight, 1);
  const minFrameWidth = baseFrameBounds.width / Math.max(cropBase.cropWidth, 1);
  const minFrameHeight = baseFrameBounds.height / Math.max(cropBase.cropHeight, 1);
  const initialImageBounds = useMemo(
    () => ({
      left: baseFrameBounds.left - cropBase.cropX * imageScaleX,
      top: baseFrameBounds.top - cropBase.cropY * imageScaleY,
      width: assetWidth * imageScaleX,
      height: assetHeight * imageScaleY,
    }),
    [
      assetHeight,
      assetWidth,
      baseFrameBounds.left,
      baseFrameBounds.top,
      cropBase.cropX,
      cropBase.cropY,
      imageScaleX,
      imageScaleY,
    ],
  );
  const initialFrameBounds = useMemo(
    () => ({
      left: initialImageBounds.left + crop.cropX * imageScaleX,
      top: initialImageBounds.top + crop.cropY * imageScaleY,
      width: crop.cropWidth * imageScaleX,
      height: crop.cropHeight * imageScaleY,
    }),
    [
      crop.cropHeight,
      crop.cropWidth,
      crop.cropX,
      crop.cropY,
      initialImageBounds.left,
      initialImageBounds.top,
      imageScaleX,
      imageScaleY,
    ],
  );
  const [displayImageBounds, setDisplayImageBounds] = useState(initialImageBounds);
  const [displayFrameBounds, setDisplayFrameBounds] = useState(initialFrameBounds);
  const previousCropAspectRatioRef = useRef<number | null>(cropAspectRatio);

  useEffect(() => {
    const localCrop = getNormalizedTraceCrop(
      {
        imageWidth: assetWidth,
        imageHeight: assetHeight,
        cropX: (displayFrameBounds.left - displayImageBounds.left) * (assetWidth / Math.max(displayImageBounds.width, 1)),
        cropY: (displayFrameBounds.top - displayImageBounds.top) * (assetHeight / Math.max(displayImageBounds.height, 1)),
        cropWidth: displayFrameBounds.width * (assetWidth / Math.max(displayImageBounds.width, 1)),
        cropHeight: displayFrameBounds.height * (assetHeight / Math.max(displayImageBounds.height, 1)),
      },
      assetWidth,
      assetHeight,
    );

    if (dragSessionRef.current) {
      return;
    }

    if (
      localCrop.cropX === crop.cropX &&
      localCrop.cropY === crop.cropY &&
      localCrop.cropWidth === crop.cropWidth &&
      localCrop.cropHeight === crop.cropHeight
    ) {
      return;
    }

    setDisplayImageBounds(initialImageBounds);
    setDisplayFrameBounds(initialFrameBounds);
  }, [
    assetHeight,
    assetWidth,
    crop,
    displayFrameBounds.height,
    displayFrameBounds.left,
    displayFrameBounds.top,
    displayFrameBounds.width,
    displayImageBounds.height,
    displayImageBounds.left,
    displayImageBounds.top,
    displayImageBounds.width,
    initialFrameBounds,
    initialImageBounds,
  ]);

  const getImageLocalPoint = useCallback(
    (clientX: number, clientY: number) => {
      const worldPoint = getWorldPointFromClient(clientX, clientY);
      if (!worldPoint) {
        return null;
      }

      const localPoint = getLocalPointWithinRotatedBounds(
        worldPoint,
        displayImageBounds,
        trace.rotation,
      );

      return {
        x: displayImageBounds.left + localPoint.x,
        y: displayImageBounds.top + localPoint.y,
      };
    },
    [displayImageBounds, getWorldPointFromClient, trace.rotation],
  );

  const emitCropFromBounds = useCallback(
    (
      nextFrameBounds: { left: number; top: number; width: number; height: number },
      nextImageBounds: { left: number; top: number; width: number; height: number },
    ) => {
      const scaleX = assetWidth / Math.max(nextImageBounds.width, 1);
      const scaleY = assetHeight / Math.max(nextImageBounds.height, 1);
      onCropPreviewChange(
        getNormalizedTraceCrop(
          {
            imageWidth: assetWidth,
            imageHeight: assetHeight,
            cropX: (nextFrameBounds.left - nextImageBounds.left) * scaleX,
            cropY: (nextFrameBounds.top - nextImageBounds.top) * scaleY,
            cropWidth: nextFrameBounds.width * scaleX,
            cropHeight: nextFrameBounds.height * scaleY,
          },
          assetWidth,
          assetHeight,
        ),
      );
    },
    [assetHeight, assetWidth, onCropPreviewChange],
  );

  useEffect(() => {
    if (dragSessionRef.current || previousCropAspectRatioRef.current === cropAspectRatio) {
      return;
    }

    previousCropAspectRatioRef.current = cropAspectRatio;

    if (!cropAspectRatio || cropAspectRatio <= 0) {
      return;
    }

    const nextFrameBounds = fitFrameBoundsToAspectRatio(
      displayFrameBounds,
      displayImageBounds,
      cropAspectRatio,
      minFrameWidth,
      minFrameHeight,
    );

    if (
      nextFrameBounds.left === displayFrameBounds.left &&
      nextFrameBounds.top === displayFrameBounds.top &&
      nextFrameBounds.width === displayFrameBounds.width &&
      nextFrameBounds.height === displayFrameBounds.height
    ) {
      return;
    }

    setDisplayFrameBounds(nextFrameBounds);
    emitCropFromBounds(nextFrameBounds, displayImageBounds);
  }, [
    cropAspectRatio,
    displayFrameBounds,
    displayImageBounds,
    emitCropFromBounds,
    minFrameHeight,
    minFrameWidth,
  ]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const session = dragSessionRef.current;
      if (!session || event.pointerId !== session.pointerId) {
        return;
      }

      const localPoint = getImageLocalPoint(event.clientX, event.clientY);
      if (!localPoint) {
        return;
      }

      const deltaX = localPoint.x - session.startLocalPoint.x;
      const deltaY = localPoint.y - session.startLocalPoint.y;

      if (session.mode === "move") {
        const nextFrameLeft = clamp(
          session.frameBounds.left + deltaX,
          session.imageBounds.left,
          session.imageBounds.left + session.imageBounds.width - session.frameBounds.width,
        );
        const nextFrameTop = clamp(
          session.frameBounds.top + deltaY,
          session.imageBounds.top,
          session.imageBounds.top + session.imageBounds.height - session.frameBounds.height,
        );
        const nextFrameBounds = {
          ...session.frameBounds,
          left: nextFrameLeft,
          top: nextFrameTop,
        };
        setDisplayFrameBounds(nextFrameBounds);
        setDisplayImageBounds(session.imageBounds);

        emitCropFromBounds(nextFrameBounds, session.imageBounds);
        return;
      }

      const nextFrameBounds = getNextCropFrameBoundsForHandleDrag(
        session.mode,
        localPoint,
        session.frameBounds,
        session.imageBounds,
        minFrameWidth,
        minFrameHeight,
        cropAspectRatio,
      );
      setDisplayFrameBounds(nextFrameBounds);
      setDisplayImageBounds(session.imageBounds);
      emitCropFromBounds(nextFrameBounds, session.imageBounds);
    };

    const handlePointerEnd = (event: PointerEvent) => {
      if (dragSessionRef.current?.pointerId === event.pointerId) {
        dragSessionRef.current = null;
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [
    cropAspectRatio,
    emitCropFromBounds,
    getImageLocalPoint,
    minFrameHeight,
    minFrameWidth,
  ]);

  const beginDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, mode: TraceCropDragMode) => {
      const localPoint = getImageLocalPoint(event.clientX, event.clientY);
      if (!localPoint) {
        return;
      }

      dragSessionRef.current = {
        mode,
        frameBounds: displayFrameBounds,
        imageBounds: displayImageBounds,
        pointerId: event.pointerId,
        startLocalPoint: localPoint,
      };
      event.preventDefault();
      event.stopPropagation();
    },
    [displayFrameBounds, displayImageBounds, getImageLocalPoint],
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 5,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: `${displayImageBounds.left}px`,
          top: `${displayImageBounds.top}px`,
          width: `${displayImageBounds.width}px`,
          height: `${displayImageBounds.height}px`,
          transform: getRotationCss(trace.rotation),
          transformOrigin: "center center",
          opacity: imageOpacity,
          pointerEvents: "none",
          overflow: "visible",
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
            objectFit: "fill",
            userSelect: "none",
            WebkitUserSelect: "none",
            pointerEvents: "none",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: `${displayFrameBounds.left}px`,
          top: `${displayFrameBounds.top}px`,
          width: `${displayFrameBounds.width}px`,
          height: `${displayFrameBounds.height}px`,
          transform: getRotationCss(trace.rotation),
          transformOrigin: "center center",
          pointerEvents: "auto",
          touchAction: "none",
          boxSizing: "border-box",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.42)",
          border: "1.5px solid rgba(255, 255, 255, 0.96)",
          cursor: "move",
        }}
        onPointerDown={(event) => beginDrag(event, "move")}
      >
        {(["nw", "ne", "se", "sw"] as const).map((handle) => (
          <div
            key={handle}
            onPointerDown={(event) => beginDrag(event, handle)}
            style={{
              position: "absolute",
              left: `${getCropHandleLeft(handle, displayFrameBounds.width, handleSize)}px`,
              top: `${getCropHandleTop(handle, displayFrameBounds.height, handleSize)}px`,
              width: `${handleSize}px`,
              height: `${handleSize}px`,
              cursor: getCropHandleCursor(handle),
            }}
          >
            {(() => {
              const visualSize = Math.max(handleSize + 14, 32);
              const visualOffset = getCropHandleVisualOffset(handle, handleSize, visualSize);

              return (
            <div
              style={{
                position: "absolute",
                left: `${visualOffset.left}px`,
                top: `${visualOffset.top}px`,
                width: `${visualSize}px`,
                height: `${visualSize}px`,
                filter: "drop-shadow(0 2px 6px rgba(15, 23, 42, 0.42))",
              }}
            >
              <svg
                aria-hidden="true"
                width="100%"
                height="100%"
                viewBox="0 0 32 32"
                style={{ display: "block", overflow: "visible" }}
              >
                <path
                  d={getCropHandleCornerPath(handle)}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.99)"
                  strokeWidth="8"
                  strokeLinecap="square"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}

function getCropHandleLeft(
  handle: "nw" | "ne" | "se" | "sw",
  width: number,
  size: number,
): number {
  return handle === "nw" || handle === "sw" ? -size / 2 : width - size / 2;
}

function getCropHandleTop(
  handle: "nw" | "ne" | "se" | "sw",
  height: number,
  size: number,
): number {
  return handle === "nw" || handle === "ne" ? -size / 2 : height - size / 2;
}

function getCropHandleCursor(handle: "nw" | "ne" | "se" | "sw"): string {
  return handle === "nw" || handle === "se" ? "nwse-resize" : "nesw-resize";
}

function getCropHandleVisualOffset(
  handle: "nw" | "ne" | "se" | "sw",
  hitSize: number,
  visualSize: number,
): { left: number; top: number } {
  const center = hitSize / 2;
  const cornerInset = 8;

  if (handle === "nw") {
    return { left: center - cornerInset, top: center - cornerInset };
  }
  if (handle === "ne") {
    return { left: center - (visualSize - cornerInset), top: center - cornerInset };
  }
  if (handle === "se") {
    return {
      left: center - (visualSize - cornerInset),
      top: center - (visualSize - cornerInset),
    };
  }

  return { left: center - cornerInset, top: center - (visualSize - cornerInset) };
}

function getCropHandleCornerPath(
  handle: "nw" | "ne" | "se" | "sw",
): string {
  if (handle === "nw") {
    return "M 28 8 H 8 V 28";
  }
  if (handle === "ne") {
    return "M 4 8 H 24 V 28";
  }
  if (handle === "se") {
    return "M 4 24 H 24 V 4";
  }
  return "M 28 24 H 8 V 4";
}

function fitFrameBoundsToAspectRatio(
  frameBounds: { left: number; top: number; width: number; height: number },
  imageBounds: { left: number; top: number; width: number; height: number },
  aspectRatio: number,
  minFrameWidth: number,
  minFrameHeight: number,
): { left: number; top: number; width: number; height: number } {
  if (!(aspectRatio > 0)) {
    return frameBounds;
  }

  const widthFromHeight = frameBounds.height * aspectRatio;
  const nextWidth = widthFromHeight <= frameBounds.width
    ? widthFromHeight
    : frameBounds.width;
  const nextHeight = widthFromHeight <= frameBounds.width
    ? frameBounds.height
    : frameBounds.width / aspectRatio;
  const clampedWidth = clamp(nextWidth, minFrameWidth, imageBounds.width);
  const clampedHeight = clamp(nextHeight, minFrameHeight, imageBounds.height);
  const centerX = frameBounds.left + frameBounds.width / 2;
  const centerY = frameBounds.top + frameBounds.height / 2;
  const left = clamp(
    centerX - clampedWidth / 2,
    imageBounds.left,
    imageBounds.left + imageBounds.width - clampedWidth,
  );
  const top = clamp(
    centerY - clampedHeight / 2,
    imageBounds.top,
    imageBounds.top + imageBounds.height - clampedHeight,
  );

  return {
    left,
    top,
    width: clampedWidth,
    height: clampedHeight,
  };
}

function getNextCropFrameBoundsForHandleDrag(
  mode: "nw" | "ne" | "se" | "sw",
  localPoint: WorldPoint,
  frameBounds: { left: number; top: number; width: number; height: number },
  imageBounds: { left: number; top: number; width: number; height: number },
  minFrameWidth: number,
  minFrameHeight: number,
  cropAspectRatio: number | null,
): { left: number; top: number; width: number; height: number } {
  const startRight = frameBounds.left + frameBounds.width;
  const startBottom = frameBounds.top + frameBounds.height;

  if (!cropAspectRatio || !(cropAspectRatio > 0)) {
    let nextLeft = frameBounds.left;
    let nextTop = frameBounds.top;
    let nextRight = startRight;
    let nextBottom = startBottom;

    if (mode === "nw" || mode === "sw") {
      nextLeft = clamp(localPoint.x, imageBounds.left, startRight - minFrameWidth);
    }
    if (mode === "ne" || mode === "se") {
      nextRight = clamp(
        localPoint.x,
        frameBounds.left + minFrameWidth,
        imageBounds.left + imageBounds.width,
      );
    }
    if (mode === "nw" || mode === "ne") {
      nextTop = clamp(localPoint.y, imageBounds.top, startBottom - minFrameHeight);
    }
    if (mode === "sw" || mode === "se") {
      nextBottom = clamp(
        localPoint.y,
        frameBounds.top + minFrameHeight,
        imageBounds.top + imageBounds.height,
      );
    }

    return {
      left: nextLeft,
      top: nextTop,
      width: nextRight - nextLeft,
      height: nextBottom - nextTop,
    };
  }

  const anchorX = mode === "nw" || mode === "sw" ? startRight : frameBounds.left;
  const anchorY = mode === "nw" || mode === "ne" ? startBottom : frameBounds.top;
  const leftEdgeDragged = mode === "nw" || mode === "sw";
  const topEdgeDragged = mode === "nw" || mode === "ne";
  const maxWidth = leftEdgeDragged
    ? anchorX - imageBounds.left
    : imageBounds.left + imageBounds.width - anchorX;
  const maxHeight = topEdgeDragged
    ? anchorY - imageBounds.top
    : imageBounds.top + imageBounds.height - anchorY;
  const maxAspectWidth = Math.max(0, Math.min(maxWidth, maxHeight * cropAspectRatio));
  const maxAspectHeight = maxAspectWidth / cropAspectRatio;
  const minAspectWidth = Math.min(
    Math.max(minFrameWidth, minFrameHeight * cropAspectRatio),
    maxAspectWidth,
  );
  const minAspectHeight = minAspectWidth / cropAspectRatio;
  const rawWidth = Math.abs(localPoint.x - anchorX);
  const rawHeight = Math.abs(localPoint.y - anchorY);
  const widthCandidate = clamp(rawWidth, minAspectWidth, maxAspectWidth);
  const heightFromWidth = widthCandidate / cropAspectRatio;
  const heightCandidate = clamp(rawHeight, minAspectHeight, maxAspectHeight);
  const widthFromHeight = heightCandidate * cropAspectRatio;
  const widthDrivenError =
    Math.abs(rawWidth - widthCandidate) + Math.abs(rawHeight - heightFromWidth);
  const heightDrivenError =
    Math.abs(rawWidth - widthFromHeight) + Math.abs(rawHeight - heightCandidate);
  const nextWidth = widthDrivenError <= heightDrivenError ? widthCandidate : widthFromHeight;
  const nextHeight = widthDrivenError <= heightDrivenError ? heightFromWidth : heightCandidate;
  const nextLeft = leftEdgeDragged ? anchorX - nextWidth : anchorX;
  const nextTop = topEdgeDragged ? anchorY - nextHeight : anchorY;

  return {
    left: nextLeft,
    top: nextTop,
    width: nextWidth,
    height: nextHeight,
  };
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
