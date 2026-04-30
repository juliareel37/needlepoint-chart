import { describe, expect, it } from "vitest";
import { createNewDesignState } from "@/lib/editor-v2/editor/store/createNewDesignState";
import { getFillRegion } from "./useGridInteractions";

describe("getFillRegion", () => {
  it("fills a contiguous empty region", () => {
    const state = createNewDesignState(3, 3);
    state.document.grid.cells = [
      null, null, "dmc:310",
      null, "dmc:310", "dmc:310",
      null, null, null,
    ];

    expect(getFillRegion(state, { x: 0, y: 0 }, "dmc:321")).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ]);
  });

  it("fills a contiguous painted region with the clicked color", () => {
    const state = createNewDesignState(4, 3);
    state.document.grid.cells = [
      "dmc:310", "dmc:310", "dmc:321", null,
      "dmc:310", "dmc:666", "dmc:321", null,
      null, "dmc:666", "dmc:321", "dmc:321",
    ];

    expect(getFillRegion(state, { x: 2, y: 0 }, "dmc:699")).toEqual([
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
    ]);
  });

  it("returns no cells when the region already matches the active color", () => {
    const state = createNewDesignState(2, 2);
    state.document.grid.cells = [
      "dmc:310", "dmc:310",
      null, null,
    ];

    expect(getFillRegion(state, { x: 0, y: 0 }, "dmc:310")).toEqual([]);
  });
});
