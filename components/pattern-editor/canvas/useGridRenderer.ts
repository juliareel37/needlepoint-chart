"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { Color } from "../../../lib/grid";
import { idx } from "../../../lib/grid";
import { symbolForColorId } from "../../../lib/symbols";
import { contrastForHex, hexToRgb } from "../utils/colorUtils";
import { getThreadRadii, getThreadStitchCanvas } from "./stitchUtils";

type FilterRect = { x0: number; y0: number; x1: number; y1: number };
type ToolName = "none" | "paint" | "eraser" | "fill" | "eyedropper" | "lasso";
type Point = { x: number; y: number };

type UseGridRendererArgs = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  width: number;
  height: number;
  grid: Uint16Array;
  paletteById: Map<number, Color>;
  symbolMap?: Map<number, string>;
  cellSize: number;
  canvasW: number;
  canvasH: number;
  containerWidth: number;
  containerHeight: number;
  lassoPoints: Point[];
  lassoClosed: boolean;
  threadView: boolean;
  traceImage: HTMLImageElement | null;
  traceOpacity: number;
  traceScale: number;
  traceOffsetX: number;
  traceOffsetY: number;
  traceAdjustMode: boolean;
  darkCanvas: boolean;
  drawTranslateX: number;
  drawTranslateY: number;
  showSymbols: boolean;
  identifyColorId?: number | null;
  hoverCell: { x: number; y: number } | null;
  tool: ToolName;
  brushSize: number;
  activeColorId: number;
  panMode: boolean;
  activeFilterRect: FilterRect | null;
  filterSelecting: boolean;
  filterEditMode?: boolean;
  zoom: number;
  showGridlines: boolean;
  gridBackground?: string;
};

export function useGridRenderer({
  canvasRef,
  width,
  height,
  grid,
  paletteById,
  symbolMap,
  cellSize,
  canvasW,
  canvasH,
  containerWidth,
  containerHeight,
  lassoPoints,
  lassoClosed,
  threadView,
  traceImage,
  traceOpacity,
  traceScale,
  traceOffsetX,
  traceOffsetY,
  traceAdjustMode,
  darkCanvas,
  drawTranslateX,
  drawTranslateY,
  showSymbols,
  identifyColorId,
  hoverCell,
  tool,
  brushSize,
  activeColorId,
  panMode,
  activeFilterRect,
  filterSelecting,
  filterEditMode = false,
  zoom,
  showGridlines,
  gridBackground,
}: UseGridRendererArgs) {
  const stitchCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const stitchStyleVersion = 6;
  const lastSurfaceRef = useRef<{ w: number; h: number; dpr: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Crisp lines on high DPI screens
    const dpr = window.devicePixelRatio || 1;
    const surfaceW = containerWidth || canvasW;
    const surfaceH = containerHeight || canvasH;
    const nextW = Math.floor(surfaceW * dpr);
    const nextH = Math.floor(surfaceH * dpr);
    const last = lastSurfaceRef.current;
    if (!last || last.w !== nextW || last.h !== nextH || last.dpr !== dpr) {
      canvas.width = nextW;
      canvas.height = nextH;
      canvas.style.width = `${surfaceW}px`;
      canvas.style.height = `${surfaceH}px`;
      lastSurfaceRef.current = { w: nextW, h: nextH, dpr };
    } else {
      // Keep CSS size in sync even if the backing store is unchanged.
      if (canvas.style.width !== `${surfaceW}px`) canvas.style.width = `${surfaceW}px`;
      if (canvas.style.height !== `${surfaceH}px`) canvas.style.height = `${surfaceH}px`;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background
    ctx.clearRect(0, 0, surfaceW, surfaceH);
    // Keep canvas transparent so overscroll reveals the container background.

    // Grid shadow (drawn within the canvas to avoid layout/compositing glitches).
    ctx.save();
    ctx.translate(drawTranslateX, drawTranslateY);
    ctx.shadowColor = "rgba(15, 23, 42, 0.28)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = "rgba(0,0,0,0.01)";
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.restore();

    // Grid background (only the grid area).
    ctx.save();
    ctx.translate(drawTranslateX, drawTranslateY);
    ctx.fillStyle = darkCanvas ? "#000000" : gridBackground ?? "#ffffff";
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.restore();

    // Trace image (below cells)
    if (traceImage && traceOpacity > 0) {
      ctx.save();
      ctx.translate(drawTranslateX, drawTranslateY);
      if (!traceAdjustMode) {
        ctx.beginPath();
        ctx.rect(0, 0, canvasW, canvasH);
        ctx.clip();
      }
      ctx.globalAlpha = Math.min(1, Math.max(0, traceOpacity));
      const drawW = traceImage.width * traceScale * zoom;
      const drawH = traceImage.height * traceScale * zoom;
      ctx.drawImage(traceImage, traceOffsetX * zoom, traceOffsetY * zoom, drawW, drawH);
      if (traceAdjustMode) {
        const accent = getComputedStyle(canvas).getPropertyValue("--accent-strong").trim() || "#7c3aed";
        ctx.globalAlpha = 1;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(traceOffsetX * zoom + 1, traceOffsetY * zoom + 1, Math.max(0, drawW - 2), Math.max(0, drawH - 2));
      }
      ctx.restore();
    }

    // Cells
    const gridAlpha = Math.min(1, Math.max(0, 1 - traceOpacity));
    ctx.save();
    ctx.translate(drawTranslateX, drawTranslateY);
    ctx.globalAlpha = gridAlpha;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const colorId = grid[idx(x, y, width)];
        if (colorId === 0) continue;
        const color = paletteById.get(colorId);
        if (!color) continue;
        ctx.fillStyle = color.hex;
        if (threadView) {
          const stitch = getThreadStitchCanvas(color.hex, cellSize, stitchCacheRef.current, stitchStyleVersion);
          ctx.drawImage(stitch, x * cellSize, y * cellSize, cellSize, cellSize);
        } else {
          const x0 = Math.round(x * cellSize);
          const y0 = Math.round(y * cellSize);
          const x1 = Math.round((x + 1) * cellSize);
          const y1 = Math.round((y + 1) * cellSize);
          ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
        }

        if (showSymbols) {
          const symbol = symbolForColorId(color.id, symbolMap);
          if (symbol) {
            const centerX = x * cellSize + cellSize / 2;
            const centerY = y * cellSize + cellSize / 2;
            ctx.save();
            ctx.globalAlpha = 1;
            ctx.fillStyle = contrastForHex(color.hex);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = `700 ${Math.max(6, Math.floor(cellSize * 0.7))}px ui-sans-serif, system-ui, sans-serif`;
            ctx.fillText(symbol, centerX, centerY + 0.5);
            ctx.restore();
          }
        }
      }
    }
    ctx.restore();

    // Gridlines
    if (showGridlines) {
      ctx.save();
      ctx.translate(drawTranslateX, drawTranslateY);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = darkCanvas ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.18)";
      ctx.lineWidth = 1;
      const maxX = Math.max(0, canvasW - 0.5);
      const maxY = Math.max(0, canvasH - 0.5);

      // Vertical lines
      for (let x = 0; x <= width; x++) {
        const px = Math.min(maxX, Math.round(x * cellSize) + 0.5);
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, canvasH);
        ctx.stroke();
      }
      // Horizontal lines
      for (let y = 0; y <= height; y++) {
        const py = Math.min(maxY, Math.round(y * cellSize) + 0.5);
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(canvasW, py);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (!showGridlines) {
      ctx.save();
      ctx.translate(drawTranslateX, drawTranslateY);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = darkCanvas ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.18)";
      ctx.lineWidth = 1;
      const w = Math.max(0, canvasW - 1);
      const h = Math.max(0, canvasH - 1);
      ctx.strokeRect(0.5, 0.5, w, h);
      ctx.restore();
    }

    if (identifyColorId != null) {
      ctx.save();
      ctx.translate(drawTranslateX, drawTranslateY);
      ctx.fillStyle = "rgba(90,90,90,0.82)";
      ctx.fillRect(0, 0, canvasW, canvasH);

      const drawIdentifyCell = (x: number, y: number) => {
        if (threadView) {
          const centerX = x * cellSize + cellSize / 2;
          const centerY = y * cellSize + cellSize / 2;
          const { radiusX, radiusY } = getThreadRadii(cellSize);
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(-Math.PI / 4);
          ctx.beginPath();
          ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          const x0 = Math.round(x * cellSize);
          const y0 = Math.round(y * cellSize);
          const x1 = Math.round((x + 1) * cellSize);
          const y1 = Math.round((y + 1) * cellSize);
          ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
        }
      };

      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,1)";
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (grid[idx(x, y, width)] !== identifyColorId) continue;
          drawIdentifyCell(x, y);
        }
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(255,255,0,0.85)";
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (grid[idx(x, y, width)] !== identifyColorId) continue;
          drawIdentifyCell(x, y);
        }
      }
      if (showSymbols) {
        const symbol = symbolForColorId(identifyColorId, symbolMap);
        if (symbol) {
          ctx.fillStyle = "rgba(0,0,0,0.9)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = `700 ${Math.max(6, Math.floor(cellSize * 0.7))}px ui-sans-serif, system-ui, sans-serif`;
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              if (grid[idx(x, y, width)] !== identifyColorId) continue;
              ctx.fillText(symbol, x * cellSize + cellSize / 2, y * cellSize + cellSize / 2 + 0.5);
            }
          }
        }
      }
      ctx.restore();
    }

    if (traceAdjustMode && traceImage) {
      ctx.save();
      ctx.translate(drawTranslateX, drawTranslateY);
      const x = traceOffsetX * zoom;
      const y = traceOffsetY * zoom;
      const w = traceImage.width * traceScale * zoom;
      const h = traceImage.height * traceScale * zoom;
      const handleSize = 8;
      const accent = getComputedStyle(canvas).getPropertyValue("--accent-strong").trim() || "#7c3aed";
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, Math.max(0, w - 2), Math.max(0, h - 2));
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      const half = handleSize / 2;
      const handles = [
        [x, y],
        [x + w, y],
        [x, y + h],
        [x + w, y + h],
        [x + w / 2, y],
        [x + w / 2, y + h],
        [x, y + h / 2],
        [x + w, y + h / 2],
      ];
      handles.forEach(([cx, cy]) => {
        ctx.fillRect(cx - half, cy - half, handleSize, handleSize);
        ctx.strokeRect(cx - half, cy - half, handleSize, handleSize);
      });
      ctx.restore();
    }

    // Lasso overlay
    if (lassoPoints.length > 0) {
      ctx.save();
      ctx.translate(drawTranslateX, drawTranslateY);
      ctx.strokeStyle = darkCanvas ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.8)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
      for (let i = 1; i < lassoPoints.length; i++) {
        ctx.lineTo(lassoPoints[i].x, lassoPoints[i].y);
      }
      if (lassoClosed) ctx.closePath();
      ctx.stroke();

      ctx.restore();
    }

    if (hoverCell && (tool === "paint" || tool === "eraser") && !panMode && !traceAdjustMode && !filterEditMode) {
      const size = Math.max(1, Math.floor(brushSize));
      const radius = Math.floor(size / 2);
      const startX = hoverCell.x - radius;
      const startY = hoverCell.y - radius;
      const endX = startX + size - 1;
      const endY = startY + size - 1;
      const clampedStartX = Math.max(0, startX);
      const clampedStartY = Math.max(0, startY);
      const clampedEndX = Math.min(width - 1, endX);
      const clampedEndY = Math.min(height - 1, endY);
      if (clampedStartX <= clampedEndX && clampedStartY <= clampedEndY) {
        const x0 = Math.round(clampedStartX * cellSize);
        const y0 = Math.round(clampedStartY * cellSize);
        const x1 = Math.round((clampedEndX + 1) * cellSize);
        const y1 = Math.round((clampedEndY + 1) * cellSize);
        const previewW = x1 - x0;
        const previewH = y1 - y0;
        const color = paletteById.get(activeColorId);
        let fill = "";
        if (tool === "paint" && color) {
          const rgb = hexToRgb(color.hex);
          if (rgb) fill = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.25)`;
        } else if (tool === "eraser") {
          fill = darkCanvas ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.5)";
        }
        ctx.save();
        ctx.translate(drawTranslateX, drawTranslateY);
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fillRect(x0, y0, previewW, previewH);
        }
        ctx.strokeStyle = darkCanvas ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.7)";
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.strokeRect(
          x0 + 0.5,
          y0 + 0.5,
          Math.max(0, previewW - 1),
          Math.max(0, previewH - 1)
        );
        ctx.restore();
      }
    }

    if (filterSelecting && !activeFilterRect) {
      ctx.save();
      ctx.translate(drawTranslateX, drawTranslateY);
      ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.restore();
    }

    if (activeFilterRect) {
      const x0 = Math.round(activeFilterRect.x0 * cellSize);
      const y0 = Math.round(activeFilterRect.y0 * cellSize);
      const x1 = Math.round((activeFilterRect.x1 + 1) * cellSize);
      const y1 = Math.round((activeFilterRect.y1 + 1) * cellSize);
      const w = x1 - x0;
      const h = y1 - y0;
      if (w > 0 && h > 0) {
        ctx.save();
        ctx.translate(drawTranslateX, drawTranslateY);
        ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
        ctx.beginPath();
        ctx.rect(0, 0, canvasW, canvasH);
        ctx.rect(x0, y0, w, h);
        ctx.fill("evenodd");
        ctx.strokeStyle = "rgba(191, 100, 217, 0.95)";
        ctx.lineWidth = 2;
        if (filterSelecting) {
          ctx.setLineDash([6, 4]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.strokeRect(x0 + 1, y0 + 1, Math.max(0, w - 2), Math.max(0, h - 2));
        if (filterEditMode) {
          const handleSize = 8;
          const half = handleSize / 2;
          ctx.fillStyle = "rgba(255,255,255,0.95)";
          ctx.strokeStyle = "rgba(0,0,0,0.65)";
          const handles = [
            [x0, y0],
            [x1, y0],
            [x0, y1],
            [x1, y1],
            [x0 + w / 2, y0],
            [x0 + w / 2, y1],
            [x0, y0 + h / 2],
            [x1, y0 + h / 2],
          ];
          handles.forEach(([cx, cy]) => {
            ctx.fillRect(cx - half, cy - half, handleSize, handleSize);
            ctx.strokeRect(cx - half, cy - half, handleSize, handleSize);
          });
        }
        ctx.restore();
      }
    }
  }, [
    width,
    height,
    grid,
    paletteById,
    symbolMap,
    cellSize,
    showGridlines,
    canvasW,
    canvasH,
    containerWidth,
    containerHeight,
    lassoPoints,
    lassoClosed,
    threadView,
    traceImage,
    traceOpacity,
    traceScale,
    traceOffsetX,
    traceOffsetY,
    traceAdjustMode,
    darkCanvas,
    drawTranslateX,
    drawTranslateY,
    showSymbols,
    identifyColorId,
    hoverCell,
    tool,
    brushSize,
    activeColorId,
    panMode,
    activeFilterRect,
    filterSelecting,
    filterEditMode,
    zoom,
  ]);
}
