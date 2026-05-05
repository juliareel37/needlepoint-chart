"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ActiveTool,
  EditorStore,
  EditorStoreState,
  SelectionState,
  SelectionPoint,
} from "@/lib/editor-v2/editor/store";
import { isPointInSelection } from "@/lib/editor-v2/editor/selection/lassoGeometry";
import {
  createMoveSelectionCommand,
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
  state: EditorStoreState;
  selectionShape: SelectionState["shape"];
}

export function useSelectionDrag({
  activeTool,
  dispatch,
  getClampedSelectionPointFromClient,
  state,
  selectionShape,
}: UseSelectionDragOptions) {
  const [isLassoing, setIsLassoing] = useState(false);
  const [isMovingSelection, setIsMovingSelection] = useState(false);
  const [hoveringMovableSelection, setHoveringMovableSelection] = useState(false);
  const lastLassoPointRef = useRef<SelectionPoint | null>(null);
  const lastSelectionDragCellRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (activeTool === "lasso") {
      return;
    }

    lastLassoPointRef.current = null;
    lastSelectionDragCellRef.current = null;
    setIsLassoing(false);
    setIsMovingSelection(false);
    setHoveringMovableSelection(false);
  }, [activeTool]);

  useEffect(() => {
    if (!isLassoing && !isMovingSelection) {
      return;
    }

    function handleWindowPointerUp(event: PointerEvent) {
      if (isMovingSelection) {
        const point = getClampedSelectionPointFromClient(
          event.clientX,
          event.clientY,
        );
        setHoveringMovableSelection(Boolean(point && isSelectionMovableAtPoint(state, point)));
        lastSelectionDragCellRef.current = null;
        setIsMovingSelection(false);
        return;
      }

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

      if (isMovingSelection) {
        const currentCell = {
          x: Math.floor(point.x),
          y: Math.floor(point.y),
        };
        const lastCell = lastSelectionDragCellRef.current;

        if (!lastCell) {
          lastSelectionDragCellRef.current = currentCell;
          return;
        }

        const deltaX = currentCell.x - lastCell.x;
        const deltaY = currentCell.y - lastCell.y;

        if (deltaX === 0 && deltaY === 0) {
          return;
        }

        lastSelectionDragCellRef.current = currentCell;
        dispatch(createMoveSelectionCommand(deltaX, deltaY));
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
  }, [
    dispatch,
    getClampedSelectionPointFromClient,
    isLassoing,
    isMovingSelection,
    selectionShape,
    state,
  ]);

  return {
    clearDragSelection,
    cursor: isMovingSelection ? "grabbing" : hoveringMovableSelection ? "grab" : null,
    handlePointerDown,
    handlePointerHover,
  };

  function clearDragSelection(): void {
    lastLassoPointRef.current = null;
    lastSelectionDragCellRef.current = null;
    setIsLassoing(false);
    setIsMovingSelection(false);
    setHoveringMovableSelection(false);
  }

  function handlePointerDown(point: SelectionPoint): boolean {
    if (activeTool !== "lasso") {
      return false;
    }

    if (isSelectionMovableAtPoint(state, point)) {
      lastSelectionDragCellRef.current = {
        x: Math.floor(point.x),
        y: Math.floor(point.y),
      };
      setHoveringMovableSelection(true);
      setIsMovingSelection(true);
      return true;
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

  function handlePointerHover(point: SelectionPoint | null): void {
    if (activeTool !== "lasso" || isLassoing || isMovingSelection) {
      setHoveringMovableSelection(false);
      return;
    }

    setHoveringMovableSelection(Boolean(point && isSelectionMovableAtPoint(state, point)));
  }
}

function isSelectionMovableAtPoint(
  state: EditorStoreState,
  point: SelectionPoint,
): boolean {
  const selection = state.session.selection;

  return Boolean(
    selection.mode !== "none" &&
      selection.rect &&
      !selection.preview &&
      isPointInSelection(state, point),
  );
}
