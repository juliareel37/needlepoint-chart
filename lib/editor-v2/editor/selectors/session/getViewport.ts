import type { EditorStoreState, ViewportState } from "../../store/state";

export function getViewport(state: EditorStoreState): ViewportState {
  return state.session.viewport;
}
