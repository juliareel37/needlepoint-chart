import type { EditorStoreState } from "../../store/state";

export function getActiveColorId(state: EditorStoreState): string | null {
  return state.session.activeTool.colorId;
}
