import type { EditorCommandHandler } from "./types";
import type { SetActiveToolCommand } from "../types";
import { buildCancelMirrorExecution } from "./mirror";
import type { ActiveTool, ActiveToolState } from "../../store/state";

function getStoredBrushSizeForTool(activeTool: ActiveToolState, tool: ActiveTool): number {
  if (tool === "paint") {
    return activeTool.paintBrushSize;
  }

  if (tool === "erase") {
    return activeTool.eraseBrushSize;
  }

  return activeTool.brushSize;
}

function getNextActiveToolState(
  activeTool: ActiveToolState,
  nextTool: ActiveTool,
  command: SetActiveToolCommand,
): ActiveToolState {
  const nextPaintBrushSize =
    nextTool === "paint" && command.payload.brushSize !== undefined
      ? command.payload.brushSize
      : activeTool.paintBrushSize;
  const nextEraseBrushSize =
    nextTool === "erase" && command.payload.brushSize !== undefined
      ? command.payload.brushSize
      : activeTool.eraseBrushSize;
  const nextBrushSize =
    command.payload.brushSize !== undefined
      ? command.payload.brushSize
      : getStoredBrushSizeForTool(
          {
            ...activeTool,
            paintBrushSize: nextPaintBrushSize,
            eraseBrushSize: nextEraseBrushSize,
          },
          nextTool,
        );

  return {
    ...activeTool,
    tool: nextTool,
    brushSize: nextBrushSize,
    paintBrushSize: nextPaintBrushSize,
    eraseBrushSize: nextEraseBrushSize,
    colorId:
      command.payload.colorId === undefined
        ? activeTool.colorId
        : command.payload.colorId,
  };
}

export const setActiveToolCommandHandler: EditorCommandHandler<SetActiveToolCommand> = {
  canHandle(command): command is SetActiveToolCommand {
    return command.kind === "tool.setActive";
  },
  handle(state, command) {
    const nextTool = command.payload.tool === "none" ? "pan" : command.payload.tool;
    const currentTool = state.session.activeTool.tool;
    const hasSelection = state.session.selection.mode !== "none";
    const normalizedCurrentTool =
      currentTool === "mirror" || currentTool === "eyedropper"
        ? "pan"
        : currentTool;
    const selectionActionTools = new Set<ActiveTool>([
      "lasso",
      "paint",
      "erase",
      "fill",
      "eyedropper",
    ]);
    const shouldPreserveSelectionForSelectionActionTool =
      hasSelection &&
      selectionActionTools.has(currentTool) &&
      selectionActionTools.has(nextTool);
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
    const shouldClearMirrorSession =
      Boolean(state.session.mirrorInteraction.session) &&
      (nextTool !== "lasso" || nextSelection.mode === "none");

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
          activeTool: getNextActiveToolState(
            execution.nextSession.activeTool,
            nextTool,
            command,
          ),
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
        activeTool: getNextActiveToolState(state.session.activeTool, nextTool, command),
        selection: nextSelection,
        mirrorInteraction: {
          session: shouldClearMirrorSession
            ? null
            : state.session.mirrorInteraction.session,
        },
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
