import type { EditorCommandHandler } from "./types";
import type {
  SetActiveSidebarSectionCommand,
  SetSidebarCollapsedCommand,
} from "../types";

export const setSidebarCollapsedCommandHandler: EditorCommandHandler<SetSidebarCollapsedCommand> =
  {
    canHandle(command): command is SetSidebarCollapsedCommand {
      return command.kind === "ui.setSidebarCollapsed";
    },
    handle(state, command) {
      return {
        nextSession: state.session,
        nextUi: {
          ...state.ui,
          shell: {
            ...state.ui.shell,
            sidebarCollapsed: command.payload.collapsed,
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

export const setActiveSidebarSectionCommandHandler: EditorCommandHandler<SetActiveSidebarSectionCommand> =
  {
    canHandle(command): command is SetActiveSidebarSectionCommand {
      return command.kind === "ui.setActiveSidebarSection";
    },
    handle(state, command) {
      return {
        nextSession: state.session,
        nextUi: {
          ...state.ui,
          shell: {
            ...state.ui.shell,
            activeSidebarSection: command.payload.section,
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
