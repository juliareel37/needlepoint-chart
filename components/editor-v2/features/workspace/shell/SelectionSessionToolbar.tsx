"use client";

import { Button, Toolbar, ToolbarButton, ToolbarDivider, ToolbarGroup, ToolbarIcon, ToolbarLabel } from "@/components/design-system";
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
        {/* <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "nowrap",
            padding: "6px 8px",
          }}
        >
          <ToolbarLabel>{instruction}</ToolbarLabel>
        </div>

        <ToolbarDivider /> */}
          <ToolbarButton
            type="button"
            onClick={handleExitSelection}
          >
          <ToolbarIcon icon="/icons/lucide/arrow-left.svg" />
          </ToolbarButton>
          
        <ToolbarDivider />

        <ToolbarButton
          type="button"
          active={selectionShape === "freehand"}
          aria-pressed={selectionShape === "freehand"}
          onClick={() => dispatch(createSetSelectionShapeCommand("freehand"))}
        >
          <ToolbarIcon icon="/icons/lucide/lasso-select.svg" />
          {/* <ToolbarLabel>Freehand</ToolbarLabel> */}
        </ToolbarButton>

        <ToolbarButton
          type="button"
          active={selectionShape === "rect"}
          aria-pressed={selectionShape === "rect"}
          onClick={() => dispatch(createSetSelectionShapeCommand("rect"))}
        >
          <ToolbarIcon icon="/icons/lucide/square-mouse-pointer.svg" />
          {/* <ToolbarLabel>Rect</ToolbarLabel> */}
        </ToolbarButton>

        {/* <ToolbarDivider /> */}

        {/* <ToolbarButton
          type="button"
          onClick={handleNewSelection}
        >
          <ToolbarLabel>Clear selection</ToolbarLabel>
        </ToolbarButton> */}

        <Button
          type="button"
          variant="ghost"
          disabled={!canPaintSelection}
          onClick={handleNewSelection}
        >
          Clear
        </Button>

        <ToolbarDivider />

        <ToolbarButton
          type="button"
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

        <Button
          type="button"
          variant="primary"
          onClick={handleExitSelection}
        >
          Done
        </Button>

        {/* <ToolbarButton
          type="button"
          aria-label="Exit selection"
          title="Exit selection"
          onClick={handleExitSelection}
        >
          <ToolbarIcon icon="/icons/lucide/x.svg" />
        </ToolbarButton> */}

      </ToolbarGroup>
    </Toolbar>
  );
}
