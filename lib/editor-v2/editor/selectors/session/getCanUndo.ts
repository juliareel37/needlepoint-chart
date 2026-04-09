import type { EditorStoreState } from "../../store/state";

export function getCanUndo(state: EditorStoreState): boolean {
  return state.session.history.past.length > 0;
}
