"use client";

import type {
  ActiveTool,
  EditorStore,
  EditorStoreState,
  GridPoint,
  TraceDocument,
  SelectionPoint,
} from "@/lib/editor-v2/editor/store";
import { findClosestPaletteColorId } from "@/lib/editor-v2/editor/color-utils";
import { getCell } from "@/lib/editor-v2/editor/selectors/document/getCell";
import { createSetToolCommand, createSetToolWithColorCommand } from "../workspaceCommands";
import { sampleTraceRgbAtWorldPoint } from "../trace/traceSampler";
import { useClearSelectionOnEscape } from "./useClearSelectionOnEscape";
import { useMirrorDrag } from "./useMirrorDrag";
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
  metrics: { cellSize: number; surfaceWidth: number; surfaceHeight: number };
  state: EditorStoreState;
  trace: TraceDocument | null;
}

export function useGridInteractions({
  activeColorId,
  activeTool,
  brushSize,
  dispatch,
  getClampedSelectionPointFromClient,
  getSelectionPointFromClient,
  metrics,
  state,
  trace,
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
    selectionShape: state.session.selection.shape,
  });
  const mirrorDrag = useMirrorDrag({
    activeTool,
    dispatch,
    getClampedSelectionPointFromClient,
    state,
  });

  useClearSelectionOnEscape({
    clearLocalSelection: selectionDrag.clearDragSelection,
    dispatch,
    hasSelection:
      activeTool === "lasso" ||
      Boolean(state.session.selection.rect) ||
      Boolean(state.session.mirrorInteraction.session),
  });

  return {
    handlePointerDown,
    handlePointerEnter,
  };

  function handlePointerDown(point: GridPoint, selectionPoint: SelectionPoint): void {
    if (activeTool === "eyedropper") {
      handleEyedropperPointerDown(point);
      return;
    }

    if (paintStroke.handlePointerDown(point)) {
      return;
    }

    if (mirrorDrag.handlePointerDown(point)) {
      return;
    }

    selectionDrag.handlePointerDown(selectionPoint);
  }

  function handlePointerEnter(point: GridPoint): void {
    paintStroke.handlePointerEnter(point);
  }

  function handleEyedropperPointerDown(point: GridPoint): void {
    const returnTool = state.session.eyedropperReturnTool ?? "pan";
    // const returnTool = "draw";

    const paintedColorId = getCell(state, point.x, point.y);

    if (paintedColorId) {
      dispatch(createSetToolWithColorCommand(returnTool, paintedColorId));
      return;
    }

    if (trace) {
      const worldPoint = {
        x: (point.x + 0.5) * metrics.cellSize,
        y: (point.y + 0.5) * metrics.cellSize,
      };
      const sampled = sampleTraceRgbAtWorldPoint(trace, metrics, worldPoint);
      if (sampled) {
        const nearest = findClosestPaletteColorId(state.document.palette.colorsById, sampled);
        if (nearest) {
          dispatch(createSetToolWithColorCommand(returnTool, nearest));
          return;
        }
      }
    }

    // Miss: do not change active color, but always return to the previous tool.
    dispatch(createSetToolCommand(returnTool));
  }
}
