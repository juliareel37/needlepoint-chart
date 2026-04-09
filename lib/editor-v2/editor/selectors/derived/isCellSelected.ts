import type { EditorStoreState } from "../../store/state";
import { isCellInSelection } from "../../selection/lassoGeometry";

export function isCellSelected(
  state: EditorStoreState,
  x: number,
  y: number,
): boolean {
  return isCellInSelection(state, { x, y });
}
