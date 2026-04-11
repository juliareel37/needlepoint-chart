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
});
