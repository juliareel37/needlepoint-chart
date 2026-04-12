import { describe, expect, it } from "vitest";
import { createEditorStore } from "../../store/createEditorStore";
import type { EditorStoreState } from "../../store/state";
import type { EditorCommand } from "../types";

describe("paletteSwapColorCommandHandler", () => {
  it("swaps only painted cells with the source color", () => {
    const store = createEditorStore({ initialState: createSwapTestState() });

    store.dispatch(createSwapCommand("dmc:310", "dmc:321"));

    expect(store.getState().document.grid.cells).toEqual([
      "dmc:321",
      "dmc:321",
      "dmc:321",
      null,
    ]);
    expect(store.getState().session.persistence.dirty).toBe(true);
  });

  it("undo restores only the cells changed by the swap", () => {
    const store = createEditorStore({ initialState: createSwapTestState() });

    store.dispatch(createSwapCommand("dmc:310", "dmc:321"));
    store.dispatch(createUndoCommand());

    expect(store.getState().document.grid.cells).toEqual([
      "dmc:310",
      "dmc:321",
      "dmc:310",
      null,
    ]);
  });

  it("preserves the symbol pairing when a used color is swapped", () => {
    const store = createEditorStore({ initialState: createSwapTestState() });

    store.dispatch(createSwapCommand("dmc:310", "dmc:321"));

    expect(store.getState().document.palette.symbolAssignments).toEqual({
      "dmc:310": "!",
      "dmc:321": "@",
    });
  });
});

function createSwapTestState(): EditorStoreState {
  return {
    document: {
      project: {
        id: null,
        title: "Swap test",
        createdAt: null,
        updatedAt: null,
        sourceVersion: 1,
      },
      grid: {
        width: 2,
        height: 2,
        meshCount: null,
        sizingMode: "stitches",
        widthInches: null,
        heightInches: null,
        cells: ["dmc:310", "dmc:321", "dmc:310", null],
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
        },
        customPalettesById: {},
        extractedPaletteIds: [],
        symbolAssignments: {
          "dmc:310": "!",
          "dmc:321": "@",
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
        threadView: false,
        darkCanvas: false,
        gridMajorInterval: 10,
      },
    },
  };
}

function createSwapCommand(fromColorId: string, toColorId: string): EditorCommand {
  return {
    id: "swap-color",
    kind: "palette.swapColor",
    payload: { fromColorId, toColorId },
    meta: {
      source: "toolbar",
      timestamp: 1,
      history: { mode: "push", label: "Swap Color" },
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
