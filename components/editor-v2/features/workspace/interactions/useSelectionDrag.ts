"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ActiveTool,
  EditorStore,
  SelectionState,
  SelectionPoint,
} from "@/lib/editor-v2/editor/store";
import {
  createSelectionCommitCommand,
  createSelectionStartCommand,
  createSelectionUpdateCommand,
} from "../workspaceCommands";

interface UseSelectionDragOptions {
  activeTool: ActiveTool;
  dispatch: EditorStore["dispatch"];
  getClampedSelectionPointFromClient: (
    clientX: number,
    clientY: number,
  ) => SelectionPoint | null;
  selectionShape: SelectionState["shape"];
}

export function useSelectionDrag({
  activeTool,
  dispatch,
  getClampedSelectionPointFromClient,
  selectionShape,
}: UseSelectionDragOptions) {
  const [isLassoing, setIsLassoing] = useState(false);
  const lastLassoPointRef = useRef<SelectionPoint | null>(null);

  useEffect(() => {
    if (!isLassoing) {
      return;
    }

    function handleWindowPointerUp(event: PointerEvent) {
      const rawPoint = getClampedSelectionPointFromClient(
        event.clientX,
        event.clientY,
      );
      const point =
        rawPoint && (selectionShape === "rect" || selectionShape === "circle")
          ? {
              x: Math.floor(rawPoint.x),
              y: Math.floor(rawPoint.y),
            }
          : rawPoint;
      dispatch(createSelectionCommitCommand(point));
      lastLassoPointRef.current = null;
      setIsLassoing(false);
    }

    function handleWindowPointerMove(event: PointerEvent) {
      const rawPoint = getClampedSelectionPointFromClient(
        event.clientX,
        event.clientY,
      );
      const point =
        rawPoint && (selectionShape === "rect" || selectionShape === "circle")
          ? {
              x: Math.floor(rawPoint.x),
              y: Math.floor(rawPoint.y),
            }
          : rawPoint;

      if (!point) {
        return;
      }

      const lastPoint = lastLassoPointRef.current;
      const minStep = 0.3;

      if (
        lastPoint &&
        Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y) < minStep
      ) {
        return;
      }

      lastLassoPointRef.current = point;
      dispatch(createSelectionUpdateCommand(point));
    }

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);
    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
    };
  }, [dispatch, getClampedSelectionPointFromClient, isLassoing, selectionShape]);

  return {
    clearDragSelection,
    handlePointerDown,
  };

  function clearDragSelection(): void {
    lastLassoPointRef.current = null;
    setIsLassoing(false);
  }

  function handlePointerDown(point: SelectionPoint): boolean {
    if (activeTool !== "lasso") {
      return false;
    }

    const normalizedPoint =
      selectionShape === "rect" || selectionShape === "circle"
        ? {
            x: Math.floor(point.x),
            y: Math.floor(point.y),
          }
        : point;

    dispatch(createSelectionStartCommand(normalizedPoint));
    lastLassoPointRef.current = normalizedPoint;
    setIsLassoing(true);

    return true;
  }
}
