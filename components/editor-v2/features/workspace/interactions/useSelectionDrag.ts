"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ActiveTool,
  EditorStore,
  EditorStoreState,
  GridPoint,
  SelectionState,
  SelectionPoint,
} from "@/lib/editor-v2/editor/store";
import { isPointInSelection } from "@/lib/editor-v2/editor/selection/lassoGeometry";
import {
  createMoveSelectionCommand,
  createResizeSelectionCommand,
  createSelectionCommitCommand,
  createSelectionStartCommand,
  createSelectionUpdateCommand,
} from "../workspaceCommands";

type SelectionResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

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
  const [activeResizeHandle, setActiveResizeHandle] = useState<SelectionResizeHandle | null>(
    null,
  );
  const [hoveringMovableSelection, setHoveringMovableSelection] = useState(false);
  const [hoveredResizeHandle, setHoveredResizeHandle] = useState<SelectionResizeHandle | null>(
    null,
  );
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
    setActiveResizeHandle(null);
    setHoveringMovableSelection(false);
    setHoveredResizeHandle(null);
  }, [activeTool]);

  useEffect(() => {
    if (!isLassoing && !isMovingSelection && !activeResizeHandle) {
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

      if (activeResizeHandle) {
        const point = getClampedSelectionPointFromClient(
          event.clientX,
          event.clientY,
        );
        const nextHoveredHandle = point ? getSelectionResizeHandleAtPoint(state, point) : null;
        setHoveredResizeHandle(nextHoveredHandle);
        setHoveringMovableSelection(
          Boolean(point && !nextHoveredHandle && isSelectionMovableAtPoint(state, point)),
        );
        setActiveResizeHandle(null);
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

      if (activeResizeHandle) {
        dispatch(
          createResizeSelectionCommand(activeResizeHandle, {
            x: Math.floor(point.x),
            y: Math.floor(point.y),
          }),
        );
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
    activeResizeHandle,
    isLassoing,
    isMovingSelection,
    selectionShape,
    state,
  ]);

  return {
    clearDragSelection,
    cursor: getSelectionCursor({
      activeResizeHandle,
      hoveredResizeHandle,
      hoveringMovableSelection,
      isMovingSelection,
    }),
    handlePointerDown,
    handlePointerHover,
  };

  function clearDragSelection(): void {
    lastLassoPointRef.current = null;
    lastSelectionDragCellRef.current = null;
    setIsLassoing(false);
    setIsMovingSelection(false);
    setActiveResizeHandle(null);
    setHoveringMovableSelection(false);
    setHoveredResizeHandle(null);
  }

  function handlePointerDown(point: SelectionPoint): boolean {
    if (activeTool !== "lasso") {
      return false;
    }

    const resizeHandle = getSelectionResizeHandleAtPoint(state, point);

    if (resizeHandle) {
      setActiveResizeHandle(resizeHandle);
      setHoveredResizeHandle(resizeHandle);
      setHoveringMovableSelection(false);
      return true;
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
      if (!activeResizeHandle) {
        setHoveredResizeHandle(null);
      }
      return;
    }

    const resizeHandle = point ? getSelectionResizeHandleAtPoint(state, point) : null;
    setHoveredResizeHandle(resizeHandle);
    setHoveringMovableSelection(
      Boolean(point && !resizeHandle && isSelectionMovableAtPoint(state, point)),
    );
  }
}

function getSelectionCursor(args: {
  activeResizeHandle: SelectionResizeHandle | null;
  hoveredResizeHandle: SelectionResizeHandle | null;
  hoveringMovableSelection: boolean;
  isMovingSelection: boolean;
}): string | null {
  if (args.isMovingSelection) {
    return "grabbing";
  }

  const resizeHandle = args.activeResizeHandle ?? args.hoveredResizeHandle;

  if (resizeHandle === "nw" || resizeHandle === "se") {
    return "nwse-resize";
  }

  if (resizeHandle === "ne" || resizeHandle === "sw") {
    return "nesw-resize";
  }

  if (resizeHandle === "n" || resizeHandle === "s") {
    return "ns-resize";
  }

  if (resizeHandle === "e" || resizeHandle === "w") {
    return "ew-resize";
  }

  if (args.hoveringMovableSelection) {
    return "grab";
  }

  return null;
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

function getSelectionResizeHandleAtPoint(
  state: EditorStoreState,
  point: SelectionPoint,
): SelectionResizeHandle | null {
  const selection = state.session.selection;

  if (
    selection.mode !== "rect" ||
    !selection.rect ||
    selection.preview ||
    state.session.duplicatePlacement
  ) {
    return null;
  }

  const tolerance = 0.45;
  const corners: Array<{ handle: SelectionResizeHandle; point: SelectionPoint }> = [
    { handle: "nw", point: { x: selection.rect.x, y: selection.rect.y } },
    {
      handle: "n",
      point: {
        x: selection.rect.x + selection.rect.width / 2,
        y: selection.rect.y,
      },
    },
    {
      handle: "ne",
      point: { x: selection.rect.x + selection.rect.width, y: selection.rect.y },
    },
    {
      handle: "e",
      point: {
        x: selection.rect.x + selection.rect.width,
        y: selection.rect.y + selection.rect.height / 2,
      },
    },
    {
      handle: "se",
      point: {
        x: selection.rect.x + selection.rect.width,
        y: selection.rect.y + selection.rect.height,
      },
    },
    {
      handle: "s",
      point: {
        x: selection.rect.x + selection.rect.width / 2,
        y: selection.rect.y + selection.rect.height,
      },
    },
    {
      handle: "sw",
      point: { x: selection.rect.x, y: selection.rect.y + selection.rect.height },
    },
    {
      handle: "w",
      point: {
        x: selection.rect.x,
        y: selection.rect.y + selection.rect.height / 2,
      },
    },
  ];

  for (const corner of corners) {
    if (
      Math.abs(point.x - corner.point.x) <= tolerance &&
      Math.abs(point.y - corner.point.y) <= tolerance
    ) {
      return corner.handle;
    }
  }

  return null;
}
