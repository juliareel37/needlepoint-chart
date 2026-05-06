import { describe, expect, it } from "vitest";
import type { EditorStoreState } from "../../store/state";
import { getUsedColors } from "./getUsedColors";

describe("getUsedColors", () => {
  it("returns only colors used inside the active selection when scope is auto", () => {
    const state = createSelectorTestState();

    expect(getUsedColors(state, { scope: "auto" })).toEqual([
      { colorId: "dmc:321", count: 2 },
    ]);
  });

  it("returns document-wide colors when no selection is active", () => {
    const state = createSelectorTestState();
    state.session.selection = {
      mode: "none",
      shape: "rect",
      rect: null,
      lassoPoints: [],
      mirrorAxis: null,
      preview: null,
    };

    expect(getUsedColors(state, { scope: "auto" })).toEqual([
      { colorId: "dmc:321", count: 2 },
      { colorId: "dmc:310", count: 1 },
      { colorId: "dmc:666", count: 1 },
    ]);
  });
});

function createSelectorTestState(): EditorStoreState {
  return {
    document: {
      project: {
        id: null,
        title: "Used colors selector",
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
        cells: ["dmc:310", "dmc:321", "dmc:666", "dmc:321"],
      },
      palette: {
        colorsById: {},
        customPalettesById: {},
        extractedPaletteIds: [],
        symbolAssignments: {},
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
        colorId: "dmc:321",
      },
      eyedropperReturnTool: null,
      viewport: {
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      },
      selection: {
        mode: "rect",
        shape: "rect",
        rect: { x: 1, y: 0, width: 1, height: 2 },
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
        touchSnappingEnabled: true,
        previewMode: false,
        threadView: false,
        darkCanvas: false,
        gridMajorInterval: 10,
      },
    },
  };
}
