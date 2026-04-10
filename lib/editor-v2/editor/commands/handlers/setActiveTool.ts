import type { EditorCommandHandler } from "./types";
import type { SetActiveToolCommand } from "../types";

export const setActiveToolCommandHandler: EditorCommandHandler<SetActiveToolCommand> = {
  canHandle(command): command is SetActiveToolCommand {
    return command.kind === "tool.setActive";
  },
  handle(state, command) {
    const nextTool = command.payload.tool === "none" ? "pan" : command.payload.tool;

    return {
      nextSession: {
        ...state.session,
        activeTool: {
          ...state.session.activeTool,
          tool: nextTool,
          brushSize:
            command.payload.brushSize ?? state.session.activeTool.brushSize,
          colorId:
            command.payload.colorId === undefined
              ? state.session.activeTool.colorId
              : command.payload.colorId,
        },
      },
      nextUi: state.ui,
      patches: [],
      inversePatches: [],
      effects: [],
      event: {
        type: "session",
        commandId: command.id,
      },
    };
  },
};
