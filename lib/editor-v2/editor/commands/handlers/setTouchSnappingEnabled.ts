import type { EditorCommandHandler } from "./types";
import type { SetTouchSnappingEnabledCommand } from "../types";

export const setTouchSnappingEnabledCommandHandler: EditorCommandHandler<SetTouchSnappingEnabledCommand> =
  {
    canHandle(command): command is SetTouchSnappingEnabledCommand {
      return command.kind === "ui.setTouchSnappingEnabled";
    },
    handle(state, command) {
      if (
        state.document.canvasPreferences.touchSnappingEnabled ===
        command.payload.enabled
      ) {
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
            touchSnappingEnabled: command.payload.enabled,
          },
        },
        patches: [
          {
            type: "canvasPreferences.update",
            changes: {
              touchSnappingEnabled: command.payload.enabled,
            },
          },
        ],
        inversePatches: [
          {
            type: "canvasPreferences.update",
            changes: {
              touchSnappingEnabled:
                state.document.canvasPreferences.touchSnappingEnabled,
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
