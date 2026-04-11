import { describe, expect, it } from "vitest";
import { createEditorStore } from "../../store/createEditorStore";
import { createInitialEditorStoreState } from "../../store/state";
import type { EditorCommand } from "../types";

describe("mirror session flow", () => {
  it("commits a mirror session as one undoable action", () => {
    const store = createEditorStore({ initialState: createMirrorTestState() });

    store.dispatch(createCommand("mirror.start", { point: { x: 0, y: 0 } }, 1));
    store.dispatch(createCommand("mirror.update", { point: { x: 1, y: 0 } }, 2));
    store.dispatch(createCommand("mirror.commit", {}, 3));
    store.dispatch(createCommand("mirror.apply", { direction: "right" }, 4));

    expect(store.getState().document.grid.cells).toEqual([
      "dmc:310",
      "dmc:321",
      "dmc:321",
      "dmc:310",
    ]);
    expect(store.getState().session.history.past).toHaveLength(0);

    store.dispatch(createCommand("mirror.done", {}, 5, { mode: "push", label: "Mirror" }));

    expect(store.getState().session.history.past).toHaveLength(1);

    store.dispatch(createCommand("history.undo", {}, 6));
    expect(store.getState().document.grid.cells).toEqual([
      "dmc:310",
      "dmc:321",
      null,
      null,
    ]);

    store.dispatch(createCommand("history.redo", {}, 7));
    expect(store.getState().document.grid.cells).toEqual([
      "dmc:310",
      "dmc:321",
      "dmc:321",
      "dmc:310",
    ]);
  });

  it("cancels the temporary mirror edits without adding history", () => {
    const store = createEditorStore({ initialState: createMirrorTestState() });

    store.dispatch(createCommand("mirror.start", { point: { x: 0, y: 0 } }, 1));
    store.dispatch(createCommand("mirror.update", { point: { x: 1, y: 0 } }, 2));
    store.dispatch(createCommand("mirror.commit", {}, 3));
    store.dispatch(createCommand("mirror.apply", { direction: "right" }, 4));
    store.dispatch(createCommand("mirror.cancel", {}, 5));

    expect(store.getState().document.grid.cells).toEqual([
      "dmc:310",
      "dmc:321",
      null,
      null,
    ]);
    expect(store.getState().session.history.past).toHaveLength(0);
    expect(store.getState().session.mirrorInteraction.session).toBeNull();
    expect(store.getState().session.activeTool.tool).toBe("pan");
  });
});

function createMirrorTestState() {
  const state = createInitialEditorStoreState();

  return {
    ...state,
    document: {
      ...state.document,
      grid: {
        ...state.document.grid,
        width: 4,
        height: 1,
        cells: ["dmc:310", "dmc:321", null, null],
      },
      palette: {
        ...state.document.palette,
        colorsById: {
          "dmc:310": {
            id: "dmc:310",
            brand: "dmc" as const,
            code: "310",
            name: "Black",
            hex: "#000000",
          },
          "dmc:321": {
            id: "dmc:321",
            brand: "dmc" as const,
            code: "321",
            name: "Red",
            hex: "#c72b3b",
          },
        },
      },
    },
  };
}

function createCommand(
  kind: EditorCommand["kind"],
  payload: Record<string, unknown>,
  timestamp: number,
  history: EditorCommand["meta"]["history"] = { mode: "skip" },
): EditorCommand {
  return {
    id: `${kind}-${timestamp}`,
    kind,
    payload: payload as never,
    meta: {
      source: "toolbar",
      timestamp,
      history,
    },
  } as EditorCommand;
}
