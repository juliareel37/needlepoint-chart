import type { EditorStoreState } from "../../store/state";

export interface UsedColorSummary {
  colorId: string;
  count: number;
}

export function getUsedColors(state: EditorStoreState): UsedColorSummary[] {
  const counts = new Map<string, number>();

  for (const cell of state.document.grid.cells) {
    if (!cell) {
      continue;
    }

    counts.set(cell, (counts.get(cell) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([colorId, count]) => ({ colorId, count }))
    .sort((left, right) => right.count - left.count);
}
