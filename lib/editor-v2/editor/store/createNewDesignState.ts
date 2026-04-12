import {
  createInitialEditorStoreState,
  type EditorStoreState,
} from "./state";
import {
  addDmcColorLibraryToPalette,
  DEFAULT_DMC_COLOR_ID,
} from "../color-library";

const DEFAULT_TITLE = "New Design";

interface NewDesignSizingOptions {
  sizingMode?: "stitches" | "inches";
  meshCount?: number | null;
  widthInches?: number | null;
  heightInches?: number | null;
}

export function createNewDesignState(
  width: number,
  height: number,
  options: NewDesignSizingOptions = {},
): EditorStoreState {
  const state = createInitialEditorStoreState();
  const {
    sizingMode = "stitches",
    meshCount = null,
    widthInches = null,
    heightInches = null,
  } = options;

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
        sizingMode,
        meshCount,
        widthInches,
        heightInches,
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
