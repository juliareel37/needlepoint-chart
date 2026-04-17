import type { EditorStoreState, PaletteColor } from "../../store/state";

export function getPaletteColors(state: EditorStoreState): PaletteColor[] {
  return Object.values(state.document.palette.colorsById);
}
