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
  createPaintCellCommand,
} from "../workspaceCommands";

interface UsePaintStrokeOptions {
  activeColorId: string | null;
  activeTool: ActiveTool;
  dispatch: EditorStore["dispatch"];
}

export function usePaintStroke({
  activeColorId,
  activeTool,
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
    const key = getGridCellKey(point);

    if (paintedCellKeysRef.current.has(key)) {
      return;
    }

    paintedCellKeysRef.current.add(key);
    dispatch(createPaintCellCommand(colorId, point, strokeId));
  }

  function erasePoint(point: GridPoint, strokeId: string): void {
    const key = getGridCellKey(point);

    if (paintedCellKeysRef.current.has(key)) {
      return;
    }

    paintedCellKeysRef.current.add(key);
    dispatch(createEraseCellCommand(point, strokeId));
  }
}

function createLocalStrokeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `stroke_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
