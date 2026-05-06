import { describe, expect, it } from "vitest";
import type { PaletteColor } from "../store/state";
import { getDmcColorFamily, getDmcColorFamilySections } from "./dmcColorFamilies";

describe("getDmcColorFamily", () => {
  it("uses the family attached to the dmc color metadata", () => {
    expect(getDmcColorFamily(createColor("dmc-321", "321", "red"))).toBe("red");
    expect(getDmcColorFamily(createColor("dmc-602", "602", "pink"))).toBe("pink");
    expect(getDmcColorFamily(createColor("dmc-blanc", "BLANC", "white"))).toBe("white");
    expect(getDmcColorFamily(createColor("dmc-310", "310", "black"))).toBe("black");
  });

  it("falls back to other for unknown family values or non-dmc colors", () => {
    expect(getDmcColorFamily(createColor("dmc-151", "151", "magenta"))).toBe("other");
    expect(
      getDmcColorFamily({
        id: "custom-1",
        brand: "custom",
        code: "custom",
        name: "Custom blue",
        hex: "#123456",
        family: "blue",
      }),
    ).toBe("other");
  });
});

describe("getDmcColorFamilySections", () => {
  it("groups colors by family in the configured section order", () => {
    const sections = getDmcColorFamilySections([
      createColor("dmc-602", "602", "pink"),
      createColor("dmc-310", "310", "black"),
      createColor("dmc-321", "321", "red"),
      createColor("dmc-151", "151", "mystery"),
    ]);

    expect(sections.map((section) => section.label)).toEqual([
      "Red",
      "Pink",
      "Black",
      "Other",
    ]);
    expect(sections[0]?.colors.map((color) => color.code)).toEqual(["321"]);
    expect(sections[1]?.colors.map((color) => color.code)).toEqual(["602"]);
    expect(sections[2]?.colors.map((color) => color.code)).toEqual(["310"]);
    expect(sections[3]?.colors.map((color) => color.code)).toEqual(["151"]);
  });
});

function createColor(id: string, code: string, family: string): PaletteColor {
  return {
    id,
    brand: "dmc",
    code,
    name: code,
    hex: "#000000",
    family,
  };
}
