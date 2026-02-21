"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Color } from "../../../lib/grid";
import { idx } from "../../../lib/grid";
import { assetPath } from "../../../lib/assetPath";
import { pointInPolygon } from "../utils/geometry";
import { scanlineFillChunked, scanlineFillSync } from "./fillUtils";
import { useGridRenderer } from "./useGridRenderer";

type Props = {
  width: number;
  height: number;
  grid: Uint16Array;
  paletteById: Map<number, Color>;
  symbolMap?: Map<number, string>;
  activeColorId: number;
  cellSize: number;
  containerWidth: number;
  containerHeight: number;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  pinchEnabled: boolean;
  onZoomChange: (nextZoom: number) => void;
  centerCanvasToken?: number;
  focusCell?: { x: number; y: number } | null;
  focusCellToken?: number;
  threadView: boolean;
  darkCanvas: boolean;
  showSymbols: boolean;
  identifyColorId?: number | null;
  traceImage: HTMLImageElement | null;
  traceOpacity: number;
  traceScale: number;
  traceOffsetX: number;
  traceOffsetY: number;
  traceAdjustMode: boolean;
  onTraceTransformStart?: () => void;
  onTraceTransformEnd?: () => void;
  onTraceOffsetChange: (x: number, y: number) => void;
  onTraceScaleChange: (scale: number) => void;
  filterEditMode?: boolean;
  panMode: boolean;
  showGridlines: boolean;
  tool: "none" | "paint" | "eraser" | "fill" | "eyedropper" | "lasso";
  brushSize: number;
  lassoPoints: { x: number; y: number }[];
  lassoClosed: boolean;
  onPickColor: (colorId: number) => void;
  onPickColorComplete?: () => void;
  onLassoReset: (point: { x: number; y: number }) => void;
  onLassoPoint: (point: { x: number; y: number }) => void;
  onLassoClose: () => void;
  onLassoFill: (points: { x: number; y: number }[]) => void;
  onStrokeStart: () => void;
  onStrokeEnd: () => void;
  onPaintCell: (x: number, y: number, colorId: number) => void;
  onFillCells?: (indices: number[], colorId: number) => void;
  onFillGrid?: (nextGrid: Uint16Array) => void;
  filterRect?: { x0: number; y0: number; x1: number; y1: number } | null;
  filterSelecting?: boolean;
  onFilterRectChange?: (rect: { x0: number; y0: number; x1: number; y1: number } | null) => void;
  onFilterSelectEnd?: () => void;
  gridBackground?: string;
};

export default function GridCanvas(props: Props) {
  const {
    width,
    height,
    grid,
    paletteById,
    symbolMap,
    activeColorId,
    cellSize,
    containerWidth,
    containerHeight,
    zoom,
    minZoom,
    maxZoom,
    pinchEnabled,
    onZoomChange,
    centerCanvasToken,
    focusCell,
    focusCellToken,
    threadView,
    darkCanvas,
    showSymbols,
    identifyColorId,
    traceImage,
    traceOpacity,
    traceScale,
    traceOffsetX,
    traceOffsetY,
    traceAdjustMode,
    onTraceTransformStart,
    onTraceTransformEnd,
    onTraceOffsetChange,
    onTraceScaleChange,
    filterEditMode = false,
    panMode,
    showGridlines,
    tool,
    brushSize,
    lassoPoints,
    lassoClosed,
    onPickColor,
    onPickColorComplete,
    onLassoReset,
    onLassoPoint,
    onLassoClose,
    onLassoFill,
    onStrokeStart,
    onStrokeEnd,
    onPaintCell,
    onFillCells,
    onFillGrid,
    filterRect,
    filterSelecting = false,
    onFilterRectChange,
    onFilterSelectEnd,
    gridBackground,
  } = props;

  const canvasW = width * cellSize;
  const canvasH = height * cellSize;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef(grid);
  gridRef.current = grid;
  const traceSamplerRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [isLassoing, setIsLassoing] = useState(false);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [filterPreviewRect, setFilterPreviewRect] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(
    null
  );
  const filterDragStartRef = useRef<{ x: number; y: number } | null>(null);
  const filterResizeRef = useRef<{
    handle: "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se" | "move";
    startRect: { x0: number; y0: number; x1: number; y1: number };
    startCell: { x: number; y: number };
  } | null>(null);
  const focusCellRef = useRef<{ x: number; y: number } | null>(null);
  const lastFocusTokenRef = useRef<number | undefined>(undefined);
  const prevZoomRef = useRef(zoom);
  const prevCellSizeRef = useRef(cellSize);
  const prevBaseOffsetRef = useRef({ x: 0, y: 0 });
  const prevPanRef = useRef({ x: 0, y: 0 });
  const zoomAnchorRef = useRef<{ x: number; y: number } | null>(null);
  const lastClampSignatureRef = useRef<string | null>(null);
  const clampDebugRef = useRef<{ count: number; last?: string }>({ count: 0 });
  useEffect(() => {
    if (!filterSelecting && filterPreviewRect) {
      setFilterPreviewRect(null);
      filterDragStartRef.current = null;
    }
  }, [filterSelecting, filterPreviewRect]);
  useEffect(() => {
    focusCellRef.current = focusCell ?? null;
  }, [focusCell]);
  const lastLassoPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastPaintCellRef = useRef<{ x: number; y: number } | null>(null);
  const isTracingDragRef = useRef(false);
  const traceDragStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const traceResizeRef = useRef<
    | {
        handle: "tl" | "tr" | "bl" | "br" | "tm" | "bm" | "ml" | "mr";
        startX: number;
        startY: number;
        startScale: number;
        imgW: number;
        imgH: number;
      }
    | null
  >(null);
  const isPanningRef = useRef(false);
  const pinchActiveRef = useRef(false);
  const fillTokenRef = useRef(0);
  const panDragStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const activeFilterRect =
    filterSelecting && filterPreviewRect ? filterPreviewRect : filterRect ?? filterPreviewRect;

  const normalizeRect = (start: { x: number; y: number }, end: { x: number; y: number }) => ({
    x0: Math.min(start.x, end.x),
    y0: Math.min(start.y, end.y),
    x1: Math.max(start.x, end.x),
    y1: Math.max(start.y, end.y),
  });

  const clampRectToBounds = (rect: { x0: number; y0: number; x1: number; y1: number }) => {
    const x0 = Math.max(0, Math.min(width - 1, rect.x0));
    const y0 = Math.max(0, Math.min(height - 1, rect.y0));
    const x1 = Math.max(0, Math.min(width - 1, rect.x1));
    const y1 = Math.max(0, Math.min(height - 1, rect.y1));
    return normalizeRect({ x: x0, y: y0 }, { x: x1, y: y1 });
  };

  const getFilterHandle = (point: { x: number; y: number }) => {
    if (!activeFilterRect) return null;
    const x0 = activeFilterRect.x0 * cellSize;
    const y0 = activeFilterRect.y0 * cellSize;
    const x1 = (activeFilterRect.x1 + 1) * cellSize;
    const y1 = (activeFilterRect.y1 + 1) * cellSize;
    const handleSize = 8;
    const within = (px: number, py: number) =>
      point.x >= px - handleSize && point.x <= px + handleSize && point.y >= py - handleSize && point.y <= py + handleSize;
    const corners: Array<[number, number, "nw" | "ne" | "sw" | "se"]> = [
      [x0, y0, "nw"],
      [x1, y0, "ne"],
      [x0, y1, "sw"],
      [x1, y1, "se"],
    ];
    for (const [cx, cy, handle] of corners) {
      if (within(cx, cy)) return handle;
    }
    const edges: Array<[number, number, "n" | "s" | "w" | "e"]> = [
      [(x0 + x1) / 2, y0, "n"],
      [(x0 + x1) / 2, y1, "s"],
      [x0, (y0 + y1) / 2, "w"],
      [x1, (y0 + y1) / 2, "e"],
    ];
    for (const [cx, cy, handle] of edges) {
      if (within(cx, cy)) return handle;
    }
    if (point.x >= x0 && point.x <= x1 && point.y >= y0 && point.y <= y1) return "move";
    return null;
  };

  const isCellInFilter = (x: number, y: number) =>
    !activeFilterRect ||
    (x >= activeFilterRect.x0 &&
      x <= activeFilterRect.x1 &&
      y >= activeFilterRect.y0 &&
      y <= activeFilterRect.y1);

  const isPointInFilter = (point: { x: number; y: number }) => {
    if (!activeFilterRect) return true;
    const cellX = Math.floor(point.x / cellSize);
    const cellY = Math.floor(point.y / cellSize);
    return isCellInFilter(cellX, cellY);
  };

  const updateHoverCell = (next: { x: number; y: number } | null) => {
    setHoverCell((prev) => {
      if (!next && !prev) return prev;
      if (next && prev && next.x === prev.x && next.y === prev.y) return prev;
      return next;
    });
  };

  const baseOffsetX = Math.max(0, (containerWidth - canvasW) / 2);
  const baseOffsetY = Math.max(0, (containerHeight - canvasH) / 2);

  function clampPan(x: number, y: number) {
    const edgeMinX = containerWidth - baseOffsetX - canvasW;
    const edgeMaxX = -baseOffsetX;
    const edgeMinY = containerHeight - baseOffsetY - canvasH;
    const edgeMaxY = -baseOffsetY;
    const baseOverscroll = Math.min(containerWidth, containerHeight) * 0.25;
    const overscrollX = baseOverscroll + Math.max(0, baseOffsetY - baseOffsetX);
    const overscrollY = baseOverscroll + Math.max(0, baseOffsetX - baseOffsetY);
    const minX = Math.min(edgeMinX, edgeMaxX) - overscrollX;
    const maxX = Math.max(edgeMinX, edgeMaxX) + overscrollX;
    const minY = Math.min(edgeMinY, edgeMaxY) - overscrollY;
    const maxY = Math.max(edgeMinY, edgeMaxY) + overscrollY;
    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  }

  useLayoutEffect(() => {
    prevPanRef.current = panOffset;
  }, [panOffset]);

  useLayoutEffect(() => {
    if (!Number.isFinite(containerWidth) || !Number.isFinite(containerHeight)) return;
    if (containerWidth <= 0 || containerHeight <= 0) return;
    const prevZoom = prevZoomRef.current;
    const prevCellSize = prevCellSizeRef.current;
    const prevBase = prevBaseOffsetRef.current;
    if (prevZoom !== zoom && Number.isFinite(prevCellSize) && prevCellSize > 0) {
      const anchor = zoomAnchorRef.current;
      const centerX = anchor ? anchor.x : containerWidth / 2;
      const centerY = anchor ? anchor.y : containerHeight / 2;
      const prevPan = prevPanRef.current;
      const gridCenterX = (centerX - prevBase.x - prevPan.x) / prevCellSize;
      const gridCenterY = (centerY - prevBase.y - prevPan.y) / prevCellSize;
      if (Number.isFinite(gridCenterX) && Number.isFinite(gridCenterY)) {
        const nextPanX = centerX - baseOffsetX - gridCenterX * cellSize;
        const nextPanY = centerY - baseOffsetY - gridCenterY * cellSize;
        setPanOffset((prev) => {
          const next = clampPan(nextPanX, nextPanY);
          if (next.x === prev.x && next.y === prev.y) return prev;
          return next;
        });
      }
      if (anchor) {
        zoomAnchorRef.current = null;
      }
    }
    prevZoomRef.current = zoom;
    prevCellSizeRef.current = cellSize;
    prevBaseOffsetRef.current = { x: baseOffsetX, y: baseOffsetY };
  }, [zoom, cellSize, containerWidth, containerHeight, baseOffsetX, baseOffsetY]);

  useLayoutEffect(() => {
    if (!Number.isFinite(containerWidth) || !Number.isFinite(containerHeight)) return;
    if (containerWidth <= 0 || containerHeight <= 0) return;
    if (!Number.isFinite(canvasW) || !Number.isFinite(canvasH)) return;
    if (canvasW <= 0 || canvasH <= 0) return;
    const signature = `${canvasW}:${canvasH}:${containerWidth}:${containerHeight}`;
    if (lastClampSignatureRef.current === signature) return;
    lastClampSignatureRef.current = signature;
    if (clampDebugRef.current.count < 1) {
      clampDebugRef.current.count += 1;
      clampDebugRef.current.last = signature;
      console.warn("GridCanvas clampPan triggered", {
        canvasW,
        canvasH,
        containerWidth,
        containerHeight,
        signature,
      });
    }
    setPanOffset((prev) => {
      const next = clampPan(prev.x, prev.y);
      if (next.x === prev.x && next.y === prev.y) return prev;
      return next;
    });
  }, [canvasW, canvasH, containerWidth, containerHeight]);

  const lastCenterTokenRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (centerCanvasToken === undefined) return;
    if (centerCanvasToken === lastCenterTokenRef.current) return;
    lastCenterTokenRef.current = centerCanvasToken;
    setPanOffset(() => clampPan(0, 0));
  }, [centerCanvasToken]);

  useEffect(() => {
    if (focusCellToken === undefined || focusCellToken === lastFocusTokenRef.current) return;
    lastFocusTokenRef.current = focusCellToken;
    const cell = focusCellRef.current;
    if (!cell) return;
    const targetX = containerWidth / 2 - baseOffsetX - (cell.x + 0.5) * cellSize;
    const targetY = containerHeight / 2 - baseOffsetY - (cell.y + 0.5) * cellSize;
    setPanOffset(() => clampPan(targetX, targetY));
  }, [
    focusCellToken,
    cellSize,
    containerWidth,
    containerHeight,
    baseOffsetX,
    baseOffsetY,
    canvasW,
    canvasH,
  ]);

  const pinchPointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number | null>(null);
  const pinchLastCenterRef = useRef<{ x: number; y: number } | null>(null);

  const rawDrawTranslateX = baseOffsetX + panOffset.x;
  const rawDrawTranslateY = baseOffsetY + panOffset.y;
  const shouldSnapDrawTranslate = !threadView && !showGridlines;
  const devicePixelRatio = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const snapToDevicePixel = (value: number) => Math.round(value * devicePixelRatio) / devicePixelRatio;
  const drawTranslateX = shouldSnapDrawTranslate ? snapToDevicePixel(rawDrawTranslateX) : rawDrawTranslateX;
  const drawTranslateY = shouldSnapDrawTranslate ? snapToDevicePixel(rawDrawTranslateY) : rawDrawTranslateY;

  const paletteRgb = useMemo(() => {
    const arr: Array<{ id: number; r: number; g: number; b: number }> = [];
    for (const color of paletteById.values()) {
      const hex = color.hex.replace("#", "");
      if (hex.length !== 6) continue;
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) continue;
      arr.push({ id: color.id, r, g, b });
    }
    return arr;
  }, [paletteById]);

  useGridRenderer({
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
    filterEditMode,
    zoom,
    showGridlines,
    gridBackground,
  });

  function getCellFromEvent(e: React.PointerEvent<HTMLCanvasElement>, ignoreFilter = false) {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left - drawTranslateX) / cellSize);
    const y = Math.floor((e.clientY - rect.top - drawTranslateY) / cellSize);
    if (x < 0 || y < 0 || x >= width || y >= height) return null;
    if (!ignoreFilter && !isCellInFilter(x, y)) return null;
    return { x, y };
  }

  function getClampedCellFromEvent(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const rawX = Math.floor((e.clientX - rect.left - drawTranslateX) / cellSize);
    const rawY = Math.floor((e.clientY - rect.top - drawTranslateY) / cellSize);
    const x = Math.max(0, Math.min(width - 1, rawX));
    const y = Math.max(0, Math.min(height - 1, rawY));
    return { x, y };
  }

  function getCanvasPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    return { x: e.clientX - rect.left - drawTranslateX, y: e.clientY - rect.top - drawTranslateY };
  }

  function findClosestPaletteColor(r: number, g: number, b: number) {
    let bestId: number | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const color of paletteRgb) {
      const dr = color.r - r;
      const dg = color.g - g;
      const db = color.b - b;
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        bestId = color.id;
      }
    }
    return bestId;
  }

  function sampleTraceColorAtCell(cell: { x: number; y: number }) {
    if (!traceImage) return null;
    const scale = traceScale * zoom;
    if (!Number.isFinite(scale) || scale <= 0) return null;
    const centerX = (cell.x + 0.5) * cellSize;
    const centerY = (cell.y + 0.5) * cellSize;
    const imgX = (centerX - traceOffsetX * zoom) / scale;
    const imgY = (centerY - traceOffsetY * zoom) / scale;
    if (imgX < 0 || imgY < 0 || imgX >= traceImage.width || imgY >= traceImage.height) return null;
    const canvas = traceSamplerRef.current ?? document.createElement("canvas");
    traceSamplerRef.current = canvas;
    if (canvas.width !== traceImage.width || canvas.height !== traceImage.height) {
      canvas.width = traceImage.width;
      canvas.height = traceImage.height;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(traceImage, 0, 0);
    const data = ctx.getImageData(Math.floor(imgX), Math.floor(imgY), 1, 1).data;
    if (data[3] < 10) return null;
    return { r: data[0], g: data[1], b: data[2] };
  }

  function clampZoom(value: number) {
    return Math.min(maxZoom, Math.max(minZoom, Number(value.toFixed(2))));
  }

  function updatePinchPointer(id: number, x: number, y: number) {
    pinchPointersRef.current.set(id, { x, y });
    if (pinchPointersRef.current.size === 2) {
      pinchActiveRef.current = true;
      const points = Array.from(pinchPointersRef.current.values());
      const dx = points[0].x - points[1].x;
      const dy = points[0].y - points[1].y;
      const distance = Math.hypot(dx, dy);
      const center = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
      if (pinchStartDistanceRef.current === null) {
        pinchStartDistanceRef.current = distance;
        pinchStartZoomRef.current = zoom;
        pinchLastCenterRef.current = center;
      } else if (pinchStartZoomRef.current !== null) {
        const nextZoom = clampZoom((pinchStartZoomRef.current * distance) / pinchStartDistanceRef.current);
        onZoomChange(nextZoom);
        if (pinchLastCenterRef.current) {
          const deltaX = center.x - pinchLastCenterRef.current.x;
          const deltaY = center.y - pinchLastCenterRef.current.y;
          if (deltaX !== 0 || deltaY !== 0) {
            setPanOffset((prev) => clampPan(prev.x + deltaX, prev.y + deltaY));
          }
        }
        pinchLastCenterRef.current = center;
      }
    }
  }

  function clearPinchPointer(id: number) {
    pinchPointersRef.current.delete(id);
    if (pinchPointersRef.current.size < 2) {
      pinchStartDistanceRef.current = null;
      pinchStartZoomRef.current = null;
      pinchLastCenterRef.current = null;
    }
  }

  function paintLine(from: { x: number; y: number }, to: { x: number; y: number }, colorId: number) {
    let x0 = from.x;
    let y0 = from.y;
    const x1 = to.x;
    const y1 = to.y;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
      paintStamp(x0, y0, colorId);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  function paintStamp(x: number, y: number, colorId: number) {
    const size = Math.max(1, Math.floor(brushSize));
    const radius = Math.floor(size / 2);
    const startX = x - radius;
    const startY = y - radius;
    const endX = startX + size - 1;
    const endY = startY + size - 1;
    for (let py = startY; py <= endY; py++) {
      for (let px = startX; px <= endX; px++) {
        if (px < 0 || py < 0 || px >= width || py >= height) continue;
        if (!isCellInFilter(px, py)) continue;
        onPaintCell(px, py, colorId);
      }
    }
  }

  async function fillRegion(startX: number, startY: number, newColorId: number) {
    const gridSnapshot = gridRef.current;
    const startIdx = idx(startX, startY, width);
    const targetColor = gridSnapshot[startIdx];
    if (targetColor === newColorId) return;

    const token = ++fillTokenRef.current;
    const collectIndices = !onFillGrid && Boolean(onFillCells);
    const maxCells = width * height;
    // Optional chunking for very large fills to keep the UI responsive.
    const shouldChunk = typeof requestAnimationFrame === "function" && maxCells > 240000;
    const bounds = filterRect
      ? { minX: filterRect.x0, maxX: filterRect.x1, minY: filterRect.y0, maxY: filterRect.y1 }
      : undefined;
    const shouldContinue = () => fillTokenRef.current === token && gridRef.current === gridSnapshot;

    const result = shouldChunk
      ? await scanlineFillChunked({
          gridSnapshot,
          width,
          height,
          startX,
          startY,
          targetColor,
          newColorId,
          collectIndices,
          bounds,
          token,
          shouldContinue,
          chunkSeedsPerFrame: 1800,
        })
      : scanlineFillSync({
          gridSnapshot,
          width,
          height,
          startX,
          startY,
          targetColor,
          newColorId,
          collectIndices,
          bounds,
        });

    if (!result || !result.filled) return;
    if (!shouldContinue()) return;

    if (onFillGrid) {
      onFillGrid(result.next);
    } else if (onFillCells && result.indices) {
      onFillCells(result.indices, newColorId);
    }
  }

  function maybeAddLassoPoint(point: { x: number; y: number }) {
    if (!isPointInFilter(point)) return;
    const last = lastLassoPointRef.current;
    if (!last) {
      lastLassoPointRef.current = point;
      onLassoPoint(point);
      return;
    }
    const minStep = Math.max(2, cellSize * 0.3);
    if (Math.hypot(point.x - last.x, point.y - last.y) >= minStep) {
      lastLassoPointRef.current = point;
      onLassoPoint(point);
    }
  }

  function getTraceHandle(point: { x: number; y: number }) {
    if (!traceImage) return null;
    const x = traceOffsetX * zoom;
    const y = traceOffsetY * zoom;
    const w = traceImage.width * traceScale * zoom;
    const h = traceImage.height * traceScale * zoom;
    const handleRadius = 8;
    const near = (px: number, py: number, cx: number, cy: number) =>
      Math.abs(px - cx) <= handleRadius && Math.abs(py - cy) <= handleRadius;
    if (near(point.x, point.y, x, y)) return "tl";
    if (near(point.x, point.y, x + w, y)) return "tr";
    if (near(point.x, point.y, x, y + h)) return "bl";
    if (near(point.x, point.y, x + w, y + h)) return "br";
    const midX = x + w / 2;
    const midY = y + h / 2;
    if (near(point.x, point.y, midX, y)) return "tm";
    if (near(point.x, point.y, midX, y + h)) return "bm";
    if (near(point.x, point.y, x, midY)) return "ml";
    if (near(point.x, point.y, x + w, midY)) return "mr";
    return null;
  }

  const alignX = "flex-start";
  const alignY = "flex-start";
  const effectivePanMode = panMode && !(traceAdjustMode && traceImage);
  const containerBg = "var(--canvas-surround-bg)";

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        const rect = node.getBoundingClientRect();
        const anchorX = e.clientX - rect.left;
        const anchorY = e.clientY - rect.top;
        const zoomFactor = Math.exp(-e.deltaY * 0.01);
        const nextZoom = clampZoom(zoom * zoomFactor);
        if (nextZoom === zoom) return;
        zoomAnchorRef.current = { x: anchorX, y: anchorY };
        onZoomChange(nextZoom);
        return;
      }

      // Two-finger scroll to pan even when not in pan mode.
      e.preventDefault();
      e.stopPropagation();
      const nextX = panOffset.x - e.deltaX;
      const nextY = panOffset.y - e.deltaY;
      setPanOffset(clampPan(nextX, nextY));
    };
    node.addEventListener("wheel", handleWheel, { passive: false });
    return () => node.removeEventListener("wheel", handleWheel);
  }, [zoom, onZoomChange, minZoom, maxZoom, panOffset]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "inline-flex",
        justifyContent: alignX,
        alignItems: alignY,
        justifySelf: "center",
        alignSelf: "start",
        width: containerWidth || canvasW,
        height: containerHeight || canvasH,
        overflow: "visible",
        borderRadius: 0,
        background: containerBg,
        boxShadow: "none",
        touchAction: "none",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: canvasW,
          height: canvasH,
          transform: `translate3d(${drawTranslateX}px, ${drawTranslateY}px, 0)`,
          boxShadow: "0 10px 24px var(--ui-border)",
          pointerEvents: "none",
          zIndex: 0,
          willChange: "transform",
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          touchAction: "none",
          position: "relative",
          zIndex: 1,
          cursor:
            filterEditMode
              ? "default"
              : filterSelecting
              ? "crosshair"
              : effectivePanMode
                ? "grab"
                : traceAdjustMode && traceImage
                  ? "grab"
                  : tool === "eyedropper"
                    ? `url(${assetPath("/dropper_cursor.svg")}) 2 14, auto`
                    : tool === "paint" || tool === "eraser"
                      ? "crosshair"
                      : "auto",
        }}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
        onPointerDown={(e) => {
          if (pinchEnabled && e.pointerType === "touch") {
            e.preventDefault();
            (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
            updatePinchPointer(e.pointerId, e.clientX, e.clientY);
            if (pinchPointersRef.current.size >= 2) {
              pinchActiveRef.current = true;
              if (isPainting) {
                setIsPainting(false);
                onStrokeEnd();
              }
              if (isPanningRef.current) {
                isPanningRef.current = false;
                panDragStartRef.current = null;
              }
              return;
            }
          }
          if (filterEditMode && activeFilterRect) {
            const point = getCanvasPoint(e);
            const handle = getFilterHandle(point);
            if (handle) {
              e.preventDefault();
              (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
              filterResizeRef.current = {
                handle,
                startRect: activeFilterRect,
                startCell: getClampedCellFromEvent(e),
              };
              return;
            }
          }
          if (filterSelecting) {
            e.preventDefault();
            const cell = getClampedCellFromEvent(e);
            if (!cell) return;
            (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
            filterDragStartRef.current = cell;
            setFilterPreviewRect({ x0: cell.x, y0: cell.y, x1: cell.x, y1: cell.y });
            return;
          }
          if (tool === "paint" || tool === "eraser") {
            updateHoverCell(getCellFromEvent(e));
          } else {
            updateHoverCell(null);
          }
          if (effectivePanMode || e.button === 2) {
            e.preventDefault();
            (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
            isPanningRef.current = true;
            const clamped = clampPan(panOffset.x, panOffset.y);
            setPanOffset(clamped);
            panDragStartRef.current = { x: e.clientX, y: e.clientY, ox: clamped.x, oy: clamped.y };
            return;
          }
          if (traceAdjustMode && traceImage) {
            const point = getCanvasPoint(e);
            const handle = getTraceHandle(point);
            (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
            onTraceTransformStart?.();
            if (handle) {
              traceResizeRef.current = {
                handle,
                startX: traceOffsetX,
                startY: traceOffsetY,
                startScale: traceScale,
                imgW: traceImage.width,
                imgH: traceImage.height,
              };
            } else {
              isTracingDragRef.current = true;
              traceDragStartRef.current = { x: e.clientX, y: e.clientY, ox: traceOffsetX, oy: traceOffsetY };
            }
            return;
          }
          if (pinchEnabled && e.pointerType === "touch") {
            if (pinchPointersRef.current.size >= 2) {
              pinchActiveRef.current = true;
              if (isPainting) {
                setIsPainting(false);
                onStrokeEnd();
              }
              return;
            }
          }
          if (tool === "paint" || tool === "eraser") {
            if (pinchEnabled && pinchActiveRef.current) return;
            (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
            setIsPainting(true);
            onStrokeStart();
            const cell = getCellFromEvent(e);
            if (!cell) return;
            lastPaintCellRef.current = cell;
            const colorId = tool === "eraser" ? 0 : activeColorId;
            paintStamp(cell.x, cell.y, colorId);
            return;
          }
          if (tool === "fill") {
            if (pinchEnabled && pinchActiveRef.current) return;
            const cell = getCellFromEvent(e);
            if (!cell) return;
            void fillRegion(cell.x, cell.y, activeColorId);
            return;
          }
          if (tool === "eyedropper") {
            if (pinchEnabled && pinchActiveRef.current) return;
            const cell = getCellFromEvent(e);
            if (!cell) return;
            const colorId = grid[idx(cell.x, cell.y, width)];
            if (colorId !== 0) {
              onPickColor(colorId);
              onPickColorComplete?.();
              return;
            }
            const sampled = sampleTraceColorAtCell(cell);
            if (!sampled) return;
            const nearest = findClosestPaletteColor(sampled.r, sampled.g, sampled.b);
            if (!nearest) return;
            onPickColor(nearest);
            onPickColorComplete?.();
            return;
          }
          if (tool === "lasso") {
            if (pinchEnabled && pinchActiveRef.current) return;
            const point = getCanvasPoint(e);
            if (!isPointInFilter(point)) return;
            if (lassoClosed && lassoPoints.length >= 3 && pointInPolygon(point, lassoPoints)) {
              onLassoFill(lassoPoints);
              return;
            }
            (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
            setIsLassoing(true);
            lastLassoPointRef.current = point;
            onLassoReset(point);
          }
        }}
        onPointerMove={(e) => {
          if (pinchEnabled && e.pointerType === "touch" && pinchPointersRef.current.size >= 2) {
            e.preventDefault();
            updatePinchPointer(e.pointerId, e.clientX, e.clientY);
            return;
          }
          if (filterResizeRef.current) {
            const { handle, startRect, startCell } = filterResizeRef.current;
            const cell = getClampedCellFromEvent(e);
            const dx = cell.x - startCell.x;
            const dy = cell.y - startCell.y;
            let next = { ...startRect };
            if (handle === "move") {
              const w = startRect.x1 - startRect.x0;
              const h = startRect.y1 - startRect.y0;
              let x0 = startRect.x0 + dx;
              let y0 = startRect.y0 + dy;
              x0 = Math.max(0, Math.min(width - 1 - w, x0));
              y0 = Math.max(0, Math.min(height - 1 - h, y0));
              next = { x0, y0, x1: x0 + w, y1: y0 + h };
            } else {
              if (handle.includes("w")) next.x0 = startRect.x0 + dx;
              if (handle.includes("e")) next.x1 = startRect.x1 + dx;
              if (handle.includes("n")) next.y0 = startRect.y0 + dy;
              if (handle.includes("s")) next.y1 = startRect.y1 + dy;
              next = clampRectToBounds(next);
            }
            onFilterRectChange?.(next);
            return;
          }
          if (filterSelecting) {
            if (filterDragStartRef.current) {
              const cell = getClampedCellFromEvent(e);
              setFilterPreviewRect(normalizeRect(filterDragStartRef.current, cell));
            }
            return;
          }
          if (tool === "paint" || tool === "eraser") {
            if (
              isPanningRef.current ||
              traceResizeRef.current ||
              isTracingDragRef.current ||
              isLassoing ||
              (pinchEnabled && pinchActiveRef.current) ||
              panMode ||
              traceAdjustMode ||
              filterEditMode
            ) {
              updateHoverCell(null);
            } else {
              updateHoverCell(getCellFromEvent(e));
            }
          } else if (hoverCell) {
            updateHoverCell(null);
          }
          if (isPanningRef.current && panDragStartRef.current) {
            const dx = e.clientX - panDragStartRef.current.x;
            const dy = e.clientY - panDragStartRef.current.y;
            const next = clampPan(panDragStartRef.current.ox + dx, panDragStartRef.current.oy + dy);
            setPanOffset(next);
            return;
          }
          if (traceResizeRef.current && traceImage) {
            const point = getCanvasPoint(e);
            const px = point.x / zoom;
            const py = point.y / zoom;
            const { handle, startX, startY, startScale, imgW, imgH } = traceResizeRef.current;
            const baseW = imgW * startScale;
            const baseH = imgH * startScale;
            const minScale = 0.05;
            let nextScale = startScale;
            let nextX = startX;
            let nextY = startY;
            if (handle === "tl") {
              const brX = startX + baseW;
              const brY = startY + baseH;
              const sx = (brX - px) / imgW;
              const sy = (brY - py) / imgH;
              nextScale = Math.max(minScale, Math.min(sx, sy));
              nextX = brX - imgW * nextScale;
              nextY = brY - imgH * nextScale;
            } else if (handle === "tr") {
              const blX = startX;
              const blY = startY + baseH;
              const sx = (px - blX) / imgW;
              const sy = (blY - py) / imgH;
              nextScale = Math.max(minScale, Math.min(sx, sy));
              nextX = blX;
              nextY = blY - imgH * nextScale;
            } else if (handle === "bl") {
              const trX = startX + baseW;
              const trY = startY;
              const sx = (trX - px) / imgW;
              const sy = (py - trY) / imgH;
              nextScale = Math.max(minScale, Math.min(sx, sy));
              nextX = trX - imgW * nextScale;
              nextY = trY;
            } else if (handle === "br") {
              const tlX = startX;
              const tlY = startY;
              const sx = (px - tlX) / imgW;
              const sy = (py - tlY) / imgH;
              nextScale = Math.max(minScale, Math.min(sx, sy));
              nextX = tlX;
              nextY = tlY;
            } else if (handle === "tm") {
              const anchorX = startX + baseW / 2;
              const anchorY = startY + baseH;
              const rawH = anchorY - py;
              const nextH = Math.max(imgH * minScale, rawH);
              const nextW = (nextH * imgW) / imgH;
              nextScale = nextW / imgW;
              nextX = anchorX - nextW / 2;
              nextY = anchorY - nextH;
            } else if (handle === "bm") {
              const anchorX = startX + baseW / 2;
              const anchorY = startY;
              const rawH = py - anchorY;
              const nextH = Math.max(imgH * minScale, rawH);
              const nextW = (nextH * imgW) / imgH;
              nextScale = nextW / imgW;
              nextX = anchorX - nextW / 2;
              nextY = anchorY;
            } else if (handle === "ml") {
              const anchorX = startX + baseW;
              const anchorY = startY + baseH / 2;
              const rawW = anchorX - px;
              const nextW = Math.max(imgW * minScale, rawW);
              const nextH = (nextW * imgH) / imgW;
              nextScale = nextW / imgW;
              nextX = anchorX - nextW;
              nextY = anchorY - nextH / 2;
            } else if (handle === "mr") {
              const anchorX = startX;
              const anchorY = startY + baseH / 2;
              const rawW = px - anchorX;
              const nextW = Math.max(imgW * minScale, rawW);
              const nextH = (nextW * imgH) / imgW;
              nextScale = nextW / imgW;
              nextX = anchorX;
              nextY = anchorY - nextH / 2;
            }
            onTraceScaleChange(nextScale);
            onTraceOffsetChange(nextX, nextY);
            return;
          }
          if (isTracingDragRef.current && traceDragStartRef.current) {
            const dx = e.clientX - traceDragStartRef.current.x;
            const dy = e.clientY - traceDragStartRef.current.y;
            onTraceOffsetChange(traceDragStartRef.current.ox + dx / zoom, traceDragStartRef.current.oy + dy / zoom);
            return;
          }
          if (isLassoing && tool === "lasso") {
            maybeAddLassoPoint(getCanvasPoint(e));
            return;
          }
          if (pinchEnabled && pinchActiveRef.current) return;
          if (!isPainting) return;
          const cell = getCellFromEvent(e);
          if (!cell) return;
          const colorId = tool === "eraser" ? 0 : activeColorId;
          const last = lastPaintCellRef.current;
          if (last) {
            paintLine(last, cell, colorId);
          } else {
            paintStamp(cell.x, cell.y, colorId);
          }
          lastPaintCellRef.current = cell;
        }}
        onPointerUp={(e) => {
          if (filterResizeRef.current) {
            filterResizeRef.current = null;
            return;
          }
          if (filterSelecting && filterDragStartRef.current) {
            const endPoint = getClampedCellFromEvent(e);
            const rect = normalizeRect(filterDragStartRef.current, endPoint);
            filterDragStartRef.current = null;
            setFilterPreviewRect(null);
            onFilterRectChange?.(rect);
            onFilterSelectEnd?.();
            return;
          }
          if (isPanningRef.current) {
            isPanningRef.current = false;
            panDragStartRef.current = null;
            return;
          }
          if (traceResizeRef.current) {
            traceResizeRef.current = null;
            onTraceTransformEnd?.();
            return;
          }
          if (isTracingDragRef.current) {
            isTracingDragRef.current = false;
            traceDragStartRef.current = null;
            onTraceTransformEnd?.();
            return;
          }
          if (isLassoing) {
            setIsLassoing(false);
            lastLassoPointRef.current = null;
            onLassoClose();
            return;
          }
          setIsPainting(false);
          lastPaintCellRef.current = null;
          onStrokeEnd();
        }}
        onPointerCancel={(e) => {
          if (filterResizeRef.current) {
            filterResizeRef.current = null;
            return;
          }
          if (filterSelecting && filterDragStartRef.current) {
            const endPoint = getClampedCellFromEvent(e);
            const rect = normalizeRect(filterDragStartRef.current, endPoint);
            filterDragStartRef.current = null;
            setFilterPreviewRect(null);
            onFilterRectChange?.(rect);
            onFilterSelectEnd?.();
            return;
          }
          if (isPanningRef.current) {
            isPanningRef.current = false;
            panDragStartRef.current = null;
            return;
          }
          if (traceResizeRef.current) {
            traceResizeRef.current = null;
            onTraceTransformEnd?.();
            return;
          }
          if (isTracingDragRef.current) {
            isTracingDragRef.current = false;
            traceDragStartRef.current = null;
            onTraceTransformEnd?.();
            return;
          }
          if (isLassoing) {
            setIsLassoing(false);
            lastLassoPointRef.current = null;
            onLassoClose();
            return;
          }
          setIsPainting(false);
          lastPaintCellRef.current = null;
          onStrokeEnd();
        }}
        onPointerLeave={() => {
          if (filterSelecting) {
            return;
          }
          updateHoverCell(null);
        }}
        onPointerUpCapture={(e) => {
          if (!pinchEnabled || e.pointerType !== "touch") return;
          clearPinchPointer(e.pointerId);
          if (pinchPointersRef.current.size < 2) {
            pinchActiveRef.current = false;
          }
        }}
        onPointerCancelCapture={(e) => {
          if (!pinchEnabled || e.pointerType !== "touch") return;
          clearPinchPointer(e.pointerId);
          if (pinchPointersRef.current.size < 2) {
            pinchActiveRef.current = false;
          }
        }}
        // style={{
        //   touchAction: pinchEnabled ? "none" : "manipulation",
        //   display: "block",
        // }} // critical for iOS dragging
      />
    </div>
  );
}
