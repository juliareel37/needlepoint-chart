import { describe, expect, it } from "vitest";
import { createEditorStore } from "../../store/createEditorStore";
import type { EditorStoreState } from "../../store/state";
import type { EditorCommand } from "../types";

describe("gridApplyTraceConversionCommandHandler", () => {
  it("replaces the converted cells, updates extracted colors, and assigns symbols", () => {
    const store = createEditorStore({ initialState: createTestState() });

    store.dispatch(
      createConvertCommand({
        replacements: [
          { index: 0, value: "dmc-321" },
          { index: 1, value: "dmc-321" },
          { index: 2, value: null },
        ],
        extractedColorIds: ["dmc-321"],
        activeColorId: "dmc-321",
      }),
    );

    expect(store.getState().document.grid.cells).toEqual([
      "dmc-321",
      "dmc-321",
      null,
      null,
    ]);
    expect(store.getState().document.palette.extractedPaletteIds).toEqual(["dmc-321"]);
    expect(store.getState().document.palette.symbolAssignments["dmc-321"]).toBeTruthy();
    expect(store.getState().session.activeTool.colorId).toBe("dmc-321");
    expect(store.getState().session.persistence.dirty).toBe(true);
  });

  it("undo restores the previous grid and extracted palette ids", () => {
    const store = createEditorStore({ initialState: createTestState() });

    store.dispatch(
      createConvertCommand({
        replacements: [
          { index: 0, value: "dmc-321" },
          { index: 1, value: "dmc-321" },
          { index: 2, value: null },
        ],
        extractedColorIds: ["dmc-321"],
        activeColorId: "dmc-321",
      }),
    );
    store.dispatch(createUndoCommand());

    expect(store.getState().document.grid.cells).toEqual([
      "dmc-310",
      null,
      "dmc-666",
      null,
    ]);
    expect(store.getState().document.palette.extractedPaletteIds).toEqual(["dmc-310", "dmc-666"]);
  });

  it("supports a temporary preview that can be canceled without history", () => {
    const store = createEditorStore({ initialState: createTestState() });

    store.dispatch(
      createPreviewCommand({
        replacements: [{ index: 0, value: "dmc-321" }],
        extractedColorIds: ["dmc-321"],
        activeColorId: "dmc-321",
      }),
    );

    expect(store.getState().document.grid.cells).toEqual([
      "dmc-321",
      null,
      "dmc-666",
      null,
    ]);
    expect(store.getState().session.traceInteraction.conversionPreview).not.toBeNull();
    expect(store.getState().session.history.past).toHaveLength(0);

    store.dispatch(createCancelPreviewCommand());

    expect(store.getState().document.grid.cells).toEqual([
      "dmc-310",
      null,
      "dmc-666",
      null,
    ]);
    expect(store.getState().document.palette.extractedPaletteIds).toEqual([
      "dmc-310",
      "dmc-666",
    ]);
    expect(store.getState().session.activeTool.colorId).toBe("dmc-310");
    expect(store.getState().session.traceInteraction.conversionPreview).toBeNull();
    expect(store.getState().session.history.past).toHaveLength(0);
  });

  it("commits a preview into history when applied", () => {
    const store = createEditorStore({ initialState: createTestState() });

    store.dispatch(
      createPreviewCommand({
        replacements: [{ index: 0, value: "dmc-321" }],
        extractedColorIds: ["dmc-321"],
        activeColorId: "dmc-321",
      }),
    );
    store.dispatch(createCommitPreviewCommand());

    expect(store.getState().document.grid.cells).toEqual([
      "dmc-321",
      null,
      "dmc-666",
      null,
    ]);
    expect(store.getState().session.traceInteraction.conversionPreview).toBeNull();
    expect(store.getState().session.history.past).toHaveLength(1);

    store.dispatch(createUndoCommand());

    expect(store.getState().document.grid.cells).toEqual([
      "dmc-310",
      null,
      "dmc-666",
      null,
    ]);
  });
});

function createTestState(): EditorStoreState {
  return {
    document: {
      project: {
        id: null,
        title: "Trace conversion test",
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
        cells: ["dmc-310", null, "dmc-666", null],
      },
      palette: {
        colorsById: {
          "dmc-310": {
            id: "dmc-310",
            brand: "dmc",
            code: "310",
            name: "Black",
            hex: "#000000",
          },
          "dmc-321": {
            id: "dmc-321",
            brand: "dmc",
            code: "321",
            name: "Red",
            hex: "#c72b3b",
          },
          "dmc-666": {
            id: "dmc-666",
            brand: "dmc",
            code: "666",
            name: "Bright Red",
            hex: "#e31d42",
          },
        },
        customPalettesById: {},
        extractedPaletteIds: ["dmc-310", "dmc-666"],
        symbolAssignments: {
          "dmc-310": "!",
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
        colorId: "dmc-310",
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
        activeSidebarSection: "trace",
        mobileToolbarVisible: true,
        mobileToolbarCollapsed: false,
        isCompact: false,
        isNarrow: false,
      },
      panels: {
        gridOpen: false,
        wipOpen: false,
        traceOpen: true,
        usedColorsOpen: false,
        customPalettesOpen: false,
        imageToPatternOpen: true,
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
        showSymbols: true,
        previewMode: false,
        threadView: false,
        darkCanvas: false,
        gridMajorInterval: 10,
      },
    },
  };
}

function createConvertCommand(
  payload: Extract<EditorCommand, { kind: "grid.applyTraceConversion" }>["payload"],
): EditorCommand {
  return {
    id: "convert-trace",
    kind: "grid.applyTraceConversion",
    payload,
    meta: {
      source: "toolbar",
      timestamp: 1,
      history: { mode: "push", label: "Convert Image to Pattern" },
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

function createPreviewCommand(
  payload: Extract<EditorCommand, { kind: "grid.previewTraceConversion" }>["payload"],
): EditorCommand {
  return {
    id: "preview-convert-trace",
    kind: "grid.previewTraceConversion",
    payload,
    meta: {
      source: "toolbar",
      timestamp: 1,
      history: { mode: "skip" },
    },
  };
}

function createCommitPreviewCommand(): EditorCommand {
  return {
    id: "commit-preview-convert-trace",
    kind: "grid.commitTraceConversionPreview",
    payload: {},
    meta: {
      source: "toolbar",
      timestamp: 2,
      history: { mode: "push", label: "Convert Image to Pattern" },
    },
  };
}

function createCancelPreviewCommand(): EditorCommand {
  return {
    id: "cancel-preview-convert-trace",
    kind: "grid.cancelTraceConversionPreview",
    payload: {},
    meta: {
      source: "toolbar",
      timestamp: 2,
      history: { mode: "skip" },
    },
  };
}
