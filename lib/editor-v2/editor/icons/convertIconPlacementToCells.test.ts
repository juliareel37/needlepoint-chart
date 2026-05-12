import { describe, expect, it } from "vitest";
import { resolveRasterPlacementColorId } from "./convertIconPlacementToCells";
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
