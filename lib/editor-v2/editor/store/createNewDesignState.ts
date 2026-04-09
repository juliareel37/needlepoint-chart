import {
  createInitialEditorStoreState,
  type EditorStoreState,
} from "./state";

const DEFAULT_TITLE = "New Design";

export function createNewDesignState(
  width: number,
  height: number,
): EditorStoreState {
  const state = createInitialEditorStoreState();

  return {
    ...state,
    document: {
      ...state.document,
      project: {
        ...state.document.project,
        title: DEFAULT_TITLE,
      },
      grid: {
        ...state.document.grid,
        width,
        height,
        cells: new Array(width * height).fill(null),
      },
      palette: {
        ...state.document.palette,
        colorsById: {
          navy: {
            id: "navy",
            brand: "custom",
            code: "navy",
            name: "Navy",
            hex: "#1d3557",
          },
          coral: {
            id: "coral",
            brand: "custom",
            code: "coral",
            name: "Coral",
            hex: "#e76f51",
          },
        },
        extractedPaletteIds: ["navy", "coral"],
      },
    },
    session: {
      ...state.session,
      activeTool: {
        ...state.session.activeTool,
        tool: "none",
        colorId: "navy",
      },
    },
  };
}
