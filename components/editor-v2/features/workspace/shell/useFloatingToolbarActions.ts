"use client";

import type { Dispatch, SetStateAction } from "react";
import type {
  EditorStore,
  GridPoint,
  GridRect,
  PaletteColor,
  TraceDocument,
} from "@/lib/editor-v2/editor/store";
import {
  createBeginTraceRepositionCommand,
  createCancelTraceRepositionCommand,
  createClearCanvasCommand,
  createClearSelectionCommand,
  createCommitTraceRepositionCommand,
  createEraseCellsCommand,
  createPaintCellsCommand,
  createRedoCommand,
  createSetActiveSidebarSectionCommand,
  createSetSidebarCollapsedCommand,
  createSetToolCommand,
  createUndoCommand,
  createUpdateTraceCommand,
} from "../workspaceCommands";

interface UseFloatingToolbarActionsOptions {
  activeColor: PaletteColor | null;
  activeTool: "paint" | "erase" | "lasso" | "eyedropper" | string;
  dispatch: EditorStore["dispatch"];
  hasPaintedCells: boolean;
  imageOpen: boolean;
  selectionBounds: GridRect | null;
  selectionCommitted: boolean;
  selectOpen: boolean;
  setBrushSizeTooltipVisible: Dispatch<SetStateAction<boolean>>;
  setDrawOpen: Dispatch<SetStateAction<boolean>>;
  setImageOpacityTooltipVisible: Dispatch<SetStateAction<boolean>>;
  setImageOpen: Dispatch<SetStateAction<boolean>>;
  setSelectOpen: Dispatch<SetStateAction<boolean>>;
  trace: TraceDocument | null;
}

export function useFloatingToolbarActions({
  activeColor,
  activeTool,
  dispatch,
  hasPaintedCells,
  imageOpen,
  selectionBounds,
  selectionCommitted,
  selectOpen,
  setBrushSizeTooltipVisible,
  setDrawOpen,
  setImageOpacityTooltipVisible,
  setImageOpen,
  setSelectOpen,
  trace,
}: UseFloatingToolbarActionsOptions) {
  const selectionCells = selectionBounds
    ? buildSelectionCandidateCells(selectionBounds)
    : [];

  return {
    closeImageMenu,
    handleAddImageClick,
    handleBeginTraceReposition,
    handleBrushMenuButtonClick,
    handleCancelTraceReposition,
    handleCommitTraceReposition,
    handleEraseClick,
    handleEyedropperClick,
    handleImageButtonClick,
    handleOpenColorPanel,
    handlePaintClick,
    handlePanClick,
    handleRedoClick,
    handleSelectionButtonClick,
    handleSelectionDone,
    handleSelectionErase,
    handleSelectionFill,
    handleToggleTraceVisibility,
    handleTraceOpacityChange,
    handleUndoClick,
  };

  function openSidebarSection(section: "color" | "trace") {
    exitSelectionFlow();
    dispatch(createSetActiveSidebarSectionCommand(section));
    dispatch(createSetSidebarCollapsedCommand(false));
  }

  function closeDrawMenu(): void {
    setDrawOpen(false);
    setBrushSizeTooltipVisible(false);
  }

  function closeImageMenu(): void {
    setImageOpen(false);
    setImageOpacityTooltipVisible(false);
  }

  function resetTransientMenus(): void {
    closeDrawMenu();
    closeImageMenu();
  }

  function exitSelectionFlow(): void {
    setSelectOpen(false);

    if (activeTool !== "lasso") {
      return;
    }

    if (selectionBounds) {
      dispatch(createClearSelectionCommand());
    }

    dispatch(createSetToolCommand("pan"));
  }

  function activateTool(tool: "pan" | "paint" | "erase"): void {
    exitSelectionFlow();
    resetTransientMenus();

    if (tool === "pan") {
      dispatch(createSetToolCommand("pan"));
      return;
    }

    dispatch(createSetToolCommand(activeTool === tool ? "pan" : tool));
  }

  function handleOpenColorPanel() {
    openSidebarSection("color");
  }

  function handlePanClick() {
    activateTool("pan");
  }

  function handlePaintClick() {
    activateTool("paint");
  }

  function handleEraseClick() {
    activateTool("erase");
  }

  function handleEyedropperClick() {
    exitSelectionFlow();
    resetTransientMenus();

    dispatch(createSetToolCommand("eyedropper"));
  }

  function handleBrushMenuButtonClick() {
    exitSelectionFlow();
    setDrawOpen((current) => !current);
    closeImageMenu();
  }

  function handleSelectionButtonClick() {
    resetTransientMenus();

    if (activeTool === "lasso") {
      if (selectOpen) {
        if (selectionBounds) {
          dispatch(createClearSelectionCommand());
        } else {
          dispatch(createSetToolCommand("pan"));
        }
        setSelectOpen(false);
        return;
      }

      setSelectOpen(true);
      return;
    }

    dispatch(createSetToolCommand("lasso"));
    setSelectOpen(true);
  }

  function handleSelectionFill() {
    if (!selectionBounds || !activeColor) {
      return;
    }

    dispatch(createPaintCellsCommand(activeColor.id, selectionCells));
  }

  function handleSelectionErase() {
    if (!selectionBounds) {
      return;
    }

    dispatch(createEraseCellsCommand(selectionCells));
  }

  function handleSelectionDone() {
    if (selectionCommitted && selectionBounds) {
      dispatch(createClearSelectionCommand());
    } else {
      dispatch(createSetToolCommand("pan"));
    }

    setSelectOpen(false);
  }

  function handleImageButtonClick() {
    exitSelectionFlow();

    if (imageOpen) {
      closeImageMenu();
    } else {
      setImageOpen(true);
    }

    closeDrawMenu();
  }

  function handleAddImageClick() {
    openSidebarSection("trace");
    closeImageMenu();
  }

  function handleToggleTraceVisibility() {
    if (!trace) {
      return;
    }

    dispatch(
      createUpdateTraceCommand(
        { visible: !trace.visible },
        { history: { mode: "skip" } },
      ),
    );
  }

  function handleTraceOpacityChange(value: number) {
    dispatch(
      createUpdateTraceCommand(
        { opacity: value },
        { history: { mode: "skip" } },
      ),
    );
  }

  function handleBeginTraceReposition() {
    dispatch(createBeginTraceRepositionCommand("toolbar"));
  }

  function handleCancelTraceReposition() {
    dispatch(createCancelTraceRepositionCommand());
  }

  function handleCommitTraceReposition() {
    dispatch(createCommitTraceRepositionCommand());
  }

  function handleUndoClick() {
    exitSelectionFlow();
    dispatch(createUndoCommand());
  }

  function handleRedoClick() {
    exitSelectionFlow();
    dispatch(createRedoCommand());
  }

}

function buildSelectionCandidateCells(bounds: GridRect): GridPoint[] {
  const cells: GridPoint[] = [];

  for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
      cells.push({ x, y });
    }
  }

  return cells;
}
