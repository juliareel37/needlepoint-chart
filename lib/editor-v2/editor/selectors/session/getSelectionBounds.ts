import type { EditorStoreState, GridRect } from "../../store/state";

export function getSelectionBounds(state: EditorStoreState): GridRect | null {
  return state.session.selection.rect;
}
