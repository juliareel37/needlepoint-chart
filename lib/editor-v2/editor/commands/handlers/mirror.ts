import type { EditorCommandExecution, EditorCommandHandler } from "./types";
import type {
  ApplyMirrorCommand,
  CancelMirrorCommand,
  CommitMirrorCommand,
  DoneMirrorCommand,
  ResetMirrorCommand,
  StartMirrorCommand,
  UpdateMirrorCommand,
} from "../types";
import type { DocumentPatch } from "../../store/patches";
import type {
  EditorSessionState,
  EditorStoreState,
  GridCellValue,
  GridPoint,
  GridRect,
  MirrorDirection,
  MirrorSessionState,
} from "../../store/state";
import { coalesceDocumentPatches, coalesceInverseDocumentPatches } from "../../store/patches";
import { buildDirtySession } from "./gridMutationUtils";
import { buildMirrorRect } from "../../selection/mirrorGeometry";

export const startMirrorCommandHandler: EditorCommandHandler<StartMirrorCommand> = {
  canHandle(command): command is StartMirrorCommand {
    return command.kind === "mirror.start";
  },
  handle(state, command) {
    return {
      nextSession: {
        ...state.session,
        mirrorInteraction: {
          session: buildStartedMirrorSession(
            state.session.mirrorInteraction.session,
            command.payload.point,
          ),
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

export const updateMirrorCommandHandler: EditorCommandHandler<UpdateMirrorCommand> = {
  canHandle(command): command is UpdateMirrorCommand {
    return command.kind === "mirror.update";
  },
  handle(state, command) {
    const previous = state.session.mirrorInteraction.session;

    if (!previous?.dragAnchor) {
      return noop(state, command.id);
    }

    return {
      nextSession: {
        ...state.session,
        mirrorInteraction: {
          session: {
            ...previous,
            sourceRect: buildMirrorRect(previous.dragAnchor, command.payload.point),
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
    const session = state.session.mirrorInteraction.session;

    if (!session?.sourceRect) {
      return noop(state, command.id);
    }

    return {
      nextSession: {
        ...state.session,
        mirrorInteraction: {
          session: {
            ...session,
            dragAnchor: null,
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

export const applyMirrorCommandHandler: EditorCommandHandler<ApplyMirrorCommand> = {
  canHandle(command): command is ApplyMirrorCommand {
    return command.kind === "mirror.apply";
  },
  handle(state, command) {
    const session = state.session.mirrorInteraction.session;

    if (!session?.sourceRect || session.dragAnchor) {
      return noop(state, command.id);
    }

    const { patches, inversePatches } = buildMirrorPatches(
      state.document.grid.cells,
      state.document.grid.width,
      state.document.grid.height,
      session.sourceRect,
      command.payload.direction,
    );

    if (patches.length === 0) {
      return {
        nextSession: {
          ...state.session,
          mirrorInteraction: {
            session: {
              ...session,
              appliedDirection: command.payload.direction,
            },
          },
        },
        nextUi: state.ui,
        patches: [],
        inversePatches: [],
        effects: [],
        event: { type: "session", commandId: command.id },
      };
    }

    return {
      nextSession: {
        ...buildDirtySession(state),
        mirrorInteraction: {
          session: {
            ...session,
            appliedDirection: command.payload.direction,
            forwardPatches: coalesceDocumentPatches([
              ...session.forwardPatches,
              ...patches,
            ]),
            inversePatches: coalesceInverseDocumentPatches([
              ...session.inversePatches,
              ...inversePatches,
            ]),
          },
        },
      },
      nextUi: state.ui,
      patches,
      inversePatches: [],
      effects: [],
      event: { type: "session", commandId: command.id },
    };
  },
};

export const resetMirrorCommandHandler: EditorCommandHandler<ResetMirrorCommand> = {
  canHandle(command): command is ResetMirrorCommand {
    return command.kind === "mirror.reset";
  },
  handle(state, command) {
    const session = state.session.mirrorInteraction.session;

    if (!session) {
      return noop(state, command.id);
    }

    return {
      nextSession: {
        ...state.session,
        mirrorInteraction: {
          session: {
            ...session,
            sourceRect: null,
            dragAnchor: null,
            appliedDirection: null,
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

export const cancelMirrorCommandHandler: EditorCommandHandler<CancelMirrorCommand> = {
  canHandle(command): command is CancelMirrorCommand {
    return command.kind === "mirror.cancel";
  },
  handle(state, command) {
    return buildCancelMirrorExecution(state, command.id);
  },
};

export const doneMirrorCommandHandler: EditorCommandHandler<DoneMirrorCommand> = {
  canHandle(command): command is DoneMirrorCommand {
    return command.kind === "mirror.done";
  },
  handle(state, command) {
    const session = state.session.mirrorInteraction.session;

    if (!session) {
      return noop(state, command.id);
    }

    return {
      nextSession: {
        ...buildDirtySession(state),
        activeTool: {
          ...state.session.activeTool,
          tool: "pan",
        },
        mirrorInteraction: {
          session: null,
        },
      },
      nextUi: state.ui,
      // Re-apply the accumulated patches so history can record the session as one
      // atomic action while the document remains visually unchanged.
      patches: session.forwardPatches,
      inversePatches: session.inversePatches,
      effects: [],
      event: {
        type: "command",
        commandId: command.id,
        label: "Mirror",
      },
    };
  },
};

export function buildCancelMirrorExecution(
  state: EditorStoreState,
  commandId: string,
  nextTool: EditorSessionState["activeTool"]["tool"] = "pan",
): EditorCommandExecution {
  const session = state.session.mirrorInteraction.session;

  return {
    nextSession: {
      ...state.session,
      activeTool: {
        ...state.session.activeTool,
        tool: nextTool,
      },
      mirrorInteraction: {
        session: null,
      },
    },
    nextUi: state.ui,
    patches: session?.inversePatches ?? [],
    inversePatches: [],
    effects: [],
    event: {
      type: "session",
      commandId,
    },
  };
}

function buildStartedMirrorSession(
  existingSession: MirrorSessionState | null,
  point: GridPoint,
): MirrorSessionState {
  const sourceRect = buildMirrorRect(point, point);

  if (!existingSession) {
    return {
      sourceRect,
      dragAnchor: point,
      appliedDirection: null,
      forwardPatches: [],
      inversePatches: [],
    };
  }

  return {
    ...existingSession,
    sourceRect,
    dragAnchor: point,
    appliedDirection: null,
  };
}

function buildMirrorPatches(
  cells: GridCellValue[],
  gridWidth: number,
  gridHeight: number,
  sourceRect: GridRect,
  direction: MirrorDirection,
): {
  patches: DocumentPatch[];
  inversePatches: DocumentPatch[];
} {
  const replacements: Array<{ index: number; value: GridCellValue }> = [];
  const inverses: Array<{ index: number; value: GridCellValue }> = [];

  for (let y = sourceRect.y; y < sourceRect.y + sourceRect.height; y += 1) {
    for (let x = sourceRect.x; x < sourceRect.x + sourceRect.width; x += 1) {
      const target = getMirroredTargetPoint(sourceRect, { x, y }, direction);

      if (
        target.x < 0 ||
        target.y < 0 ||
        target.x >= gridWidth ||
        target.y >= gridHeight
      ) {
        continue;
      }

      const sourceIndex = y * gridWidth + x;
      const targetIndex = target.y * gridWidth + target.x;
      const sourceValue = cells[sourceIndex] ?? null;
      const targetValue = cells[targetIndex] ?? null;

      if (targetValue === sourceValue) {
        continue;
      }

      replacements.push({ index: targetIndex, value: sourceValue });
      inverses.push({ index: targetIndex, value: targetValue });
    }
  }

  return {
    patches: buildReplaceCellsPatch(replacements),
    inversePatches: buildReplaceCellsPatch(inverses),
  };
}

function getMirroredTargetPoint(
  sourceRect: GridRect,
  point: GridPoint,
  direction: MirrorDirection,
): GridPoint {
  const dx = point.x - sourceRect.x;
  const dy = point.y - sourceRect.y;

  switch (direction) {
    case "left":
      return {
        x: sourceRect.x - 1 - dx,
        y: point.y,
      };
    case "right":
      return {
        x: sourceRect.x + sourceRect.width + (sourceRect.width - 1 - dx),
        y: point.y,
      };
    case "top":
      return {
        x: point.x,
        y: sourceRect.y - 1 - dy,
      };
    case "bottom":
      return {
        x: point.x,
        y: sourceRect.y + sourceRect.height + (sourceRect.height - 1 - dy),
      };
  }
}

function noop(
  state: EditorStoreState,
  commandId: string,
): EditorCommandExecution {
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
