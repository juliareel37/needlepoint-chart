"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { idx } from "../../../lib/grid";
import {
  clampFilterRect,
  getMirrorTargetRect,
  pointInPolygon,
  type FilterRect,
  type MirrorDirection,
  type Point,
} from "../utils/geometry";

type ToolName = "none" | "paint" | "eraser" | "fill" | "eyedropper" | "lasso" | "mirror";

type UseSelectionToolsArgs = {
  tool: ToolName;
  gridW: number;
  gridH: number;
  activeColorId: number;
  displayCellSize: number;
  updateGrid: (updater: (prev: Uint16Array) => Uint16Array) => void;
  setLastEditCell: (value: { x: number; y: number } | null) => void;
};

export function useSelectionTools({
  tool,
  gridW,
  gridH,
  activeColorId,
  displayCellSize,
  updateGrid,
  setLastEditCell,
}: UseSelectionToolsArgs) {
  const [lassoPoints, setLassoPoints] = useState<Point[]>([]);
  const [lassoClosed, setLassoClosed] = useState(false);
  const [filterMode, setFilterMode] = useState(false);
  const [filterRect, setFilterRect] = useState<FilterRect | null>(null);
  const [filterSelecting, setFilterSelecting] = useState(false);
  const [mirrorRect, setMirrorRect] = useState<FilterRect | null>(null);
  const [mirrorSelecting, setMirrorSelecting] = useState(false);
  const prevToolRef = useRef<ToolName>(tool);

  useEffect(() => {
    if (tool !== "lasso") {
      setLassoPoints([]);
      setLassoClosed(false);
    }
  }, [tool]);

  useEffect(() => {
    if (!filterMode && filterSelecting) {
      setFilterSelecting(false);
    }
  }, [filterMode, filterSelecting]);

  useEffect(() => {
    const prevTool = prevToolRef.current;
    prevToolRef.current = tool;
    if (tool !== "mirror") {
      setMirrorSelecting(false);
      return;
    }
    if (prevTool !== "mirror" && !mirrorRect && !mirrorSelecting) {
      setMirrorSelecting(true);
    }
  }, [tool, mirrorRect, mirrorSelecting]);

  useEffect(() => {
    if (!filterRect) return;
    if (gridW <= 0 || gridH <= 0) return;
    const clamped = clampFilterRect(filterRect, gridW, gridH);
    if (
      clamped.x0 !== filterRect.x0 ||
      clamped.y0 !== filterRect.y0 ||
      clamped.x1 !== filterRect.x1 ||
      clamped.y1 !== filterRect.y1
    ) {
      setFilterRect(clamped);
    }
  }, [filterRect, gridW, gridH]);

  useEffect(() => {
    if (!mirrorRect) return;
    if (gridW <= 0 || gridH <= 0) return;
    const clamped = clampFilterRect(mirrorRect, gridW, gridH);
    if (
      clamped.x0 !== mirrorRect.x0 ||
      clamped.y0 !== mirrorRect.y0 ||
      clamped.x1 !== mirrorRect.x1 ||
      clamped.y1 !== mirrorRect.y1
    ) {
      setMirrorRect(clamped);
    }
  }, [mirrorRect, gridW, gridH]);

  const activeFilterRect = useMemo(() => {
    if (!filterMode || !filterRect) return null;
    return clampFilterRect(filterRect, gridW, gridH);
  }, [filterMode, filterRect, gridW, gridH]);

  const isCellInFilter = (x: number, y: number) =>
    !activeFilterRect ||
    (x >= activeFilterRect.x0 &&
      x <= activeFilterRect.x1 &&
      y >= activeFilterRect.y0 &&
      y <= activeFilterRect.y1);

  const isIndexInFilter = (cellIdx: number) => {
    if (!activeFilterRect) return true;
    const x = cellIdx % gridW;
    const y = Math.floor(cellIdx / gridW);
    return (
      x >= activeFilterRect.x0 &&
      x <= activeFilterRect.x1 &&
      y >= activeFilterRect.y0 &&
      y <= activeFilterRect.y1
    );
  };

  function startFilterSelection() {
    setFilterMode(true);
    setFilterSelecting(true);
  }

  function clearFilterSelection() {
    setFilterRect(null);
    setFilterSelecting(false);
    setFilterMode(false);
  }

  function endFilterSelection() {
    setFilterSelecting(false);
  }

  function setFilterRectClamped(next: FilterRect | null) {
    if (!next) {
      setFilterRect(null);
      return;
    }
    setFilterRect(clampFilterRect(next, gridW, gridH));
  }

  function addLassoPoint(point: Point) {
    if (lassoClosed) {
      setLassoPoints([point]);
      setLassoClosed(false);
      return;
    }
    setLassoPoints((points) => [...points, point]);
  }

  function resetLasso(point: Point) {
    setLassoPoints([point]);
    setLassoClosed(false);
  }

  function closeLasso() {
    if (lassoPoints.length < 3) return;
    setLassoClosed(true);
  }

  function fillLasso(points: Point[]) {
    if (points.length < 3) return;
    updateGrid((prev) => {
      const next = new Uint16Array(prev);
      let changed = false;
      let minX = gridW;
      let minY = gridH;
      let maxX = 0;
      let maxY = 0;
      for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
          if (!isCellInFilter(x, y)) continue;
          const cx = (x + 0.5) * displayCellSize;
          const cy = (y + 0.5) * displayCellSize;
          if (!pointInPolygon({ x: cx, y: cy }, points)) continue;
          const cellIdx = idx(x, y, gridW);
          if (next[cellIdx] === activeColorId) continue;
          next[cellIdx] = activeColorId;
          changed = true;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
      if (changed) {
        setLastEditCell({
          x: Math.round((minX + maxX) / 2),
          y: Math.round((minY + maxY) / 2),
        });
      }
      return changed ? next : prev;
    });
    setLassoPoints([]);
    setLassoClosed(false);
  }

  function clearMirrorSelection() {
    setMirrorRect(null);
    setMirrorSelecting(false);
  }

  function startMirrorSelection() {
    setMirrorRect(null);
    setMirrorSelecting(true);
  }

  function endMirrorSelection() {
    setMirrorSelecting(false);
  }

  function setMirrorRectClamped(next: FilterRect | null) {
    if (!next) {
      setMirrorRect(null);
      return;
    }
    setMirrorRect(clampFilterRect(next, gridW, gridH));
  }

  function applyMirror(direction: MirrorDirection) {
    if (!mirrorRect) return;
    const targetRect = getMirrorTargetRect(mirrorRect, direction);
    updateGrid((prev) => {
      const next = new Uint16Array(prev);
      let changed = false;
      for (let sy = mirrorRect.y0; sy <= mirrorRect.y1; sy++) {
        for (let sx = mirrorRect.x0; sx <= mirrorRect.x1; sx++) {
          const rx = sx - mirrorRect.x0;
          const ry = sy - mirrorRect.y0;
          const tx =
            direction === "left" || direction === "right"
              ? targetRect.x0 + (mirrorRect.x1 - sx)
              : targetRect.x0 + rx;
          const ty =
            direction === "top" || direction === "bottom"
              ? targetRect.y0 + (mirrorRect.y1 - sy)
              : targetRect.y0 + ry;
          if (tx < 0 || ty < 0 || tx >= gridW || ty >= gridH) continue;
          const sourceColorId = prev[idx(sx, sy, gridW)];
          const targetIndex = idx(tx, ty, gridW);
          if (next[targetIndex] === sourceColorId) continue;
          next[targetIndex] = sourceColorId;
          changed = true;
        }
      }
      if (changed) {
        setLastEditCell({
          x: Math.round((targetRect.x0 + targetRect.x1) / 2),
          y: Math.round((targetRect.y0 + targetRect.y1) / 2),
        });
      }
      return changed ? next : prev;
    });
  }

  return {
    lassoPoints,
    lassoClosed,
    filterMode,
    filterRect,
    filterSelecting,
    mirrorRect,
    mirrorSelecting,
    activeFilterRect,
    isCellInFilter,
    isIndexInFilter,
    setFilterMode,
    setFilterRect: setFilterRectClamped,
    startFilterSelection,
    clearFilterSelection,
    endFilterSelection,
    addLassoPoint,
    resetLasso,
    closeLasso,
    fillLasso,
    startMirrorSelection,
    clearMirrorSelection,
    endMirrorSelection,
    setMirrorRect: setMirrorRectClamped,
    applyMirror,
  };
}
