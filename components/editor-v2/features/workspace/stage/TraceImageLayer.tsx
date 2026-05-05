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
import { createPreviewTraceRepositionCommand } from "../workspaceCommands";
import { PositioningBoxOverlay } from "./overlays/PositioningBoxOverlay";
import type { LoadedTraceAsset } from "./GridCanvasStage.shared";
import type { TraceDisplayOverride } from "./GridCanvasStage.shared";

const DESKTOP_TRACE_DRAG_PROXY_MODE: "off" | "solid-rect" = "off";
const MIN_VISIBLE_TRACE_PX = 24;

interface TraceImageLayerProps {
  cropAspectRatio?: number | null;
  cropBase?: TraceDisplayOverride;
  cropEditing?: boolean;
  dispatch: EditorStore["dispatch"];
  getWorldPointFromClient: (clientX: number, clientY: number) => WorldPoint | null;
  imageOpacity: number;
  metrics: GridWorldMetrics;
  onCropPreviewChange?: (crop: TraceDisplayOverride) => void;
  positioningEnabled: boolean;
  portalHost?: HTMLElement | null;
  stageBounds: { left: number; top: number; width: number; height: number };
  trace: TraceDocument;
  traceAsset: LoadedTraceAsset | null;
  traceDisplayOverride?: TraceDisplayOverride;
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
  getWorldPointFromClient,
  imageOpacity,
  metrics,
  onCropPreviewChange,
  positioningEnabled,
  portalHost = null,
  stageBounds,
  trace,
  traceAsset,
  traceDisplayOverride = null,
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
        setMobilePreviewSize({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      }
    };
    image.src = renderTrace.previewUrl;

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
        trace: renderTrace,
        width: traceAsset.width,
        height: traceAsset.height,
      });
    }
  }, [coarsePointer, renderTrace, traceAsset]);

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
                src={renderTrace.previewUrl}
                alt=""
                draggable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                  imageRendering: "auto",
                  objectFit: "cover",
                  objectPosition: getObjectPositionPercent(
                    renderTrace,
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

  return (
    <>
      {cropOverlay}
      {cropEditing ? null : mobileOverlay}
      {!cropEditing && (!coarsePointer || !positioningEnabled) ? (
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
