import type { GridCellValue, PaletteColor } from "@/lib/editor-v2/editor/store";

export interface LibraryStitchSnapshot {
  width: number;
  height: number;
  cells: Array<string | null>;
}

export function buildLibraryStitchSnapshot(options: {
  gridWidth: number;
  gridHeight: number;
  cells: GridCellValue[];
  colorsById: Record<string, PaletteColor>;
}): LibraryStitchSnapshot {
  const { gridWidth, gridHeight, cells, colorsById } = options;
  const safeGridWidth = Math.max(1, Math.floor(gridWidth));
  const safeGridHeight = Math.max(1, Math.floor(gridHeight));
  const snapshotCells = cells
    .slice(0, safeGridWidth * safeGridHeight)
    .map((colorId) => (colorId && colorsById[colorId] ? colorsById[colorId].hex : null));

  return {
    width: safeGridWidth,
    height: safeGridHeight,
    cells: snapshotCells,
  };
}
