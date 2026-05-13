import { describe, expect, it } from "vitest";
import { addDmcColorLibraryToPalette } from "./dmcColorLibrary";
import type { PaletteDocument } from "../store/state";

describe("addDmcColorLibraryToPalette", () => {
  it("removes discontinued dmc-776 entries from persisted palette state", () => {
    const palette = addDmcColorLibraryToPalette({
      colorsById: {
        "dmc-776": {
          id: "dmc-776",
          brand: "dmc",
          code: "776",
          name: "Pink Medium",
          hex: "#fcb0b9",
        },
      },
      customPalettesById: {
        custom: {
          id: "custom",
          name: "Favorites",
          colorIds: ["dmc-321", "dmc-776"],
        },
      },
      extractedPaletteIds: ["dmc-776", "dmc-321"],
      symbolAssignments: {
        "dmc-776": "A",
        "dmc-321": "B",
      },
    } satisfies PaletteDocument);

    expect(palette.colorsById["dmc-776"]).toBeUndefined();
    expect(palette.customPalettesById.custom?.colorIds).toEqual(["dmc-321"]);
    expect(palette.extractedPaletteIds).toEqual(["dmc-321"]);
    expect(palette.symbolAssignments).toEqual({ "dmc-321": "B" });
  });

  it("refreshes persisted dmc colors with current library metadata", () => {
    const palette = addDmcColorLibraryToPalette({
      colorsById: {
        "dmc-321": {
          id: "dmc-321",
          brand: "dmc",
          code: "321",
          name: "Old saved name",
          hex: "#000000",
        },
      },
      customPalettesById: {},
      extractedPaletteIds: [],
      symbolAssignments: {},
    } satisfies PaletteDocument);

    expect(palette.colorsById["dmc-321"]).toMatchObject({
      id: "dmc-321",
      brand: "dmc",
      code: "321",
      family: "red",
      searchAliases: ["Red"],
    });
    expect(palette.colorsById["dmc-321"]?.name).not.toBe("Old saved name");
    expect(palette.colorsById["dmc-321"]?.hex).not.toBe("#000000");
  });
});
