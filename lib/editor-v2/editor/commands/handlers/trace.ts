import type { RemoveTracePatch, UpsertTracePatch } from "../../store/patches";
import type { TraceDocument } from "../../store/state";
import type { EditorCommandHandler } from "./types";
import type {
  AttachTraceCommand,
  RemoveTraceCommand,
  UpdateTraceCommand,
} from "../types";

export const attachTraceCommandHandler: EditorCommandHandler<AttachTraceCommand> = {
  canHandle(command): command is AttachTraceCommand {
    return command.kind === "trace.attach";
  },
  handle(state, command) {
    const nextTrace: TraceDocument = {
      assetUrl: command.payload.assetUrl,
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
      nextSession: buildNextSession(state.session),
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

    const nextTrace: TraceDocument = {
      ...currentTrace,
      ...command.payload.changes,
    };

    return {
      nextSession: buildNextSession(state.session),
      nextUi: state.ui,
      patches: [{ type: "trace.upsert", trace: nextTrace }],
      inversePatches: [{ type: "trace.upsert", trace: currentTrace }],
      effects: [],
      event: {
        type: "command",
        commandId: command.id,
        label: "Update Trace",
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
      nextSession: buildNextSession(state.session),
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
