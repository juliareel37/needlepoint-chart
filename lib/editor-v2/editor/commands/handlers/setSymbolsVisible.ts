import type { EditorCommandHandler } from "./types";
import type { SetSymbolsVisibleCommand } from "../types";

export const setSymbolsVisibleCommandHandler: EditorCommandHandler<SetSymbolsVisibleCommand> =
  {
    canHandle(command): command is SetSymbolsVisibleCommand {
      return command.kind === "ui.setSymbolsVisible";
    },
    handle(state, command) {
      return {
        nextSession: state.session,
        nextUi: {
          ...state.ui,
          preferences: {
            ...state.ui.preferences,
            showSymbols: command.payload.visible,
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
