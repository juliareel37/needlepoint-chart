"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildPrimitiveIconDataUrl,
  isPrimitiveFrameKind,
  resolvePrimitiveColorSlots,
} from "@/lib/editor-v2/editor/icons/primitiveIcon";
import { renderIconPlacementPreview } from "@/lib/editor-v2/editor/icons/renderIconPlacementPreview";
import type { EditorStore, IconPlacementSession, PaletteColor } from "@/lib/editor-v2/editor/store";
import type { ViewportState } from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics, WorldPoint } from "@/lib/editor-v2/editor/viewport";
import {
  getContainedRect,
} from "@/lib/editor-v2/editor/positioning";
import {
  getIconPlacementBounds,
  getIconPlacementTransformCss,
  type IconPlacementTransform,
} from "@/lib/editor-v2/editor/icons/iconPlacementGeometry";
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
  const [coarsePointer, setCoarsePointer] = useState(false);
  const [mobilePreviewTransform, setMobilePreviewTransform] = useState<
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
      lockAspectRatio: placement.lockAspectRatio,
      freeCornerResize: isPrimitiveFrameKind(placement.primitiveKind),
    }),
    [
      placement.primitiveKind,
      placement.lockAspectRatio,
      placement.offsetX,
      placement.offsetY,
      placement.scaleX,
      placement.scaleY,
    ],
  );
  const bounds = useMemo(
    () => getIconPlacementBounds(baseRect, transform),
    [baseRect, transform],
  );
  const displayTransform = mobilePreviewTransform ?? transform;
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
  const previewImageRef = useRef<HTMLImageElement | null>(null);
  const [previewSrc, setPreviewSrc] = useState(placement.src);
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
  const handleTransformPreview = useCallback((nextTransform: typeof transform) => {
    if (coarsePointer && portalHost) {
      setMobilePreviewTransform(nextTransform);
      return;
    }

    if (!previewIconRef.current) {
      return;
    }

    if (placement.primitiveKind) {
      const nextBounds = getIconPlacementBounds(baseRect, nextTransform);
      previewIconRef.current.style.left = `${nextBounds.left}px`;
      previewIconRef.current.style.top = `${nextBounds.top}px`;
      previewIconRef.current.style.width = `${nextBounds.width}px`;
      previewIconRef.current.style.height = `${nextBounds.height}px`;
      previewIconRef.current.style.transform = "none";
      if (previewImageRef.current) {
        previewImageRef.current.src = buildPrimitiveIconDataUrl({
          kind: placement.primitiveKind,
          width: nextBounds.width,
          height: nextBounds.height,
          strokeColor: primitiveColors?.primary ?? previewColor,
          secondaryStrokeColor: primitiveColors?.secondary,
          strokeReferenceSize: placement.primitiveStrokeReferenceSize,
          strokeWidthScale: placement.strokeWidthScale,
          patternScale: placement.primitivePatternScale,
          spacingScale: placement.primitiveSpacingScale,
        });
      }
      return;
    }

    previewIconRef.current.style.transform = getIconPlacementTransformCss(nextTransform);
  }, [
    baseRect,
    coarsePointer,
    placement.primitiveKind,
    portalHost,
    placement.strokeWidthScale,
    placement.primitivePatternScale,
    placement.primitiveSpacingScale,
    previewColor,
    primitiveColors,
  ]);
  const handleTransformCommit = useCallback(
    (nextTransform: typeof transform, _transactionKey?: string) => {
      dispatch(
        createUpdateIconPlacementCommand({
          offsetX: nextTransform.offsetX,
          offsetY: nextTransform.offsetY,
          scaleX: nextTransform.scaleX,
          scaleY: nextTransform.scaleY,
        }),
      );
      setMobilePreviewTransform(nextTransform);
    },
    [dispatch],
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

  useEffect(() => {
    let cancelled = false;

    async function buildPreview() {
      if (placement.primitiveKind) {
        setPreviewSrc(primitivePreviewSrc ?? placement.src);
        return;
      }

      if (placement.colorSlots.length === 0) {
        setPreviewSrc(placement.src);
        return;
      }

      try {
        const nextPreviewSrc = await renderIconPlacementPreview(
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

        if (!cancelled) {
          setPreviewSrc(nextPreviewSrc);
        }
      } catch {
        if (!cancelled) {
          setPreviewSrc(placement.src);
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
    setMobilePreviewTransform(null);
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
            }}
          >
            {placement.primitiveKind || placement.colorSlots.length > 0 ? (
              <img
                src={placement.primitiveKind ? primitivePreviewSrc ?? previewSrc : previewSrc}
                alt=""
                aria-hidden="true"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            ) : (
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
              top: `${placement.primitiveKind ? bounds.top : baseRect.top}px`,
              left: `${placement.primitiveKind ? bounds.left : baseRect.left}px`,
              width: `${placement.primitiveKind ? bounds.width : baseRect.width}px`,
              height: `${placement.primitiveKind ? bounds.height : baseRect.height}px`,
              transform: placement.primitiveKind
                ? "none"
                : getIconPlacementTransformCss(transform),
              transformOrigin: "top left",
              willChange: "transform",
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              filter: `drop-shadow(0 1px 0 rgba(255,255,255,0.55))`,
            }}
          >
            {placement.primitiveKind || placement.colorSlots.length > 0 ? (
              <img
                ref={previewImageRef}
                src={placement.primitiveKind ? primitivePreviewSrc ?? previewSrc : previewSrc}
                alt=""
                aria-hidden="true"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            ) : (
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
            transactionKeyPrefix="icon-drag"
            transform={transform}
            zoom={zoom}
          />
        </div>
      ) : null}
    </>
  );
}
