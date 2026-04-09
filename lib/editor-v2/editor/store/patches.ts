import type {
  GridCellValue,
  ProjectDocument,
  TextEntity,
  TraceDocument,
} from "./state";

export type DocumentPatch =
  | ReplaceGridCellsPatch
  | ResizeGridPatch
  | ReplaceColorPatch
  | UpsertTracePatch
  | RemoveTracePatch
  | UpdateProjectMetadataPatch
  | UpsertTextEntityPatch
  | RemoveTextEntityPatch;

export interface ReplaceGridCellsPatch {
  type: "grid.replaceCells";
  cells: Array<{ index: number; value: GridCellValue }>;
}

export interface ResizeGridPatch {
  type: "grid.resize";
  width: number;
  height: number;
  cells: GridCellValue[];
}

export interface ReplaceColorPatch {
  type: "palette.replaceColor";
  fromColorId: string;
  toColorId: string;
}

export interface UpsertTracePatch {
  type: "trace.upsert";
  trace: TraceDocument;
}

export interface RemoveTracePatch {
  type: "trace.remove";
}

export interface UpdateProjectMetadataPatch {
  type: "project.metadata.update";
  changes: Partial<ProjectDocument>;
}

export interface UpsertTextEntityPatch {
  type: "text.upsertEntity";
  entity: TextEntity;
}

export interface RemoveTextEntityPatch {
  type: "text.removeEntity";
  entityId: string;
}

export function coalesceDocumentPatches(
  patches: DocumentPatch[],
): DocumentPatch[] {
  return coalesceDocumentPatchesWithStrategy(patches, "last-wins");
}

export function coalesceInverseDocumentPatches(
  patches: DocumentPatch[],
): DocumentPatch[] {
  return coalesceDocumentPatchesWithStrategy(patches, "first-wins");
}

function coalesceDocumentPatchesWithStrategy(
  patches: DocumentPatch[],
  strategy: "first-wins" | "last-wins",
): DocumentPatch[] {
  const coalesced: DocumentPatch[] = [];
  let pendingGridPatch: ReplaceGridCellsPatch | null = null;

  for (const patch of patches) {
    if (patch.type === "grid.replaceCells") {
      pendingGridPatch = pendingGridPatch
        ? mergeReplaceGridCellsPatches(pendingGridPatch, patch, strategy)
        : patch;
      continue;
    }

    if (pendingGridPatch) {
      coalesced.push(pendingGridPatch);
      pendingGridPatch = null;
    }

    coalesced.push(patch);
  }

  if (pendingGridPatch) {
    coalesced.push(pendingGridPatch);
  }

  return coalesced;
}

function mergeReplaceGridCellsPatches(
  previous: ReplaceGridCellsPatch,
  next: ReplaceGridCellsPatch,
  strategy: "first-wins" | "last-wins",
): ReplaceGridCellsPatch {
  const replacements = new Map<number, GridCellValue>();

  for (const replacement of previous.cells) {
    replacements.set(replacement.index, replacement.value);
  }

  for (const replacement of next.cells) {
    if (strategy === "first-wins" && replacements.has(replacement.index)) {
      continue;
    }

    replacements.set(replacement.index, replacement.value);
  }

  return {
    type: "grid.replaceCells",
    cells: Array.from(replacements, ([index, value]) => ({
      index,
      value,
    })),
  };
}
