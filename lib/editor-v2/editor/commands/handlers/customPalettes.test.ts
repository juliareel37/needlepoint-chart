import { describe, expect, it } from "vitest";
import {
  createAddColorToCustomPaletteCommand,
  createCustomPaletteCommand,
  createDeleteCustomPaletteCommand,
  createRedoCommand,
  createRemoveColorFromCustomPaletteCommand,
  createRenameCustomPaletteCommand,
  createUndoCommand,
} from "@/components/editor-v2/features/workspace/workspaceCommands";
import { createEditorStore } from "../../store/createEditorStore";
import { createNewDesignState } from "../../store/createNewDesignState";

describe("custom palette commands", () => {
  it("creates a custom palette with a normalized name and deduped color ids", () => {
    const store = createEditorStore({
      initialState: createNewDesignState(2, 2),
    });

    store.dispatch(
      createCustomPaletteCommand("palette-1", "   ", [
        "dmc-310",
        "dmc-321",
        "dmc-310",
        "missing-color",
      ]),
    );

    expect(store.getState().document.palette.customPalettesById["palette-1"]).toEqual({
      id: "palette-1",
      name: "Untitled Palette",
      colorIds: ["dmc-310", "dmc-321"],
    });
    expect(store.getState().session.persistence.dirty).toBe(true);
  });

  it("renames a custom palette and restores the old name on undo", () => {
    const store = createEditorStore({
      initialState: createNewDesignState(2, 2),
    });

    store.dispatch(createCustomPaletteCommand("palette-1", "Warm", ["dmc-310"]));
    store.dispatch(createRenameCustomPaletteCommand("palette-1", "Deep Warm"));

    expect(store.getState().document.palette.customPalettesById["palette-1"]?.name).toBe(
      "Deep Warm",
    );

    store.dispatch(createUndoCommand());

    expect(store.getState().document.palette.customPalettesById["palette-1"]?.name).toBe(
      "Warm",
    );
  });

  it("adds and removes palette colors with undo and redo support", () => {
    const store = createEditorStore({
      initialState: createNewDesignState(2, 2),
    });

    store.dispatch(createCustomPaletteCommand("palette-1", "Favorites", ["dmc-310"]));
    store.dispatch(createAddColorToCustomPaletteCommand("palette-1", "dmc-321"));

    expect(
      store.getState().document.palette.customPalettesById["palette-1"]?.colorIds,
    ).toEqual(["dmc-310", "dmc-321"]);

    store.dispatch(createRemoveColorFromCustomPaletteCommand("palette-1", "dmc-310"));

    expect(
      store.getState().document.palette.customPalettesById["palette-1"]?.colorIds,
    ).toEqual(["dmc-321"]);

    store.dispatch(createUndoCommand());
    expect(
      store.getState().document.palette.customPalettesById["palette-1"]?.colorIds,
    ).toEqual(["dmc-310", "dmc-321"]);

    store.dispatch(createRedoCommand());
    expect(
      store.getState().document.palette.customPalettesById["palette-1"]?.colorIds,
    ).toEqual(["dmc-321"]);
  });

  it("deletes a palette and restores it on undo", () => {
    const store = createEditorStore({
      initialState: createNewDesignState(2, 2),
    });

    store.dispatch(createCustomPaletteCommand("palette-1", "Favorites", ["dmc-310"]));
    store.dispatch(createDeleteCustomPaletteCommand("palette-1"));

    expect(store.getState().document.palette.customPalettesById["palette-1"]).toBeUndefined();

    store.dispatch(createUndoCommand());

    expect(store.getState().document.palette.customPalettesById["palette-1"]).toEqual({
      id: "palette-1",
      name: "Favorites",
      colorIds: ["dmc-310"],
    });
  });

  it("treats invalid palette operations as no-ops", () => {
    const store = createEditorStore({
      initialState: createNewDesignState(2, 2),
    });

    store.dispatch(createAddColorToCustomPaletteCommand("missing", "dmc-310"));
    store.dispatch(createDeleteCustomPaletteCommand("missing"));
    store.dispatch(createCustomPaletteCommand("palette-1", "Favorites", ["dmc-310"]));
    store.dispatch(createAddColorToCustomPaletteCommand("palette-1", "dmc-310"));

    expect(store.getState().document.palette.customPalettesById).toEqual({
      "palette-1": {
        id: "palette-1",
        name: "Favorites",
        colorIds: ["dmc-310"],
      },
    });
  });
});
