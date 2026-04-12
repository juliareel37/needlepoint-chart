import type { EditorCommandHandler } from "./types";
import type { PaintCellsCommand } from "../types";
import {
  buildDirtySession,
  buildInverseReplaceCellsPatch,
  buildReplaceCellsPatch,
  filterCellsWithinSelection,
  filterValidCells,
} from "./gridMutationUtils";
import {
  buildAppendOnlyInverseSymbolPatches,
  buildAssignSymbolsPatch,
} from "./symbolAssignments";

export const gridPaintCommandHandler: EditorCommandHandler<PaintCellsCommand> = {
  canHandle(command): command is PaintCellsCommand {
    return command.kind === "grid.paint";
  },
  handle(state, command) {
    const { colorId, cells } = command.payload;
    const validCells = filterValidCells(cells, state);
    const paintableCells = filterCellsWithinSelection(validCells, state);
    const cellPatches = buildReplaceCellsPatch(state, paintableCells, colorId);
    const symbolPatches = buildAssignSymbolsPatch(
      state,
      cellPatches.length > 0 ? [colorId] : [],
    );
    const patches = [...cellPatches, ...symbolPatches];
    const inversePatches = [
      ...buildInverseReplaceCellsPatch(state, paintableCells),
      ...buildAppendOnlyInverseSymbolPatches(symbolPatches),
    ];

    return {
      nextSession: buildDirtySession(state),
      nextUi: state.ui,
      patches,
      inversePatches,
      effects: [],
      event: {
        type: "command",
        commandId: command.id,
        label: command.meta.history.mode === "skip" ? undefined : "Paint",
      },
    };
  },
};
