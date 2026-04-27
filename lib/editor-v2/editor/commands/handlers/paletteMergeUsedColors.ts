import type { ReplaceGridCellsPatch } from "../../store/patches";
import { isCellInSelection } from "../../selection/lassoGeometry";
import type { MergeUsedColorsCommand } from "../types";
import { buildDirtySession } from "./gridMutationUtils";
import type { EditorCommandHandler } from "./types";
import {
  buildAppendOnlyInverseSymbolPatches,
  buildAssignSymbolsPatch,
} from "./symbolAssignments";

export const paletteMergeUsedColorsCommandHandler: EditorCommandHandler<MergeUsedColorsCommand> = {
  canHandle(command): command is MergeUsedColorsCommand {
    return command.kind === "palette.mergeUsedColors";
  },
  handle(state, command) {
    const { toColorId } = command.payload;
    const fromColorIds = Array.from(new Set(command.payload.fromColorIds))
      .filter((colorId) => colorId !== toColorId);
    const toColor = state.document.palette.colorsById[toColorId];

    if (!toColor || fromColorIds.length === 0) {
      return {
        nextSession: state.session,
        nextUi: state.ui,
        patches: [],
        inversePatches: [],
        effects: [],
        event: {
          type: "command",
          commandId: command.id,
          label: undefined,
        },
      };
    }

    const fromColorIdSet = new Set(fromColorIds);
    const gridWidth = state.document.grid.width;
    const selectionActive =
      state.session.selection.mode !== "none" && state.session.selection.rect !== null;
    const mergedCells = state.document.grid.cells.flatMap((cell, index) => {
      if (!cell || !fromColorIdSet.has(cell)) {
        return [];
      }

      if (
        selectionActive &&
        !isCellInSelection(state, {
          x: index % gridWidth,
          y: Math.floor(index / gridWidth),
        })
      ) {
        return [];
      }

      return [{ index, value: toColorId }];
    });
    const patches: ReplaceGridCellsPatch[] = mergedCells.length > 0
      ? [{ type: "grid.replaceCells", cells: mergedCells }]
      : [];
    const symbolPatches =
      mergedCells.length > 0 &&
      !state.document.palette.symbolAssignments[toColorId]
        ? buildAssignSymbolsPatch(state, [toColorId])
        : [];
    const inversePatches: ReplaceGridCellsPatch[] = mergedCells.length > 0
      ? [
          {
            type: "grid.replaceCells",
            cells: mergedCells.map(({ index }) => ({
              index,
              value: state.document.grid.cells[index],
            })),
          },
        ]
      : [];

    return {
      nextSession: mergedCells.length > 0 ? buildDirtySession(state) : state.session,
      nextUi: state.ui,
      patches: [...patches, ...symbolPatches],
      inversePatches: [
        ...inversePatches,
        ...buildAppendOnlyInverseSymbolPatches(symbolPatches),
      ],
      effects: [],
      event: {
        type: "command",
        commandId: command.id,
        label: command.meta.history.mode === "skip" ? undefined : "Merge Colors",
      },
    };
  },
};
