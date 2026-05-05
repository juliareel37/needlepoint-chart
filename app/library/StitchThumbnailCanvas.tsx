"use client";

import { useEffect, useRef, useState } from "react";
import {
  getContainedRect,
  getPositionedBounds,
} from "@/lib/editor-v2/editor/positioning";
import type { LibraryTracePlacement } from "@/lib/library/designs";
import type { LibraryStitchSnapshot } from "@/lib/library/stitchSnapshot";
import { getThreadStitchCanvas } from "@/lib/stitchUtils";

const EDITOR_TRACE_POSITION_CELL_SIZE = 28;
const LOW_SCALE_PREVIEW_CELL_SIZE_THRESHOLD = 2;
const TRACE_ASPECT_MISMATCH_EPSILON = 0.05;

function getThumbnailSurfaceSize(snapshot: LibraryStitchSnapshot) {
  return {
    width: snapshot.width * EDITOR_TRACE_POSITION_CELL_SIZE,
    height: snapshot.height * EDITOR_TRACE_POSITION_CELL_SIZE,
  };
}

function createScratchCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

function getMeasurementSize(element: HTMLElement) {
  const computedStyle = window.getComputedStyle(element);
  const paddingX =
    parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
  const paddingY =
    parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
  const width = element.clientWidth - paddingX;
  const height = element.clientHeight - paddingY;

  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
}

export function StitchThumbnailCanvas({
  snapshot,
  traceThumbnailUrl,
  tracePlacement,
  className,
  testId,
}: {
  snapshot: LibraryStitchSnapshot | null;
  traceThumbnailUrl?: string | null;
  tracePlacement?: LibraryTracePlacement | null;
  className?: string;
  testId?: string;
}) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stitchCanvasCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const traceImageCacheRef = useRef<Map<string, HTMLImageElement | null>>(new Map());
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    let frameId: number | null = null;

    const syncBackgroundColor = () => {
      const nextColor = getComputedStyle(root)
        .getPropertyValue("--canvas-bg")
        .trim();
      setBackgroundColor(nextColor || "#ffffff");
    };

    const syncBackgroundColorDuringThemeTransition = () => {
      syncBackgroundColor();

      if (!root.hasAttribute("data-theme-transitioning")) {
        frameId = null;
        return;
      }

      frameId = window.requestAnimationFrame(syncBackgroundColorDuringThemeTransition);
    };

    syncBackgroundColor();

    const observer = new MutationObserver(() => {
      syncBackgroundColor();

      if (root.hasAttribute("data-theme-transitioning") && frameId === null) {
        frameId = window.requestAnimationFrame(syncBackgroundColorDuringThemeTransition);
      }
    });
    observer.observe(root, {
      attributeFilter: ["data-theme", "data-theme-transitioning"],
      attributes: true,
    });

    return () => {
      observer.disconnect();
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  useEffect(() => {
    const surface = surfaceRef.current;
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!surface || !frame || !canvas) {
      return;
    }

    const render = () => {
      const currentSurface = surfaceRef.current;
      const currentFrame = frameRef.current;
      const currentCanvas = canvasRef.current;
      if (!currentSurface || !currentFrame || !currentCanvas) {
        return;
      }

      const measurementElement = currentSurface.parentElement ?? currentSurface;
      const { width: surfaceWidth, height: surfaceHeight } =
        getMeasurementSize(measurementElement);
      const thumbnailSurface = snapshot
        ? getContainedRect(
            snapshot.width,
            snapshot.height,
            surfaceWidth,
            surfaceHeight,
          )
        : { width: surfaceWidth, height: surfaceHeight };
      const width = Math.max(1, Math.round(thumbnailSurface.width));
      const height = Math.max(1, Math.round(thumbnailSurface.height));
      const dpr = window.devicePixelRatio || 1;
      const targetWidth = Math.max(1, Math.round(width * dpr));
      const targetHeight = Math.max(1, Math.round(height * dpr));
      const nextFrameWidth = `${width}px`;
      const nextFrameHeight = `${height}px`;

      if (currentFrame.style.width !== nextFrameWidth) {
        currentFrame.style.width = nextFrameWidth;
      }

      if (currentFrame.style.height !== nextFrameHeight) {
        currentFrame.style.height = nextFrameHeight;
      }

      if (currentCanvas.width !== targetWidth) {
        currentCanvas.width = targetWidth;
      }

      if (currentCanvas.height !== targetHeight) {
        currentCanvas.height = targetHeight;
      }

      const context = currentCanvas.getContext("2d");
      if (!context) {
        return;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = backgroundColor || "#ffffff";
      context.fillRect(0, 0, width, height);

      if (!snapshot) {
        return;
      }

      const cellSize = Math.min(width / snapshot.width, height / snapshot.height);
      const drawWidth = cellSize * snapshot.width;
      const drawHeight = cellSize * snapshot.height;
      const drawX = (width - drawWidth) / 2;
      const drawY = (height - drawHeight) / 2;
      const oversampleFactor = cellSize >= 18 ? 1 : cellSize >= 12 ? 1.5 : 2;
      const stitchSize = Math.max(1, Math.round(cellSize * oversampleFactor));
      const shouldUseCompactPreview = cellSize < LOW_SCALE_PREVIEW_CELL_SIZE_THRESHOLD;

      context.imageSmoothingEnabled = oversampleFactor > 1;
      if (oversampleFactor > 1) {
        context.imageSmoothingQuality = "high";
      }

      let compactPreviewCanvas: HTMLCanvasElement | null = null;
      let compactPreviewContext: CanvasRenderingContext2D | null = null;

      if (shouldUseCompactPreview) {
        compactPreviewCanvas = createScratchCanvas(snapshot.width, snapshot.height);
        compactPreviewContext = compactPreviewCanvas.getContext("2d");
        compactPreviewContext?.clearRect(0, 0, snapshot.width, snapshot.height);
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

          if (compactPreviewContext) {
            const compactScale = 1 / EDITOR_TRACE_POSITION_CELL_SIZE;
            compactPreviewContext.save();
            compactPreviewContext.globalAlpha = 0.35;
            compactPreviewContext.translate(
              (traceBounds.left + traceBounds.width / 2) * compactScale,
              (traceBounds.top + traceBounds.height / 2) * compactScale,
            );
            compactPreviewContext.rotate(
              ((tracePlacement?.rotation ?? 0) * Math.PI) / 180,
            );
            compactPreviewContext.drawImage(
              cachedTraceImage,
              (-traceBounds.width / 2) * compactScale,
              (-traceBounds.height / 2) * compactScale,
              traceBounds.width * compactScale,
              traceBounds.height * compactScale,
            );
            compactPreviewContext.restore();
          }
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

        if (compactPreviewContext) {
          compactPreviewContext.fillStyle = color;
          compactPreviewContext.fillRect(x, y, 1, 1);
          continue;
        }

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

      if (compactPreviewCanvas) {
        context.save();
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(compactPreviewCanvas, drawX, drawY, drawWidth, drawHeight);
        context.restore();
      }
    };

    render();
    let resizeTimeoutId: number | null = null;
    let animationFrameId: number | null = null;
    let lastMeasuredWidth = -1;
    let lastMeasuredHeight = -1;

    const renderOnNextFrame = () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = null;
        render();
      });
    };

    const scheduleSettledRender = () => {
      if (resizeTimeoutId !== null) {
        window.clearTimeout(resizeTimeoutId);
      }

      resizeTimeoutId = window.setTimeout(() => {
        resizeTimeoutId = null;
        renderOnNextFrame();
      }, 140);
    };

    const measurementElement = surface.parentElement ?? surface;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const nextWidth = Math.round(entry?.contentRect.width ?? 0);
      const nextHeight = Math.round(entry?.contentRect.height ?? 0);

      if (nextWidth === lastMeasuredWidth && nextHeight === lastMeasuredHeight) {
        return;
      }

      lastMeasuredWidth = nextWidth;
      lastMeasuredHeight = nextHeight;
      renderOnNextFrame();
      scheduleSettledRender();
    });
    observer.observe(measurementElement);

    const handleWindowResize = () => {
      scheduleSettledRender();
    };
    window.addEventListener("resize", handleWindowResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleWindowResize);

      if (resizeTimeoutId !== null) {
        window.clearTimeout(resizeTimeoutId);
      }

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [backgroundColor, snapshot, tracePlacement, traceThumbnailUrl]);

  return (
    <div
      ref={surfaceRef}
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        placeItems: "center",
      }}
      aria-hidden="true"
    >
      <div
        ref={frameRef}
        className={className}
        data-testid={testId}
        style={{ width: "100%", height: "100%" }}
      >
        <canvas
          ref={canvasRef}
          style={{ display: "block", width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}
