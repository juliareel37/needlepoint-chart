import { describe, expect, it } from "vitest";
import { createEditorStore } from "../../store/createEditorStore";
import { createInitialEditorStoreState } from "../../store/state";

describe("selection command handlers", () => {
  it("builds a rectangular selection when the shape is rect", () => {
    const initial = createInitialEditorStoreState();
    initial.session.activeTool.tool = "lasso";
    initial.session.selection.shape = "rect";

    const store = createEditorStore({ initialState: initial });

    store.dispatch({
      id: "cmd-1",
      kind: "selection.start",
      payload: { point: { x: 2, y: 3 } },
      meta: { source: "canvas", timestamp: 1, history: { mode: "skip" } },
    });

    store.dispatch({
      id: "cmd-2",
      kind: "selection.update",
      payload: { point: { x: 5, y: 7 } },
      meta: { source: "canvas", timestamp: 2, history: { mode: "skip" } },
    });

    store.dispatch({
      id: "cmd-3",
      kind: "selection.commit",
      payload: { point: { x: 5, y: 7 } },
      meta: { source: "canvas", timestamp: 3, history: { mode: "skip" } },
    });

    expect(store.getState().session.selection).toEqual({
      mode: "rect",
      shape: "rect",
      rect: { x: 2, y: 3, width: 4, height: 5 },
      lassoPoints: [
        { x: 2, y: 3 },
        { x: 5, y: 7 },
      ],
      mirrorAxis: null,
      preview: null,
    });
  });

  it("updates the stored shape preference", () => {
    const initial = createInitialEditorStoreState();
    const store = createEditorStore({ initialState: initial });

    store.dispatch({
      id: "cmd-1",
      kind: "selection.setShape",
      payload: { shape: "rect" },
      meta: { source: "toolbar", timestamp: 1, history: { mode: "skip" } },
    });

    expect(store.getState().session.selection).toEqual({
      mode: "none",
      shape: "rect",
      rect: null,
      lassoPoints: [],
      mirrorAxis: null,
      preview: null,
    });
  });

  it("builds a circular selection when the shape is circle", () => {
    const initial = createInitialEditorStoreState();
    initial.session.activeTool.tool = "lasso";
    initial.session.selection.shape = "circle";

    const store = createEditorStore({ initialState: initial });

    store.dispatch({
      id: "cmd-1",
      kind: "selection.start",
      payload: { point: { x: 2, y: 3 } },
      meta: { source: "canvas", timestamp: 1, history: { mode: "skip" } },
    });

    store.dispatch({
      id: "cmd-2",
      kind: "selection.update",
      payload: { point: { x: 5, y: 7 } },
      meta: { source: "canvas", timestamp: 2, history: { mode: "skip" } },
    });

    store.dispatch({
      id: "cmd-3",
      kind: "selection.commit",
      payload: { point: { x: 5, y: 7 } },
      meta: { source: "canvas", timestamp: 3, history: { mode: "skip" } },
    });

    expect(store.getState().session.selection).toEqual({
      mode: "circle",
      shape: "circle",
      rect: { x: 2, y: 3, width: 4, height: 5 },
      lassoPoints: [
        { x: 2, y: 3 },
        { x: 5, y: 7 },
      ],
      mirrorAxis: null,
      preview: null,
    });
  });

  it("moves a committed rectangular selection without changing canvas data", () => {
    const initial = createInitialEditorStoreState();
    initial.session.selection = {
      mode: "rect",
      shape: "rect",
      rect: { x: 2, y: 3, width: 4, height: 5 },
      lassoPoints: [
        { x: 2, y: 3 },
        { x: 5, y: 7 },
      ],
      mirrorAxis: null,
      preview: null,
    };
    initial.document.grid.width = 12;
    initial.document.grid.height = 12;

    const store = createEditorStore({ initialState: initial });

    store.dispatch({
      id: "cmd-4",
      kind: "selection.move",
      payload: { deltaX: 3, deltaY: -2 },
      meta: { source: "canvas", timestamp: 4, history: { mode: "skip" } },
    });

    expect(store.getState().session.selection).toEqual({
      mode: "rect",
      shape: "rect",
      rect: { x: 5, y: 1, width: 4, height: 5 },
      lassoPoints: [
        { x: 5, y: 1 },
        { x: 8, y: 5 },
      ],
      mirrorAxis: null,
      preview: null,
    });
  });

  it("clamps selection movement to the canvas bounds", () => {
    const initial = createInitialEditorStoreState();
    initial.session.selection = {
      mode: "lasso",
      shape: "freehand",
      rect: { x: 1, y: 1, width: 3, height: 3 },
      lassoPoints: [
        { x: 1.2, y: 1.4 },
        { x: 3.8, y: 1.2 },
        { x: 2.6, y: 3.7 },
      ],
      mirrorAxis: null,
      preview: null,
    };
    initial.document.grid.width = 5;
    initial.document.grid.height = 5;

    const store = createEditorStore({ initialState: initial });

    store.dispatch({
      id: "cmd-5",
      kind: "selection.move",
      payload: { deltaX: 4, deltaY: 4 },
      meta: { source: "canvas", timestamp: 5, history: { mode: "skip" } },
    });

    expect(store.getState().session.selection).toEqual({
      mode: "lasso",
      shape: "freehand",
      rect: { x: 2, y: 2, width: 3, height: 3 },
      lassoPoints: [
        { x: 2.2, y: 2.4 },
        { x: 4.8, y: 2.2 },
        { x: 3.6, y: 4.7 },
      ],
      mirrorAxis: null,
      preview: null,
    });
  });

  it("starts duplicate placement from the painted cells inside the selection", () => {
    const initial = createInitialEditorStoreState();
    initial.document.grid.width = 5;
    initial.document.grid.height = 5;
    initial.document.grid.cells = [
      null, null, null, null, null,
      null, "dmc:310", "dmc:321", null, null,
      null, null, "dmc:666", null, null,
      null, null, null, null, null,
      null, null, null, null, null,
    ];
    initial.session.selection = {
      mode: "lasso",
      shape: "freehand",
      rect: { x: 1, y: 1, width: 2, height: 2 },
      lassoPoints: [
        { x: 1, y: 1 },
        { x: 3, y: 1 },
        { x: 3, y: 3 },
        { x: 1, y: 3 },
      ],
      mirrorAxis: null,
      preview: null,
    };

    const store = createEditorStore({ initialState: initial });

    store.dispatch({
      id: "cmd-6",
      kind: "selection.beginDuplicatePlacement",
      payload: {},
      meta: { source: "toolbar", timestamp: 6, history: { mode: "skip" } },
    });

    expect(store.getState().session.duplicatePlacement).toEqual({
      sourceRect: { x: 1, y: 1, width: 2, height: 2 },
      cells: [
        { x: 0, y: 0, colorId: "dmc:310" },
        { x: 1, y: 0, colorId: "dmc:321" },
        { x: 1, y: 1, colorId: "dmc:666" },
      ],
    });
  });

  it("commits duplicate placement as a single paint step and clears the session", () => {
    const initial = createInitialEditorStoreState();
    initial.document.grid.width = 6;
    initial.document.grid.height = 6;
    initial.document.grid.cells = new Array(36).fill(null);
    initial.document.grid.cells[1 * 6 + 1] = "dmc:310";
    initial.document.grid.cells[1 * 6 + 2] = "dmc:321";
    initial.document.grid.cells[2 * 6 + 2] = "dmc:666";
    initial.session.selection = {
      mode: "rect",
      shape: "rect",
      rect: { x: 1, y: 1, width: 2, height: 2 },
      lassoPoints: [
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ],
      mirrorAxis: null,
      preview: null,
    };

    const store = createEditorStore({ initialState: initial });

    store.dispatch({
      id: "cmd-7",
      kind: "selection.beginDuplicatePlacement",
      payload: {},
      meta: { source: "toolbar", timestamp: 7, history: { mode: "skip" } },
    });

    store.dispatch({
      id: "cmd-8",
      kind: "selection.commitDuplicatePlacement",
      payload: { deltaX: 2, deltaY: 1 },
      meta: { source: "toolbar", timestamp: 8, history: { mode: "push", label: "Duplicate Selection" } },
    });

    expect(store.getState().session.duplicatePlacement).toBeNull();
    expect(store.getState().document.grid.cells[2 * 6 + 3]).toBe("dmc:310");
    expect(store.getState().document.grid.cells[2 * 6 + 4]).toBe("dmc:321");
    expect(store.getState().document.grid.cells[3 * 6 + 4]).toBe("dmc:666");
    expect(store.getState().document.grid.cells[1 * 6 + 1]).toBe("dmc:310");
  });
});
