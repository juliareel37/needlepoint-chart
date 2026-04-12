import { describe, expect, it } from "vitest";
import { createEditorStore } from "../../store/createEditorStore";
import { createNewDesignState } from "../../store/createNewDesignState";
import type { EditorCommand } from "../types";

describe("gridPaintCommandHandler", () => {
  it("assigns symbols in first-use order and keeps them after undo", () => {
    const store = createEditorStore({
      initialState: createNewDesignState(2, 2),
    });

    store.dispatch(createPaintCommand("dmc:310", [{ x: 0, y: 0 }], 1));
    store.dispatch(createPaintCommand("dmc:321", [{ x: 1, y: 0 }], 2));
    store.dispatch(createUndoCommand(3));

    expect(store.getState().document.palette.symbolAssignments).toEqual({
      "dmc:310": "!",
      "dmc:321": "@",
    });
    expect(store.getState().document.grid.cells).toEqual(["dmc:310", null, null, null]);
  });
});

function createPaintCommand(
  colorId: string,
  cells: Array<{ x: number; y: number }>,
  timestamp: number,
): EditorCommand {
  return {
    id: `paint-${timestamp}`,
    kind: "grid.paint",
    payload: { colorId, cells },
    meta: {
      source: "canvas",
      timestamp,
      history: { mode: "push", label: "Paint" },
    },
  };
}

function createUndoCommand(timestamp: number): EditorCommand {
  return {
    id: `undo-${timestamp}`,
    kind: "history.undo",
    payload: {},
    meta: {
      source: "toolbar",
      timestamp,
      history: { mode: "skip" },
    },
  };
}
