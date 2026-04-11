import {
  createInitialEditorStoreState,
  type EditorStoreState,
} from "./state";
import {
  addDmcColorLibraryToPalette,
  DEFAULT_DMC_COLOR_ID,
} from "../color-library";

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
        ...addDmcColorLibraryToPalette(state.document.palette),
      },
    },
    session: {
      ...state.session,
      activeTool: {
        ...state.session.activeTool,
        tool: "pan",
        colorId: DEFAULT_DMC_COLOR_ID,
      },
      eyedropperReturnTool: null,
    },
  };
}
