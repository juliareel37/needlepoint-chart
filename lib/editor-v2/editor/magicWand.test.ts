import { describe, expect, it } from "vitest";
import {
  createConnectedMagicSelection,
  getMagicWandToleranceFromDragDistance,
} from "./magicWand";

function createImageDataFromColors(colors: number[][], width: number, height: number): ImageData {
  return {
    data: Uint8ClampedArray.from(colors.flat()),
    width,
    height,
    colorSpace: "srgb",
  } as ImageData;
}

describe("createConnectedMagicSelection", () => {
  it("selects only the connected region that matches the seed color", () => {
    const imageData = createImageDataFromColors(
      [
        [255, 255, 255, 255],
        [255, 255, 255, 255],
        [0, 0, 0, 255],
        [0, 0, 0, 255],
        [0, 0, 0, 255],
        [255, 255, 255, 255],
        [255, 255, 255, 255],
        [0, 0, 0, 255],
        [255, 255, 255, 255],
      ],
      3,
      3,
    );

    const selection = createConnectedMagicSelection({
      imageData,
      seedX: 0,
      seedY: 0,
      tolerance: 0,
    });

    expect(selection.selectedPixelCount).toBe(2);
    expect(Array.from(selection.pixels)).toEqual([
      1, 1, 0,
      0, 0, 0,
      0, 0, 0,
    ]);
  });

  it("expands as tolerance increases", () => {
    const imageData = createImageDataFromColors(
      [
        [100, 100, 100, 255],
        [112, 112, 112, 255],
        [180, 180, 180, 255],
      ],
      3,
      1,
    );

    const lowToleranceSelection = createConnectedMagicSelection({
      imageData,
      seedX: 0,
      seedY: 0,
      tolerance: 5,
    });
    const higherToleranceSelection = createConnectedMagicSelection({
      imageData,
      seedX: 0,
      seedY: 0,
      tolerance: 25,
    });

    expect(lowToleranceSelection.selectedPixelCount).toBe(1);
    expect(higherToleranceSelection.selectedPixelCount).toBe(2);
  });
});

describe("getMagicWandToleranceFromDragDistance", () => {
  it("maps drag distance into the supported tolerance range", () => {
    expect(getMagicWandToleranceFromDragDistance(0)).toBe(0);
    expect(getMagicWandToleranceFromDragDistance(90)).toBeGreaterThan(0);
    expect(getMagicWandToleranceFromDragDistance(10_000)).toBe(220);
  });
});
