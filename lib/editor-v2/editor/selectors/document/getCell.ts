import type { EditorStoreState, GridCellValue } from "../../store/state";

export function getCell(
  state: EditorStoreState,
  x: number,
  y: number,
): GridCellValue | null {
  const { width, height, cells } = state.document.grid;

  if (x < 0 || y < 0 || x >= width || y >= height) {
    return null;
  }

  return cells[y * width + x] ?? null;
}
