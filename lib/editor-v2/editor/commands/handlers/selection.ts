import type { SelectionState } from "../../store/state";
import { getLassoBounds } from "../../selection/lassoGeometry";
import type { EditorCommandHandler } from "./types";
import type {
  ClearSelectionCommand,
  CommitSelectionCommand,
  MoveSelectionCommand,
  SetSelectionShapeCommand,
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
        selection: buildStartedSelection(
          command.payload.point,
          state.session.selection.shape,
        ),
        mirrorInteraction: {
          session: null,
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
                tool: "pan",
              }
            : state.session.activeTool,
        selection: {
          mode: "none",
          shape: state.session.selection.shape,
          rect: null,
          lassoPoints: [],
          mirrorAxis: null,
          preview: null,
        },
        mirrorInteraction: {
          session: null,
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

export const moveSelectionCommandHandler: EditorCommandHandler<MoveSelectionCommand> = {
  canHandle(command): command is MoveSelectionCommand {
    return command.kind === "selection.move";
  },
  handle(state, command) {
    const translatedSelection = translateSelection(
      state.session.selection,
      command.payload.deltaX,
      command.payload.deltaY,
      state.document.grid.width,
      state.document.grid.height,
    );

    if (translatedSelection === state.session.selection) {
      return {
        nextSession: state.session,
        nextUi: state.ui,
        patches: [],
        inversePatches: [],
        effects: [],
        event: {
          type: "session",
          commandId: command.id,
        },
      };
    }

    return {
      nextSession: {
        ...state.session,
        selection: translatedSelection,
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

export const setSelectionShapeCommandHandler: EditorCommandHandler<SetSelectionShapeCommand> = {
  canHandle(command): command is SetSelectionShapeCommand {
    return command.kind === "selection.setShape";
  },
  handle(state, command) {
    const nextShape = command.payload.shape;

    return {
      nextSession: {
        ...state.session,
        selection: {
          mode: "none",
          shape: nextShape,
          rect: null,
          lassoPoints: [],
          mirrorAxis: null,
          preview: null,
        },
        mirrorInteraction: {
          session: null,
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
  shape: SelectionState["shape"],
): SelectionState {
  if (shape === "rect" || shape === "circle") {
    const normalizedPoint = normalizeRectPoint(point);
    const rect = buildRectSelectionBounds(normalizedPoint, normalizedPoint);

    return {
      mode: shape === "circle" ? "circle" : "rect",
      shape,
      rect,
      lassoPoints: [normalizedPoint],
      mirrorAxis: null,
      preview: {
        hoveredCell: normalizedPoint,
        liveRegion: rect,
      },
    };
  }

  return {
    mode: "lasso",
    shape,
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
  if (previous.shape === "rect" || previous.shape === "circle") {
    const anchor = previous.lassoPoints[0] ?? normalizeRectPoint(point);
    const currentPoint = normalizeRectPoint(point);
    const rect = buildRectSelectionBounds(anchor, currentPoint);

    return {
      ...previous,
      mode: previous.shape === "circle" ? "circle" : "rect",
      rect,
      lassoPoints: [anchor, currentPoint],
      preview: {
        hoveredCell: currentPoint,
        liveRegion: rect,
      },
    };
  }

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
  if (previous.shape === "rect" || previous.shape === "circle") {
    const anchor = previous.lassoPoints[0];

    if (!anchor) {
      return {
        mode: "none",
        shape: previous.shape,
        rect: null,
        lassoPoints: [],
        mirrorAxis: null,
        preview: null,
      };
    }

    const currentPoint = normalizeRectPoint(point ?? anchor);

    return {
      ...previous,
      mode: previous.shape === "circle" ? "circle" : "rect",
      rect: buildRectSelectionBounds(anchor, currentPoint),
      lassoPoints: [anchor, currentPoint],
    };
  }

  const lassoPoints = point ? [...previous.lassoPoints, point] : previous.lassoPoints;

  if (lassoPoints.length < 3) {
    return {
      mode: "none",
      shape: previous.shape,
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

function normalizeRectPoint(point: StartSelectionCommand["payload"]["point"]) {
  return {
    x: Math.floor(point.x),
    y: Math.floor(point.y),
  };
}

function buildRectSelectionBounds(
  anchor: { x: number; y: number },
  point: { x: number; y: number },
) {
  const x = Math.min(anchor.x, point.x);
  const y = Math.min(anchor.y, point.y);
  const width = Math.abs(point.x - anchor.x) + 1;
  const height = Math.abs(point.y - anchor.y) + 1;

  return { x, y, width, height };
}

function translateSelection(
  selection: SelectionState,
  requestedDeltaX: number,
  requestedDeltaY: number,
  gridWidth: number,
  gridHeight: number,
): SelectionState {
  if (!selection.rect || selection.preview) {
    return selection;
  }

  const effectiveDeltaX = clampSelectionDeltaX(selection.rect, requestedDeltaX, gridWidth);
  const effectiveDeltaY = clampSelectionDeltaY(selection.rect, requestedDeltaY, gridHeight);

  if (effectiveDeltaX === 0 && effectiveDeltaY === 0) {
    return selection;
  }

  const nextRect = {
    ...selection.rect,
    x: selection.rect.x + effectiveDeltaX,
    y: selection.rect.y + effectiveDeltaY,
  };

  return {
    ...selection,
    rect: nextRect,
    lassoPoints: selection.lassoPoints.map((point) => ({
      x: point.x + effectiveDeltaX,
      y: point.y + effectiveDeltaY,
    })),
  };
}

function clampSelectionDeltaX(
  rect: { x: number; width: number },
  deltaX: number,
  gridWidth: number,
): number {
  const minDelta = -rect.x;
  const maxDelta = gridWidth - (rect.x + rect.width);

  return Math.min(Math.max(deltaX, minDelta), maxDelta);
}

function clampSelectionDeltaY(
  rect: { y: number; height: number },
  deltaY: number,
  gridHeight: number,
): number {
  const minDelta = -rect.y;
  const maxDelta = gridHeight - (rect.y + rect.height);

  return Math.min(Math.max(deltaY, minDelta), maxDelta);
}
