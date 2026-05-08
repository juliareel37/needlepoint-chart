import type {
  CanvasPreferencesDocument,
  GridCellValue,
  ProjectDocument,
  TextEntity,
  TraceDocument,
} from "./state";

export type DocumentPatch =
  | ReplaceGridCellsPatch
  | ResizeGridPatch
  | ReplaceColorPatch
  | SetExtractedPaletteIdsPatch
  | AssignPaletteSymbolsPatch
  | UpsertTracePatch
  | UpdateTracePatch
  | RemoveTracePatch
  | UpdateProjectMetadataPatch
  | UpdateCanvasPreferencesPatch
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

export interface SetExtractedPaletteIdsPatch {
  type: "palette.setExtractedColorIds";
  colorIds: string[];
}

export interface AssignPaletteSymbolsPatch {
  type: "palette.assignSymbols";
  assignments: Record<string, string>;
}

export interface UpsertTracePatch {
  type: "trace.upsert";
  trace: TraceDocument;
}

export type TraceUpdateChanges = Partial<
  Pick<
    TraceDocument,
    | "visible"
    | "blendMode"
    | "opacity"
    | "cropX"
    | "cropY"
    | "cropWidth"
    | "cropHeight"
    | "offsetX"
    | "offsetY"
    | "scale"
    | "rotation"
    | "locked"
  >
>;

export interface UpdateTracePatch {
  type: "trace.update";
  changes: TraceUpdateChanges;
}

export interface RemoveTracePatch {
  type: "trace.remove";
}

export interface UpdateProjectMetadataPatch {
  type: "project.metadata.update";
  changes: Partial<ProjectDocument>;
}

export type CanvasPreferencesChanges = Partial<CanvasPreferencesDocument>;

export interface UpdateCanvasPreferencesPatch {
  type: "canvasPreferences.update";
  changes: CanvasPreferencesChanges;
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
  let pendingTracePatch: UpdateTracePatch | null = null;

  const flushPendingPatches = () => {
    if (pendingGridPatch) {
      coalesced.push(pendingGridPatch);
      pendingGridPatch = null;
    }

    if (pendingTracePatch) {
      coalesced.push(pendingTracePatch);
      pendingTracePatch = null;
    }
  };

  for (const patch of patches) {
    if (patch.type === "grid.replaceCells") {
      if (pendingTracePatch) {
        coalesced.push(pendingTracePatch);
        pendingTracePatch = null;
      }

      pendingGridPatch = pendingGridPatch
        ? mergeReplaceGridCellsPatches(pendingGridPatch, patch, strategy)
        : patch;
      continue;
    }

    if (pendingGridPatch) {
      coalesced.push(pendingGridPatch);
      pendingGridPatch = null;
    }

    if (patch.type === "trace.update") {
      pendingTracePatch = pendingTracePatch
        ? mergeUpdateTracePatches(pendingTracePatch, patch, strategy)
        : patch;
      continue;
    }

    if (pendingTracePatch) {
      coalesced.push(pendingTracePatch);
      pendingTracePatch = null;
    }

    coalesced.push(patch);
  }

  flushPendingPatches();

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

function mergeUpdateTracePatches(
  previous: UpdateTracePatch,
  next: UpdateTracePatch,
  strategy: "first-wins" | "last-wins",
): UpdateTracePatch {
  const changes: TraceUpdateChanges = { ...previous.changes };

  for (const key of Object.keys(next.changes) as Array<keyof TraceUpdateChanges>) {
    if (strategy === "first-wins" && key in changes) {
      continue;
    }

    changes[key] = next.changes[key] as never;
  }

  return {
    type: "trace.update",
    changes,
  };
}
