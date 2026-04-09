import type { SelectionState } from "../../store/state";
import { getLassoBounds } from "../../selection/lassoGeometry";
import type { EditorCommandHandler } from "./types";
import type {
  ClearSelectionCommand,
  CommitSelectionCommand,
  StartSelectionCommand,
  UpdateSelectionCommand,
} from "../types";

export const startSelectionCommandHandler: EditorCommandHandler<StartSelectionCommand> = {
  canHandle(command): command is StartSelectionCommand {
    return command.kind === "selection.start";
  },
  handle(state, command) {
    return {
      nextSession: {
        ...state.session,
        selection: buildStartedSelection(command.payload.point),
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

export const updateSelectionCommandHandler: EditorCommandHandler<UpdateSelectionCommand> = {
  canHandle(command): command is UpdateSelectionCommand {
    return command.kind === "selection.update";
  },
  handle(state, command) {
    return {
      nextSession: {
        ...state.session,
        selection: appendLassoPoint(
          state.session.selection,
          command.payload.point,
        ),
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

export const commitSelectionCommandHandler: EditorCommandHandler<CommitSelectionCommand> = {
  canHandle(command): command is CommitSelectionCommand {
    return command.kind === "selection.commit";
  },
  handle(state, command) {
    return {
      nextSession: {
        ...state.session,
        selection: {
          ...commitLassoSelection(
            state.session.selection,
            command.payload.point,
          ),
          preview: null,
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

export const clearSelectionCommandHandler: EditorCommandHandler<ClearSelectionCommand> = {
  canHandle(command): command is ClearSelectionCommand {
    return command.kind === "selection.clear";
  },
  handle(state, command) {
    return {
      nextSession: {
        ...state.session,
        activeTool:
          state.session.activeTool.tool === "lasso"
            ? {
                ...state.session.activeTool,
                tool: "none",
              }
            : state.session.activeTool,
        selection: {
          mode: "none",
          rect: null,
          lassoPoints: [],
          mirrorAxis: null,
          preview: null,
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

function buildStartedSelection(
  point: StartSelectionCommand["payload"]["point"],
): SelectionState {
  return {
    mode: "lasso",
    rect: getLassoBounds([point]),
    lassoPoints: [point],
    mirrorAxis: null,
    preview: {
      hoveredCell: {
        x: Math.floor(point.x),
        y: Math.floor(point.y),
      },
      liveRegion: getLassoBounds([point]),
    },
  };
}

function appendLassoPoint(
  previous: SelectionState,
  point: UpdateSelectionCommand["payload"]["point"],
): SelectionState {
  const lassoPoints = [...previous.lassoPoints, point];
  const rect = getLassoBounds(lassoPoints);

  return {
    ...previous,
    mode: "lasso",
    rect,
    lassoPoints,
    preview: {
      hoveredCell: {
        x: Math.floor(point.x),
        y: Math.floor(point.y),
      },
      liveRegion: rect,
    },
  };
}

function commitLassoSelection(
  previous: SelectionState,
  point: CommitSelectionCommand["payload"]["point"],
): SelectionState {
  const lassoPoints = point ? [...previous.lassoPoints, point] : previous.lassoPoints;

  if (lassoPoints.length < 3) {
    return {
      mode: "none",
      rect: null,
      lassoPoints: [],
      mirrorAxis: null,
      preview: null,
    };
  }

  return {
    ...previous,
    mode: "lasso",
    rect: getLassoBounds(lassoPoints),
    lassoPoints,
  };
}
