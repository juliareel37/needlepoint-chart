"use client";

import { useEffect, useMemo, useState } from "react";
import { idx } from "../../../lib/grid";
import { clampFilterRect, pointInPolygon, type FilterRect, type Point } from "../utils/geometry";

type ToolName = "paint" | "eraser" | "fill" | "eyedropper" | "lasso";

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

  return {
    lassoPoints,
    lassoClosed,
    filterMode,
    filterRect,
    filterSelecting,
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
  };
}
