"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ActiveTool,
  EditorStore,
  GridPoint,
} from "@/lib/editor-v2/editor/store";
import { clampGridBrushSize } from "@/lib/editor-v2/editor/brushSize";
import {
  createEraseCellsCommand,
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

interface ActivePaintStroke {
  colorId: string | null;
  mode: "paint" | "erase";
  strokeId: string;
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

  const activeStrokeRef = useRef<ActivePaintStroke | null>(null);
  const paintedCellKeysRef = useRef<Set<string>>(new Set());
  const lastStrokePointRef = useRef<GridPoint | null>(null);
  const pendingCellsRef = useRef<GridPoint[]>([]);
  const pendingCellKeysRef = useRef<Set<string>>(new Set());
  const frameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!disabled) {
      return;
    }

    cancelStroke();
  }, [disabled]);

  useEffect(() => {
    if (!paintStrokeId) {
      return;
    }

    function endStroke() {
      finishStroke();
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
    isStrokeActive: paintStrokeId !== null,
  };

  function cancelStroke(): void {
    cancelPendingFlush();
    pendingCellsRef.current = [];
    pendingCellKeysRef.current.clear();
    paintedCellKeysRef.current.clear();
    lastStrokePointRef.current = null;
    activeStrokeRef.current = null;
    setPaintStrokeId(null);
  }

  function finishStroke(): void {
    flushPendingCells();
    paintedCellKeysRef.current.clear();
    lastStrokePointRef.current = null;
    activeStrokeRef.current = null;
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
      pendingCellsRef.current = [];
      pendingCellKeysRef.current.clear();
      lastStrokePointRef.current = point;
      activeStrokeRef.current = {
        colorId: activeColorId,
        mode: "paint",
        strokeId,
      };
      setPaintStrokeId(strokeId);

      queuePoint(point);
      return true;
    }

    if (activeTool === "erase") {
      const strokeId = createLocalStrokeId();
      paintedCellKeysRef.current.clear();
      pendingCellsRef.current = [];
      pendingCellKeysRef.current.clear();
      lastStrokePointRef.current = point;
      activeStrokeRef.current = {
        colorId: null,
        mode: "erase",
        strokeId,
      };
      setPaintStrokeId(strokeId);

      queuePoint(point);
      return true;
    }

    return false;
  }

  function handlePointerEnter(point: GridPoint): boolean {
    if (disabled) {
      return false;
    }

    const activeStroke = activeStrokeRef.current;

    if (!activeStroke) {
      return false;
    }

    if (activeStroke.mode === "paint") {
      if (!activeStroke.colorId || activeTool !== "paint") {
        return false;
      }

      applyStrokeSegment(lastStrokePointRef.current, point, (strokePoint) => {
        queuePoint(strokePoint);
      });

      lastStrokePointRef.current = point;
      return true;
    }

    if (activeStroke.mode === "erase") {
      if (activeTool !== "erase") {
        return false;
      }

      applyStrokeSegment(lastStrokePointRef.current, point, (strokePoint) => {
        queuePoint(strokePoint);
      });

      lastStrokePointRef.current = point;
      return true;
    }

    return false;
  }

  function queuePoint(point: GridPoint): void {
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

    for (const cell of newCells) {
      const key = getLocalGridCellKey(cell);

      if (pendingCellKeysRef.current.has(key)) {
        continue;
      }

      pendingCellKeysRef.current.add(key);
      pendingCellsRef.current.push(cell);
    }

    schedulePendingFlush();
  }

  function schedulePendingFlush(): void {
    if (frameIdRef.current !== null) {
      return;
    }

    if (typeof window === "undefined") {
      flushPendingCells();
      return;
    }

    frameIdRef.current = window.requestAnimationFrame(() => {
      frameIdRef.current = null;
      flushPendingCells();
    });
  }

  function cancelPendingFlush(): void {
    if (frameIdRef.current === null || typeof window === "undefined") {
      frameIdRef.current = null;
      return;
    }

    window.cancelAnimationFrame(frameIdRef.current);
    frameIdRef.current = null;
  }

  function flushPendingCells(): void {
    cancelPendingFlush();

    const activeStroke = activeStrokeRef.current;
    const pendingCells = pendingCellsRef.current;

    if (!activeStroke || pendingCells.length === 0) {
      pendingCellsRef.current = [];
      pendingCellKeysRef.current.clear();
      return;
    }

    pendingCellsRef.current = [];
    pendingCellKeysRef.current.clear();

    if (activeStroke.mode === "paint" && activeStroke.colorId) {
      dispatch(
        createPaintCellsCommand(
          activeStroke.colorId,
          pendingCells,
          activeStroke.strokeId,
        ),
      );
      return;
    }

    if (activeStroke.mode === "erase") {
      dispatch(createEraseCellsCommand(pendingCells, activeStroke.strokeId));
    }
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
    const key = getLocalGridCellKey(cell);

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

function getLocalGridCellKey(point: GridPoint): string {
  return `${point.x}:${point.y}`;
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
