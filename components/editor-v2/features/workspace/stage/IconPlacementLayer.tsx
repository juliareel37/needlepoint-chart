"use client";

import { useCallback, useMemo, useRef } from "react";
import type { EditorStore, IconPlacementSession } from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics, WorldPoint } from "@/lib/editor-v2/editor/viewport";
import {
  getContainedRect,
  getPositionedBounds,
  getPositioningTransformCss,
} from "@/lib/editor-v2/editor/positioning";
import { createUpdateIconPlacementCommand } from "../workspaceCommands";
import { PositioningBoxOverlay } from "./overlays/PositioningBoxOverlay";

interface IconPlacementLayerProps {
  dispatch: EditorStore["dispatch"];
  getWorldPointFromClient: (clientX: number, clientY: number) => WorldPoint | null;
  metrics: GridWorldMetrics;
  placement: IconPlacementSession;
  previewColor: string;
  zoom: number;
}

export function IconPlacementLayer({
  dispatch,
  getWorldPointFromClient,
  metrics,
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
      scale: placement.scale,
    }),
    [placement.offsetX, placement.offsetY, placement.scale],
  );
  const bounds = useMemo(
    () => getPositionedBounds(baseRect, transform),
    [baseRect, transform],
  );
  const previewIconRef = useRef<HTMLDivElement | null>(null);
  const handleTransformPreview = useCallback((nextTransform: typeof transform) => {
    if (previewIconRef.current) {
      previewIconRef.current.style.transform = getPositioningTransformCss(nextTransform);
    }
  }, []);
  const handleTransformCommit = useCallback(
    (nextTransform: typeof transform, _transactionKey?: string) => {
      dispatch(
        createUpdateIconPlacementCommand({
          offsetX: nextTransform.offsetX,
          offsetY: nextTransform.offsetY,
          scale: nextTransform.scale,
        }),
      );
    },
    [dispatch],
  );

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
          transform: getPositioningTransformCss(transform),
          transformOrigin: "top left",
          willChange: "transform",
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          filter: `drop-shadow(0 1px 0 rgba(255,255,255,0.55))`,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: previewColor,
            WebkitMaskImage: `url(${placement.src})`,
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            WebkitMaskSize: "contain",
            maskImage: `url(${placement.src})`,
            maskRepeat: "no-repeat",
            maskPosition: "center",
            maskSize: "contain",
          }}
        />
      </div>

      <PositioningBoxOverlay
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
