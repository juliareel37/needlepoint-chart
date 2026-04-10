import type { EditorCommand } from "../commands/types";
import {
  coalesceDocumentPatches,
  coalesceInverseDocumentPatches,
  type DocumentPatch,
  type TraceUpdateChanges,
} from "../store/patches";
import type {
  EditorStoreState,
  HistoryEntry,
  HistoryState,
  TraceDocument,
} from "../store/state";
import type { EditorCommandExecution } from "../commands/handlers/types";

const TRANSIENT_TRACE_FIELDS = [
  "visible",
  "blendMode",
  "opacity",
  "locked",
] as const;

export interface HistoryEngine {
  record(
    state: HistoryState,
    command: EditorCommand,
    forwardPatches: DocumentPatch[],
    inversePatches: DocumentPatch[],
  ): HistoryState;
  undo(state: EditorStoreState): EditorCommandExecution | null;
  redo(state: EditorStoreState): EditorCommandExecution | null;
}

export function createHistoryEngine(): HistoryEngine {
  return {
    record(state, command, forwardPatches, inversePatches) {
      const policy = command.meta.history;

      if (inversePatches.length === 0 || policy.mode === "skip") {
        return state;
      }

      if (policy.mode === "merge") {
        return mergeHistoryEntry(state, command, forwardPatches, inversePatches);
      }

      const entry: HistoryEntry = {
        commandId: command.id,
        label: policy.label,
        forwardPatches,
        inversePatches,
        timestamp: command.meta.timestamp,
      };

      return {
        past: [...state.past, entry],
        future: [],
        lastAppliedCommandId: command.id,
        transaction: null,
      };
    },
    undo(state) {
      const entry = state.session.history.past[state.session.history.past.length - 1];

      if (!entry) {
        return null;
      }

      const patches = preserveTransientTraceState(
        entry.inversePatches,
        state.document.trace,
      );

      return {
        nextSession: {
          ...state.session,
          history: {
            past: state.session.history.past.slice(0, -1),
            future: [entry, ...state.session.history.future],
            lastAppliedCommandId: entry.commandId,
            transaction: null,
          },
          persistence: {
            ...state.session.persistence,
            dirty: true,
          },
        },
        nextUi: state.ui,
        patches,
        inversePatches: [],
        effects: [],
        event: {
          type: "history",
          commandId: entry.commandId,
          label: `Undo ${entry.label}`,
        },
      };
    },
    redo(state) {
      const entry = state.session.history.future[0];

      if (!entry) {
        return null;
      }

      const patches = preserveTransientTraceState(
        entry.forwardPatches,
        state.document.trace,
      );

      return {
        nextSession: {
          ...state.session,
          history: {
            past: [...state.session.history.past, entry],
            future: state.session.history.future.slice(1),
            lastAppliedCommandId: entry.commandId,
            transaction: null,
          },
          persistence: {
            ...state.session.persistence,
            dirty: true,
          },
        },
        nextUi: state.ui,
        patches,
        inversePatches: [],
        effects: [],
        event: {
          type: "history",
          commandId: entry.commandId,
          label: `Redo ${entry.label}`,
        },
      };
    },
  };
}

function preserveTransientTraceState(
  patches: DocumentPatch[],
  currentTrace: TraceDocument | null,
): DocumentPatch[] {
  return patches.map((patch) => {
    if (patch.type === "trace.upsert") {
      return {
        ...patch,
        trace: {
          ...patch.trace,
          ...getPreservedTraceFields(currentTrace, patch.trace),
        },
      };
    }

    if (patch.type === "trace.update") {
      const changes: TraceUpdateChanges = { ...patch.changes };

      for (const field of TRANSIENT_TRACE_FIELDS) {
        if (!(field in changes)) {
          continue;
        }

        if (currentTrace) {
          changes[field] = currentTrace[field] as never;
        } else {
          delete changes[field];
        }
      }

      return {
        ...patch,
        changes,
      };
    }

    return patch;
  });
}

function getPreservedTraceFields(
  currentTrace: TraceDocument | null,
  fallbackTrace: TraceDocument,
): Pick<TraceDocument, (typeof TRANSIENT_TRACE_FIELDS)[number]> {
  return {
    visible: currentTrace?.visible ?? true,
    blendMode: currentTrace?.blendMode ?? fallbackTrace.blendMode,
    opacity: currentTrace?.opacity ?? fallbackTrace.opacity,
    locked: currentTrace?.locked ?? true,
  };
}

function mergeHistoryEntry(
  state: HistoryState,
  command: EditorCommand,
  forwardPatches: DocumentPatch[],
  inversePatches: DocumentPatch[],
): HistoryState {
  const policy = command.meta.history;

  if (policy.mode !== "merge") {
    throw new Error('mergeHistoryEntry requires a command with history mode "merge"');
  }

  const entry: HistoryEntry = {
    commandId: command.id,
    label: policy.label,
    forwardPatches: coalesceDocumentPatches(forwardPatches),
    inversePatches: coalesceInverseDocumentPatches(inversePatches),
    timestamp: command.meta.timestamp,
  };

  const activeTransaction = state.transaction;

  if (activeTransaction && activeTransaction.id === policy.transactionKey) {
    return {
      ...state,
      past: [
        ...state.past.slice(0, -1),
        {
          ...entry,
          forwardPatches: coalesceDocumentPatches([
            ...activeTransaction.forwardPatches,
            ...forwardPatches,
          ]),
          inversePatches: coalesceInverseDocumentPatches([
            ...activeTransaction.inversePatches,
            ...inversePatches,
          ]),
        },
      ],
      future: [],
      lastAppliedCommandId: command.id,
      transaction: {
        ...activeTransaction,
        forwardPatches: coalesceDocumentPatches([
          ...activeTransaction.forwardPatches,
          ...forwardPatches,
        ]),
        inversePatches: coalesceInverseDocumentPatches([
          ...activeTransaction.inversePatches,
          ...inversePatches,
        ]),
      },
    };
  }

  return {
    past: [...state.past, entry],
    future: [],
    lastAppliedCommandId: command.id,
    transaction: {
      id: policy.transactionKey,
      label: policy.label,
      forwardPatches: entry.forwardPatches,
      inversePatches: entry.inversePatches,
    },
  };
}
