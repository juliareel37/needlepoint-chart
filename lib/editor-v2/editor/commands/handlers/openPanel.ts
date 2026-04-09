import type { PanelUiState } from "../../store/state";
import type { EditorCommandHandler } from "./types";
import type { OpenPanelCommand } from "../types";

export const openPanelCommandHandler: EditorCommandHandler<OpenPanelCommand> = {
  canHandle(command): command is OpenPanelCommand {
    return command.kind === "ui.openPanel";
  },
  handle(state, command) {
    return {
      nextSession: state.session,
      nextUi: {
        ...state.ui,
        panels: openPanel(state.ui.panels, command.payload.panel),
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

function openPanel(
  panels: PanelUiState,
  panel: OpenPanelCommand["payload"]["panel"],
): PanelUiState {
  return {
    ...panels,
    [panel]: true,
  };
}
