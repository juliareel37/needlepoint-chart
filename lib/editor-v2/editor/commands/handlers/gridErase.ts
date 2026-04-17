import type { EditorCommandHandler } from "./types";
import type { EraseCellsCommand } from "../types";
import {
  buildDirtySession,
  buildInverseReplaceCellsPatch,
  buildReplaceCellsPatch,
  filterCellsWithinSelection,
  filterValidCells,
} from "./gridMutationUtils";

export const gridEraseCommandHandler: EditorCommandHandler<EraseCellsCommand> = {
  canHandle(command): command is EraseCellsCommand {
    return command.kind === "grid.erase";
  },
  handle(state, command) {
    const validCells = filterValidCells(command.payload.cells, state);
    const erasableCells = filterCellsWithinSelection(validCells, state);
    const patches = buildReplaceCellsPatch(state, erasableCells, null);
    const inversePatches = buildInverseReplaceCellsPatch(state, erasableCells);

    return {
      nextSession: buildDirtySession(state),
      nextUi: state.ui,
      patches,
      inversePatches,
      effects: [],
      event: {
        type: "command",
        commandId: command.id,
        label: command.meta.history.mode === "skip" ? undefined : "Erase",
      },
    };
  },
};
