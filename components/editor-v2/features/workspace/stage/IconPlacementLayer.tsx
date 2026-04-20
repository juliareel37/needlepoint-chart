"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { renderIconPlacementPreview } from "@/lib/editor-v2/editor/icons/renderIconPlacementPreview";
import type { EditorStore, IconPlacementSession, PaletteColor } from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics, WorldPoint } from "@/lib/editor-v2/editor/viewport";
import {
  getContainedRect,
} from "@/lib/editor-v2/editor/positioning";
import {
  getIconPlacementBounds,
  getIconPlacementTransformCss,
} from "@/lib/editor-v2/editor/icons/iconPlacementGeometry";
import { createUpdateIconPlacementCommand } from "../workspaceCommands";
import { IconPlacementBoxOverlay } from "./overlays/IconPlacementBoxOverlay";

interface IconPlacementLayerProps {
  dispatch: EditorStore["dispatch"];
  getWorldPointFromClient: (clientX: number, clientY: number) => WorldPoint | null;
  metrics: GridWorldMetrics;
  paletteById: Record<string, PaletteColor>;
  placement: IconPlacementSession;
  previewColor: string;
  zoom: number;
}

export function IconPlacementLayer({
  dispatch,
  getWorldPointFromClient,
  metrics,
  paletteById,
  placement,
  previewColor,
  zoom,
}: IconPlacementLayerProps) {
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
  const transform = useMemo(
    () => ({
      offsetX: placement.offsetX,
      offsetY: placement.offsetY,
      scaleX: placement.scaleX,
      scaleY: placement.scaleY,
    }),
    [placement.offsetX, placement.offsetY, placement.scaleX, placement.scaleY],
  );
  const bounds = useMemo(
    () => getIconPlacementBounds(baseRect, transform),
    [baseRect, transform],
  );
  const previewIconRef = useRef<HTMLDivElement | null>(null);
  const [previewSrc, setPreviewSrc] = useState(placement.src);
  const handleTransformPreview = useCallback((nextTransform: typeof transform) => {
    if (previewIconRef.current) {
      previewIconRef.current.style.transform = getIconPlacementTransformCss(nextTransform);
    }
  }, []);
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
    },
    [dispatch],
  );

  useEffect(() => {
    let cancelled = false;

    async function buildPreview() {
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
    paletteById,
    placement.colorSlots,
    placement.intrinsicHeight,
    placement.intrinsicWidth,
    placement.src,
  ]);

  return (
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
          top: `${baseRect.top}px`,
          left: `${baseRect.left}px`,
          width: `${baseRect.width}px`,
          height: `${baseRect.height}px`,
          transform: getIconPlacementTransformCss(transform),
          transformOrigin: "top left",
          willChange: "transform",
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          filter: `drop-shadow(0 1px 0 rgba(255,255,255,0.55))`,
        }}
        >
        {placement.colorSlots.length > 0 ? (
          <img
            src={previewSrc}
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
  );
}
