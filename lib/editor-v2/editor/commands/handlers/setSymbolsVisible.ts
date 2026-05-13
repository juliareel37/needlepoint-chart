import type { EditorCommandHandler } from "./types";
import type { SetSymbolsVisibleCommand } from "../types";

export const setSymbolsVisibleCommandHandler: EditorCommandHandler<SetSymbolsVisibleCommand> =
  {
    canHandle(command): command is SetSymbolsVisibleCommand {
      return command.kind === "ui.setSymbolsVisible";
    },
    handle(state, command) {
      if (state.document.canvasPreferences.showSymbols === command.payload.visible) {
        return {
          nextSession: state.session,
          nextUi: state.ui,
          patches: [],
          inversePatches: [],
          effects: [],
          event: {
            type: "ui",
            commandId: command.id,
          },
        };
      }

      return {
        nextSession: {
          ...state.session,
          persistence: {
            ...state.session.persistence,
            dirty: true,
          },
        },
        nextUi: {
          ...state.ui,
          preferences: {
            ...state.ui.preferences,
            showSymbols: command.payload.visible,
          },
        },
        patches: [
          {
            type: "canvasPreferences.update",
            changes: {
              showSymbols: command.payload.visible,
            },
          },
        ],
        inversePatches: [
          {
            type: "canvasPreferences.update",
            changes: {
              showSymbols: state.document.canvasPreferences.showSymbols,
            },
          },
        ],
        effects: [],
        event: {
          type: "ui",
          commandId: command.id,
        },
      };
    },
  };
