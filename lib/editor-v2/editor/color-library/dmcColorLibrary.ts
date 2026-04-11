import { DMC_COLORS } from "@/lib/dmcColors";
import type { PaletteColor, PaletteDocument } from "../store/state";

export const DEFAULT_DMC_COLOR_ID = "dmc-310";

export const DMC_COLOR_LIBRARY: PaletteColor[] = DMC_COLORS.map((color) => ({
  id: getDmcColorId(color.code),
  brand: "dmc",
  code: color.code,
  name: color.name,
  hex: color.hex,
}));

export const DMC_COLOR_LIBRARY_BY_ID: Record<string, PaletteColor> =
  Object.fromEntries(DMC_COLOR_LIBRARY.map((color) => [color.id, color]));

export function addDmcColorLibraryToPalette(
  palette: PaletteDocument,
): PaletteDocument {
  return {
    ...palette,
    colorsById: {
      ...DMC_COLOR_LIBRARY_BY_ID,
      ...palette.colorsById,
    },
  };
}

function getDmcColorId(code: string): string {
  return `dmc-${code.toLowerCase()}`;
}
