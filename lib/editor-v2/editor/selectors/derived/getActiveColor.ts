import type { EditorStoreState, PaletteColor } from "../../store/state";
import { getActiveColorId } from "../session/getActiveColorId";

export function getActiveColor(state: EditorStoreState): PaletteColor | null {
  const activeColorId = getActiveColorId(state);

  if (!activeColorId) {
    return null;
  }

  return state.document.palette.colorsById[activeColorId] ?? null;
}
