import type { EditorCommandHandler } from "./types";
import type { SetPreviewModeCommand } from "../types";

export const setPreviewModeCommandHandler: EditorCommandHandler<SetPreviewModeCommand> =
  {
    canHandle(command): command is SetPreviewModeCommand {
      return command.kind === "ui.setPreviewMode";
    },
    handle(state, command) {
      return {
        nextSession: state.session,
        nextUi: {
          ...state.ui,
          preferences: {
            ...state.ui.preferences,
            previewMode: command.payload.visible,
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
