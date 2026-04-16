import type {
  EditorDocumentState,
  GridDocument,
  PaletteDocument,
  TextDocument,
} from "@/lib/editor-v2/editor/store";

export const PERSISTED_EDITOR_V2_SCHEMA_VERSION = 1;

export interface PersistedEditorV2Grid {
  width: number;
  height: number;
  sizingMode: GridDocument["sizingMode"];
  meshCount: number | null;
  widthInches: number | null;
  heightInches: number | null;
  cells: GridDocument["cells"];
}

export interface PersistedEditorV2Palette {
  colorsById: PaletteDocument["colorsById"];
  customPalettesById: PaletteDocument["customPalettesById"];
  extractedPaletteIds: PaletteDocument["extractedPaletteIds"];
  symbolAssignments: PaletteDocument["symbolAssignments"];
}

export interface PersistedEditorV2Trace {
  assetUrl: string;
  fileName: string | null;
  byteSize: number | null;
  mimeType: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;
}

export interface PersistedEditorV2Design {
  schemaVersion: number;
  project: {
    title: string;
  };
  grid: PersistedEditorV2Grid;
  palette: PersistedEditorV2Palette;
  trace: PersistedEditorV2Trace | null;
  text: TextDocument;
}

export interface EditorDesignListItem {
  id: string;
  title: string;
  gridWidth: number;
  gridHeight: number;
  updatedAt: string;
}

export interface PersistedEditorV2DesignRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  data: PersistedEditorV2Design;
}

export function serializeEditorV2Document(
  document: EditorDocumentState,
): PersistedEditorV2Design {
  return {
    schemaVersion: PERSISTED_EDITOR_V2_SCHEMA_VERSION,
    project: {
      title: normalizeProjectTitle(document.project.title),
    },
    grid: {
      width: document.grid.width,
      height: document.grid.height,
      sizingMode: document.grid.sizingMode,
      meshCount: document.grid.meshCount,
      widthInches: document.grid.widthInches,
      heightInches: document.grid.heightInches,
      cells: [...document.grid.cells],
    },
    palette: {
      colorsById: document.palette.colorsById,
      customPalettesById: document.palette.customPalettesById,
      extractedPaletteIds: [...document.palette.extractedPaletteIds],
      symbolAssignments: document.palette.symbolAssignments,
    },
    trace: document.trace
      ? {
          assetUrl: document.trace.assetUrl,
          fileName: document.trace.fileName,
          byteSize: document.trace.byteSize,
          mimeType: document.trace.mimeType,
          imageWidth: document.trace.imageWidth,
          imageHeight: document.trace.imageHeight,
          offsetX: document.trace.offsetX,
          offsetY: document.trace.offsetY,
          scale: document.trace.scale,
          rotation: document.trace.rotation,
        }
      : null,
    text: document.text,
  };
}

export function hydrateEditorV2Document(
  record: PersistedEditorV2DesignRecord,
): EditorDocumentState {
  return {
    project: {
      id: record.id,
      title: normalizeProjectTitle(record.data.project.title),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      sourceVersion: 1,
    },
    grid: {
      width: record.data.grid.width,
      height: record.data.grid.height,
      sizingMode: record.data.grid.sizingMode,
      meshCount: record.data.grid.meshCount,
      widthInches: record.data.grid.widthInches,
      heightInches: record.data.grid.heightInches,
      cells: [...record.data.grid.cells],
    },
    palette: {
      colorsById: record.data.palette.colorsById,
      customPalettesById: record.data.palette.customPalettesById,
      extractedPaletteIds: [...record.data.palette.extractedPaletteIds],
      symbolAssignments: record.data.palette.symbolAssignments,
    },
    trace: record.data.trace
      ? {
          assetUrl: record.data.trace.assetUrl,
          fileName: record.data.trace.fileName,
          byteSize: record.data.trace.byteSize,
          mimeType: record.data.trace.mimeType,
          imageWidth: record.data.trace.imageWidth,
          imageHeight: record.data.trace.imageHeight,
          offsetX: record.data.trace.offsetX,
          offsetY: record.data.trace.offsetY,
          scale: record.data.trace.scale,
          rotation: record.data.trace.rotation,
          visible: true,
          blendMode: "image",
          opacity: 0.35,
          locked: true,
        }
      : null,
    text: record.data.text,
    metadata: {
      legacyDraftId: null,
      persistedVersionId: null,
      schemaVersion: record.data.schemaVersion,
    },
  };
}

export function parsePersistedEditorV2Design(
  value: unknown,
): PersistedEditorV2Design | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<PersistedEditorV2Design>;

  if (
    candidate.schemaVersion !== PERSISTED_EDITOR_V2_SCHEMA_VERSION ||
    !candidate.project ||
    typeof candidate.project !== "object" ||
    typeof candidate.project.title !== "string" ||
    !candidate.grid ||
    typeof candidate.grid !== "object" ||
    !Array.isArray(candidate.grid.cells) ||
    typeof candidate.grid.width !== "number" ||
    typeof candidate.grid.height !== "number" ||
    (candidate.grid.sizingMode !== "stitches" &&
      candidate.grid.sizingMode !== "inches") ||
    !candidate.palette ||
    typeof candidate.palette !== "object" ||
    !candidate.text ||
    typeof candidate.text !== "object"
  ) {
    return null;
  }

  if (
    candidate.trace !== null &&
    candidate.trace !== undefined &&
    (typeof candidate.trace !== "object" ||
      typeof candidate.trace.assetUrl !== "string" ||
      typeof candidate.trace.offsetX !== "number" ||
      typeof candidate.trace.offsetY !== "number" ||
      typeof candidate.trace.scale !== "number" ||
      typeof candidate.trace.rotation !== "number")
  ) {
    return null;
  }

  return candidate as PersistedEditorV2Design;
}

export function normalizeProjectTitle(title: string): string {
  const trimmedTitle = title.trim();
  return trimmedTitle.length > 0 ? trimmedTitle : "Untitled Design";
}
