import { appendSymbolAssignments } from "@/lib/symbols";
import type { AssignPaletteSymbolsPatch, DocumentPatch } from "../../store/patches";
import type { EditorStoreState } from "../../store/state";

export function buildAssignSymbolsPatch(
  state: EditorStoreState,
  colorIds: string[],
): AssignPaletteSymbolsPatch[] {
  const assignments = appendSymbolAssignments(
    state.document.palette.symbolAssignments,
    colorIds,
  );

  return Object.keys(assignments).length > 0
    ? [{ type: "palette.assignSymbols", assignments }]
    : [];
}

export function buildAppendOnlyInverseSymbolPatches(
  patches: AssignPaletteSymbolsPatch[],
): DocumentPatch[] {
  return patches;
}
