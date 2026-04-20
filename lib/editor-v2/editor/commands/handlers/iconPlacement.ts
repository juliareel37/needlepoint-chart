import type { EditorCommandExecution, EditorCommandHandler } from "./types";
import type { EditorStoreState } from "../../store/state";
import type {
  BeginIconPlacementCommand,
  CancelIconPlacementCommand,
  PreviewIconPlacementCommand,
  UpdateIconPlacementCommand,
} from "../types";

export const beginIconPlacementCommandHandler: EditorCommandHandler<BeginIconPlacementCommand> = {
  canHandle(command): command is BeginIconPlacementCommand {
    return command.kind === "icon.beginPlacement";
  },
  handle(state, command) {
    return {
      nextSession: {
        ...state.session,
        iconInteraction: {
          placement: {
            iconId: command.payload.iconId,
            name: command.payload.name,
            src: command.payload.src,
            intrinsicWidth: command.payload.intrinsicWidth,
            intrinsicHeight: command.payload.intrinsicHeight,
            offsetX: command.payload.offsetX ?? 0,
            offsetY: command.payload.offsetY ?? 0,
            scale: command.payload.scale ?? 1,
          },
        },
      },
      nextUi: state.ui,
      patches: [],
      inversePatches: [],
      effects: [],
      event: {
        type: "session",
        commandId: command.id,
      },
    };
  },
};

export const previewIconPlacementCommandHandler: EditorCommandHandler<PreviewIconPlacementCommand> = {
  canHandle(command): command is PreviewIconPlacementCommand {
    return command.kind === "icon.previewPlacement";
  },
  handle(state, command) {
    const placement = state.session.iconInteraction.placement;

    if (!placement) {
      return buildIconSessionNoop(state, command.id);
    }

    return {
      nextSession: {
        ...state.session,
        iconInteraction: {
          placement: {
            ...placement,
            offsetX: command.payload.offsetX,
            offsetY: command.payload.offsetY,
            scale: command.payload.scale,
          },
        },
      },
      nextUi: state.ui,
      patches: [],
      inversePatches: [],
      effects: [],
      event: {
        type: "session",
        commandId: command.id,
      },
    };
  },
};

export const updateIconPlacementCommandHandler: EditorCommandHandler<UpdateIconPlacementCommand> = {
  canHandle(command): command is UpdateIconPlacementCommand {
    return command.kind === "icon.updatePlacement";
  },
  handle(state, command) {
    const placement = state.session.iconInteraction.placement;

    if (!placement) {
      return buildIconSessionNoop(state, command.id);
    }

    return {
      nextSession: {
        ...state.session,
        iconInteraction: {
          placement: {
            ...placement,
            ...command.payload,
          },
        },
      },
      nextUi: state.ui,
      patches: [],
      inversePatches: [],
      effects: [],
      event: {
        type: "session",
        commandId: command.id,
      },
    };
  },
};

export const cancelIconPlacementCommandHandler: EditorCommandHandler<CancelIconPlacementCommand> = {
  canHandle(command): command is CancelIconPlacementCommand {
    return command.kind === "icon.cancelPlacement";
  },
  handle(state, command) {
    if (!state.session.iconInteraction.placement) {
      return buildIconSessionNoop(state, command.id);
    }

    return {
      nextSession: {
        ...state.session,
        iconInteraction: {
          placement: null,
        },
      },
      nextUi: state.ui,
      patches: [],
      inversePatches: [],
      effects: [],
      event: {
        type: "session",
        commandId: command.id,
      },
    };
  },
};

function buildIconSessionNoop(
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
