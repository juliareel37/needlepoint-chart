import type { ViewportState } from "../../store/state";
import type { EditorCommandHandler } from "./types";
import type { PanViewportCommand, SetViewportZoomCommand } from "../types";

const MIN_ZOOM = 0.01;
const MAX_ZOOM = 16;

export const setViewportZoomCommandHandler: EditorCommandHandler<SetViewportZoomCommand> = {
  canHandle(command): command is SetViewportZoomCommand {
    return command.kind === "viewport.setZoom";
  },
  handle(state, command) {
    const nextZoom = clampZoom(command.payload.zoom);
    const anchor = command.payload.anchor;
    const currentViewport = state.session.viewport;
    const nextOffsetX = anchor
      ? anchor.x - ((anchor.x - currentViewport.offsetX) / currentViewport.zoom) * nextZoom
      : currentViewport.offsetX;
    const nextOffsetY = anchor
      ? anchor.y - ((anchor.y - currentViewport.offsetY) / currentViewport.zoom) * nextZoom
      : currentViewport.offsetY;

    return {
      nextSession: {
        ...state.session,
        viewport: {
          ...currentViewport,
          zoom: nextZoom,
          offsetX: nextOffsetX,
          offsetY: nextOffsetY,
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

export const panViewportCommandHandler: EditorCommandHandler<PanViewportCommand> = {
  canHandle(command): command is PanViewportCommand {
    return command.kind === "viewport.pan";
  },
  handle(state, command) {
    return {
      nextSession: {
        ...state.session,
        viewport: {
          ...state.session.viewport,
          offsetX: state.session.viewport.offsetX + command.payload.deltaX,
          offsetY: state.session.viewport.offsetY + command.payload.deltaY,
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

function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}
