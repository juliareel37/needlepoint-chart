"use client";

import { useEffect, useRef } from "react";
import {
  getContainedRect,
  getPositionedBounds,
} from "@/lib/editor-v2/editor/positioning";
import type { LibraryTracePlacement } from "@/lib/library/designs";
import type { LibraryStitchSnapshot } from "@/lib/library/stitchSnapshot";
import { getThreadStitchCanvas } from "@/lib/stitchUtils";

const EDITOR_TRACE_POSITION_CELL_SIZE = 28;
const TRACE_ASPECT_MISMATCH_EPSILON = 0.05;

export function StitchThumbnailCanvas({
  snapshot,
  traceThumbnailUrl,
  tracePlacement,
  className,
}: {
  snapshot: LibraryStitchSnapshot | null;
  traceThumbnailUrl?: string | null;
  tracePlacement?: LibraryTracePlacement | null;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stitchCanvasCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const traceImageCacheRef = useRef<Map<string, HTMLImageElement | null>>(new Map());
  const aspectRatio = snapshot ? snapshot.width / Math.max(snapshot.height, 1) : 1;
  const frameStyle =
    aspectRatio >= 1
      ? {
          width: "100%",
          height: `${100 / aspectRatio}%`,
        }
      : {
          width: `${aspectRatio * 100}%`,
          height: "100%",
        };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const render = () => {
      const currentCanvas = canvasRef.current;
      if (!currentCanvas) {
        return;
      }

      const bounds = currentCanvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(bounds.width));
      const height = Math.max(1, Math.round(bounds.height));
      const dpr = window.devicePixelRatio || 1;
      currentCanvas.width = Math.max(1, Math.round(width * dpr));
      currentCanvas.height = Math.max(1, Math.round(height * dpr));

      const context = currentCanvas.getContext("2d");
      if (!context) {
        return;
      }
      const canvasBackground = getComputedStyle(currentCanvas)
        .getPropertyValue("--canvas-bg")
        .trim();

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = canvasBackground || "#ffffff";
      context.fillRect(0, 0, width, height);

      if (!snapshot) {
        return;
      }

      const cellSize = Math.max(1, Math.min(width / snapshot.width, height / snapshot.height));
      const drawWidth = cellSize * snapshot.width;
      const drawHeight = cellSize * snapshot.height;
      const drawX = (width - drawWidth) / 2;
      const drawY = (height - drawHeight) / 2;
      const oversampleFactor = cellSize >= 18 ? 1 : cellSize >= 12 ? 1.5 : 2;
      const stitchSize = Math.max(1, Math.round(cellSize * oversampleFactor));

      context.imageSmoothingEnabled = oversampleFactor > 1;
      if (oversampleFactor > 1) {
        context.imageSmoothingQuality = "high";
      }

      if (traceThumbnailUrl) {
        const cachedTraceImage = traceImageCacheRef.current.get(traceThumbnailUrl);

        if (cachedTraceImage) {
          const loadedTraceWidth =
            cachedTraceImage.naturalWidth || cachedTraceImage.width || 0;
          const loadedTraceHeight =
            cachedTraceImage.naturalHeight || cachedTraceImage.height || 0;
          const persistedTraceWidth =
            tracePlacement?.imageWidth && tracePlacement.imageWidth > 0
              ? tracePlacement.imageWidth
              : 0;
          const persistedTraceHeight =
            tracePlacement?.imageHeight && tracePlacement.imageHeight > 0
              ? tracePlacement.imageHeight
              : 0;
          const loadedAspect =
            loadedTraceWidth > 0 && loadedTraceHeight > 0
              ? loadedTraceWidth / loadedTraceHeight
              : null;
          const persistedAspect =
            persistedTraceWidth > 0 && persistedTraceHeight > 0
              ? persistedTraceWidth / persistedTraceHeight
              : null;
          const shouldPreferPersistedAspect =
            loadedAspect !== null &&
            persistedAspect !== null &&
            Math.abs(loadedAspect - persistedAspect) / persistedAspect >
              TRACE_ASPECT_MISMATCH_EPSILON;
          const traceSourceWidth = shouldPreferPersistedAspect
            ? persistedTraceWidth
            : loadedTraceWidth || persistedTraceWidth;
          const traceSourceHeight = shouldPreferPersistedAspect
            ? persistedTraceHeight
            : loadedTraceHeight || persistedTraceHeight;
          const traceBaseRect = getContainedRect(
            traceSourceWidth,
            traceSourceHeight,
            drawWidth,
            drawHeight,
          );
          const traceBounds = getPositionedBounds(traceBaseRect, {
            offsetX:
              (tracePlacement?.offsetX ?? 0) *
              (cellSize / EDITOR_TRACE_POSITION_CELL_SIZE),
            offsetY:
              (tracePlacement?.offsetY ?? 0) *
              (cellSize / EDITOR_TRACE_POSITION_CELL_SIZE),
            scale: tracePlacement?.scale ?? 1,
            rotation: tracePlacement?.rotation ?? 0,
          });

          context.save();
          context.globalAlpha = 0.35;
          context.translate(
            drawX + traceBounds.left + traceBounds.width / 2,
            drawY + traceBounds.top + traceBounds.height / 2,
          );
          context.rotate(((tracePlacement?.rotation ?? 0) * Math.PI) / 180);
          context.drawImage(
            cachedTraceImage,
            -traceBounds.width / 2,
            -traceBounds.height / 2,
            traceBounds.width,
            traceBounds.height,
          );
          context.restore();
        } else if (!traceImageCacheRef.current.has(traceThumbnailUrl)) {
          traceImageCacheRef.current.set(traceThumbnailUrl, null);
          const traceImage = new Image();
          traceImage.crossOrigin = "anonymous";
          traceImage.decoding = "async";
          traceImage.onload = () => {
            traceImageCacheRef.current.set(traceThumbnailUrl, traceImage);
            render();
          };
          traceImage.onerror = () => {
            traceImageCacheRef.current.delete(traceThumbnailUrl);
          };
          traceImage.src = traceThumbnailUrl;
        }
      }

      for (let index = 0; index < snapshot.cells.length; index += 1) {
        const color = snapshot.cells[index];

        if (!color) {
          continue;
        }

        const x = index % snapshot.width;
        const y = Math.floor(index / snapshot.width);
        const stitchCanvas = getThreadStitchCanvas(
          color,
          stitchSize,
          stitchCanvasCacheRef.current,
          1,
        );

        context.drawImage(
          stitchCanvas,
          drawX + x * cellSize,
          drawY + y * cellSize,
          cellSize,
          cellSize,
        );
      }
    };

    render();
    const observer = new ResizeObserver(() => render());
    observer.observe(canvas);

    return () => observer.disconnect();
  }, [snapshot, tracePlacement, traceThumbnailUrl]);

  return (
    <div className={className} style={frameStyle} aria-hidden="true">
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
}
