"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ActiveTool,
  EditorStore,
  GridPoint,
} from "@/lib/editor-v2/editor/store";
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
  dispatch: EditorStore["dispatch"];
}

export function usePaintStroke({
  activeColorId,
  activeTool,
  brushSize,
  dispatch,
}: UsePaintStrokeOptions) {
  const [paintStrokeId, setPaintStrokeId] = useState<string | null>(null);
  const paintedCellKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!paintStrokeId) {
      return;
    }

    function handleWindowMouseUp() {
      paintedCellKeysRef.current.clear();
      setPaintStrokeId(null);
    }

    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => window.removeEventListener("mouseup", handleWindowMouseUp);
  }, [paintStrokeId]);

  return {
    handlePointerDown,
    handlePointerEnter,
  };

  function handlePointerDown(point: GridPoint): boolean {
    if (activeTool === "paint" && activeColorId) {
      const strokeId = createLocalStrokeId();

      paintedCellKeysRef.current.clear();
      setPaintStrokeId(strokeId);
      paintPoint(point, activeColorId, strokeId);
      return true;
    }

    if (activeTool === "erase") {
      const strokeId = createLocalStrokeId();

      paintedCellKeysRef.current.clear();
      setPaintStrokeId(strokeId);
      erasePoint(point, strokeId);
      return true;
    }

    return false;
  }

  function handlePointerEnter(point: GridPoint): boolean {
    if (paintStrokeId && activeTool === "paint" && activeColorId) {
      paintPoint(point, activeColorId, paintStrokeId);
      return true;
    }

    if (paintStrokeId && activeTool === "erase") {
      erasePoint(point, paintStrokeId);
      return true;
    }

    return false;
  }

  function paintPoint(
    point: GridPoint,
    colorId: string,
    strokeId: string,
  ): void {
    const cellsForBrush = getCellsFromBrush(point, brushSize);
    const newCells: GridPoint[] = [];

    for (const cell of cellsForBrush) {
      const key = getGridCellKey(cell);
      if (!paintedCellKeysRef.current.has(key)) {
        paintedCellKeysRef.current.add(key);
        newCells.push(cell);
      }
    }

    if (newCells.length > 0) {
      if (newCells.length === 1) {
        dispatch(createPaintCellCommand(colorId, newCells[0], strokeId));
      } else {
        dispatch(createPaintCellsCommand(colorId, newCells, strokeId));
      }
    }
  }

  function erasePoint(point: GridPoint, strokeId: string): void {
    const cellsForBrush = getCellsFromBrush(point, brushSize);
    const newCells: GridPoint[] = [];

    for (const cell of cellsForBrush) {
      const key = getGridCellKey(cell);
      if (!paintedCellKeysRef.current.has(key)) {
        paintedCellKeysRef.current.add(key);
        newCells.push(cell);
      }
    }

    if (newCells.length > 0) {
      if (newCells.length === 1) {
        dispatch(createEraseCellCommand(newCells[0], strokeId));
      } else {
        dispatch(createEraseCellsCommand(newCells, strokeId));
      }
    }
  }
}

function getCellsFromBrush(center: GridPoint, brushSize: number): GridPoint[] {
  const cells: GridPoint[] = [];
  const size = Math.min(Math.max(Math.round(brushSize), 1), 10);
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
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `stroke_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
