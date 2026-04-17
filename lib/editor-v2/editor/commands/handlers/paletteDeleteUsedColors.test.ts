import { describe, expect, it } from "vitest";
import { createEditorStore } from "../../store/createEditorStore";
import type { EditorStoreState } from "../../store/state";
import type { EditorCommand } from "../types";

describe("paletteDeleteUsedColorsCommandHandler", () => {
  it("replaces selected used colors with the closest remaining used colors", () => {
    const store = createEditorStore({ initialState: createDeleteTestState() });

    store.dispatch(createDeleteUsedColorsCommand(["dmc:321", "dmc:666"]));

    expect(store.getState().document.grid.cells).toEqual([
      "dmc:310",
      "dmc:310",
      "dmc:310",
      "dmc:310",
      "dmc:310",
      "dmc:310",
    ]);
    expect(store.getState().session.persistence.dirty).toBe(true);
  });

  it("undo restores all deleted used colors in one history step", () => {
    const store = createEditorStore({ initialState: createDeleteTestState() });

    store.dispatch(createDeleteUsedColorsCommand(["dmc:321", "dmc:666"]));
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

  it("does nothing when there is no remaining used color to replace into", () => {
    const store = createEditorStore({ initialState: createSingleUsedColorState() });

    store.dispatch(createDeleteUsedColorsCommand(["dmc:310"]));

    expect(store.getState().document.grid.cells).toEqual(["dmc:310"]);
    expect(store.getState().session.persistence.dirty).toBe(false);
  });
});

function createDeleteTestState(): EditorStoreState {
  return {
    document: {
      project: {
        id: null,
        title: "Delete test",
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
}

function createSingleUsedColorState(): EditorStoreState {
  const state = createDeleteTestState();

  return {
    ...state,
    document: {
      ...state.document,
      grid: {
        ...state.document.grid,
        width: 1,
        height: 1,
        cells: ["dmc:310"],
      },
    },
  };
}

function createDeleteUsedColorsCommand(colorIds: string[]): EditorCommand {
  return {
    id: "delete-colors",
    kind: "palette.deleteUsedColors",
    payload: { colorIds },
    meta: {
      source: "toolbar",
      timestamp: 1,
      history: { mode: "push", label: "Delete Colors" },
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
