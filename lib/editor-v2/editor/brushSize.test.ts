import { describe, expect, it } from "vitest";
import { clampGridBrushSize, getGridBrushSizeMax } from "./brushSize";

describe("grid brush sizing", () => {
  it("scales the max brush size with the shorter grid side", () => {
    expect(getGridBrushSizeMax(5, 5)).toBe(1);
    expect(getGridBrushSizeMax(80, 120)).toBe(16);
    expect(getGridBrushSizeMax(300, 300)).toBe(60);
  });

  it("caps very large grids to keep brush strokes bounded", () => {
    expect(getGridBrushSizeMax(2000, 1600)).toBe(200);
  });

  it("clamps brush sizes to the dynamic range", () => {
    expect(clampGridBrushSize(0, 200, 200)).toBe(1);
    expect(clampGridBrushSize(16.6, 200, 200)).toBe(17);
    expect(clampGridBrushSize(50, 200, 200)).toBe(40);
  });
});
