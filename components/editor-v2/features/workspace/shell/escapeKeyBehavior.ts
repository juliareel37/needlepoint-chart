"use client";

export interface WorkspaceEscapeState {
  highlightedColorActive: boolean;
  iconPlacementActive: boolean;
  previewMode: boolean;
  textPlacementActive: boolean;
  traceConversionPreviewActive: boolean;
  traceCropEditing: boolean;
  traceRepositionActive: boolean;
}

export type WorkspaceEscapeAction =
  | "exit-trace-conversion-preview"
  | "cancel-trace-crop"
  | "cancel-trace-reposition"
  | "cancel-text-placement"
  | "cancel-icon-placement"
  | "clear-highlight"
  | "exit-preview";

export function getWorkspaceEscapeAction(
  state: WorkspaceEscapeState,
): WorkspaceEscapeAction | null {
  if (state.traceConversionPreviewActive) {
    return "exit-trace-conversion-preview";
  }

  if (state.traceCropEditing) {
    return "cancel-trace-crop";
  }

  if (state.traceRepositionActive) {
    return "cancel-trace-reposition";
  }

  if (state.textPlacementActive) {
    return "cancel-text-placement";
  }

  if (state.iconPlacementActive) {
    return "cancel-icon-placement";
  }

  if (state.highlightedColorActive) {
    return "clear-highlight";
  }

  if (state.previewMode) {
    return "exit-preview";
  }

  return null;
}
