import type { CustomPalette, PaletteColor } from "../store/state";

export type ColorLibraryPaletteSection = {
  id: string;
  label: string;
  colors: PaletteColor[];
};

export function getColorLibraryPaletteSections(
  colors: PaletteColor[],
  customPalettesById: Record<string, CustomPalette>,
): ColorLibraryPaletteSection[] {
  const colorsById = colors.reduce<Record<string, PaletteColor>>((accumulator, color) => {
    accumulator[color.id] = color;
    return accumulator;
  }, {});

  return Object.values(customPalettesById).map((palette) => ({
    id: palette.id,
    label: palette.name,
    colors: palette.colorIds
      .map((colorId) => colorsById[colorId])
      .filter((color): color is PaletteColor => Boolean(color)),
  }));
}
