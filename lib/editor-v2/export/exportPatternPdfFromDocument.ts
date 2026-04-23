import { exportPatternPdf } from "@/lib/pdf";
import type { Color } from "@/lib/grid";
import type { EditorDocumentState } from "@/lib/editor-v2/editor/store";

const PDF_EXPORT_CELL_SIZE = 28;

export function exportPatternPdfFromDocument(
  document: EditorDocumentState,
): void {
  const paletteEntries = Object.values(document.palette.colorsById);
  const legacyPaletteByEditorId = new Map<string, Color>();
  const paletteByLegacyId = new Map<number, Color>();
  const symbolMap = new Map<number, string>();
  const legacyGrid = new Uint16Array(document.grid.width * document.grid.height);
  let nextLegacyColorId = 1;

  for (const color of paletteEntries) {
    const legacyColor = createLegacyColor(color, nextLegacyColorId);
    legacyPaletteByEditorId.set(color.id, legacyColor);
    paletteByLegacyId.set(legacyColor.id, legacyColor);

    const symbol = document.palette.symbolAssignments[color.id];
    if (symbol) {
      symbolMap.set(legacyColor.id, symbol);
    }

    nextLegacyColorId += 1;
  }

  for (let index = 0; index < document.grid.cells.length; index += 1) {
    const colorId = document.grid.cells[index];

    if (!colorId) {
      legacyGrid[index] = 0;
      continue;
    }

    const legacyColor = legacyPaletteByEditorId.get(colorId);
    legacyGrid[index] = legacyColor ? legacyColor.id : 0;
  }

  const usedColorCounts = new Map<string, number>();
  for (const colorId of document.grid.cells) {
    if (!colorId) {
      continue;
    }

    usedColorCounts.set(colorId, (usedColorCounts.get(colorId) ?? 0) + 1);
  }

  const usedColors = Array.from(usedColorCounts.entries())
    .map(([colorId, count]) => {
      const legacyColor = legacyPaletteByEditorId.get(colorId);
      return legacyColor ? { color: legacyColor, count } : null;
    })
    .filter((entry): entry is { color: Color; count: number } => entry !== null)
    .sort((left, right) => right.count - left.count);

  exportPatternPdf({
    title: document.project.title,
    usedColors,
    grid: legacyGrid,
    paletteById: paletteByLegacyId,
    symbolMap,
    width: document.grid.width,
    height: document.grid.height,
    cellSize: PDF_EXPORT_CELL_SIZE,
  });
}

function createLegacyColor(
  color: EditorDocumentState["palette"]["colorsById"][string],
  legacyId: number,
): Color {
  return {
    id: legacyId,
    name: color.name,
    hex: color.hex,
    code: color.code,
  };
}
