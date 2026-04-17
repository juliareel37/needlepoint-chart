import type { ReplaceGridCellsPatch } from "../../store/patches";
import { findClosestColorIdFromCandidates } from "../../color-utils";
import type { DeleteUsedColorsCommand } from "../types";
import { getUsedColors } from "../../selectors";
import { buildDirtySession } from "./gridMutationUtils";
import type { EditorCommandHandler } from "./types";
import {
  buildAppendOnlyInverseSymbolPatches,
  buildAssignSymbolsPatch,
} from "./symbolAssignments";

export const paletteDeleteUsedColorsCommandHandler: EditorCommandHandler<DeleteUsedColorsCommand> = {
  canHandle(command): command is DeleteUsedColorsCommand {
    return command.kind === "palette.deleteUsedColors";
  },
  handle(state, command) {
    const selectedColorIds = Array.from(new Set(command.payload.colorIds));
    const selectedColorIdSet = new Set(selectedColorIds);
    const usedColors = getUsedColors(state);
    const remainingUsedColorIds = usedColors
      .map((entry) => entry.colorId)
      .filter((colorId) => !selectedColorIdSet.has(colorId));

    if (selectedColorIds.length === 0 || remainingUsedColorIds.length === 0) {
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

    const replacementByColorId = new Map<string, string>();

    for (const colorId of selectedColorIds) {
      const replacementColorId = findClosestColorIdFromCandidates(
        state.document.palette.colorsById,
        remainingUsedColorIds,
        colorId,
      );

      if (replacementColorId) {
        replacementByColorId.set(colorId, replacementColorId);
      }
    }

    const replacedCells = state.document.grid.cells.flatMap((cell, index) => {
      if (!cell) {
        return [];
      }

      const replacementColorId = replacementByColorId.get(cell);
      return replacementColorId ? [{ index, value: replacementColorId }] : [];
    });

    const patches: ReplaceGridCellsPatch[] = replacedCells.length > 0
      ? [{ type: "grid.replaceCells", cells: replacedCells }]
      : [];
    const symbolTargets = Array.from(new Set(replacedCells.map((cell) => cell.value)))
      .filter((colorId) => !state.document.palette.symbolAssignments[colorId]);
    const symbolPatches =
      replacedCells.length > 0 ? buildAssignSymbolsPatch(state, symbolTargets) : [];
    const inversePatches: ReplaceGridCellsPatch[] = replacedCells.length > 0
      ? [
          {
            type: "grid.replaceCells",
            cells: replacedCells.map(({ index, value }) => ({
              index,
              value: state.document.grid.cells[index] ?? value,
            })),
          },
        ]
      : [];

    return {
      nextSession: replacedCells.length > 0 ? buildDirtySession(state) : state.session,
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
        label: command.meta.history.mode === "skip" ? undefined : "Delete Colors",
      },
    };
  },
};
