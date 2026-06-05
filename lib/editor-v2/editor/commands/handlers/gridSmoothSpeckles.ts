import type { ReplaceGridCellsPatch } from "../../store/patches";
import type { SmoothSpecklesCommand } from "../types";
import { buildDirtySession } from "./gridMutationUtils";
import {
  buildAppendOnlyInverseSymbolPatches,
  buildAssignSymbolsPatch,
} from "./symbolAssignments";
import type { EditorCommandHandler } from "./types";

export const gridSmoothSpecklesCommandHandler: EditorCommandHandler<SmoothSpecklesCommand> = {
  canHandle(command): command is SmoothSpecklesCommand {
    return command.kind === "grid.smoothSpeckles";
  },
  handle(state, command) {
    const gridCellCount = state.document.grid.cells.length;
    const seenIndexes = new Set<number>();
    const replacements = command.payload.replacements.filter(({ index, toColorId }) => {
      if (
        seenIndexes.has(index) ||
        index < 0 ||
        index >= gridCellCount ||
        !state.document.palette.colorsById[toColorId] ||
        state.document.grid.cells[index] === toColorId
      ) {
        return false;
      }

      seenIndexes.add(index);
      return true;
    });
    const cellPatch: ReplaceGridCellsPatch | null =
      replacements.length > 0
        ? {
            type: "grid.replaceCells",
            cells: replacements.map(({ index, toColorId }) => ({
              index,
              value: toColorId,
            })),
          }
        : null;
    const inverseCellPatch: ReplaceGridCellsPatch | null =
      replacements.length > 0
        ? {
            type: "grid.replaceCells",
            cells: replacements.map(({ index }) => ({
              index,
              value: state.document.grid.cells[index],
            })),
          }
        : null;
    const replacementColorIds = Array.from(
      new Set(replacements.map(({ toColorId }) => toColorId)),
    );
    const symbolPatches = buildAssignSymbolsPatch(state, replacementColorIds);

    return {
      nextSession: replacements.length > 0 ? buildDirtySession(state) : state.session,
      nextUi: state.ui,
      patches: [
        ...(cellPatch ? [cellPatch] : []),
        ...symbolPatches,
      ],
      inversePatches: [
        ...(inverseCellPatch ? [inverseCellPatch] : []),
        ...buildAppendOnlyInverseSymbolPatches(symbolPatches),
      ],
      effects: [],
      event: {
        type: "command",
        commandId: command.id,
        label: command.meta.history.mode === "skip" ? undefined : "Smooth Speckles",
      },
    };
  },
};
