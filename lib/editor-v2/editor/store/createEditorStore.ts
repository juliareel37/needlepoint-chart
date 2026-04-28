import { commandHandlers } from "../commands/registry";
import type { EditorCommandContext } from "../commands/types";
import { createHistoryEngine } from "../history/HistoryEngine";
import type { HistoryEngine } from "../history/HistoryEngine";
import type {
  EditorCommandResult,
  EditorStore,
  EditorStoreListener,
  EditorStoreEvent,
} from "./EditorStore";
import {
  NoopEditorEffectRunner,
  type EditorEffect,
  type EditorEffectRunner,
} from "./effects";
import { applyDocumentPatches } from "./applyDocumentPatches";
import {
  createInitialEditorStoreState,
  type EditorStoreState,
} from "./state";

interface CreateEditorStoreOptions {
  initialState?: EditorStoreState;
  effectRunner?: EditorEffectRunner;
  historyEngine?: HistoryEngine;
}

export function createEditorStore(
  options: CreateEditorStoreOptions = {},
): EditorStore {
  let state = options.initialState ?? createInitialEditorStoreState();
  const listeners = new Set<EditorStoreListener>();
  const effectRunner = options.effectRunner ?? new NoopEditorEffectRunner();
  const historyEngine = options.historyEngine ?? createHistoryEngine();

  const context: EditorCommandContext = {
    now: () => Date.now(),
    generateId: () => createCommandId(),
  };

  return {
    getState() {
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    dispatch(command) {
      if (command.kind === "history.undo" || command.kind === "history.redo") {
        try {
          const prevState = state;
          const execution =
            command.kind === "history.undo"
              ? historyEngine.undo(prevState)
              : historyEngine.redo(prevState);

          if (!execution) {
            return {
              commandId: command.id,
              ok: true,
              emittedEffects: [],
            };
          }

          const nextDocument = applyDocumentPatches(
            prevState.document,
            execution.patches,
          );
          const nextState: EditorStoreState = {
            document: nextDocument,
            session: execution.nextSession,
            ui: execution.nextUi,
          };

          state = nextState;
          notifyListeners(listeners, nextState, prevState, {
            ...execution.event,
            patches: execution.patches,
          });

          return {
            commandId: command.id,
            ok: true,
            emittedEffects: execution.effects,
          };
        } catch (error) {
          return buildErrorResult(
            command.id,
            "HISTORY_EXECUTION_FAILED",
            `Command "${command.kind}" failed`,
            error,
          );
        }
      }

      const handler = commandHandlers.find((candidate) =>
        candidate.canHandle(command),
      );

      if (!handler) {
        return buildErrorResult(
          command.id,
          "UNKNOWN_COMMAND",
          `No handler registered for command kind "${command.kind}"`,
        );
      }

      try {
        const prevState = state;
        const execution = handler.handle(prevState, command, context);
        const nextDocument = applyDocumentPatches(
          prevState.document,
          execution.patches,
        );

        let nextState: EditorStoreState = {
          document: nextDocument,
          session: execution.nextSession,
          ui: execution.nextUi,
        };

        nextState = {
          ...nextState,
          session: {
            ...nextState.session,
            history: historyEngine.record(
              prevState.session.history,
              command,
              execution.patches,
              execution.inversePatches,
            ),
          },
        };

        state = nextState;
        notifyListeners(listeners, nextState, prevState, {
          ...execution.event,
          patches: execution.patches,
        });

        return {
          commandId: command.id,
          ok: true,
          emittedEffects: execution.effects,
        };
      } catch (error) {
        return buildErrorResult(
          command.id,
          "COMMAND_EXECUTION_FAILED",
          `Command "${command.kind}" failed`,
          error,
        );
      }
    },
    run(effect: EditorEffect) {
      return effectRunner.run(effect);
    },
  };
}

function createCommandId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function notifyListeners(
  listeners: Set<EditorStoreListener>,
  nextState: EditorStoreState,
  prevState: EditorStoreState,
  event: EditorStoreEvent,
): void {
  for (const listener of listeners) {
    listener(nextState, prevState, event);
  }
}

function buildErrorResult(
  commandId: string,
  code: string,
  message: string,
  cause?: unknown,
): EditorCommandResult {
  return {
    commandId,
    ok: false,
    error: {
      code,
      message,
      cause,
    },
    emittedEffects: [],
  };
}
