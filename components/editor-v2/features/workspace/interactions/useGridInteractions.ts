"use client";

import type {
  ActiveTool,
  EditorStore,
  EditorStoreState,
  GridPoint,
  SelectionPoint,
} from "@/lib/editor-v2/editor/store";
import { useClearSelectionOnEscape } from "./useClearSelectionOnEscape";
import { usePaintStroke } from "./usePaintStroke";
import { useSelectionDrag } from "./useSelectionDrag";

interface UseGridInteractionsOptions {
  activeColorId: string | null;
  activeTool: ActiveTool;
  brushSize: number;
  dispatch: EditorStore["dispatch"];
  getClampedSelectionPointFromClient: (
    clientX: number,
    clientY: number,
  ) => SelectionPoint | null;
  getSelectionPointFromClient: (clientX: number, clientY: number) => SelectionPoint | null;
  state: EditorStoreState;
}

export function useGridInteractions({
  activeColorId,
  activeTool,
  brushSize,
  dispatch,
  getClampedSelectionPointFromClient,
  getSelectionPointFromClient,
  state,
}: UseGridInteractionsOptions) {
  const paintStroke = usePaintStroke({
    activeColorId,
    activeTool,
    brushSize,
    dispatch,
  });
  const selectionDrag = useSelectionDrag({
    activeTool,
    dispatch,
    getClampedSelectionPointFromClient,
    getSelectionPointFromClient,
  });

  useClearSelectionOnEscape({
    clearLocalSelection: selectionDrag.clearDragSelection,
    dispatch,
    hasSelection: Boolean(state.session.selection.rect),
  });

  return {
    handlePointerDown,
    handlePointerEnter,
  };

  function handlePointerDown(point: GridPoint, selectionPoint: SelectionPoint): void {
    if (paintStroke.handlePointerDown(point)) {
      return;
    }

    selectionDrag.handlePointerDown(selectionPoint);
  }

  function handlePointerEnter(point: GridPoint): void {
    paintStroke.handlePointerEnter(point);
  }
}
