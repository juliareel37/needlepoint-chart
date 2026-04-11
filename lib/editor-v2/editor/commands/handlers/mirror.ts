import type { EditorCommandExecution, EditorCommandHandler } from "./types";
import type {
  ApplyMirrorCommand,
  CommitMirrorCommand,
  StartMirrorCommand,
  UpdateMirrorCommand,
} from "../types";
import type { DocumentPatch } from "../../store/patches";
import type { GridCellValue, GridPoint, SelectionState } from "../../store/state";
import { buildDirtySession } from "./gridMutationUtils";
import { getLassoBounds } from "../../selection/lassoGeometry";

export const startMirrorCommandHandler: EditorCommandHandler<StartMirrorCommand> = {
  canHandle(command): command is StartMirrorCommand {
    return command.kind === "mirror.start";
  },
  handle(state, command) {
    return {
      nextSession: {
        ...state.session,
        selection: buildMirrorSelection(command.payload.point),
      },
      nextUi: state.ui,
      patches: [],
      inversePatches: [],
      effects: [],
      event: { type: "session", commandId: command.id },
    };
  },
};

export const updateMirrorCommandHandler: EditorCommandHandler<UpdateMirrorCommand> = {
  canHandle(command): command is UpdateMirrorCommand {
    return command.kind === "mirror.update";
  },
  handle(state, command) {
    const previous = state.session.selection;
    if (previous.mode !== "mirror" || !previous.rect) return noop(state, command.id);
    return {
      nextSession: {
        ...state.session,
        selection: {
          ...previous,
          rect: expandMirrorRect(previous.rect, command.payload.point),
          preview: {
            hoveredCell: {
              x: Math.floor(command.payload.point.x),
              y: Math.floor(command.payload.point.y),
            },
            liveRegion: expandMirrorRect(previous.rect, command.payload.point),
          },
        },
      },
      nextUi: state.ui,
      patches: [],
      inversePatches: [],
      effects: [],
      event: { type: "session", commandId: command.id },
    };
  },
};

export const commitMirrorCommandHandler: EditorCommandHandler<CommitMirrorCommand> = {
  canHandle(command): command is CommitMirrorCommand {
    return command.kind === "mirror.commit";
  },
  handle(state, command) {
    const selection = state.session.selection;
    if (selection.mode !== "mirror" || !selection.rect) return noop(state, command.id);

    return {
      nextSession: {
        ...state.session,
        selection: {
          ...selection,
          preview: null,
        },
      },
      nextUi: state.ui,
      patches: [],
      inversePatches: [],
      effects: [],
      event: { type: "session", commandId: command.id },
    };
  },
};

export const applyMirrorCommandHandler: EditorCommandHandler<ApplyMirrorCommand> = {
  canHandle(command): command is ApplyMirrorCommand {
    return command.kind === "mirror.apply";
  },
  handle(state, command) {
    const selection = state.session.selection;
    if (selection.mode !== "mirror" || !selection.rect) return noop(state, command.id);

    const { patches, inversePatches } = buildMirrorPatches(
      state.document.grid.cells,
      state.document.grid.width,
      selection.rect,
      command.payload.axis,
    );

    return {
      nextSession: {
        ...buildDirtySession(state),
        selection: {
          ...selection,
          mirrorAxis: command.payload.axis,
        },
      },
      nextUi: state.ui,
      patches,
      inversePatches,
      effects: [],
      event: { type: "command", commandId: command.id, label: command.payload.axis === "horizontal" ? "Mirror Horizontal" : "Mirror Vertical" },
    };
  },
};

function buildMirrorSelection(point: GridPoint): SelectionState {
  const rect = getLassoBounds([point]);
  return {
    mode: "mirror",
    rect,
    lassoPoints: [point],
    mirrorAxis: null,
    preview: {
      hoveredCell: { x: Math.floor(point.x), y: Math.floor(point.y) },
      liveRegion: rect,
    },
  };
}

function expandMirrorRect(current: NonNullable<SelectionState["rect"]>, point: GridPoint) {
  return getLassoBounds([
    { x: current.x, y: current.y },
    { x: current.x + current.width, y: current.y + current.height },
    point,
  ]);
}

function buildMirrorPatches(
  cells: GridCellValue[],
  width: number,
  rect: NonNullable<SelectionState["rect"]>,
  axis: "horizontal" | "vertical",
) {
  const patches: DocumentPatch[] = [];
  const inversePatches: DocumentPatch[] = [];
  const replacements: Array<{ index: number; value: GridCellValue }> = [];
  const inverses: Array<{ index: number; value: GridCellValue }> = [];
  for (let y = rect.y; y < rect.y + rect.height; y += 1) {
    for (let x = rect.x; x < rect.x + rect.width; x += 1) {
      const sourceIndex = y * width + x;
      const mirrored = axis === "horizontal"
        ? { x: rect.x + rect.width + (rect.width - 1 - (x - rect.x)), y }
        : { x, y: rect.y + rect.height + (rect.height - 1 - (y - rect.y)) };
      const targetIndex = mirrored.y * width + mirrored.x;
      if (targetIndex < 0 || targetIndex >= cells.length) continue;
      const sourceValue = cells[sourceIndex];
      if (cells[targetIndex] === sourceValue) continue;
      replacements.push({ index: targetIndex, value: sourceValue });
      inverses.push({ index: targetIndex, value: cells[targetIndex] ?? null });
    }
  }
  return {
    patches: buildReplaceCellsPatch(replacements),
    inversePatches: buildReplaceCellsPatch(inverses),
  };
}

function noop(state: Parameters<EditorCommandHandler["handle"]>[0], commandId: string): EditorCommandExecution {
  return {
    nextSession: state.session,
    nextUi: state.ui,
    patches: [],
    inversePatches: [],
    effects: [],
    event: { type: "session", commandId },
  };
}

function buildReplaceCellsPatch(
  cells: Array<{ index: number; value: GridCellValue }>,
): DocumentPatch[] {
  return cells.length > 0
    ? [
        {
          type: "grid.replaceCells",
          cells,
        },
      ]
    : [];
}
