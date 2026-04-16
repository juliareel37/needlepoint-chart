import {
  createInitialEditorStoreState,
  type EditorDocumentState,
  type EditorStoreState,
} from "./state";
import { ensureSymbolAssignmentsForCells } from "@/lib/symbols";
import { addDmcColorLibraryToPalette } from "../color-library";

export function createEditorStateFromDocument(
  document: EditorDocumentState,
): EditorStoreState {
  const state = createInitialEditorStoreState();
  const now = Date.now();
  const normalizedDocument: EditorDocumentState = {
    ...document,
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
      ? {
          ...document.trace,
          fileName: document.trace.fileName ?? null,
          byteSize: document.trace.byteSize ?? null,
          mimeType: document.trace.mimeType ?? null,
          imageWidth: document.trace.imageWidth ?? null,
          imageHeight: document.trace.imageHeight ?? null,
          blendMode: document.trace.blendMode ?? "image",
        }
      : null,
  };
  const defaultColorId =
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
        tool: "pan",
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
        restoreSource: normalizedDocument.project.id ? "server" : "none",
        versionPreview: null,
      },
    },
  };
}
