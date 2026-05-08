import type {
  CanvasPreferencesDocument,
  EditorDocumentState,
  GridDocument,
  PaletteDocument,
  TextDocument,
} from "@/lib/editor-v2/editor/store";
import { getNormalizedTraceCrop } from "@/lib/editor-v2/editor/trace/crop";

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
  previewUrl: string;
  thumbnailUrl: string;
  originalUrl: string;
  fileName: string | null;
  byteSize: number | null;
  mimeType: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;
}

export interface PersistedEditorV2CanvasPreferences {
  showGridlines: CanvasPreferencesDocument["showGridlines"];
  showRuler: CanvasPreferencesDocument["showRuler"];
  showSymbols: CanvasPreferencesDocument["showSymbols"];
  touchSnappingEnabled: CanvasPreferencesDocument["touchSnappingEnabled"];
}

export interface PersistedEditorV2Design {
  schemaVersion: number;
  project: {
    title: string;
  };
  grid: PersistedEditorV2Grid;
  palette: PersistedEditorV2Palette;
  canvasPreferences?: PersistedEditorV2CanvasPreferences;
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
    canvasPreferences: {
      showGridlines: document.canvasPreferences.showGridlines,
      showRuler: document.canvasPreferences.showRuler,
      showSymbols: document.canvasPreferences.showSymbols,
      touchSnappingEnabled: document.canvasPreferences.touchSnappingEnabled,
    },
    trace: document.trace
      ? (() => {
          const normalizedCrop = getNormalizedTraceCrop(document.trace);

          return {
            previewUrl: document.trace.previewUrl,
            thumbnailUrl: document.trace.thumbnailUrl,
            originalUrl: document.trace.originalUrl,
            fileName: document.trace.fileName,
            byteSize: document.trace.byteSize,
            mimeType: document.trace.mimeType,
            imageWidth: document.trace.imageWidth,
            imageHeight: document.trace.imageHeight,
            cropX: normalizedCrop.cropX,
            cropY: normalizedCrop.cropY,
            cropWidth: normalizedCrop.cropWidth,
            cropHeight: normalizedCrop.cropHeight,
            offsetX: document.trace.offsetX,
            offsetY: document.trace.offsetY,
            scale: document.trace.scale,
            rotation: document.trace.rotation,
          };
        })()
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
    canvasPreferences: normalizePersistedCanvasPreferences(record.data.canvasPreferences),
    trace: record.data.trace
      ? (() => {
          const normalizedTrace = normalizePersistedTrace(record.data.trace);

          return {
            previewUrl: normalizedTrace.previewUrl,
            thumbnailUrl: normalizedTrace.thumbnailUrl,
            originalUrl: normalizedTrace.originalUrl,
            fileName: normalizedTrace.fileName,
            byteSize: normalizedTrace.byteSize,
            mimeType: normalizedTrace.mimeType,
            imageWidth: normalizedTrace.imageWidth,
            imageHeight: normalizedTrace.imageHeight,
            cropX: normalizedTrace.cropX,
            cropY: normalizedTrace.cropY,
            cropWidth: normalizedTrace.cropWidth,
            cropHeight: normalizedTrace.cropHeight,
            offsetX: normalizedTrace.offsetX,
            offsetY: normalizedTrace.offsetY,
            scale: normalizedTrace.scale,
            rotation: normalizedTrace.rotation,
            visible: true,
            blendMode: "image",
            opacity: 0.35,
            locked: true,
          };
        })()
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
    !isPersistedTrace(candidate.trace)
  ) {
    return null;
  }

  if (
    candidate.canvasPreferences !== undefined &&
    !isPersistedCanvasPreferences(candidate.canvasPreferences)
  ) {
    return null;
  }

  return {
    ...candidate,
    canvasPreferences: normalizePersistedCanvasPreferences(candidate.canvasPreferences),
    trace: candidate.trace ? normalizePersistedTrace(candidate.trace) : null,
  } as PersistedEditorV2Design;
}

export function normalizeProjectTitle(title: string): string {
  const trimmedTitle = title.trim();
  return trimmedTitle.length > 0 ? trimmedTitle : "Untitled Design";
}

function isPersistedTrace(value: unknown): value is PersistedEditorV2Trace {
  if (!value || typeof value !== "object") {
    return false;
  }

  const trace = value as Partial<PersistedEditorV2Trace> & {
    assetUrl?: unknown;
  };

  return (
    typeof getLegacyCompatibleTraceUrl(trace, "previewUrl") === "string" &&
    typeof getLegacyCompatibleTraceUrl(trace, "thumbnailUrl") === "string" &&
    typeof getLegacyCompatibleTraceUrl(trace, "originalUrl") === "string" &&
    typeof trace.offsetX === "number" &&
    typeof trace.offsetY === "number" &&
    typeof trace.scale === "number" &&
    typeof trace.rotation === "number"
  );
}

function normalizePersistedTrace(
  trace: PersistedEditorV2Trace | (Partial<PersistedEditorV2Trace> & { assetUrl?: unknown }),
): PersistedEditorV2Trace {
  const normalizedCrop = getNormalizedTraceCrop(trace);

  return {
    ...trace,
    previewUrl: getLegacyCompatibleTraceUrl(trace, "previewUrl"),
    thumbnailUrl: getLegacyCompatibleTraceUrl(trace, "thumbnailUrl"),
    originalUrl: getLegacyCompatibleTraceUrl(trace, "originalUrl"),
    fileName: trace.fileName ?? null,
    byteSize: trace.byteSize ?? null,
    mimeType: trace.mimeType ?? null,
    imageWidth: trace.imageWidth ?? null,
    imageHeight: trace.imageHeight ?? null,
    cropX: normalizedCrop.cropX,
    cropY: normalizedCrop.cropY,
    cropWidth: normalizedCrop.cropWidth,
    cropHeight: normalizedCrop.cropHeight,
    offsetX: trace.offsetX ?? 0,
    offsetY: trace.offsetY ?? 0,
    scale: trace.scale ?? 1,
    rotation: trace.rotation ?? 0,
  };
}

function isPersistedCanvasPreferences(
  value: unknown,
): value is PersistedEditorV2CanvasPreferences {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PersistedEditorV2CanvasPreferences>;

  return (
    typeof candidate.showGridlines === "boolean" &&
    typeof candidate.showRuler === "boolean" &&
    typeof candidate.showSymbols === "boolean" &&
    typeof candidate.touchSnappingEnabled === "boolean"
  );
}

function normalizePersistedCanvasPreferences(
  value: PersistedEditorV2CanvasPreferences | undefined,
): PersistedEditorV2CanvasPreferences {
  return {
    showGridlines: value?.showGridlines ?? true,
    showRuler: value?.showRuler ?? true,
    showSymbols: value?.showSymbols ?? true,
    touchSnappingEnabled: value?.touchSnappingEnabled ?? true,
  };
}

function getLegacyCompatibleTraceUrl(
  trace: Partial<PersistedEditorV2Trace> & { assetUrl?: unknown },
  field: "previewUrl" | "thumbnailUrl" | "originalUrl",
): string {
  const candidate = trace[field];
  if (typeof candidate === "string") {
    return candidate;
  }

  if (typeof trace.assetUrl === "string") {
    return trace.assetUrl;
  }

  throw new Error(`Missing ${field}`);
}
