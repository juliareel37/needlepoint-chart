"use client";

import { useEffect, useRef } from "react";
import type { LibraryStitchSnapshot } from "@/lib/library/stitchSnapshot";
import { getThreadStitchCanvas } from "@/lib/stitchUtils";

export function StitchThumbnailCanvas({
  snapshot,
  className,
}: {
  snapshot: LibraryStitchSnapshot | null;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stitchCanvasCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());

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
  }, [snapshot]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
