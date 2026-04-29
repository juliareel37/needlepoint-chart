import type { EditorCommand } from "../commands/types";
import type { EditorEffect } from "./effects";
import type { DocumentPatch } from "./patches";
import type { EditorStoreState } from "./state";

export interface EditorStore {
  getState(): EditorStoreState;
  subscribe(listener: EditorStoreListener): EditorUnsubscribe;
  dispatch(command: EditorCommand): EditorCommandResult;
  run(effect: EditorEffect): Promise<void>;
}

export type EditorStoreListener = (
  nextState: EditorStoreState,
  prevState: EditorStoreState,
  event: EditorStoreEvent,
) => void;

export type EditorUnsubscribe = () => void;

export interface EditorCommandResult {
  commandId: string;
  ok: boolean;
  error?: EditorCommandError;
  emittedEffects: EditorEffect[];
}

export interface EditorCommandError {
  code: string;
  message: string;
  cause?: unknown;
}

export interface EditorStoreEvent {
  type: "command" | "history" | "session" | "ui";
  commandId?: string;
  label?: string;
  patches?: DocumentPatch[];
}
