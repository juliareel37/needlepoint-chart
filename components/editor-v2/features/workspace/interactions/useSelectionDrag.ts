"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ActiveTool,
  EditorStore,
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
  getSelectionPointFromClient: (clientX: number, clientY: number) => SelectionPoint | null;
}

export function useSelectionDrag({
  activeTool,
  dispatch,
  getClampedSelectionPointFromClient,
  getSelectionPointFromClient,
}: UseSelectionDragOptions) {
  const [isLassoing, setIsLassoing] = useState(false);
  const lastLassoPointRef = useRef<SelectionPoint | null>(null);

  useEffect(() => {
    if (!isLassoing) {
      return;
    }

    function handleWindowMouseUp(event: MouseEvent) {
      const point = getClampedSelectionPointFromClient(
        event.clientX,
        event.clientY,
      );
      dispatch(createSelectionCommitCommand(point));
      lastLassoPointRef.current = null;
      setIsLassoing(false);
    }

    function handleWindowMouseMove(event: MouseEvent) {
      const point = getClampedSelectionPointFromClient(
        event.clientX,
        event.clientY,
      );

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

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [dispatch, getClampedSelectionPointFromClient, isLassoing]);

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

    dispatch(createSelectionStartCommand(point));
    lastLassoPointRef.current = point;
    setIsLassoing(true);

    return true;
  }
}
