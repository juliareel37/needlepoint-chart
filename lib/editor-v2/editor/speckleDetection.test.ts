import { describe, expect, it } from "vitest";
import type { GridCellValue, PaletteColor } from "./store";
import {
  buildSpeckleSmoothingReplacements,
  detectSpeckleCellIndexes,
} from "./speckleDetection";

describe("detectSpeckleCellIndexes", () => {
  it("finds a painted cell surrounded by eight different-color painted neighbors", () => {
    const cells: GridCellValue[] = [
      "blue", "blue", "blue",
      "blue", "red", "blue",
      "blue", "blue", "blue",
    ];

    expect(detectSpeckleCellIndexes(cells, 3, 3)).toEqual([4]);
  });

  it("does not count matching, empty, or edge-neighbor cells", () => {
    const withMatchingNeighbor: GridCellValue[] = [
      "blue", "red", "blue",
      "blue", "red", "blue",
      "blue", "blue", "blue",
    ];
    const withEmptyNeighbor: GridCellValue[] = [
      "blue", "blue", "blue",
      "blue", "red", null,
      "blue", "blue", "blue",
    ];
    const edgeSpeckleCandidate: GridCellValue[] = [
      "red", "blue", "blue",
      "blue", "blue", "blue",
      "blue", "blue", "blue",
    ];

    expect(detectSpeckleCellIndexes(withMatchingNeighbor, 3, 3)).toEqual([]);
    expect(detectSpeckleCellIndexes(withEmptyNeighbor, 3, 3)).toEqual([]);
    expect(detectSpeckleCellIndexes(edgeSpeckleCandidate, 3, 3)).toEqual([]);
  });

  it("chooses the simple majority neighbor color for smoothing", () => {
    const cells: GridCellValue[] = [
      "black", "black", "black",
      "black", "white", "gray",
      "black", "gray", "gray",
    ];

    expect(buildSpeckleSmoothingReplacements(cells, 3, 3, COLORS)).toEqual([
      { index: 4, fromColorId: "white", toColorId: "black" },
    ]);
  });

  it("groups nearby shades before choosing the smoothing replacement", () => {
    const cells: GridCellValue[] = [
      "blue-1", "blue-2", "green",
      "blue-3", "gray", "green",
      "blue-2", "green", "green",
    ];

    expect(buildSpeckleSmoothingReplacements(cells, 3, 3, COLORS)).toEqual([
      { index: 4, fromColorId: "gray", toColorId: "blue-2" },
    ]);
  });

  it("only detects and smooths speckles in the eligible cell scope", () => {
    const cells: GridCellValue[] = [
      "black", "black", "black", "black", "black",
      "black", "white", "black", "gray", "black",
      "black", "black", "black", "black", "black",
    ];
    const eligibleCellIndexes = new Set([6]);

    expect(detectSpeckleCellIndexes(cells, 5, 3, eligibleCellIndexes)).toEqual([6]);
    expect(buildSpeckleSmoothingReplacements(cells, 5, 3, COLORS, eligibleCellIndexes)).toEqual([
      { index: 6, fromColorId: "white", toColorId: "black" },
    ]);
  });
});

const COLORS: Record<string, PaletteColor> = {
  black: createColor("black", "#050505"),
  "blue-1": createColor("blue-1", "#154bff"),
  "blue-2": createColor("blue-2", "#2360f2"),
  "blue-3": createColor("blue-3", "#3474ff"),
  gray: createColor("gray", "#888888"),
  green: createColor("green", "#18a558"),
  white: createColor("white", "#ffffff"),
};

function createColor(id: string, hex: string): PaletteColor {
  return {
    id,
    brand: "custom",
    code: id,
    name: id,
    hex,
  };
}
