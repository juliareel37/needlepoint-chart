import type {
  DuplicatePlacementCell,
  EditorStoreState,
  GridPoint,
  SelectionState,
} from "../../store/state";
import { getLassoBounds, isCellInSelection } from "../../selection/lassoGeometry";
import type { EditorCommandHandler } from "./types";
import type {
  BeginDuplicatePlacementCommand,
  BeginCutPlacementCommand,
  CancelDuplicatePlacementCommand,
  ClearSelectionCommand,
  CommitDuplicatePlacementCommand,
  CommitSelectionCommand,
  MoveSelectionCommand,
  ResizeSelectionCommand,
  SetSelectionShapeCommand,
  StartSelectionCommand,
  UpdateSelectionCommand,
} from "../types";
import {
  buildDirtySession,
  buildInverseReplaceCellsPatch,
  filterValidCells,
} from "./gridMutationUtils";
import {
  buildAppendOnlyInverseSymbolPatches,
  buildAssignSymbolsPatch,
} from "./symbolAssignments";

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
    const duplicatePlacement = state.session.duplicatePlacement;
    const clearPatches =
      duplicatePlacement?.operation === "cut"
        ? buildGridReplacementPatch(
            state,
            buildPlacementSourceGridPoints(
              duplicatePlacement.sourceRect,
              duplicatePlacement.cells,
            ),
            duplicatePlacement,
          )
        : [];

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
        duplicatePlacement: null,
        mirrorInteraction: {
          session: null,
        },
      },
      nextUi: state.ui,
      patches: clearPatches,
      inversePatches: [],
      effects: [],
      event: {
        type: "session",
        commandId: command.id,
      },
    };
  },
};

export const beginDuplicatePlacementCommandHandler: EditorCommandHandler<BeginDuplicatePlacementCommand> = {
  canHandle(command): command is BeginDuplicatePlacementCommand {
    return command.kind === "selection.beginDuplicatePlacement";
  },
  handle(state, command) {
    const selectionMode = state.session.selection.mode;

    if (
      (selectionMode !== "rect" &&
        selectionMode !== "circle" &&
        selectionMode !== "lasso") ||
      !state.session.selection.rect ||
      state.session.selection.preview ||
      state.session.duplicatePlacement
    ) {
      return buildSelectionSessionNoop(state, command.id);
    }

    return {
      nextSession: {
        ...state.session,
        duplicatePlacement: {
          operation: "duplicate",
          sourceRect: state.session.selection.rect,
          selectionMode,
          outlinePoints: buildDuplicatePlacementOutlinePoints(state),
          cells: buildDuplicatePlacementCells(state),
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

export const beginCutPlacementCommandHandler: EditorCommandHandler<BeginCutPlacementCommand> = {
  canHandle(command): command is BeginCutPlacementCommand {
    return command.kind === "selection.beginCutPlacement";
  },
  handle(state, command) {
    const selectionMode = state.session.selection.mode;

    if (
      (selectionMode !== "rect" &&
        selectionMode !== "circle" &&
        selectionMode !== "lasso") ||
      !state.session.selection.rect ||
      state.session.selection.preview ||
      state.session.duplicatePlacement
    ) {
      return buildSelectionSessionNoop(state, command.id);
    }

    const placementCells = buildDuplicatePlacementCells(state);
    const sourceGridPoints = buildPlacementSourceGridPoints(
      state.session.selection.rect,
      placementCells,
    );

    return {
      nextSession: {
        ...state.session,
        duplicatePlacement: {
          operation: "cut",
          sourceRect: state.session.selection.rect,
          selectionMode,
          outlinePoints: buildDuplicatePlacementOutlinePoints(state),
          cells: placementCells,
        },
      },
      nextUi: state.ui,
      patches: buildGridReplacementPatch(state, sourceGridPoints, null),
      inversePatches: [],
      effects: [],
      event: {
        type: "session",
        commandId: command.id,
      },
    };
  },
};

export const cancelDuplicatePlacementCommandHandler: EditorCommandHandler<CancelDuplicatePlacementCommand> = {
  canHandle(command): command is CancelDuplicatePlacementCommand {
    return command.kind === "selection.cancelDuplicatePlacement";
  },
  handle(state, command) {
    const session = state.session.duplicatePlacement;

    if (!session) {
      return buildSelectionSessionNoop(state, command.id);
    }

    return {
      nextSession: {
        ...state.session,
        duplicatePlacement: null,
      },
      nextUi: state.ui,
      patches:
        session.operation === "cut"
          ? buildGridReplacementPatch(
              state,
              buildPlacementSourceGridPoints(session.sourceRect, session.cells),
              session,
            )
          : [],
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

export const resizeSelectionCommandHandler: EditorCommandHandler<ResizeSelectionCommand> = {
  canHandle(command): command is ResizeSelectionCommand {
    return command.kind === "selection.resize";
  },
  handle(state, command) {
    const resizedSelection = resizeSelection(
      state.session.selection,
      command.payload.handle,
      command.payload.current,
    );

    if (resizedSelection === state.session.selection) {
      return buildSelectionSessionNoop(state, command.id);
    }

    return {
      nextSession: {
        ...state.session,
        selection: resizedSelection,
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

export const commitDuplicatePlacementCommandHandler: EditorCommandHandler<CommitDuplicatePlacementCommand> = {
  canHandle(command): command is CommitDuplicatePlacementCommand {
    return command.kind === "selection.commitDuplicatePlacement";
  },
  handle(state, command) {
    const session = state.session.duplicatePlacement;

    if (!session) {
      return buildSelectionSessionNoop(state, command.id);
    }

    const candidateDestinations = session.cells.map((cell) => ({
      point: {
        x: session.sourceRect.x + cell.x + command.payload.deltaX,
        y: session.sourceRect.y + cell.y + command.payload.deltaY,
      },
      colorId: cell.colorId,
    }));
    const validDestinations = filterValidCells(
      candidateDestinations.map((entry) => entry.point),
      state,
    );
    const destinationMap = new Map(
      candidateDestinations.map((entry) => [`${entry.point.x}:${entry.point.y}`, entry.colorId]),
    );
    const changedDestinations = validDestinations.filter((cell) => {
      const nextColorId = destinationMap.get(`${cell.x}:${cell.y}`);

      return (
        typeof nextColorId === "string" &&
        state.document.grid.cells[cell.y * state.document.grid.width + cell.x] !== nextColorId
      );
    });
    const replacements = changedDestinations
      .map((cell) => ({
        index: cell.y * state.document.grid.width + cell.x,
        value: destinationMap.get(`${cell.x}:${cell.y}`) ?? null,
      }))
      .filter((replacement): replacement is { index: number; value: string } => {
        return typeof replacement.value === "string";
      });
    const colorIds = Array.from(new Set(replacements.map((replacement) => replacement.value)))
      .filter((value): value is string => Boolean(value));
    const symbolPatches = buildAssignSymbolsPatch(state, colorIds);
    const sourceGridPoints = buildPlacementSourceGridPoints(session.sourceRect, session.cells);
    const sourceClearPatches =
      session.operation === "cut"
        ? buildGridReplacementPatch(state, sourceGridPoints, null)
        : [];
    const sourceRestorePatches =
      session.operation === "cut"
        ? buildGridReplacementPatch(state, sourceGridPoints, session)
        : [];
    const hasGridChanges = replacements.length > 0 || session.operation === "cut";

    if (!hasGridChanges) {
      return {
        nextSession: {
          ...state.session,
          duplicatePlacement: null,
          selection:
            session.operation === "cut"
              ? {
                  mode: "none",
                  shape: state.session.selection.shape,
                  rect: null,
                  lassoPoints: [],
                  mirrorAxis: null,
                  preview: null,
                }
              : state.session.selection,
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
    }

    return {
      nextSession: {
        ...buildDirtySession(state),
        duplicatePlacement: null,
        selection:
          session.operation === "cut"
            ? {
                mode: "none",
                shape: state.session.selection.shape,
                rect: null,
                lassoPoints: [],
                mirrorAxis: null,
                preview: null,
              }
            : state.session.selection,
      },
      nextUi: state.ui,
      patches: [
        ...sourceClearPatches,
        {
          type: "grid.replaceCells",
          cells: replacements,
        },
        ...symbolPatches,
      ],
      inversePatches: [
        ...sourceRestorePatches,
        ...buildInverseReplaceCellsPatch(state, changedDestinations),
        ...buildAppendOnlyInverseSymbolPatches(symbolPatches),
      ],
      effects: [],
      event: {
        type: "command",
        commandId: command.id,
        label: "Duplicate Selection",
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
        duplicatePlacement: null,
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

function resizeSelection(
  selection: SelectionState,
  handle: ResizeSelectionCommand["payload"]["handle"],
  current: GridPoint,
): SelectionState {
  if (
    (selection.mode !== "rect" && selection.mode !== "circle") ||
    !selection.rect ||
    selection.preview
  ) {
    return selection;
  }

  const rect = buildResizedRect(selection.rect, handle, normalizeRectPoint(current));

  if (!rect) {
    return selection;
  }

  return {
    ...selection,
    rect,
    lassoPoints: [
      { x: rect.x, y: rect.y },
      { x: rect.x + rect.width - 1, y: rect.y + rect.height - 1 },
    ],
    preview: null,
  };
}

function buildResizedRect(
  rect: NonNullable<SelectionState["rect"]>,
  handle: ResizeSelectionCommand["payload"]["handle"],
  current: GridPoint,
) {
  const left = rect.x;
  const top = rect.y;
  const right = rect.x + rect.width - 1;
  const bottom = rect.y + rect.height - 1;

  switch (handle) {
    case "n":
      return buildEdgeResizedRect({
        fixedLeft: left,
        fixedRight: right,
        fixedBottom: bottom,
        nextTop: current.y,
      });
    case "e":
      return buildEdgeResizedRect({
        fixedTop: top,
        fixedBottom: bottom,
        fixedLeft: left,
        nextRight: current.x,
      });
    case "s":
      return buildEdgeResizedRect({
        fixedLeft: left,
        fixedRight: right,
        fixedTop: top,
        nextBottom: current.y,
      });
    case "w":
      return buildEdgeResizedRect({
        fixedTop: top,
        fixedBottom: bottom,
        fixedRight: right,
        nextLeft: current.x,
      });
    case "nw":
      return buildCornerAspectLockedRect({
        anchorX: right,
        anchorY: bottom,
        current,
        sourceWidth: rect.width,
        sourceHeight: rect.height,
      });
    case "ne":
      return buildCornerAspectLockedRect({
        anchorX: left,
        anchorY: bottom,
        current,
        sourceWidth: rect.width,
        sourceHeight: rect.height,
      });
    case "se":
      return buildCornerAspectLockedRect({
        anchorX: left,
        anchorY: top,
        current,
        sourceWidth: rect.width,
        sourceHeight: rect.height,
      });
    case "sw":
      return buildCornerAspectLockedRect({
        anchorX: right,
        anchorY: top,
        current,
        sourceWidth: rect.width,
        sourceHeight: rect.height,
      });
    default:
      return null;
  }
}

function buildEdgeResizedRect(args: {
  fixedTop?: number;
  fixedRight?: number;
  fixedBottom?: number;
  fixedLeft?: number;
  nextTop?: number;
  nextRight?: number;
  nextBottom?: number;
  nextLeft?: number;
}) {
  const left = args.nextLeft ?? args.fixedLeft ?? 0;
  const right = args.nextRight ?? args.fixedRight ?? left;
  const top = args.nextTop ?? args.fixedTop ?? 0;
  const bottom = args.nextBottom ?? args.fixedBottom ?? top;

  return {
    x: Math.min(left, right),
    y: Math.min(top, bottom),
    width: Math.abs(right - left) + 1,
    height: Math.abs(bottom - top) + 1,
  };
}

function buildCornerAspectLockedRect(args: {
  anchorX: number;
  anchorY: number;
  current: GridPoint;
  sourceWidth: number;
  sourceHeight: number;
}) {
  const { anchorX, anchorY, current, sourceWidth, sourceHeight } = args;
  const ratio = sourceWidth / sourceHeight;
  const deltaX = current.x - anchorX;
  const deltaY = current.y - anchorY;
  const signX = deltaX === 0 ? -1 : Math.sign(deltaX);
  const signY = deltaY === 0 ? -1 : Math.sign(deltaY);
  const absX = Math.abs(deltaX) + 1;
  const absY = Math.abs(deltaY) + 1;
  let width = absX;
  let height = absY;

  if (absX / absY > ratio) {
    height = Math.max(1, Math.round(width / ratio));
  } else {
    width = Math.max(1, Math.round(height * ratio));
  }

  const nextX = anchorX + signX * (width - 1);
  const nextY = anchorY + signY * (height - 1);

  return {
    x: Math.min(anchorX, nextX),
    y: Math.min(anchorY, nextY),
    width: Math.abs(nextX - anchorX) + 1,
    height: Math.abs(nextY - anchorY) + 1,
  };
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

function buildSelectionSessionNoop(state: EditorStoreState, commandId: string) {
  return {
    nextSession: state.session,
    nextUi: state.ui,
    patches: [],
    inversePatches: [],
    effects: [],
    event: {
      type: "session" as const,
      commandId,
    },
  };
}

function buildDuplicatePlacementCells(state: EditorStoreState): DuplicatePlacementCell[] {
  const selectionBounds = state.session.selection.rect;

  if (!selectionBounds) {
    return [];
  }

  const cells: DuplicatePlacementCell[] = [];

  for (let y = selectionBounds.y; y < selectionBounds.y + selectionBounds.height; y += 1) {
    for (let x = selectionBounds.x; x < selectionBounds.x + selectionBounds.width; x += 1) {
      if (!isCellInSelection(state, { x, y })) {
        continue;
      }

      const colorId = state.document.grid.cells[y * state.document.grid.width + x];

      if (!colorId) {
        continue;
      }

      cells.push({
        x: x - selectionBounds.x,
        y: y - selectionBounds.y,
        colorId,
      });
    }
  }

  return cells;
}

function buildDuplicatePlacementOutlinePoints(state: EditorStoreState) {
  const selectionBounds = state.session.selection.rect;

  if (!selectionBounds) {
    return [];
  }

  return state.session.selection.lassoPoints.map((point) => ({
    x: point.x - selectionBounds.x,
    y: point.y - selectionBounds.y,
  }));
}

function buildPlacementSourceGridPoints(
  sourceRect: { x: number; y: number },
  cells: DuplicatePlacementCell[],
): GridPoint[] {
  return cells.map((cell) => ({
    x: sourceRect.x + cell.x,
    y: sourceRect.y + cell.y,
  }));
}

function buildGridReplacementPatch(
  state: EditorStoreState,
  cells: GridPoint[],
  value: null | { cells: DuplicatePlacementCell[]; sourceRect: { x: number; y: number } },
) {
  const replacements = cells
    .map((cell, index) => ({
      index: cell.y * state.document.grid.width + cell.x,
      value:
        value === null
          ? null
          : value.cells[index]?.colorId ?? null,
    }))
    .filter((replacement) => replacement.value !== undefined);

  return replacements.length > 0
    ? [
        {
          type: "grid.replaceCells" as const,
          cells: replacements,
        },
      ]
    : [];
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
