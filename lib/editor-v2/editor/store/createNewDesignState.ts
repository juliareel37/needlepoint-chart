import {
  createInitialEditorStoreState,
  DEFAULT_CANVAS_PREFERENCES,
  type CanvasPreferencesDocument,
  type EditorStoreState,
} from "./state";
import {
  addDmcColorLibraryToPalette,
  DEFAULT_DMC_COLOR_ID,
} from "../color-library";

const DEFAULT_TITLE = "Untitled Design";

interface NewDesignSizingOptions {
  canvasPreferences?: CanvasPreferencesDocument | null;
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
    canvasPreferences = null,
    sizingMode = "stitches",
    meshCount = null,
    widthInches = null,
    heightInches = null,
  } = options;
  const resolvedCanvasPreferences = {
    ...DEFAULT_CANVAS_PREFERENCES,
    ...(canvasPreferences ?? {}),
  };

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
      canvasPreferences: resolvedCanvasPreferences,
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
    ui: {
      ...state.ui,
      preferences: {
        ...state.ui.preferences,
        showGridlines: resolvedCanvasPreferences.showGridlines,
        showRuler: resolvedCanvasPreferences.showRuler,
        showSymbols: resolvedCanvasPreferences.showSymbols,
        touchSnappingEnabled: resolvedCanvasPreferences.touchSnappingEnabled,
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
