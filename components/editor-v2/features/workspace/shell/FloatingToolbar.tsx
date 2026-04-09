"use client";

import { useState } from "react";
import {
  Toolbar,
  ToolbarAnchor,
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup,
  ToolbarIcon,
  ToolbarLabel,
  ToolbarPopover,
  ToolbarSubtoolGroup,
  ToolbarSwatch,
} from "@/components/design-system";
import type {
  EditorStore,
  GridPoint,
  GridRect,
  PaletteColor,
  TraceDocument,
} from "@/lib/editor-v2/editor/store";
import {
  createClearSelectionCommand,
  createClearCanvasCommand,
  createEraseCellsCommand,
  createPaintCellsCommand,
  createRedoCommand,
  createSetActiveSidebarSectionCommand,
  createSetSidebarCollapsedCommand,
  createSetToolCommand,
  createUndoCommand,
  createUpdateTraceCommand,
} from "../workspaceCommands";
import styles from "./EditorV2Shell.module.css";

interface FloatingToolbarProps {
  activeColor: PaletteColor | null;
  activeTool: "paint" | "erase" | "lasso" | string;
  canRedo: boolean;
  canUndo: boolean;
  dispatch: EditorStore["dispatch"];
  hasPaintedCells: boolean;
  selectionBounds: GridRect | null;
  selectionCommitted: boolean;
  trace: TraceDocument | null;
}

export function FloatingToolbar({
  activeColor,
  activeTool,
  canRedo,
  canUndo,
  dispatch,
  hasPaintedCells,
  selectionBounds,
  selectionCommitted,
  trace,
}: FloatingToolbarProps) {
  const [drawOpen, setDrawOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  const activeSwatchColor = activeColor?.hex ?? "var(--neutral-400)";
  const canPaintSelection = Boolean(selectionCommitted && selectionBounds && activeColor);
  const canEraseSelection = Boolean(selectionCommitted && selectionBounds);
  const drawToolActive = activeTool === "paint" || activeTool === "erase";
  const drawTriggerActive = drawOpen || drawToolActive;

  function openSidebarSection(section: "color" | "trace") {
    exitSelectionFlow();
    dispatch(createSetActiveSidebarSectionCommand(section));
    dispatch(createSetSidebarCollapsedCommand(false));
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

  function exitSelectionFlow(): void {
    setSelectOpen(false);

    if (activeTool !== "lasso") {
      return;
    }

    if (selectionBounds) {
      dispatch(createClearSelectionCommand());
    }

    dispatch(createSetToolCommand("none"));
  }

  return (
    <Toolbar className={styles.floatingToolbar}>
      <ToolbarGroup>
        <ToolbarButton
          type="button"
          swatch
          aria-label="Open color panel"
          title="Open color panel"
          onClick={() => openSidebarSection("color")}
        >
          <ToolbarSwatch color={activeSwatchColor} />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup>
        <ToolbarAnchor>
          <ToolbarButton
            type="button"
            active={drawTriggerActive}
            aria-pressed={drawTriggerActive}
            onClick={() => {
              exitSelectionFlow();
              setDrawOpen((current) => !current);
              setImageOpen(false);
            }}
          >
            <ToolbarIcon icon="/icons/lucide/brush_thick.svg" />
            <ToolbarLabel>Draw</ToolbarLabel>
          </ToolbarButton>

          {drawOpen ? (
            <ToolbarPopover role="dialog" aria-label="Draw tools">
              <ToolbarSubtoolGroup>
                <ToolbarButton type="button" disabled>
                  <ToolbarIcon icon="/icons/lucide/ruler.svg" />
                  <ToolbarLabel>Size</ToolbarLabel>
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                  type="button"
                  active={activeTool === "paint"}
                  inertWhenActive
                  aria-pressed={activeTool === "paint"}
                  aria-label="Brush"
                  title="Brush"
                  onClick={() => {
                    dispatch(createSetToolCommand("paint"));
                    setDrawOpen(false);
                  }}
                >
                  <ToolbarIcon icon="/icons/lucide/brush_thin.svg" />
                </ToolbarButton>

                <ToolbarButton
                  type="button"
                  active={activeTool === "erase"}
                  inertWhenActive
                  aria-pressed={activeTool === "erase"}
                  aria-label="Erase"
                  title="Erase"
                  onClick={() => {
                    dispatch(createSetToolCommand("erase"));
                    setDrawOpen(false);
                  }}
                >
                  <ToolbarIcon icon="/icons/lucide/eraser.svg" />
                </ToolbarButton>

                <ToolbarButton type="button" disabled>
                  <ToolbarIcon icon="/icons/lucide/paint_bucket.svg" />
                  <ToolbarLabel>Fill</ToolbarLabel>
                </ToolbarButton>

                <ToolbarButton type="button" disabled>
                  <ToolbarIcon icon="/icons/lucide/flip-horizontal.svg" />
                  <ToolbarLabel>Mirror</ToolbarLabel>
                </ToolbarButton>
              </ToolbarSubtoolGroup>
            </ToolbarPopover>
          ) : null}
        </ToolbarAnchor>
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup>
        <ToolbarAnchor>
          <ToolbarButton
            type="button"
            active={activeTool === "lasso"}
            aria-pressed={activeTool === "lasso"}
            onClick={() => {
              setDrawOpen(false);
              setImageOpen(false);

                if (activeTool === "lasso") {
                  if (selectOpen) {
                    if (selectionBounds) {
                      dispatch(createClearSelectionCommand());
                    } else {
                      dispatch(createSetToolCommand("none"));
                    }
                    setSelectOpen(false);
                    return;
                  }

                setSelectOpen(true);
                return;
              }

              dispatch(createSetToolCommand("lasso"));
              setSelectOpen(true);
            }}
          >
            <ToolbarIcon icon="/icons/lucide/vector_square.svg" />
            <ToolbarLabel>Select</ToolbarLabel>
          </ToolbarButton>

          {activeTool === "lasso" && selectOpen ? (
            <ToolbarPopover role="dialog" aria-label="Selection tools">
              <ToolbarSubtoolGroup>
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
                <ToolbarButton
                  type="button"
                  primary
                  onClick={() => {
                    if (selectionCommitted && selectionBounds) {
                      dispatch(createClearSelectionCommand());
                    } else {
                      dispatch(createSetToolCommand("none"));
                    }
                    setSelectOpen(false);
                  }}
                >
                  <ToolbarLabel>Done</ToolbarLabel>
                </ToolbarButton>
              </ToolbarSubtoolGroup>
            </ToolbarPopover>
          ) : null}
        </ToolbarAnchor>
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup>
        <ToolbarAnchor>
          <ToolbarButton
            type="button"
            active={imageOpen}
            aria-pressed={imageOpen}
            onClick={() => {
              exitSelectionFlow();
              setImageOpen((current) => !current);
              setDrawOpen(false);
            }}
          >
            <ToolbarIcon icon="/icons/lucide/image.svg" />
            <ToolbarLabel>Image</ToolbarLabel>
          </ToolbarButton>

          {imageOpen ? (
            <ToolbarPopover
              subtoolbar
              role="dialog"
              aria-label="Image tools"
            >
              <ToolbarButton
                type="button"
                disabled={!trace}
                onClick={() => {
                  if (!trace) return;

                  dispatch(
                    createUpdateTraceCommand({ visible: !trace.visible }),
                  );
                }}
              >
                <ToolbarIcon
                  icon={
                    trace?.visible ? "/icons/eye.svg" : "/icons/eye_off.svg"
                  }
                />
                <ToolbarLabel>
                  {trace ? (trace.visible ? "Visible" : "Hidden") : "No trace"}
                </ToolbarLabel>
              </ToolbarButton>

              <ToolbarDivider />

              <ToolbarButton
                type="button"
                disabled={!trace}
                onClick={() => {
                  openSidebarSection("trace");
                  setImageOpen(false);
                }}
              >
                <ToolbarIcon icon="/icons/lucide/blend.svg" />
                <ToolbarLabel>Opacity</ToolbarLabel>
              </ToolbarButton>

              <ToolbarButton
                type="button"
                disabled={!trace}
                onClick={() => {
                  openSidebarSection("trace");
                  setImageOpen(false);
                }}
              >
                <ToolbarIcon icon="/icons/lucide/vector_square.svg" />
                <ToolbarLabel>Reposition</ToolbarLabel>
              </ToolbarButton>

              <ToolbarButton type="button" disabled>
                <ToolbarIcon icon="/icons/lucide/crop.svg" />
                <ToolbarLabel>Crop</ToolbarLabel>
              </ToolbarButton>
            </ToolbarPopover>
          ) : null}
        </ToolbarAnchor>
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup>
        <ToolbarButton
          type="button"
          disabled={!canUndo}
          aria-label="Undo"
          title="Undo"
          className={styles.historyButton}
          onClick={() => {
            exitSelectionFlow();
            dispatch(createUndoCommand());
          }}
        >
          <ToolbarIcon icon="/icons/lucide/undo.svg" />
        </ToolbarButton>
        <ToolbarButton
          type="button"
          disabled={!canRedo}
          aria-label="Redo"
          title="Redo"
          className={styles.historyButton}
          onClick={() => {
            exitSelectionFlow();
            dispatch(createRedoCommand());
          }}
        >
          <ToolbarIcon icon="/icons/lucide/redo.svg" />
        </ToolbarButton>

        <ToolbarDivider className={styles.historyDivider} />

        <ToolbarButton
          type="button"
          disabled={!hasPaintedCells}
          aria-label="Clear canvas"
          title="Clear canvas"
          onClick={() => {
            exitSelectionFlow();
            if (!hasPaintedCells) {
              return;
            }

            if (!window.confirm("Clear the entire canvas?")) {
              return;
            }

            dispatch(createClearCanvasCommand());
          }}
        >
          <ToolbarIcon icon="/icons/lucide/trash2.svg" />
        </ToolbarButton>
      </ToolbarGroup>
    </Toolbar>
  );
}
