"use client";

import { useEffect, useRef, useState } from "react";
import {
  MenuChevronIcon,
  Toolbar,
  ToolbarAnchor,
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup,
  ToolbarIcon,
  ToolbarLabel,
  ToolbarPopover,
} from "@/components/design-system";
import type { EditorStore, GridPoint, GridRect, PaletteColor, SelectionState } from "@/lib/editor-v2/editor/store";
import {
  createClearSelectionCommand,
  createEraseCellsCommand,
  createPaintCellsCommand,
  createSetSelectionShapeCommand,
  createSetToolCommand,
} from "../workspaceCommands";
import styles from "./EditorV2Shell.module.css";

const selectionShapeOptions: Array<{
  shape: SelectionState["shape"];
  label: string;
  icon: string;
}> = [
  {
    shape: "rect",
    label: "Rectangle",
    icon: "/icons/lucide/square-mouse-pointer.svg",
  },
  {
    shape: "circle",
    label: "Circle",
    icon: "/icons/lucide/selection-circle.svg",
  },
  {
    shape: "freehand",
    label: "Lasso",
    icon: "/icons/lucide/lasso-select.svg",
  },
];

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
  const [selectionShapeMenuOpen, setSelectionShapeMenuOpen] = useState(false);
  const selectionShapeAnchorRef = useRef<HTMLDivElement | null>(null);
  const canPaintSelection = Boolean(selectionCommitted && selectionBounds && activeColor);
  const canEraseSelection = Boolean(selectionCommitted && selectionBounds);
  const activeSelectionShape =
    selectionShapeOptions.find((option) => option.shape === selectionShape) ??
    selectionShapeOptions[0];
  const instruction = selectionCommitted
    ? "Selection ready. Fill, erase, or start a new selection."
    : selectionShape === "rect"
      ? "Drag to select canvas area."
      : selectionShape === "circle"
        ? "Drag to select a circular area."
      : "Drag across the canvas to create a freehand selection.";

  useEffect(() => {
    if (!selectionShapeMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (selectionShapeAnchorRef.current?.contains(target)) {
        return;
      }

      setSelectionShapeMenuOpen(false);
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [selectionShapeMenuOpen]);

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
    setSelectionShapeMenuOpen(false);
    dispatch(createClearSelectionCommand());
    dispatch(createSetToolCommand("lasso"));
  }

  function handleExitSelection() {
    setSelectionShapeMenuOpen(false);
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

        <ToolbarAnchor ref={selectionShapeAnchorRef}>
          <ToolbarButton
            type="button"
            labelled
            active={selectionShapeMenuOpen}
            aria-expanded={selectionShapeMenuOpen}
            aria-haspopup="menu"
            onClick={() => setSelectionShapeMenuOpen((open) => !open)}
            className={styles.selectionShapeTrigger}
          >
            <ToolbarIcon icon={activeSelectionShape.icon} />
            <ToolbarLabel>{activeSelectionShape.label}</ToolbarLabel>
            <MenuChevronIcon open={selectionShapeMenuOpen} />
          </ToolbarButton>

          {selectionShapeMenuOpen ? (
            <ToolbarPopover
              role="menu"
              aria-label="Selection type"
              className={styles.selectionShapeMenu}
            >
              {selectionShapeOptions.map((option) => (
                <ToolbarButton
                  key={option.shape}
                  type="button"
                  labelled
                  role="menuitemradio"
                  active={selectionShape === option.shape}
                  aria-checked={selectionShape === option.shape}
                  onClick={() => {
                    dispatch(createSetSelectionShapeCommand(option.shape));
                    setSelectionShapeMenuOpen(false);
                  }}
                  className={styles.selectionShapeMenuItem}
                >
                  <ToolbarIcon icon={option.icon} />
                  <ToolbarLabel>{option.label}</ToolbarLabel>
                </ToolbarButton>
              ))}
            </ToolbarPopover>
          ) : null}
        </ToolbarAnchor>

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
