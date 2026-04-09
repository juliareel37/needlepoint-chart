import type { EditorStoreState } from "../../store/state";

export function getCanRedo(state: EditorStoreState): boolean {
  return state.session.history.future.length > 0;
}
