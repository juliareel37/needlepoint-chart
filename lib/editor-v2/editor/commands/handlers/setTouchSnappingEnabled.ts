import type { EditorCommandHandler } from "./types";
import type { SetTouchSnappingEnabledCommand } from "../types";

export const setTouchSnappingEnabledCommandHandler: EditorCommandHandler<SetTouchSnappingEnabledCommand> =
  {
    canHandle(command): command is SetTouchSnappingEnabledCommand {
      return command.kind === "ui.setTouchSnappingEnabled";
    },
    handle(state, command) {
      return {
        nextSession: state.session,
        nextUi: {
          ...state.ui,
          preferences: {
            ...state.ui.preferences,
            touchSnappingEnabled: command.payload.enabled,
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
