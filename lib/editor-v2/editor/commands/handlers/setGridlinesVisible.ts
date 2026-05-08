import type { EditorCommandHandler } from "./types";
import type { SetGridlinesVisibleCommand } from "../types";

export const setGridlinesVisibleCommandHandler: EditorCommandHandler<SetGridlinesVisibleCommand> =
  {
    canHandle(command): command is SetGridlinesVisibleCommand {
      return command.kind === "ui.setGridlinesVisible";
    },
    handle(state, command) {
      if (state.document.canvasPreferences.showGridlines === command.payload.visible) {
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
            showGridlines: command.payload.visible,
          },
        },
        patches: [
          {
            type: "canvasPreferences.update",
            changes: {
              showGridlines: command.payload.visible,
            },
          },
        ],
        inversePatches: [
          {
            type: "canvasPreferences.update",
            changes: {
              showGridlines: state.document.canvasPreferences.showGridlines,
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
