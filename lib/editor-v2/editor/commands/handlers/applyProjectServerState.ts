import type { UpdateProjectMetadataPatch } from "../../store/patches";
import type { EditorCommandHandler } from "./types";
import type { ApplyProjectServerStateCommand } from "../types";

export const applyProjectServerStateCommandHandler: EditorCommandHandler<
  ApplyProjectServerStateCommand
> = {
  canHandle(command): command is ApplyProjectServerStateCommand {
    return command.kind === "project.applyServerState";
  },
  handle(state, command) {
    const patches: UpdateProjectMetadataPatch[] = [
      {
        type: "project.metadata.update",
        changes: {
          id: command.payload.id,
          title: command.payload.title,
          createdAt: command.payload.createdAt,
          updatedAt: command.payload.updatedAt,
        },
      },
    ];

    return {
      nextSession: {
        ...state.session,
        persistence: {
          ...state.session.persistence,
          currentDraftId: command.payload.id,
          dirty: false,
          saving: false,
          loading: false,
          lastSavedAt: command.payload.lastSavedAt,
          restoreSource: "none",
          versionPreview: null,
        },
      },
      nextUi: state.ui,
      patches,
      inversePatches: [],
      effects: [],
      event: {
        type: "session",
        commandId: command.id,
      },
    };
  },
};
