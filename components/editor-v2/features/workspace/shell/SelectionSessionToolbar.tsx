"use client";

import { Toolbar, ToolbarButton, ToolbarDivider, ToolbarGroup, ToolbarIcon, ToolbarLabel } from "@/components/design-system";
import type { EditorStore, GridPoint, GridRect, PaletteColor, SelectionState } from "@/lib/editor-v2/editor/store";
import {
  createClearSelectionCommand,
  createEraseCellsCommand,
  createPaintCellsCommand,
  createSetSelectionShapeCommand,
  createSetToolCommand,
} from "../workspaceCommands";
import styles from "./EditorV2Shell.module.css";

interface SelectionSessionToolbarProps {
  activeColor: PaletteColor | null;
  dispatch: EditorStore["dispatch"];
  selectionBounds: GridRect | null;
  selectionCommitted: boolean;
  selectionShape: SelectionState["shape"];
}

export function SelectionSessionToolbar({
  activeColor,
  dispatch,
  selectionBounds,
  selectionCommitted,
  selectionShape,
}: SelectionSessionToolbarProps) {
  const canPaintSelection = Boolean(selectionCommitted && selectionBounds && activeColor);
  const canEraseSelection = Boolean(selectionCommitted && selectionBounds);
  const instruction = selectionCommitted
    ? "Selection ready. Fill, erase, or start a new selection."
    : selectionShape === "rect"
      ? "Drag to select canvas area."
      : selectionShape === "circle"
        ? "Drag to select a circular area."
      : "Drag across the canvas to create a freehand selection.";

  function buildSelectionCandidateCells(bounds: GridRect): GridPoint[] {
    const cells: GridPoint[] = [];

    for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
        cells.push({ x, y });
      }
    }

    return cells;
  }

  function handleNewSelection() {
    dispatch(createClearSelectionCommand());
    dispatch(createSetToolCommand("lasso"));
  }

  function handleExitSelection() {
    dispatch(createClearSelectionCommand());
  }

  return (
    <Toolbar className={styles.floatingToolbar}>
      <ToolbarGroup>
        <ToolbarButton
          type="button"
          variant="ghost"
          iconOnly
          aria-label="Exit selection"
          title="Exit selection"
          onClick={handleExitSelection}
        >
            <ToolbarIcon icon="/icons/lucide/arrow-left.svg" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          type="button"
          active={selectionShape === "rect"}
          aria-pressed={selectionShape === "rect"}
          onClick={() => dispatch(createSetSelectionShapeCommand("rect"))}
        >
          <ToolbarIcon icon="/icons/lucide/square-mouse-pointer.svg" />
          {/* <ToolbarLabel>Rect</ToolbarLabel> */}
        </ToolbarButton>

        <ToolbarButton
          type="button"
          active={selectionShape === "circle"}
          aria-pressed={selectionShape === "circle"}
          onClick={() => dispatch(createSetSelectionShapeCommand("circle"))}
        >
          <ToolbarIcon icon="/icons/lucide/selection-circle.svg" />
        </ToolbarButton>

        <ToolbarButton
          type="button"
          active={selectionShape === "freehand"}
          aria-pressed={selectionShape === "freehand"}
          onClick={() => dispatch(createSetSelectionShapeCommand("freehand"))}
        >
          <ToolbarIcon icon="/icons/lucide/lasso-select.svg" />
          {/* <ToolbarLabel>Freehand</ToolbarLabel> */}
        </ToolbarButton>

        {/* <ToolbarDivider /> */}

        {/* <ToolbarButton
          type="button"
          onClick={handleNewSelection}
        >
          <ToolbarLabel>Clear selection</ToolbarLabel>
        </ToolbarButton> */}

        <ToolbarButton
          type="button"
          variant="secondary"
          labelled
          disabled={!canPaintSelection}
          onClick={handleNewSelection}
        >
          Select new
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          type="button"
          labelled
          disabled={!canPaintSelection}
          onClick={() => {
            if (!selectionBounds || !activeColor) {
              return;
            }

            dispatch(
              createPaintCellsCommand(
                activeColor.id,
                buildSelectionCandidateCells(selectionBounds),
              ),
            );
          }}
        >
          <ToolbarIcon icon="/icons/lucide/paint_bucket.svg" />
          <ToolbarLabel>Fill</ToolbarLabel>
        </ToolbarButton>

        <ToolbarButton
          type="button"
          labelled
          disabled={!canEraseSelection}
          onClick={() => {
            if (!selectionBounds) {
              return;
            }

            dispatch(
              createEraseCellsCommand(
                buildSelectionCandidateCells(selectionBounds),
              ),
            );
          }}
        >
          <ToolbarIcon icon="/icons/lucide/eraser.svg" />
          <ToolbarLabel>Erase</ToolbarLabel>
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          type="button"
          variant="primary"
          labelled
          onClick={handleExitSelection}
        >
          Done
        </ToolbarButton>

      </ToolbarGroup>
    </Toolbar>
  );
}
