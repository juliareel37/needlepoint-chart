import { describe, expect, it } from "vitest";
import { createEditorStore } from "../../store/createEditorStore";
import type { EditorStoreState } from "../../store/state";
import type { EditorCommand } from "../types";

describe("paletteMergeUsedColorsCommandHandler", () => {
  it("merges selected used colors into the target color", () => {
    const store = createEditorStore({ initialState: createMergeTestState() });

    store.dispatch(createMergeUsedColorsCommand(["dmc:321", "dmc:666"], "dmc:321"));

    expect(store.getState().document.grid.cells).toEqual([
      "dmc:310",
      "dmc:321",
      "dmc:321",
      "dmc:321",
      "dmc:321",
      "dmc:310",
    ]);
    expect(store.getState().session.persistence.dirty).toBe(true);
  });

  it("undo restores the pre-merge colors", () => {
    const store = createEditorStore({ initialState: createMergeTestState() });

    store.dispatch(createMergeUsedColorsCommand(["dmc:321", "dmc:666"], "dmc:321"));
    store.dispatch(createUndoCommand());

    expect(store.getState().document.grid.cells).toEqual([
      "dmc:310",
      "dmc:321",
      "dmc:666",
      "dmc:321",
      "dmc:666",
      "dmc:310",
    ]);
  });

  it("merges only cells inside the active selection", () => {
    const store = createEditorStore({
      initialState: createMergeTestState({
        selection: {
          mode: "rect",
          shape: "rect",
          rect: { x: 1, y: 0, width: 1, height: 2 },
          lassoPoints: [],
          mirrorAxis: null,
          preview: null,
        },
      }),
    });

    store.dispatch(createMergeUsedColorsCommand(["dmc:321", "dmc:666"], "dmc:321"));

    expect(store.getState().document.grid.cells).toEqual([
      "dmc:310",
      "dmc:321",
      "dmc:666",
      "dmc:321",
      "dmc:321",
      "dmc:310",
    ]);
  });
});

function createMergeTestState(
  overrides?: Partial<EditorStoreState["session"]>,
): EditorStoreState {
  const state: EditorStoreState = {
    document: {
      project: {
        id: null,
        title: "Merge test",
        createdAt: null,
        updatedAt: null,
        sourceVersion: 1,
      },
      grid: {
        width: 3,
        height: 2,
        meshCount: null,
        sizingMode: "stitches",
        widthInches: null,
        heightInches: null,
        cells: ["dmc:310", "dmc:321", "dmc:666", "dmc:321", "dmc:666", "dmc:310"],
      },
      palette: {
        colorsById: {
          "dmc:310": {
            id: "dmc:310",
            brand: "dmc",
            code: "310",
            name: "Black",
            hex: "#000000",
          },
          "dmc:321": {
            id: "dmc:321",
            brand: "dmc",
            code: "321",
            name: "Red",
            hex: "#c72b3b",
          },
          "dmc:666": {
            id: "dmc:666",
            brand: "dmc",
            code: "666",
            name: "Bright Red",
            hex: "#e31d42",
          },
        },
        customPalettesById: {},
        extractedPaletteIds: [],
        symbolAssignments: {
          "dmc:310": "!",
          "dmc:321": "@",
          "dmc:666": "#",
        },
      },
      trace: null,
      text: {
        mode: "destructive-grid",
        entities: [],
      },
      metadata: {
        legacyDraftId: null,
        persistedVersionId: null,
        schemaVersion: 1,
      },
    },
    session: {
      activeTool: {
        tool: "paint",
        brushSize: 1,
        paintBrushSize: 1,
        eraseBrushSize: 1,
        colorId: "dmc:310",
      },
      eyedropperReturnTool: null,
      viewport: {
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      },
      selection: {
        mode: "none",
        shape: "freehand",
        rect: null,
        lassoPoints: [],
        mirrorAxis: null,
        preview: null,
      },
      duplicatePlacement: null,
      mirrorInteraction: {
        session: null,
      },
      history: {
        past: [],
        future: [],
        lastAppliedCommandId: null,
        transaction: null,
      },
      persistence: {
        currentDraftId: null,
        dirty: false,
        saving: false,
        loading: false,
        lastSavedAt: null,
        lastLoadedAt: null,
        restoreSource: "none",
        versionPreview: null,
      },
      traceInteraction: {
        uploadStatus: "idle",
        placementMode: "idle",
        repositionOrigin: null,
        replacedTrace: null,
        repositionSnapshot: null,
        runtimeImageRefId: null,
        conversionPreview: null,
      },
      textInteraction: {
        draftText: "",
        draftColorId: null,
        draftFontFamily: "Arial",
        draftFontSize: 1,
        draftFontStyle: "normal",
        draftFontWeight: 400,
        previewPosition: null,
        placement: null,
      },
      iconInteraction: {
        placement: null,
      },
      inFlightCommand: null,
    },
    ui: {
      shell: {
        sidebarCollapsed: false,
        activeSidebarSection: "color",
        mobileToolbarVisible: true,
        mobileToolbarCollapsed: false,
        isCompact: false,
        isNarrow: false,
      },
      panels: {
        gridOpen: false,
        wipOpen: false,
        traceOpen: false,
        usedColorsOpen: true,
        customPalettesOpen: false,
        imageToPatternOpen: false,
        textOpen: false,
        settingsOpen: false,
      },
      dialogs: {
        confirmDialog: null,
        draftPickerOpen: false,
        versionHistoryOpen: false,
      },
      menus: {
        fileMenuOpen: false,
        mobileSettingsOpen: false,
        activePopoverId: null,
      },
      preferences: {
        darkMode: false,
        showGridlines: true,
        showMajorGridlines: true,
        showRuler: true,
        showSymbols: false,
        previewMode: false,
        threadView: false,
        darkCanvas: false,
        gridMajorInterval: 10,
      },
    },
  };

  return {
    ...state,
    session: {
      ...state.session,
      ...overrides,
    },
  };
}

function createMergeUsedColorsCommand(
  fromColorIds: string[],
  toColorId: string,
): EditorCommand {
  return {
    id: "merge-colors",
    kind: "palette.mergeUsedColors",
    payload: { fromColorIds, toColorId },
    meta: {
      source: "toolbar",
      timestamp: 1,
      history: { mode: "push", label: "Merge Colors" },
    },
  };
}

function createUndoCommand(): EditorCommand {
  return {
    id: "undo",
    kind: "history.undo",
    payload: {},
    meta: {
      source: "toolbar",
      timestamp: 2,
      history: { mode: "skip" },
    },
  };
}
