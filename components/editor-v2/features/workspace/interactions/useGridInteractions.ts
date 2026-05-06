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
import { getSelectionBounds } from "@/lib/editor-v2/editor/selectors/session/getSelectionBounds";
import { isCellInSelection } from "@/lib/editor-v2/editor/selection/lassoGeometry";
import {
  createEraseCellsCommand,
  createPaintCellsCommand,
  createSetToolCommand,
  createSetToolWithColorCommand,
} from "../workspaceCommands";
import { sampleTraceRgbAtWorldPoint } from "../trace/traceSampler";
import { useClearSelectionOnEscape } from "./useClearSelectionOnEscape";
import { useMirrorDrag } from "./useMirrorDrag";
import { usePaintStroke } from "./usePaintStroke";
import { useSelectionDrag } from "./useSelectionDrag";

interface UseGridInteractionsOptions {
  activeColorId: string | null;
  activeTool: ActiveTool;
  brushSize: number;
  coarsePointer?: boolean;
  dispatch: EditorStore["dispatch"];
  getClampedSelectionPointFromClient: (
    clientX: number,
    clientY: number,
  ) => SelectionPoint | null;
  getSelectionPointFromClient: (clientX: number, clientY: number) => SelectionPoint | null;
  metrics: { cellSize: number; surfaceWidth: number; surfaceHeight: number };
  paintDisabled?: boolean;
  state: EditorStoreState;
  trace: TraceDocument | null;
}

export function useGridInteractions({
  activeColorId,
  activeTool,
  brushSize,
  coarsePointer = false,
  dispatch,
  getClampedSelectionPointFromClient,
  getSelectionPointFromClient,
  metrics,
  paintDisabled = false,
  state,
  trace,
}: UseGridInteractionsOptions) {
  const paintStroke = usePaintStroke({
    activeColorId,
    activeTool,
    brushSize,
    dispatch,
    disabled: paintDisabled,
  });
  const selectionDrag = useSelectionDrag({
    activeTool,
    coarsePointer,
    dispatch,
    getClampedSelectionPointFromClient,
    state,
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
    duplicatePlacementActive: Boolean(state.session.duplicatePlacement),
    hasSelection:
      activeTool === "lasso" ||
      Boolean(state.session.duplicatePlacement) ||
      Boolean(state.session.selection.rect) ||
      Boolean(state.session.mirrorInteraction.session),
  });

  return {
    cancelPaintStroke: paintStroke.cancelStroke,
    cursor: selectionDrag.cursor,
    handleHover,
    handlePointerDown,
    handlePointerEnter,
  };

  function handlePointerDown(point: GridPoint, selectionPoint: SelectionPoint): void {
    if (activeTool === "eyedropper") {
      handleEyedropperPointerDown(point);
      return;
    }

    if (activeTool === "fill") {
      handleFillPointerDown(point);
      return;
    }

    if (!paintDisabled && paintStroke.handlePointerDown(point)) {
      return;
    }

    if (mirrorDrag.handlePointerDown(point)) {
      return;
    }

    selectionDrag.handlePointerDown(selectionPoint);
  }

  function handlePointerEnter(point: GridPoint): void {
    if (paintDisabled) {
      return;
    }

    paintStroke.handlePointerEnter(point);
  }

  function handleHover(selectionPoint: SelectionPoint | null): void {
    selectionDrag.handlePointerHover(selectionPoint);
  }

  function handleEyedropperPointerDown(point: GridPoint): void {
    const returnTool = state.session.eyedropperReturnTool ?? "paint";
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

  function handleFillPointerDown(point: GridPoint): void {
    if (paintDisabled || !activeColorId) {
      return;
    }

    const selectionCells = getSelectedRegionCells(state, point);

    if (selectionCells.length > 0) {
      dispatch(createPaintCellsCommand(activeColorId, selectionCells));
      dispatch(createSetToolCommand("lasso"));
      return;
    }

    const fillCells = getFillRegion(state, point, activeColorId);

    if (fillCells.length > 0) {
      dispatch(createPaintCellsCommand(activeColorId, fillCells));
    }
  }
}

function getSelectedRegionCells(
  state: EditorStoreState,
  start: GridPoint,
): GridPoint[] {
  const selectionBounds = getSelectionBounds(state);

  if (!selectionBounds || state.session.selection.preview) {
    return [];
  }

  if (!isCellInSelection(state, start)) {
    return [];
  }

  const cells: GridPoint[] = [];

  for (let y = selectionBounds.y; y < selectionBounds.y + selectionBounds.height; y += 1) {
    for (let x = selectionBounds.x; x < selectionBounds.x + selectionBounds.width; x += 1) {
      const cell = { x, y };

      if (isCellInSelection(state, cell)) {
        cells.push(cell);
      }
    }
  }

  return cells;
}

export function getFillRegion(
  state: EditorStoreState,
  start: GridPoint,
  activeColorId: string,
): GridPoint[] {
  const { width, height } = state.document.grid;
  const hasCommittedSelection = Boolean(
    getSelectionBounds(state) && !state.session.selection.preview,
  );

  if (start.x < 0 || start.y < 0 || start.x >= width || start.y >= height) {
    return [];
  }

  if (hasCommittedSelection && !isCellInSelection(state, start)) {
    return [];
  }

  const targetValue = getCell(state, start.x, start.y);

  if (targetValue === activeColorId) {
    return [];
  }

  const region: GridPoint[] = [];
  const visited = new Set<string>();
  const queue: GridPoint[] = [start];

  while (queue.length > 0) {
    const point = queue.shift();

    if (!point) {
      continue;
    }

    const key = `${point.x}:${point.y}`;
    if (visited.has(key)) {
      continue;
    }
    visited.add(key);

    if (point.x < 0 || point.y < 0 || point.x >= width || point.y >= height) {
      continue;
    }

    if (hasCommittedSelection && !isCellInSelection(state, point)) {
      continue;
    }

    if (getCell(state, point.x, point.y) !== targetValue) {
      continue;
    }

    region.push(point);

    queue.push(
      { x: point.x - 1, y: point.y },
      { x: point.x + 1, y: point.y },
      { x: point.x, y: point.y - 1 },
      { x: point.x, y: point.y + 1 },
    );
  }

  return region;
}
