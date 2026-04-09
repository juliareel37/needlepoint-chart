import type { EditorCommandHandler } from "./types";
import type { ClearCanvasCommand } from "../types";
import {
  buildDirtySession,
  buildInverseReplaceCellsPatch,
  buildReplaceCellsPatch,
  getFilledGridPoints,
} from "./gridMutationUtils";

export const gridClearCommandHandler: EditorCommandHandler<ClearCanvasCommand> = {
  canHandle(command): command is ClearCanvasCommand {
    return command.kind === "grid.clear";
  },
  handle(state, command) {
    const filledCells = getFilledGridPoints(state);
    const patches = buildReplaceCellsPatch(state, filledCells, null);
    const inversePatches = buildInverseReplaceCellsPatch(state, filledCells);

    return {
      nextSession: buildDirtySession(state),
      nextUi: state.ui,
      patches,
      inversePatches,
      effects: [],
      event: {
        type: "command",
        commandId: command.id,
        label: command.meta.history.mode === "skip" ? undefined : "Clear Canvas",
      },
    };
  },
};
