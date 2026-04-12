"use client";

import { useCallback, useMemo } from "react";
import type { EditorStore, TextPlacementSession } from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics, WorldPoint } from "@/lib/editor-v2/editor/viewport";
import {
  getContainedRect,
  getPositionedBounds,
  getPositioningTransformCss,
} from "@/lib/editor-v2/editor/positioning";
import { createPreviewTextPlacementCommand } from "../workspaceCommands";
import { PositioningBoxOverlay } from "./overlays/PositioningBoxOverlay";

interface TextPlacementLayerProps {
  dispatch: EditorStore["dispatch"];
  getWorldPointFromClient: (clientX: number, clientY: number) => WorldPoint | null;
  metrics: GridWorldMetrics;
  placement: TextPlacementSession;
  previewColor: string;
  zoom: number;
}

export function TextPlacementLayer({
  dispatch,
  getWorldPointFromClient,
  metrics,
  placement,
  previewColor,
  zoom,
}: TextPlacementLayerProps) {
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
  const baseFontScale = baseRect.width / Math.max(placement.intrinsicWidth, 1);
  const fontSize = placement.baseFontSize * baseFontScale;
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
  const handleTransformChange = useCallback(
    (nextTransform: typeof transform) => {
      dispatch(
        createPreviewTextPlacementCommand({
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
        aria-hidden="true"
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
          fontFamily: `${placement.fontFamily}, sans-serif`,
          fontWeight: placement.fontWeight,
          fontStyle: placement.fontStyle,
          fontSize: `${fontSize}px`,
          lineHeight: 1.1,
          textAlign: "center",
          color: previewColor,
          textShadow: "0 1px 0 rgba(255,255,255,0.55)",
          textDecoration: placement.underline ? "underline" : "none",
          padding: 6,
          boxSizing: "border-box",
          whiteSpace: "pre-wrap",
          overflow: "hidden",
        }}
      >
        {placement.text}
      </div>

      <PositioningBoxOverlay
        ariaLabel="Text placement controls"
        baseRect={baseRect}
        bounds={bounds}
        getWorldPointFromClient={getWorldPointFromClient}
        onTransformChange={handleTransformChange}
        transactionKeyPrefix="text-drag"
        transform={transform}
        zoom={zoom}
      />
    </div>
  );
}
