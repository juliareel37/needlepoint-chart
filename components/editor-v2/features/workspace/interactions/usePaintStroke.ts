"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ActiveTool,
  EditorStore,
  GridPoint,
} from "@/lib/editor-v2/editor/store";
import { clampGridBrushSize } from "@/lib/editor-v2/editor/brushSize";
import { getGridCellKey } from "@/lib/editor-v2/editor/viewport";
import {
  createEraseCellCommand,
  createEraseCellsCommand,
  createPaintCellCommand,
  createPaintCellsCommand,
} from "../workspaceCommands";

interface UsePaintStrokeOptions {
  activeColorId: string | null;
  activeTool: ActiveTool;
  brushSize: number;
  disabled?: boolean;
  dispatch: EditorStore["dispatch"];
  gridHeight: number;
  gridWidth: number;
}

export function usePaintStroke({
  activeColorId,
  activeTool,
  brushSize,
  disabled = false,
  dispatch,
  gridHeight,
  gridWidth,
}: UsePaintStrokeOptions) {
  const [paintStrokeId, setPaintStrokeId] = useState<string | null>(null);

  const paintedCellKeysRef = useRef<Set<string>>(new Set());
  const lastStrokePointRef = useRef<GridPoint | null>(null);

  useEffect(() => {
    if (!disabled) {
      return;
    }

    paintedCellKeysRef.current.clear();
    lastStrokePointRef.current = null;
    setPaintStrokeId(null);
  }, [disabled]);

  useEffect(() => {
    if (!paintStrokeId) {
      return;
    }

    function endStroke() {
      paintedCellKeysRef.current.clear();
      lastStrokePointRef.current = null;
      setPaintStrokeId(null);
    }

    window.addEventListener("mouseup", endStroke);
    window.addEventListener("pointerup", endStroke);
    window.addEventListener("pointercancel", endStroke);

    return () => {
      window.removeEventListener("mouseup", endStroke);
      window.removeEventListener("pointerup", endStroke);
      window.removeEventListener("pointercancel", endStroke);
    };
  }, [paintStrokeId]);

  return {
    cancelStroke,
    handlePointerDown,
    handlePointerEnter,
  };

  function cancelStroke(): void {
    paintedCellKeysRef.current.clear();
    lastStrokePointRef.current = null;
    setPaintStrokeId(null);
  }

  function handlePointerDown(point: GridPoint): boolean {
    if (disabled) {
      return false;
    }

    if (activeTool === "paint") {
      if (!activeColorId) {
        return false;
      }

      const strokeId = createLocalStrokeId();
      paintedCellKeysRef.current.clear();
      lastStrokePointRef.current = point;
      setPaintStrokeId(strokeId);

      paintPoint(point, activeColorId, strokeId);
      return true;
    }

    if (activeTool === "erase") {
      const strokeId = createLocalStrokeId();
      paintedCellKeysRef.current.clear();
      lastStrokePointRef.current = point;
      setPaintStrokeId(strokeId);

      erasePoint(point, strokeId);
      return true;
    }

    return false;
  }

  function handlePointerEnter(point: GridPoint): boolean {
    if (disabled) {
      return false;
    }

    if (!paintStrokeId) {
      return false;
    }

    if (activeTool === "paint") {
      if (!activeColorId) {
        return false;
      }

      applyStrokeSegment(lastStrokePointRef.current, point, (strokePoint) => {
        paintPoint(strokePoint, activeColorId, paintStrokeId);
      });

      lastStrokePointRef.current = point;
      return true;
    }

    if (activeTool === "erase") {
      applyStrokeSegment(lastStrokePointRef.current, point, (strokePoint) => {
        erasePoint(strokePoint, paintStrokeId);
      });

      lastStrokePointRef.current = point;
      return true;
    }

    return false;
  }

  function paintPoint(
    point: GridPoint,
    colorId: string,
    strokeId: string,
  ): void {
    const newCells = getNewCellsForBrush(
      point,
      brushSize,
      gridWidth,
      gridHeight,
      paintedCellKeysRef.current,
    );

    if (newCells.length === 0) {
      return;
    }

    if (newCells.length === 1) {
      dispatch(createPaintCellCommand(colorId, newCells[0], strokeId));
      return;
    }

    dispatch(createPaintCellsCommand(colorId, newCells, strokeId));
  }

  function erasePoint(point: GridPoint, strokeId: string): void {
    const newCells = getNewCellsForBrush(
      point,
      brushSize,
      gridWidth,
      gridHeight,
      paintedCellKeysRef.current,
    );

    if (newCells.length === 0) {
      return;
    }

    if (newCells.length === 1) {
      dispatch(createEraseCellCommand(newCells[0], strokeId));
      return;
    }

    dispatch(createEraseCellsCommand(newCells, strokeId));
  }
}

function applyStrokeSegment(
  from: GridPoint | null,
  to: GridPoint,
  applyPoint: (point: GridPoint) => void,
): void {
  if (!from) {
    applyPoint(to);
    return;
  }

  const points = getLinePoints(from, to);
  for (const point of points) {
    applyPoint(point);
  }
}

function getLinePoints(from: GridPoint, to: GridPoint): GridPoint[] {
  const points: GridPoint[] = [];

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
    points.push({ x: x0, y: y0 });

    if (x0 === x1 && y0 === y1) {
      break;
    }

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

  return points;
}

function getNewCellsForBrush(
  center: GridPoint,
  brushSize: number,
  gridWidth: number,
  gridHeight: number,
  paintedCellKeys: Set<string>,
): GridPoint[] {
  const cellsForBrush = getCellsFromBrush(center, brushSize, gridWidth, gridHeight);
  const newCells: GridPoint[] = [];

  for (const cell of cellsForBrush) {
    const key = getGridCellKey(cell);

    if (paintedCellKeys.has(key)) {
      continue;
    }

    paintedCellKeys.add(key);
    newCells.push(cell);
  }

  return newCells;
}

function getCellsFromBrush(
  center: GridPoint,
  brushSize: number,
  gridWidth: number,
  gridHeight: number,
): GridPoint[] {
  const cells: GridPoint[] = [];
  const size = clampGridBrushSize(brushSize, gridWidth, gridHeight);
  const leadingOffset = Math.floor((size - 1) / 2);
  const trailingOffset = size - leadingOffset - 1;

  for (let dx = -leadingOffset; dx <= trailingOffset; dx++) {
    for (let dy = -leadingOffset; dy <= trailingOffset; dy++) {
      cells.push({
        x: center.x + dx,
        y: center.y + dy,
      });
    }
  }

  return cells;
}

function createLocalStrokeId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `stroke_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
