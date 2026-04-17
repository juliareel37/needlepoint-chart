import type { UpdateProjectMetadataPatch } from "../../store/patches";
import type { EditorCommandHandler } from "./types";
import type { SetProjectTitleCommand } from "../types";

export const setProjectTitleCommandHandler: EditorCommandHandler<SetProjectTitleCommand> = {
  canHandle(command): command is SetProjectTitleCommand {
    return command.kind === "project.setTitle";
  },
  handle(state, command, context) {
    const trimmedTitle = command.payload.title.trim();
    const nextTitle =
      trimmedTitle.length > 0 ? trimmedTitle : state.document.project.title;
    const previousTitle = state.document.project.title;
    const hasChanged = nextTitle !== previousTitle;

    const patches: UpdateProjectMetadataPatch[] = hasChanged
      ? [
          {
            type: "project.metadata.update",
            changes: {
              title: nextTitle,
              updatedAt: new Date(context.now()).toISOString(),
            },
          },
        ]
      : [];
    const inversePatches: UpdateProjectMetadataPatch[] = hasChanged
      ? [
          {
            type: "project.metadata.update",
            changes: {
              title: previousTitle,
              updatedAt: state.document.project.updatedAt,
            },
          },
        ]
      : [];

    return {
      nextSession: {
        ...state.session,
        persistence: {
          ...state.session.persistence,
          dirty: hasChanged ? true : state.session.persistence.dirty,
        },
      },
      nextUi: state.ui,
      patches,
      inversePatches,
      effects: [],
      event: {
        type: "command",
        commandId: command.id,
        label:
          command.meta.history.mode === "skip" ? undefined : "Rename Project",
      },
    };
  },
};
