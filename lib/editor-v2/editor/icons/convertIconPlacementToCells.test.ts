import { describe, expect, it } from "vitest";
import {
  resolveRasterPlacementColorId,
  sampleCellSampledPlacementPreview,
} from "./convertIconPlacementToCells";
import type { PaletteColor } from "../store/state";

function makePaletteColor(id: string, hex: string): PaletteColor {
  return {
    id,
    brand: "dmc",
    code: id,
    name: id,
    hex,
  };
}

describe("sampleCellSampledPlacementPreview", () => {
  it("samples cell centers correctly from scaled preview rasters", () => {
    const hits: string[] = [];
    const sourceContext = {
      canvas: { width: 2, height: 2 },
      getImageData(x: number, y: number) {
        hits.push(`${x},${y}`);
        const isBottomRight = x === 1 && y === 1;

        return {
          data: new Uint8ClampedArray(
            isBottomRight ? [12, 34, 56, 255] : [0, 0, 0, 0],
          ),
        };
      },
    } as unknown as CanvasRenderingContext2D;

    const cells = sampleCellSampledPlacementPreview({
      bounds: { left: 0, top: 0, width: 40, height: 40 },
      metrics: {
        cellSize: 10,
        cellGap: 0,
        width: 4,
        height: 4,
        surfaceWidth: 40,
        surfaceHeight: 40,
      },
      sourceContext,
    });

    expect(hits).toContain("1,1");
    expect(cells).toEqual([
      {
        alpha: 1,
        color: { r: 12, g: 34, b: 56 },
        x: 2,
        y: 2,
      },
      {
        alpha: 1,
        color: { r: 12, g: 34, b: 56 },
        x: 3,
        y: 2,
      },
      {
        alpha: 1,
        color: { r: 12, g: 34, b: 56 },
        x: 2,
        y: 3,
      },
      {
        alpha: 1,
        color: { r: 12, g: 34, b: 56 },
        x: 3,
        y: 3,
      },
    ]);
  });
});

describe("resolveRasterPlacementColorId", () => {
  it("maps sampled raster pixels to the nearest palette color", () => {
    const paletteById: Record<string, PaletteColor> = {
      red: makePaletteColor("red", "#ff0000"),
      blue: makePaletteColor("blue", "#0000ff"),
      yellow: makePaletteColor("yellow", "#ffff00"),
    };

    expect(
      resolveRasterPlacementColorId(
        { r: 240, g: 20, b: 20 },
        "blue",
        paletteById,
      ),
    ).toBe("red");

    expect(
      resolveRasterPlacementColorId(
        { r: 15, g: 15, b: 230 },
        "red",
        paletteById,
      ),
    ).toBe("blue");
  });

  it("falls back to the active color when the palette is unavailable", () => {
    expect(
      resolveRasterPlacementColorId(
        { r: 120, g: 80, b: 200 },
        "fallback",
        {},
      ),
    ).toBe("fallback");
  });
});
