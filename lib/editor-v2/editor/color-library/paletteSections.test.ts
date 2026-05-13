import { describe, expect, it } from "vitest";
import type { CustomPalette, PaletteColor } from "../store/state";
import { getColorLibraryPaletteSections } from "./paletteSections";

describe("getColorLibraryPaletteSections", () => {
  it("builds palette sections in palette order and preserves duplicate colors", () => {
    const colors = [
      createColor("dmc-321", "321"),
      createColor("dmc-666", "666"),
      createColor("dmc-444", "444"),
    ];
    const customPalettesById: Record<string, CustomPalette> = {
      warm: {
        id: "warm",
        name: "Warm",
        colorIds: ["dmc-321", "dmc-666", "dmc-321"],
      },
      accent: {
        id: "accent",
        name: "Accent",
        colorIds: ["dmc-444"],
      },
    };

    expect(getColorLibraryPaletteSections(colors, customPalettesById)).toEqual([
      {
        id: "warm",
        label: "Warm",
        colors: [colors[0], colors[1], colors[0]],
      },
      {
        id: "accent",
        label: "Accent",
        colors: [colors[2]],
      },
    ]);
  });

  it("drops palette color ids that do not exist in the available color library", () => {
    const colors = [createColor("dmc-321", "321")];
    const customPalettesById: Record<string, CustomPalette> = {
      warm: {
        id: "warm",
        name: "Warm",
        colorIds: ["dmc-321", "missing-color"],
      },
    };

    expect(getColorLibraryPaletteSections(colors, customPalettesById)).toEqual([
      {
        id: "warm",
        label: "Warm",
        colors: [colors[0]],
      },
    ]);
  });
});

function createColor(id: string, code: string): PaletteColor {
  return {
    id,
    brand: "dmc",
    code,
    name: `Color ${code}`,
    hex: "#000000",
    family: "red",
  };
}
