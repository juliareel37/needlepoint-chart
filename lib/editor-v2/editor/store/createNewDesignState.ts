import {
  createInitialEditorStoreState,
  type EditorStoreState,
} from "./state";
import {
  addDmcColorLibraryToPalette,
  DEFAULT_DMC_COLOR_ID,
} from "../color-library";

const DEFAULT_TITLE = "Untitled Design";

interface NewDesignSizingOptions {
  sizingMode?: "stitches" | "inches";
  meshCount?: number | null;
  widthInches?: number | null;
  heightInches?: number | null;
  projectId?: string | null;
}

export function createNewDesignState(
  width: number,
  height: number,
  options: NewDesignSizingOptions = {},
): EditorStoreState {
  const state = createInitialEditorStoreState();
  const localProjectId = options.projectId ?? createLocalProjectId();
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
        id: localProjectId,
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
        tool: "paint",
        colorId: DEFAULT_DMC_COLOR_ID,
      },
      eyedropperReturnTool: null,
      persistence: {
        ...state.session.persistence,
        currentDraftId: localProjectId,
      },
    },
  };
}

export function createLocalProjectId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `local_${crypto.randomUUID()}`;
  }

  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
