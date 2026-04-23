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
});
