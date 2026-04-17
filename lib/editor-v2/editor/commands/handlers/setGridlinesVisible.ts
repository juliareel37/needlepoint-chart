import type { EditorCommandHandler } from "./types";
import type { SetGridlinesVisibleCommand } from "../types";

export const setGridlinesVisibleCommandHandler: EditorCommandHandler<SetGridlinesVisibleCommand> =
  {
    canHandle(command): command is SetGridlinesVisibleCommand {
      return command.kind === "ui.setGridlinesVisible";
    },
    handle(state, command) {
      return {
        nextSession: state.session,
        nextUi: {
          ...state.ui,
          preferences: {
            ...state.ui.preferences,
            showGridlines: command.payload.visible,
          },
        },
        patches: [],
        inversePatches: [],
        effects: [],
        event: {
          type: "ui",
          commandId: command.id,
        },
      };
    },
  };
