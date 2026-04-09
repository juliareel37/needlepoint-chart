import {
  createInitialEditorStoreState,
  type EditorDocumentState,
  type EditorStoreState,
} from "./state";

export function createEditorStateFromDocument(
  document: EditorDocumentState,
): EditorStoreState {
  const state = createInitialEditorStoreState();
  const normalizedDocument: EditorDocumentState = {
    ...document,
    trace: document.trace
      ? {
          ...document.trace,
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
        tool: "none",
        colorId: defaultColorId,
      },
    },
  };
}
