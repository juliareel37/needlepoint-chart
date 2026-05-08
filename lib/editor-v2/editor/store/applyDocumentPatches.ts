import type {
  EditorDocumentState,
  GridCellValue,
  TextEntity,
} from "./state";
import { coalesceDocumentPatches, type DocumentPatch } from "./patches";

export class UnsupportedDocumentPatchError extends Error {
  constructor(patchType: DocumentPatch["type"]) {
    super(`Unsupported document patch: ${patchType}`);
    this.name = "UnsupportedDocumentPatchError";
  }
}

export function applyDocumentPatches(
  document: EditorDocumentState,
  patches: DocumentPatch[],
): EditorDocumentState {
  return coalesceDocumentPatches(patches).reduce(applyDocumentPatch, document);
}

function applyDocumentPatch(
  document: EditorDocumentState,
  patch: DocumentPatch,
): EditorDocumentState {
  switch (patch.type) {
    case "grid.replaceCells":
      return {
        ...document,
        grid: {
          ...document.grid,
          cells: replaceGridCells(document.grid.cells, patch.cells),
        },
      };
    case "grid.resize":
      return {
        ...document,
        grid: {
          ...document.grid,
          width: patch.width,
          height: patch.height,
          cells: [...patch.cells],
        },
      };
    case "palette.replaceColor":
      return applyReplaceColorPatch(document, patch.fromColorId, patch.toColorId);
    case "palette.setExtractedColorIds":
      return {
        ...document,
        palette: {
          ...document.palette,
          extractedPaletteIds: [...patch.colorIds],
        },
      };
    case "palette.assignSymbols":
      return {
        ...document,
        palette: {
          ...document.palette,
          symbolAssignments: {
            ...document.palette.symbolAssignments,
            ...patch.assignments,
          },
        },
      };
    case "trace.upsert":
      return {
        ...document,
        trace: patch.trace,
      };
    case "trace.update":
      if (!document.trace) {
        return document;
      }

      return {
        ...document,
        trace: {
          ...document.trace,
          ...patch.changes,
        },
      };
    case "trace.remove":
      return {
        ...document,
        trace: null,
      };
    case "project.metadata.update":
      return {
        ...document,
        project: {
          ...document.project,
          ...patch.changes,
        },
      };
    case "canvasPreferences.update":
      return {
        ...document,
        canvasPreferences: {
          ...document.canvasPreferences,
          ...patch.changes,
        },
      };
    case "text.upsertEntity":
      return {
        ...document,
        text: {
          ...document.text,
          entities: upsertTextEntity(document.text.entities, patch.entity),
        },
      };
    case "text.removeEntity":
      return {
        ...document,
        text: {
          ...document.text,
          entities: document.text.entities.filter(
            (entity) => entity.id !== patch.entityId,
          ),
        },
      };
    default:
      return assertUnreachablePatch(patch);
  }
}

function replaceGridCells(
  cells: GridCellValue[],
  replacements: Array<{ index: number; value: GridCellValue }>,
): GridCellValue[] {
  const next = [...cells];

  for (const replacement of replacements) {
    next[replacement.index] = replacement.value;
  }

  return next;
}

function applyReplaceColorPatch(
  document: EditorDocumentState,
  fromColorId: string,
  toColorId: string,
): EditorDocumentState {
  const nextCells = document.grid.cells.map((cell) =>
    cell === fromColorId ? toColorId : cell,
  );
  const nextExtracted = dedupeColorIds(
    document.palette.extractedPaletteIds.map((colorId) =>
      colorId === fromColorId ? toColorId : colorId,
    ),
  );
  const nextAssignments = { ...document.palette.symbolAssignments };

  if (nextAssignments[fromColorId] && !nextAssignments[toColorId]) {
    nextAssignments[toColorId] = nextAssignments[fromColorId];
  }
  delete nextAssignments[fromColorId];

  return {
    ...document,
    grid: {
      ...document.grid,
      cells: nextCells,
    },
    palette: {
      ...document.palette,
      extractedPaletteIds: nextExtracted,
      symbolAssignments: nextAssignments,
    },
  };
}

function upsertTextEntity(entities: TextEntity[], nextEntity: TextEntity): TextEntity[] {
  const index = entities.findIndex((entity) => entity.id === nextEntity.id);

  if (index === -1) {
    return [...entities, nextEntity];
  }

  const next = [...entities];
  next[index] = nextEntity;
  return next;
}

function dedupeColorIds(colorIds: string[]): string[] {
  return Array.from(new Set(colorIds));
}

function assertUnreachablePatch(patch: never): never {
  void patch;
  throw new UnsupportedDocumentPatchError("unknown" as DocumentPatch["type"]);
}
