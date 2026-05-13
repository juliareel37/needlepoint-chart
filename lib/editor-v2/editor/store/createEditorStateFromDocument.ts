import {
  createInitialEditorStoreState,
  DEFAULT_CANVAS_PREFERENCES,
  type EditorDocumentState,
  type EditorStoreState,
} from "./state";
import { ensureSymbolAssignmentsForCells } from "@/lib/symbols";
import { addDmcColorLibraryToPalette } from "../color-library";
import { getNormalizedTraceCrop } from "../trace/crop";

export function createEditorStateFromDocument(
  document: EditorDocumentState,
  options: { activeColorId?: string | null } = {},
): EditorStoreState {
  const state = createInitialEditorStoreState();
  const now = Date.now();
  const normalizedDocument: EditorDocumentState = {
    ...document,
    canvasPreferences: {
      ...DEFAULT_CANVAS_PREFERENCES,
      ...(document.canvasPreferences ?? {}),
    },
    palette: (() => {
      const palette = addDmcColorLibraryToPalette(document.palette);

      return {
        ...palette,
        symbolAssignments: ensureSymbolAssignmentsForCells(
          document.grid.cells,
          palette.symbolAssignments,
        ),
      };
    })(),
    trace: document.trace
      ? (() => {
          const normalizedCrop = getNormalizedTraceCrop(document.trace);

          return {
            ...document.trace,
            ...normalizedCrop,
            previewUrl: document.trace.previewUrl,
            thumbnailUrl: document.trace.thumbnailUrl ?? document.trace.previewUrl,
            originalUrl: document.trace.originalUrl ?? document.trace.previewUrl,
            maskUrl: document.trace.maskUrl ?? null,
            fileName: document.trace.fileName ?? null,
            byteSize: document.trace.byteSize ?? null,
            mimeType: document.trace.mimeType ?? null,
            imageWidth: document.trace.imageWidth ?? null,
            imageHeight: document.trace.imageHeight ?? null,
            blendMode: document.trace.blendMode ?? "image",
            locked: true,
          };
        })()
      : null,
  };
  const requestedActiveColorId = options.activeColorId ?? null;
  const defaultColorId =
    (requestedActiveColorId &&
    normalizedDocument.palette.colorsById[requestedActiveColorId]
      ? requestedActiveColorId
      : null) ??
    normalizedDocument.palette.extractedPaletteIds[0] ??
    Object.keys(normalizedDocument.palette.colorsById)[0] ??
    null;

  return {
    ...state,
    document: normalizedDocument,
    session: {
      ...state.session,
      activeTool: {
        ...state.session.activeTool,
        tool: "paint",
        colorId: defaultColorId,
      },
      eyedropperReturnTool: null,
      persistence: {
        ...state.session.persistence,
        currentDraftId: normalizedDocument.project.id,
        dirty: false,
        saving: false,
        loading: false,
        lastLoadedAt: now,
        restoreSource: normalizedDocument.metadata.persistedVersionId
          ? "version-preview"
          : normalizedDocument.project.id
            ? "server"
            : "none",
        versionPreview: null,
      },
    },
    ui: {
      ...state.ui,
      preferences: {
        ...state.ui.preferences,
        showGridlines: normalizedDocument.canvasPreferences.showGridlines,
        showRuler: normalizedDocument.canvasPreferences.showRuler,
        showSymbols: normalizedDocument.canvasPreferences.showSymbols,
        touchSnappingEnabled: normalizedDocument.canvasPreferences.touchSnappingEnabled,
      },
    },
  };
}
