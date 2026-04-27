"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildPrimitiveIconDataUrl,
  isPrimitiveFrameKind,
  resolvePrimitiveColorSlots,
} from "@/lib/editor-v2/editor/icons/primitiveIcon";
import {
  renderFlatColorIconPreview,
  renderIconPlacementPreview,
} from "@/lib/editor-v2/editor/icons/renderIconPlacementPreview";
import { renderCellSampledPlacementPreview } from "@/lib/editor-v2/editor/icons/convertIconPlacementToCells";
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
import { SHOW_CELL_SAMPLED_PLACEMENT_PREVIEW } from "./placementPreviewMode";
import { createUpdateIconPlacementCommand } from "../workspaceCommands";
import { IconPlacementBoxOverlay } from "./overlays/IconPlacementBoxOverlay";

interface IconPlacementLayerProps {
  dispatch: EditorStore["dispatch"];
  getWorldPointFromClient: (clientX: number, clientY: number) => WorldPoint | null;
  metrics: GridWorldMetrics;
  paletteById: Record<string, PaletteColor>;
  placement: IconPlacementSession;
  portalHost?: HTMLElement | null;
  previewColor: string;
  stageBounds: { left: number; top: number; width: number; height: number };
  viewport: ViewportState;
  worldBounds: { left: number; top: number; width: number; height: number };
  zoom: number;
}

export function IconPlacementLayer({
  dispatch,
  getWorldPointFromClient,
  metrics,
  paletteById,
  placement,
  portalHost = null,
  previewColor,
  stageBounds,
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
  const [coarsePointer, setCoarsePointer] = useState(false);
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
  const mobileDisplayStageBounds = useMemo(
    () => ({
      left: worldBounds.left + displayBounds.left * viewport.zoom,
      top: worldBounds.top + displayBounds.top * viewport.zoom,
      width: displayBounds.width * viewport.zoom,
      height: displayBounds.height * viewport.zoom,
    }),
    [displayBounds, viewport.zoom, worldBounds.left, worldBounds.top],
  );
  const mobileOverlayBounds = useMemo(
    () => ({
      left: mobileDisplayStageBounds.left - stageBounds.left,
      top: mobileDisplayStageBounds.top - stageBounds.top,
      width: mobileDisplayStageBounds.width,
      height: mobileDisplayStageBounds.height,
    }),
    [mobileDisplayStageBounds, stageBounds.left, stageBounds.top],
  );
  const previewIconRef = useRef<HTMLDivElement | null>(null);
  const mobilePreviewIconRef = useRef<HTMLDivElement | null>(null);
  const previewImageRef = useRef<HTMLImageElement | null>(null);
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
            strokeWidthScale: placement.strokeWidthScale,
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

      return {
        left: worldBounds.left - stageBounds.left + nextBounds.left * viewport.zoom,
        top: worldBounds.top - stageBounds.top + nextBounds.top * viewport.zoom,
        width: nextBounds.width * viewport.zoom,
        height: nextBounds.height * viewport.zoom,
      };
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
  const handleTransformPreview = useCallback((nextTransform: typeof transform) => {
    if (coarsePointer && portalHost) {
      setPreviewTransform(nextTransform);
      const mobilePreviewIcon = mobilePreviewIconRef.current;
      if (!mobilePreviewIcon) {
        return;
      }

      const nextBounds = projectMobileStageBounds(nextTransform, baseRect);
      applyPreviewIconBox(mobilePreviewIcon, nextBounds, nextTransform.rotation);
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
    coarsePointer,
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

    async function buildPreview() {
      const basePreviewSrc = await (async () => {
        if (placement.primitiveKind) {
          return primitivePreviewSrc;
        }

        if (placement.colorSlots.length === 0) {
          if (!useCellSampledPreview) {
            return null;
          }

          return renderFlatColorIconPreview(
            placement.src,
            placement.intrinsicWidth,
            placement.intrinsicHeight,
            previewColor,
          );
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

      if (!basePreviewSrc) {
        if (!cancelled) {
          setPreviewSrc(null);
        }
        return;
      }

      if (!useCellSampledPreview) {
        if (!cancelled) {
          setPreviewSrc(basePreviewSrc);
        }
        return;
      }

      try {
        const nextPreviewSrc = await renderCellSampledPlacementPreview({
          src: basePreviewSrc,
          bounds: displayBounds,
          metrics,
        });
        if (!cancelled) {
          setPreviewSrc(nextPreviewSrc);
        }
      } catch {
        if (!cancelled) {
          setPreviewSrc(basePreviewSrc);
        }
      }
    }

    void buildPreview();

    return () => {
      cancelled = true;
    };
  }, [
    displayBounds.height,
    displayBounds.width,
    displayBounds.left,
    displayBounds.top,
    metrics,
    paletteById,
    placement.colorSlots,
    placement.intrinsicHeight,
    placement.intrinsicWidth,
    placement.primitiveKind,
    placement.primitiveStrokeReferenceSize,
    placement.src,
    placement.strokeWidthScale,
    placement.primitivePatternScale,
    placement.primitiveSpacingScale,
    placement.supportsStrokeWidth,
    primitivePreviewSrc,
    previewColor,
    primitiveColors,
    useCellSampledPreview,
  ]);

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
    setPreviewTransform(null);
  }, [transform]);

  const showMobilePositioning = coarsePointer && portalHost;
  const mobileOverlay = showMobilePositioning
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
            ref={mobilePreviewIconRef}
            style={{
              position: "absolute",
              top: `${mobileOverlayBounds.top}px`,
              left: `${mobileOverlayBounds.left}px`,
              width: `${mobileOverlayBounds.width}px`,
              height: `${mobileOverlayBounds.height}px`,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              filter: `drop-shadow(0 1px 0 rgba(255,255,255,0.55))`,
              transform: getRotationCss(displayTransform.rotation),
              transformOrigin: "center center",
            }}
          >
            {previewSrc ? (
              <img
                src={previewSrc ?? undefined}
                alt=""
                aria-hidden="true"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
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
          </div>

          <IconPlacementBoxOverlay
            ariaLabel="Icon placement controls"
            baseRect={baseRect}
            bounds={mobileOverlayBounds}
            interactionBounds={displayBounds}
            getWorldPointFromClient={getWorldPointFromClient}
            onTransformCommit={handleTransformCommit}
            onTransformPreview={handleTransformPreview}
            projectBoundsForPreview={projectMobileStageBounds}
            snapContainerBounds={snapContainerBounds}
            snapGuideContainerBounds={mobileSnapGuideContainerBounds}
            snapGuideZoom={1}
            snapZoom={viewport.zoom}
            transactionKeyPrefix="icon-drag"
            transform={transform}
            zoom={1}
          />
        </div>,
        portalHost,
      )
    : null;

  return (
    <>
      {mobileOverlay}
      {!showMobilePositioning ? (
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
            {previewSrc ? (
              <img
                ref={previewImageRef}
                src={previewSrc ?? undefined}
                alt=""
                aria-hidden="true"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
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
            transactionKeyPrefix="icon-drag"
            transform={transform}
            zoom={zoom}
          />
        </div>
      ) : null}
    </>
  );
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
