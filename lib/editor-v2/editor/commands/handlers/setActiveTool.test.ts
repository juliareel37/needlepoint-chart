import { describe, expect, it } from "vitest";
import { createEditorStore } from "../../store/createEditorStore";
import { createInitialEditorStoreState } from "../../store/state";

describe("setActiveToolCommandHandler", () => {
  it("captures the previous tool when entering eyedropper", () => {
    const initial = createInitialEditorStoreState();
    initial.session.activeTool.tool = "paint";
    initial.session.activeTool.colorId = "dmc:310";

    const store = createEditorStore({ initialState: initial });

    store.dispatch({
      id: "cmd-1",
      kind: "tool.setActive",
      payload: { tool: "eyedropper" },
      meta: { source: "toolbar", timestamp: 1, history: { mode: "skip" } },
    });

    expect(store.getState().session.activeTool.tool).toBe("eyedropper");
    expect(store.getState().session.eyedropperReturnTool).toBe("paint");
  });

  it("clears eyedropperReturnTool when leaving eyedropper", () => {
    const initial = createInitialEditorStoreState();
    initial.session.activeTool.tool = "paint";

    const store = createEditorStore({ initialState: initial });

    store.dispatch({
      id: "cmd-1",
      kind: "tool.setActive",
      payload: { tool: "eyedropper" },
      meta: { source: "toolbar", timestamp: 1, history: { mode: "skip" } },
    });

    store.dispatch({
      id: "cmd-2",
      kind: "tool.setActive",
      payload: { tool: "erase" },
      meta: { source: "toolbar", timestamp: 2, history: { mode: "skip" } },
    });

    expect(store.getState().session.activeTool.tool).toBe("erase");
    expect(store.getState().session.eyedropperReturnTool).toBeNull();
  });

  it("clears the selection when leaving lasso", () => {
    const initial = createInitialEditorStoreState();
    initial.session.activeTool.tool = "lasso";
    initial.session.selection = {
      mode: "lasso",
      shape: "freehand",
      rect: { x: 2, y: 3, width: 4, height: 5 },
      lassoPoints: [
        { x: 2, y: 3 },
        { x: 5, y: 3 },
        { x: 5, y: 7 },
      ],
      mirrorAxis: null,
      preview: null,
    };

    const store = createEditorStore({ initialState: initial });

    store.dispatch({
      id: "cmd-1",
      kind: "tool.setActive",
      payload: { tool: "paint" },
      meta: { source: "toolbar", timestamp: 1, history: { mode: "skip" } },
    });

    expect(store.getState().session.activeTool.tool).toBe("paint");
    expect(store.getState().session.selection).toEqual({
      mode: "none",
      shape: "freehand",
      rect: null,
      lassoPoints: [],
      mirrorAxis: null,
      preview: null,
    });
  });

  it("keeps a committed selection when switching from lasso to fill", () => {
    const initial = createInitialEditorStoreState();
    initial.session.activeTool.tool = "lasso";
    initial.session.selection = {
      mode: "lasso",
      shape: "freehand",
      rect: { x: 2, y: 3, width: 4, height: 5 },
      lassoPoints: [
        { x: 2, y: 3 },
        { x: 5, y: 3 },
        { x: 5, y: 7 },
      ],
      mirrorAxis: null,
      preview: null,
    };

    const store = createEditorStore({ initialState: initial });

    store.dispatch({
      id: "cmd-1",
      kind: "tool.setActive",
      payload: { tool: "fill" },
      meta: { source: "toolbar", timestamp: 1, history: { mode: "skip" } },
    });

    expect(store.getState().session.activeTool.tool).toBe("fill");
    expect(store.getState().session.selection).toEqual(initial.session.selection);
  });

  it("clears a preserved selection when leaving fill", () => {
    const initial = createInitialEditorStoreState();
    initial.session.activeTool.tool = "fill";
    initial.session.selection = {
      mode: "lasso",
      shape: "freehand",
      rect: { x: 2, y: 3, width: 4, height: 5 },
      lassoPoints: [
        { x: 2, y: 3 },
        { x: 5, y: 3 },
        { x: 5, y: 7 },
      ],
      mirrorAxis: null,
      preview: null,
    };

    const store = createEditorStore({ initialState: initial });

    store.dispatch({
      id: "cmd-1",
      kind: "tool.setActive",
      payload: { tool: "paint" },
      meta: { source: "toolbar", timestamp: 1, history: { mode: "skip" } },
    });

    expect(store.getState().session.activeTool.tool).toBe("paint");
    expect(store.getState().session.selection).toEqual({
      mode: "none",
      shape: "freehand",
      rect: null,
      lassoPoints: [],
      mirrorAxis: null,
      preview: null,
    });
  });

  it("keeps a committed selection when switching from lasso to erase", () => {
    const initial = createInitialEditorStoreState();
    initial.session.activeTool.tool = "lasso";
    initial.session.selection = {
      mode: "lasso",
      shape: "freehand",
      rect: { x: 2, y: 3, width: 4, height: 5 },
      lassoPoints: [
        { x: 2, y: 3 },
        { x: 5, y: 3 },
        { x: 5, y: 7 },
      ],
      mirrorAxis: null,
      preview: null,
    };

    const store = createEditorStore({ initialState: initial });

    store.dispatch({
      id: "cmd-1",
      kind: "tool.setActive",
      payload: { tool: "erase" },
      meta: { source: "toolbar", timestamp: 1, history: { mode: "skip" } },
    });

    expect(store.getState().session.activeTool.tool).toBe("erase");
    expect(store.getState().session.selection).toEqual(initial.session.selection);
  });

  it("remembers separate brush sizes for paint and erase", () => {
    const initial = createInitialEditorStoreState();
    initial.session.activeTool.tool = "paint";

    const store = createEditorStore({ initialState: initial });

    store.dispatch({
      id: "cmd-1",
      kind: "tool.setActive",
      payload: { tool: "paint", brushSize: 6 },
      meta: { source: "toolbar", timestamp: 1, history: { mode: "skip" } },
    });

    store.dispatch({
      id: "cmd-2",
      kind: "tool.setActive",
      payload: { tool: "erase" },
      meta: { source: "toolbar", timestamp: 2, history: { mode: "skip" } },
    });

    expect(store.getState().session.activeTool.brushSize).toBe(1);
    expect(store.getState().session.activeTool.paintBrushSize).toBe(6);
    expect(store.getState().session.activeTool.eraseBrushSize).toBe(1);

    store.dispatch({
      id: "cmd-3",
      kind: "tool.setActive",
      payload: { tool: "erase", brushSize: 2 },
      meta: { source: "toolbar", timestamp: 3, history: { mode: "skip" } },
    });

    expect(store.getState().session.activeTool.brushSize).toBe(2);
    expect(store.getState().session.activeTool.eraseBrushSize).toBe(2);

    store.dispatch({
      id: "cmd-4",
      kind: "tool.setActive",
      payload: { tool: "paint" },
      meta: { source: "toolbar", timestamp: 4, history: { mode: "skip" } },
    });

    expect(store.getState().session.activeTool.tool).toBe("paint");
    expect(store.getState().session.activeTool.brushSize).toBe(6);
    expect(store.getState().session.activeTool.paintBrushSize).toBe(6);
    expect(store.getState().session.activeTool.eraseBrushSize).toBe(2);
  });
});
