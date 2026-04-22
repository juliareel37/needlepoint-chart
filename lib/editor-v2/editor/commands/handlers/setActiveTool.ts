import type { EditorCommandHandler } from "./types";
import type { SetActiveToolCommand } from "../types";
import { buildCancelMirrorExecution } from "./mirror";

export const setActiveToolCommandHandler: EditorCommandHandler<SetActiveToolCommand> = {
  canHandle(command): command is SetActiveToolCommand {
    return command.kind === "tool.setActive";
  },
  handle(state, command) {
    const nextTool = command.payload.tool === "none" ? "pan" : command.payload.tool;
    const currentTool = state.session.activeTool.tool;
    const hasCommittedSelection = Boolean(
      state.session.selection.rect && !state.session.selection.preview,
    );
    const normalizedCurrentTool =
      currentTool === "mirror" || currentTool === "eyedropper"
        ? "pan"
        : currentTool;
    const shouldPreserveSelectionForSelectionActionTool =
      hasCommittedSelection &&
      ((currentTool === "lasso" && (nextTool === "fill" || nextTool === "erase")) ||
        ((currentTool === "fill" || currentTool === "erase") && nextTool === "lasso"));
    const nextSelection =
      (currentTool === "lasso" || currentTool === "fill" || currentTool === "erase") &&
      nextTool !== currentTool &&
      !shouldPreserveSelectionForSelectionActionTool
        ? {
            mode: "none" as const,
            shape: state.session.selection.shape,
            rect: null,
            lassoPoints: [],
            mirrorAxis: null,
            preview: null,
          }
        : state.session.selection;

    if (
      currentTool === "mirror" &&
      nextTool !== "mirror" &&
      state.session.mirrorInteraction.session
    ) {
      const execution = buildCancelMirrorExecution(state, command.id, nextTool);
      const eyedropperReturnTool =
        nextTool === "eyedropper"
          ? state.session.eyedropperReturnTool ?? normalizedCurrentTool
          : null;

      return {
        ...execution,
        nextSession: {
          ...execution.nextSession,
          activeTool: {
            ...execution.nextSession.activeTool,
            brushSize:
              command.payload.brushSize ?? execution.nextSession.activeTool.brushSize,
            colorId:
              command.payload.colorId === undefined
                ? execution.nextSession.activeTool.colorId
                : command.payload.colorId,
          },
          eyedropperReturnTool,
        },
      };
    }

    const eyedropperReturnTool =
      nextTool === "eyedropper"
        ? state.session.eyedropperReturnTool ?? normalizedCurrentTool
        : null;

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
        selection: nextSelection,
        eyedropperReturnTool,
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
