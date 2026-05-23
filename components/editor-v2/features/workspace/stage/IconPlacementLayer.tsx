"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildPrimitiveIconDataUrl,
  isPrimitiveFrameKind,
  resolvePrimitiveColorSlots,
} from "@/lib/editor-v2/editor/icons/primitiveIcon";
import {
  renderIconPlacementPreview,
} from "@/lib/editor-v2/editor/icons/renderIconPlacementPreview";
import {
  sampleCellSampledPlacementPreview,
  type CellSampledPreviewCell,
} from "@/lib/editor-v2/editor/icons/convertIconPlacementToCells";
import type { EditorStore, IconPlacementSession, PaletteColor } from "@/lib/editor-v2/editor/store";
import type { ViewportState } from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics, WorldPoint } from "@/lib/editor-v2/editor/viewport";
import {
  getContainedRect,
  getRotationCss,
} from "@/lib/editor-v2/editor/positioning";
import {
  getIconPlacementBounds,
  type IconPlacementTransform,
} from "@/lib/editor-v2/editor/icons/iconPlacementGeometry";
import type { EraserEditMode, EraserMode } from "@/lib/editor-v2/editor/magicWand";
import { SHOW_CELL_SAMPLED_PLACEMENT_PREVIEW } from "./placementPreviewMode";
import { createUpdateIconPlacementCommand } from "../workspaceCommands";
import { IconPlacementBoxOverlay } from "./overlays/IconPlacementBoxOverlay";
import { IconPlacementEraserOverlay } from "./IconPlacementEraserOverlay";
import styles from "../shell/EditorV2Shell.module.css";

interface IconPlacementLayerProps {
  dispatch: EditorStore["dispatch"];
  eraserBrushPreviewVisible?: boolean;
  eraserBrushSize?: number;
  eraserDraftRevision?: number;
  eraserEditing?: boolean;
  eraserMaskUrl?: string | null;
  eraserEditMode?: EraserEditMode;
  eraserMode?: EraserMode;
  getWorldPointFromClient: (clientX: number, clientY: number) => WorldPoint | null;
  metrics: GridWorldMetrics;
  onEraserDraftChange?: (nextMaskUrl: string | null, isFullyVisible: boolean) => void;
  paletteById: Record<string, PaletteColor>;
  placement: IconPlacementSession;
  portalHost?: HTMLElement | null;
  previewColor: string;
  stageBounds: { left: number; top: number; width: number; height: number };
  touchSnappingEnabled: boolean;
  viewport: ViewportState;
  worldBounds: { left: number; top: number; width: number; height: number };
  zoom: number;
}

export function IconPlacementLayer({
  dispatch,
  eraserBrushPreviewVisible = false,
  eraserBrushSize = 1,
  eraserDraftRevision = 0,
  eraserEditing = false,
  eraserMaskUrl = null,
  eraserEditMode = "brush",
  eraserMode = "erase",
  getWorldPointFromClient,
  metrics,
  onEraserDraftChange,
  paletteById,
  placement,
  portalHost = null,
  previewColor,
  stageBounds,
  touchSnappingEnabled,
  viewport,
  worldBounds,
  zoom,
}: IconPlacementLayerProps) {
  const useCellSampledPreview = SHOW_CELL_SAMPLED_PLACEMENT_PREVIEW;
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
  const [previewTransform, setPreviewTransform] = useState<
    IconPlacementTransform | null
  >(null);
  const baseRect = useMemo(
    () =>
      getContainedRect(
        placement.intrinsicWidth,
        placement.intrinsicHeight,
        metrics.surfaceWidth,
        metrics.surfaceHeight,
      ),
    [
      metrics.surfaceHeight,
      metrics.surfaceWidth,
      placement.intrinsicHeight,
      placement.intrinsicWidth,
    ],
  );
  const transform = useMemo<IconPlacementTransform>(
    () => ({
      offsetX: placement.offsetX,
      offsetY: placement.offsetY,
      scaleX: placement.scaleX,
      scaleY: placement.scaleY,
      rotation: placement.rotation,
      lockAspectRatio: placement.lockAspectRatio,
      freeCornerResize: isPrimitiveFrameKind(placement.primitiveKind),
    }),
    [
      placement.primitiveKind,
      placement.lockAspectRatio,
      placement.offsetX,
      placement.offsetY,
      placement.rotation,
      placement.scaleX,
      placement.scaleY,
    ],
  );
  const bounds = useMemo(
    () => getIconPlacementBounds(baseRect, transform),
    [baseRect, transform],
  );
  const displayTransform = previewTransform ?? transform;
  const displayBounds = useMemo(
    () => getIconPlacementBounds(baseRect, displayTransform),
    [baseRect, displayTransform],
  );
  const displayStageBounds = useMemo(() => {
    const devicePixelRatio =
      typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;

    return snapRectToDevicePixels(
      {
        left: worldBounds.left + displayBounds.left * viewport.zoom,
        top: worldBounds.top + displayBounds.top * viewport.zoom,
        width: displayBounds.width * viewport.zoom,
        height: displayBounds.height * viewport.zoom,
      },
      devicePixelRatio,
    );
  }, [displayBounds, viewport.zoom, worldBounds.left, worldBounds.top]);
  const overlayBounds = useMemo(
    () => ({
      left: displayStageBounds.left - stageBounds.left,
      top: displayStageBounds.top - stageBounds.top,
      width: displayStageBounds.width,
      height: displayStageBounds.height,
    }),
    [displayStageBounds, stageBounds.left, stageBounds.top],
  );
  const previewIconRef = useRef<HTMLDivElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewImageCacheRef = useRef<{
    src: string;
    image: HTMLImageElement;
  } | null>(null);
  const primitiveColors = useMemo(
    () =>
      placement.primitiveKind
        ? resolvePrimitiveColorSlots(placement.colorSlots, paletteById, previewColor)
        : null,
    [paletteById, placement.colorSlots, placement.primitiveKind, previewColor],
  );
  const primitivePreviewSrc = useMemo(
    () =>
      placement.primitiveKind
        ? buildPrimitiveIconDataUrl({
            kind: placement.primitiveKind,
            width: displayBounds.width,
            height: displayBounds.height,
            strokeColor: primitiveColors?.primary ?? previewColor,
            secondaryStrokeColor: primitiveColors?.secondary,
            fillColor: primitiveColors?.fill,
            strokeReferenceSize: placement.primitiveStrokeReferenceSize,
            strokeWidthScale:
              placement.primitiveKind === "linked-circle-frame"
                ? 1
                : placement.strokeWidthScale,
            patternScale: placement.primitivePatternScale,
            spacingScale: placement.primitiveSpacingScale,
          })
        : null,
    [
      displayBounds.height,
      displayBounds.width,
      placement.primitiveKind,
      placement.primitiveStrokeReferenceSize,
      placement.strokeWidthScale,
      placement.primitivePatternScale,
      placement.primitiveSpacingScale,
      previewColor,
      primitiveColors,
    ],
  );
  const projectMobileStageBounds = useCallback(
    (
      nextTransform: IconPlacementTransform,
      nextBaseRect: typeof baseRect,
    ) => {
      const nextBounds = getIconPlacementBounds(nextBaseRect, nextTransform);
      const devicePixelRatio =
        typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;

      return snapRectToDevicePixels(
        {
          left: worldBounds.left - stageBounds.left + nextBounds.left * viewport.zoom,
          top: worldBounds.top - stageBounds.top + nextBounds.top * viewport.zoom,
          width: nextBounds.width * viewport.zoom,
          height: nextBounds.height * viewport.zoom,
        },
        devicePixelRatio,
      );
    },
    [
      stageBounds.left,
      stageBounds.top,
      viewport.zoom,
      worldBounds.left,
      worldBounds.top,
    ],
  );
  const [previewSrc, setPreviewSrc] = useState<string | null>(
    placement.primitiveKind ? null : placement.src,
  );
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [sampledPreviewCells, setSampledPreviewCells] = useState<CellSampledPreviewCell[] | null>(null);
  const handleTransformPreview = useCallback((nextTransform: typeof transform) => {
    if (portalHost) {
      setPreviewTransform(nextTransform);
      const previewIcon = previewIconRef.current;
      if (!previewIcon) {
        return;
      }

      const nextBounds = projectMobileStageBounds(nextTransform, baseRect);
      applyPreviewIconBox(previewIcon, nextBounds, nextTransform.rotation);
      return;
    }

    if (placement.primitiveKind || useCellSampledPreview) {
      setPreviewTransform(nextTransform);
    }

    if (!previewIconRef.current) {
      return;
    }

    if (placement.primitiveKind) {
      const nextBounds = getIconPlacementBounds(baseRect, nextTransform);
      applyPreviewIconBox(previewIconRef.current, nextBounds, nextTransform.rotation);
      return;
    }

    const nextBounds = getIconPlacementBounds(baseRect, nextTransform);
    applyPreviewIconBox(previewIconRef.current, nextBounds, nextTransform.rotation);
  }, [
    baseRect,
    placement.primitiveKind,
    portalHost,
    projectMobileStageBounds,
    useCellSampledPreview,
  ]);
  const handleTransformCommit = useCallback(
    (nextTransform: typeof transform, _transactionKey?: string) => {
      dispatch(
        createUpdateIconPlacementCommand({
          offsetX: nextTransform.offsetX,
          offsetY: nextTransform.offsetY,
          scaleX: nextTransform.scaleX,
          scaleY: nextTransform.scaleY,
          rotation: nextTransform.rotation,
        }),
      );
      setPreviewTransform(nextTransform);
    },
    [dispatch],
  );

  useEffect(() => {
    let cancelled = false;

    async function buildBasePreview() {
      setIsPreviewLoading(true);
      const nextPreviewSrc = await (async () => {
        if (placement.primitiveKind) {
          return primitivePreviewSrc;
        }

        if (placement.colorSlots.length === 0) {
          return placement.src;
        }

        return renderIconPlacementPreview(
          placement.src,
          placement.intrinsicWidth,
          placement.intrinsicHeight,
          placement.colorSlots,
          paletteById,
          {
            strokeWidthScale: placement.strokeWidthScale,
            supportsStrokeWidth: placement.supportsStrokeWidth,
          },
        );
      })();

      if (!cancelled) {
        setPreviewSrc(nextPreviewSrc);
      }
    }

    void buildBasePreview();

    return () => {
      cancelled = true;
    };
  }, [
    paletteById,
    placement.colorSlots,
    placement.intrinsicHeight,
    placement.intrinsicWidth,
    placement.primitiveKind,
    placement.src,
    placement.strokeWidthScale,
    placement.supportsStrokeWidth,
    primitivePreviewSrc,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function buildSampledPreview() {
      if (!previewSrc) {
        if (!cancelled) {
          setSampledPreviewCells(null);
          setIsPreviewLoading(false);
        }
        return;
      }

      if (!useCellSampledPreview || !shouldUseCellSampledIconPreview(displayBounds, metrics)) {
        if (!cancelled) {
          setSampledPreviewCells(null);
          setIsPreviewLoading(false);
        }
        return;
      }

      try {
        const cachedPreview = previewImageCacheRef.current;
        const image =
          cachedPreview?.src === previewSrc
            ? cachedPreview.image
            : await loadPreviewImage(previewSrc);

        if (cancelled) {
          return;
        }

        if (cachedPreview?.src !== previewSrc) {
          previewImageCacheRef.current = {
            src: previewSrc,
            image,
          };
        }

        const sourceCanvas = document.createElement("canvas");
        const sourceCanvasSize = getCellSampledSourceCanvasSize(displayBounds, metrics);
        sourceCanvas.width = sourceCanvasSize.width;
        sourceCanvas.height = sourceCanvasSize.height;
        const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
        if (!sourceContext) {
          throw new Error("Unable to get icon preview context");
        }
        sourceContext.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
        sourceContext.drawImage(image, 0, 0, sourceCanvas.width, sourceCanvas.height);
        const nextSampledCells = sampleCellSampledPlacementPreview({
          bounds: displayBounds,
          metrics,
          sourceContext,
        });
        if (!cancelled) {
          setSampledPreviewCells(nextSampledCells);
          setIsPreviewLoading(false);
        }
      } catch {
        if (!cancelled) {
          setSampledPreviewCells(null);
          setIsPreviewLoading(false);
        }
      }
    }

    void buildSampledPreview();

    return () => {
      cancelled = true;
    };
  }, [
    displayBounds.height,
    displayBounds.width,
    displayBounds.left,
    displayBounds.top,
    metrics,
    previewSrc,
    useCellSampledPreview,
  ]);

  useEffect(() => {
    if (placement.primitiveKind) {
      setIsPreviewLoading(false);
    }
  }, [placement.primitiveKind]);

  const previewLoadingOverlay = isPreviewLoading ? (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        borderRadius: 12,
        background: "rgba(255, 255, 255, 0.52)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          borderRadius: 999,
          background: "rgba(255, 255, 255, 0.88)",
          boxShadow: "0 6px 18px rgba(15, 23, 42, 0.12)",
          color: "var(--text-primary)",
          fontSize: 12,
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        <span className={styles.saveButtonSpinner} aria-hidden="true" />
        Preparing preview...
      </div>
    </div>
  ) : null;

  useEffect(() => {
    setPreviewTransform(null);
  }, [transform]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !sampledPreviewCells) {
      return;
    }

    const devicePixelRatio =
      typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
    const renderBounds = portalHost ? overlayBounds : displayBounds;
    const cssWidth = Math.max(1, renderBounds.width);
    const cssHeight = Math.max(1, renderBounds.height);
    const backingWidth = Math.max(1, Math.round(cssWidth * devicePixelRatio));
    const backingHeight = Math.max(1, Math.round(cssHeight * devicePixelRatio));

    if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
      canvas.width = backingWidth;
      canvas.height = backingHeight;
    }
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, cssWidth, cssHeight);

    const pitch = metrics.cellSize + metrics.cellGap;
    const gapOverlap = Math.max(0, metrics.cellGap / 2);

    for (const cell of sampledPreviewCells) {
      const cellRect = snapRectToDevicePixels(
        {
          left: (cell.x * pitch - displayBounds.left - gapOverlap) * viewport.zoom,
          top: (cell.y * pitch - displayBounds.top - gapOverlap) * viewport.zoom,
          width: (metrics.cellSize + gapOverlap * 2) * viewport.zoom,
          height: (metrics.cellSize + gapOverlap * 2) * viewport.zoom,
        },
        devicePixelRatio,
      );

      if (cellRect.width <= 0 || cellRect.height <= 0) {
        continue;
      }

      context.fillStyle = `rgba(${cell.color.r}, ${cell.color.g}, ${cell.color.b}, ${cell.alpha})`;
      context.fillRect(cellRect.left, cellRect.top, cellRect.width, cellRect.height);
    }
  }, [
    displayBounds.left,
    displayBounds.top,
    displayBounds.width,
    displayBounds.height,
    metrics.cellGap,
    metrics.cellSize,
    overlayBounds.height,
    overlayBounds.width,
    portalHost,
    sampledPreviewCells,
    viewport.zoom,
  ]);

  const portalOverlay = portalHost
    ? createPortal(
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <div
            ref={previewIconRef}
            style={{
              position: "absolute",
              top: `${overlayBounds.top}px`,
              left: `${overlayBounds.left}px`,
              width: `${overlayBounds.width}px`,
              height: `${overlayBounds.height}px`,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              filter: `drop-shadow(0 1px 0 rgba(255,255,255,0.55))`,
              transform: getRotationCss(displayTransform.rotation),
              transformOrigin: "center center",
            }}
          >
            {sampledPreviewCells ? (
              <canvas
                ref={previewCanvasRef}
                aria-hidden="true"
                style={{
                  width: "100%",
                  height: "100%",
                  imageRendering: "pixelated",
                }}
              />
            ) : previewSrc ? (
              <img
                src={previewSrc ?? undefined}
                alt=""
                aria-hidden="true"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  imageRendering:
                    useCellSampledPreview || placement.primitiveKind ? "pixelated" : "auto",
                }}
              />
            ) : placement.primitiveKind ? null : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: previewColor,
                  WebkitMaskImage: `url(${placement.src})`,
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  WebkitMaskSize: "100% 100%",
                  maskImage: `url(${placement.src})`,
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                  maskSize: "100% 100%",
                }}
              />
            )}
            {previewLoadingOverlay}
          </div>

          <IconPlacementBoxOverlay
            ariaLabel="Icon placement controls"
            baseRect={baseRect}
            bounds={overlayBounds}
            interactionBounds={displayBounds}
            getWorldPointFromClient={getWorldPointFromClient}
            onTransformCommit={handleTransformCommit}
            onTransformPreview={handleTransformPreview}
            projectBoundsForPreview={projectMobileStageBounds}
            snapContainerBounds={snapContainerBounds}
            snapGuideContainerBounds={mobileSnapGuideContainerBounds}
            snapGuideZoom={1}
            snapZoom={viewport.zoom}
            touchSnappingEnabled={touchSnappingEnabled}
            transactionKeyPrefix="icon-drag"
            transform={transform}
            zoom={1}
          />
        </div>,
        portalHost,
      )
    : null;

  const eraserOverlayContent =
    eraserEditing && previewSrc && onEraserDraftChange
      ? (
          <IconPlacementEraserOverlay
            bounds={portalHost ? overlayBounds : displayBounds}
            brushPreviewVisible={eraserBrushPreviewVisible}
            brushSize={eraserBrushSize}
            displaySrc={previewSrc}
            draftMaskUrl={eraserMaskUrl}
            draftRevision={eraserDraftRevision}
            editMode={eraserEditMode}
            imageOpacity={1}
            intrinsicHeight={placement.intrinsicHeight}
            intrinsicWidth={placement.intrinsicWidth}
            mode={eraserMode}
            onMaskChange={onEraserDraftChange}
            rotation={displayTransform.rotation}
            stageHeight={portalHost ? stageBounds.height : metrics.surfaceHeight}
            stageWidth={portalHost ? stageBounds.width : metrics.surfaceWidth}
          />
        )
      : null;
  const eraserOverlay =
    eraserOverlayContent && portalHost
      ? createPortal(
          <div
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              zIndex: 10,
            }}
          >
            {eraserOverlayContent}
          </div>,
          portalHost,
        )
      : eraserOverlayContent;

  return (
    <>
      {eraserOverlay}
      {!eraserEditing ? portalOverlay : null}
      {!portalHost && !eraserEditing ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            overflow: "visible",
            pointerEvents: "auto",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          <div
            ref={previewIconRef}
            style={{
              position: "absolute",
              top: `${displayBounds.top}px`,
              left: `${displayBounds.left}px`,
              width: `${displayBounds.width}px`,
              height: `${displayBounds.height}px`,
              transform: getRotationCss(displayTransform.rotation),
              transformOrigin: "center center",
              willChange: "left, top, width, height, transform",
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              filter: `drop-shadow(0 1px 0 rgba(255,255,255,0.55))`,
            }}
          >
            {sampledPreviewCells ? (
              <canvas
                ref={previewCanvasRef}
                aria-hidden="true"
                style={{
                  width: "100%",
                  height: "100%",
                  imageRendering: "pixelated",
                }}
              />
            ) : previewSrc ? (
              <img
                src={previewSrc ?? undefined}
                alt=""
                aria-hidden="true"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  imageRendering:
                    useCellSampledPreview || placement.primitiveKind ? "pixelated" : "auto",
                }}
              />
            ) : placement.primitiveKind ? null : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: previewColor,
                  WebkitMaskImage: `url(${placement.src})`,
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  WebkitMaskSize: "100% 100%",
                  maskImage: `url(${placement.src})`,
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                  maskSize: "100% 100%",
                }}
              />
            )}
            {previewLoadingOverlay}
          </div>

          <IconPlacementBoxOverlay
            ariaLabel="Icon placement controls"
            baseRect={baseRect}
            bounds={bounds}
            getWorldPointFromClient={getWorldPointFromClient}
            onTransformCommit={handleTransformCommit}
            onTransformPreview={handleTransformPreview}
            snapContainerBounds={snapContainerBounds}
            snapGuideContainerBounds={snapContainerBounds}
            snapGuideZoom={zoom}
            snapZoom={viewport.zoom}
            touchSnappingEnabled={touchSnappingEnabled}
            transactionKeyPrefix="icon-drag"
            transform={transform}
            zoom={zoom}
          />
        </div>
      ) : null}
    </>
  );
}

function shouldUseCellSampledIconPreview(
  bounds: { left: number; top: number; width: number; height: number },
  metrics: GridWorldMetrics,
): boolean {
  if (!Number.isFinite(bounds.left) || !Number.isFinite(bounds.top)) {
    return false;
  }

  if (!Number.isFinite(bounds.width) || !Number.isFinite(bounds.height)) {
    return false;
  }

  if (bounds.width <= 0 || bounds.height <= 0) {
    return false;
  }
  const visibleWidth = Math.max(
    0,
    Math.min(bounds.left + bounds.width, metrics.surfaceWidth) - Math.max(bounds.left, 0),
  );
  const visibleHeight = Math.max(
    0,
    Math.min(bounds.top + bounds.height, metrics.surfaceHeight) - Math.max(bounds.top, 0),
  );

  if (visibleWidth <= 0 || visibleHeight <= 0) {
    return false;
  }

  return true;
}

function getCellSampledSourceCanvasSize(
  bounds: { width: number; height: number },
  metrics: GridWorldMetrics,
) {
  const pitch = Math.max(1, metrics.cellSize + metrics.cellGap);

  return {
    width: Math.max(1, Math.ceil(bounds.width / pitch) + 1),
    height: Math.max(1, Math.ceil(bounds.height / pitch) + 1),
  };
}

function loadPreviewImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load preview image: ${src}`));
    image.src = src;
  });
}

function snapRectToDevicePixels(
  rect: { left: number; top: number; width: number; height: number },
  devicePixelRatio: number,
) {
  const left = snapToDevicePixel(rect.left, devicePixelRatio);
  const top = snapToDevicePixel(rect.top, devicePixelRatio);
  const right = snapToDevicePixel(rect.left + rect.width, devicePixelRatio);
  const bottom = snapToDevicePixel(rect.top + rect.height, devicePixelRatio);

  return {
    left,
    top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

function snapToDevicePixel(value: number, devicePixelRatio: number): number {
  return Math.round(value * devicePixelRatio) / devicePixelRatio;
}

function applyPreviewIconBox(
  element: HTMLDivElement,
  bounds: { left: number; top: number; width: number; height: number },
  rotation: number,
): void {
  element.style.left = `${bounds.left}px`;
  element.style.top = `${bounds.top}px`;
  element.style.width = `${bounds.width}px`;
  element.style.height = `${bounds.height}px`;
  element.style.transform = getRotationCss(rotation);
}
