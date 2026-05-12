import type {
  RemoveTracePatch,
  TraceUpdateChanges,
  UpsertTracePatch,
} from "../../store/patches";
import type {
  EditorStoreState,
  TraceDocument,
  TraceRepositionSnapshot,
} from "../../store/state";
import type { EditorCommandExecution, EditorCommandHandler } from "./types";
import type {
  AttachTraceCommand,
  BeginTraceRepositionCommand,
  CancelTraceRepositionCommand,
  CommitTraceRepositionCommand,
  PreviewTraceRepositionCommand,
  RemoveTraceCommand,
  UpdateTraceCommand,
} from "../types";
import { createFullTraceCrop } from "../../trace/crop";

export const attachTraceCommandHandler: EditorCommandHandler<AttachTraceCommand> = {
  canHandle(command): command is AttachTraceCommand {
    return command.kind === "trace.attach";
  },
  handle(state, command) {
    const nextTrace: TraceDocument = {
      previewUrl: command.payload.previewUrl,
      thumbnailUrl: command.payload.thumbnailUrl,
      originalUrl: command.payload.originalUrl,
      maskUrl: null,
      fileName: command.payload.fileName,
      byteSize: command.payload.byteSize,
      mimeType: command.payload.mimeType,
      imageWidth: command.payload.imageWidth,
      imageHeight: command.payload.imageHeight,
      ...createFullTraceCrop(
        command.payload.imageWidth,
        command.payload.imageHeight,
      ),
      blendMode: "image",
      opacity: 0.35,
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      rotation: 0,
      locked: false,
      visible: true,
    };

    return {
      nextSession: buildNextSession({
        ...clearTraceRepositionSession(state.session),
        traceInteraction: {
          ...state.session.traceInteraction,
          placementMode: "move",
          repositionOrigin: command.payload.origin,
          replacedTrace: command.payload.origin === "replace" ? state.document.trace : null,
          repositionSnapshot: buildTraceRepositionSnapshot(nextTrace),
        },
      }),
      nextUi: state.ui,
      patches: [{ type: "trace.upsert", trace: nextTrace }],
      inversePatches: buildInverseTracePatches(state.document.trace),
      effects: [],
      event: {
        type: "command",
        commandId: command.id,
        label: "Attach Trace",
      },
    };
  },
};

export const updateTraceCommandHandler: EditorCommandHandler<UpdateTraceCommand> = {
  canHandle(command): command is UpdateTraceCommand {
    return command.kind === "trace.update";
  },
  handle(state, command) {
    const currentTrace = state.document.trace;

    if (!currentTrace) {
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
      nextSession: buildNextSession(state.session),
      nextUi: state.ui,
      patches: [{ type: "trace.update", changes: command.payload.changes }],
      inversePatches: [
        {
          type: "trace.update",
          changes: buildInverseTraceUpdateChanges(
            currentTrace,
            command.payload.changes,
          ),
        },
      ],
      effects: [],
      event: {
        type: "command",
        commandId: command.id,
        label: "Update Trace",
      },
    };
  },
};

export const beginTraceRepositionCommandHandler: EditorCommandHandler<BeginTraceRepositionCommand> = {
  canHandle(command): command is BeginTraceRepositionCommand {
    return command.kind === "trace.beginReposition";
  },
  handle(state, command) {
    const currentTrace = state.document.trace;

    if (!currentTrace) {
      return buildTraceSessionNoop(state, command.id);
    }

    return {
      nextSession: {
        ...state.session,
        traceInteraction: {
          ...state.session.traceInteraction,
          placementMode: "move",
          repositionOrigin: command.payload.origin,
          replacedTrace: null,
          repositionSnapshot: buildTraceRepositionSnapshot(currentTrace),
        },
      },
      nextUi: state.ui,
      patches: [{ type: "trace.update", changes: { locked: false } }],
      inversePatches: [],
      effects: [],
      event: {
        type: "session",
        commandId: command.id,
      },
    };
  },
};

export const previewTraceRepositionCommandHandler: EditorCommandHandler<PreviewTraceRepositionCommand> = {
  canHandle(command): command is PreviewTraceRepositionCommand {
    return command.kind === "trace.previewReposition";
  },
  handle(state, command) {
    if (!state.document.trace || !state.session.traceInteraction.repositionSnapshot) {
      return buildTraceSessionNoop(state, command.id);
    }

    return {
      nextSession: state.session,
      nextUi: state.ui,
      patches: [
        {
          type: "trace.update",
          changes: {
            offsetX: command.payload.offsetX,
            offsetY: command.payload.offsetY,
            scale: command.payload.scale,
            rotation: command.payload.rotation,
          },
        },
      ],
      inversePatches: [],
      effects: [],
      event: {
        type: "session",
        commandId: command.id,
      },
    };
  },
};

export const cancelTraceRepositionCommandHandler: EditorCommandHandler<CancelTraceRepositionCommand> = {
  canHandle(command): command is CancelTraceRepositionCommand {
    return command.kind === "trace.cancelReposition";
  },
  handle(state, command) {
    const { repositionOrigin, replacedTrace, repositionSnapshot } =
      state.session.traceInteraction;

    if (!state.document.trace || !repositionSnapshot) {
      return buildTraceSessionNoop(state, command.id);
    }

    if (repositionOrigin === "upload") {
      return {
        nextSession: clearTraceRepositionSession(state.session),
        nextUi: state.ui,
        patches: [{ type: "trace.remove" }],
        inversePatches: [],
        effects: [],
        event: {
          type: "session",
          commandId: command.id,
        },
      };
    }

    if (repositionOrigin === "replace" && replacedTrace) {
      return {
        nextSession: clearTraceRepositionSession(state.session),
        nextUi: state.ui,
        patches: [{ type: "trace.upsert", trace: replacedTrace }],
        inversePatches: [],
        effects: [],
        event: {
          type: "session",
          commandId: command.id,
        },
      };
    }

      return {
        nextSession: clearTraceRepositionSession(state.session),
        nextUi: state.ui,
        patches: [{ type: "trace.update", changes: repositionSnapshot }],
        inversePatches: [],
        effects: [],
        event: {
        type: "session",
        commandId: command.id,
      },
    };
  },
};

export const commitTraceRepositionCommandHandler: EditorCommandHandler<CommitTraceRepositionCommand> = {
  canHandle(command): command is CommitTraceRepositionCommand {
    return command.kind === "trace.commitReposition";
  },
  handle(state, command) {
    const currentTrace = state.document.trace;
    const snapshot = state.session.traceInteraction.repositionSnapshot;

    if (!currentTrace || !snapshot) {
      return buildTraceSessionNoop(state, command.id);
    }

    const committedChanges: TraceUpdateChanges = {
      offsetX: currentTrace.offsetX,
      offsetY: currentTrace.offsetY,
      scale: currentTrace.scale,
      rotation: currentTrace.rotation,
      cropX: currentTrace.cropX,
      cropY: currentTrace.cropY,
      cropWidth: currentTrace.cropWidth,
      cropHeight: currentTrace.cropHeight,
      locked: true,
    };

    return {
      nextSession: buildNextSession(clearTraceRepositionSession(state.session)),
      nextUi: state.ui,
      patches: [{ type: "trace.update", changes: committedChanges }],
      inversePatches: [{ type: "trace.update", changes: snapshot }],
      effects: [],
      event: {
        type: "command",
        commandId: command.id,
        label: "Reposition Trace",
      },
    };
  },
};

export const removeTraceCommandHandler: EditorCommandHandler<RemoveTraceCommand> = {
  canHandle(command): command is RemoveTraceCommand {
    return command.kind === "trace.remove";
  },
  handle(state, command) {
    const currentTrace = state.document.trace;

    if (!currentTrace) {
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
      nextSession: buildNextSession(clearTraceRepositionSession(state.session)),
      nextUi: state.ui,
      patches: [{ type: "trace.remove" }],
      inversePatches: [{ type: "trace.upsert", trace: currentTrace }],
      effects: [],
      event: {
        type: "command",
        commandId: command.id,
        label: "Remove Trace",
      },
    };
  },
};

function buildInverseTracePatches(
  currentTrace: TraceDocument | null,
): Array<UpsertTracePatch | RemoveTracePatch> {
  if (!currentTrace) {
    return [{ type: "trace.remove" }];
  }

  return [{ type: "trace.upsert", trace: currentTrace }];
}

function buildInverseTraceUpdateChanges(
  currentTrace: TraceDocument,
  changes: TraceUpdateChanges,
): TraceUpdateChanges {
  const inverseChanges: TraceUpdateChanges = {};

  for (const key of Object.keys(changes) as Array<keyof TraceUpdateChanges>) {
    inverseChanges[key] = currentTrace[key] as never;
  }

  return inverseChanges;
}

function buildTraceRepositionSnapshot(
  trace: TraceDocument,
): TraceRepositionSnapshot {
  return {
    offsetX: trace.offsetX,
    offsetY: trace.offsetY,
    scale: trace.scale,
    rotation: trace.rotation,
    cropX: trace.cropX,
    cropY: trace.cropY,
    cropWidth: trace.cropWidth,
    cropHeight: trace.cropHeight,
    locked: true,
  };
}

function clearTraceRepositionSession<TSession extends {
  traceInteraction: {
    placementMode: "idle" | "move" | "scale" | "rotate";
    repositionOrigin: import("../../store/state").TraceRepositionOrigin | null;
    replacedTrace: TraceDocument | null;
    repositionSnapshot: TraceRepositionSnapshot | null;
  };
}>(session: TSession): TSession {
  return {
    ...session,
    traceInteraction: {
      ...session.traceInteraction,
      placementMode: "idle",
      repositionOrigin: null,
      replacedTrace: null,
      repositionSnapshot: null,
    },
  };
}

function buildTraceSessionNoop(
  state: EditorStoreState,
  commandId: string,
): EditorCommandExecution {
  return {
    nextSession: state.session,
    nextUi: state.ui,
    patches: [],
    inversePatches: [],
    effects: [],
    event: {
      type: "session",
      commandId,
    },
  };
}

function buildNextSession<TSession extends { persistence: { dirty: boolean } }>(
  session: TSession,
): TSession {
  return {
    ...session,
    persistence: {
      ...session.persistence,
      dirty: true,
    },
  };
}
