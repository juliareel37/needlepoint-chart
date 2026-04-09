import type { EditorCommandHandler } from "./types";
import type { SetRulerVisibleCommand } from "../types";

export const setRulerVisibleCommandHandler: EditorCommandHandler<SetRulerVisibleCommand> =
  {
    canHandle(command): command is SetRulerVisibleCommand {
      return command.kind === "ui.setRulerVisible";
    },
    handle(state, command) {
      return {
        nextSession: state.session,
        nextUi: {
          ...state.ui,
          preferences: {
            ...state.ui.preferences,
            showRuler: command.payload.visible,
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
