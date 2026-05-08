import type { EditorCommandHandler } from "./types";
import type { SetRulerVisibleCommand } from "../types";

export const setRulerVisibleCommandHandler: EditorCommandHandler<SetRulerVisibleCommand> =
  {
    canHandle(command): command is SetRulerVisibleCommand {
      return command.kind === "ui.setRulerVisible";
    },
    handle(state, command) {
      if (state.document.canvasPreferences.showRuler === command.payload.visible) {
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
            showRuler: command.payload.visible,
          },
        },
        patches: [
          {
            type: "canvasPreferences.update",
            changes: {
              showRuler: command.payload.visible,
            },
          },
        ],
        inversePatches: [
          {
            type: "canvasPreferences.update",
            changes: {
              showRuler: state.document.canvasPreferences.showRuler,
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
