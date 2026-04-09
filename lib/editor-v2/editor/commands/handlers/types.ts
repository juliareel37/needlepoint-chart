import type { EditorStoreEvent } from "../../store/EditorStore";
import type { EditorEffect } from "../../store/effects";
import type { DocumentPatch } from "../../store/patches";
import type {
  EditorSessionState,
  EditorStoreState,
  EditorUiState,
} from "../../store/state";
import type { EditorCommand, EditorCommandContext } from "../types";

export interface EditorCommandExecution {
  nextSession: EditorSessionState;
  nextUi: EditorUiState;
  patches: DocumentPatch[];
  inversePatches: DocumentPatch[];
  effects: EditorEffect[];
  event: EditorStoreEvent;
}

export interface EditorCommandHandler<TCommand extends EditorCommand = EditorCommand> {
  canHandle(command: EditorCommand): command is TCommand;
  handle(
    state: EditorStoreState,
    command: TCommand,
    context: EditorCommandContext,
  ): EditorCommandExecution;
}
