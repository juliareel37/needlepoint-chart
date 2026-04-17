import type { EditorCommandExecution, EditorCommandHandler } from "./types";
import type { EditorStoreState } from "../../store/state";
import type {
  BeginTextPlacementCommand,
  CancelTextPlacementCommand,
  PreviewTextPlacementCommand,
  UpdateTextPlacementCommand,
} from "../types";

export const beginTextPlacementCommandHandler: EditorCommandHandler<BeginTextPlacementCommand> = {
  canHandle(command): command is BeginTextPlacementCommand {
    return command.kind === "text.beginPlacement";
  },
  handle(state, command) {
    return {
      nextSession: {
        ...state.session,
        textInteraction: {
          ...state.session.textInteraction,
          placement: {
            text: command.payload.text,
            intrinsicWidth: command.payload.intrinsicWidth,
            intrinsicHeight: command.payload.intrinsicHeight,
            baseFontSize: command.payload.baseFontSize,
            fontFamily: command.payload.fontFamily,
            fontStyle: command.payload.fontStyle,
            fontWeight: command.payload.fontWeight,
            underline: command.payload.underline,
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

export const previewTextPlacementCommandHandler: EditorCommandHandler<PreviewTextPlacementCommand> = {
  canHandle(command): command is PreviewTextPlacementCommand {
    return command.kind === "text.previewPlacement";
  },
  handle(state, command) {
    const placement = state.session.textInteraction.placement;

    if (!placement) {
      return buildTextSessionNoop(state, command.id);
    }

    return {
      nextSession: {
        ...state.session,
        textInteraction: {
          ...state.session.textInteraction,
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

export const updateTextPlacementCommandHandler: EditorCommandHandler<UpdateTextPlacementCommand> = {
  canHandle(command): command is UpdateTextPlacementCommand {
    return command.kind === "text.updatePlacement";
  },
  handle(state, command) {
    const placement = state.session.textInteraction.placement;

    if (!placement) {
      return buildTextSessionNoop(state, command.id);
    }

    return {
      nextSession: {
        ...state.session,
        textInteraction: {
          ...state.session.textInteraction,
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

export const cancelTextPlacementCommandHandler: EditorCommandHandler<CancelTextPlacementCommand> = {
  canHandle(command): command is CancelTextPlacementCommand {
    return command.kind === "text.cancelPlacement";
  },
  handle(state, command) {
    if (!state.session.textInteraction.placement) {
      return buildTextSessionNoop(state, command.id);
    }

    return {
      nextSession: {
        ...state.session,
        textInteraction: {
          ...state.session.textInteraction,
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

function buildTextSessionNoop(
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
