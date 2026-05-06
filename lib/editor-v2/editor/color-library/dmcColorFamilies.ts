import type { PaletteColor } from "../store/state";

export const DMC_COLOR_FAMILY_ORDER = [
  "red",
  "pink",
  "purple",
  "blue",
  "green",
  "yellow",
  "orange",
  "brown",
  "beige",
  "grey",
  "white",
  "black",
] as const;

export type DmcColorFamily = (typeof DMC_COLOR_FAMILY_ORDER)[number];

export type DmcColorFamilySection = {
  family: DmcColorFamily | "other";
  label: string;
  colors: PaletteColor[];
};

const COMBINED_GREYSCALE_FAMILIES: DmcColorFamily[] = ["grey", "white", "black"];

const DMC_COLOR_FAMILY_LABELS: Record<DmcColorFamily, string> = {
  red: "Red",
  pink: "Pink",
  purple: "Purple",
  blue: "Blue",
  green: "Green",
  yellow: "Yellow",
  orange: "Orange",
  brown: "Brown",
  beige: "Beige",
  grey: "Grey",
  white: "White",
  black: "Black",
};

const DMC_COLOR_FAMILY_SET = new Set<string>(DMC_COLOR_FAMILY_ORDER);

export function getDmcColorFamily(color: PaletteColor): DmcColorFamily | "other" {
  if (color.brand !== "dmc") {
    return "other";
  }

  const normalizedFamily = color.family?.trim().toLowerCase();
  if (!normalizedFamily || !DMC_COLOR_FAMILY_SET.has(normalizedFamily)) {
    return "other";
  }

  return normalizedFamily as DmcColorFamily;
}

export function getDmcColorFamilySections(colors: PaletteColor[]): DmcColorFamilySection[] {
  const colorsByFamily = new Map<DmcColorFamily | "other", PaletteColor[]>();

  for (const color of colors) {
    const family = getDmcColorFamily(color);
    const existing = colorsByFamily.get(family);

    if (existing) {
      existing.push(color);
      continue;
    }

    colorsByFamily.set(family, [color]);
  }

  const sections: DmcColorFamilySection[] = [];
  const combinedGreyscaleColors = COMBINED_GREYSCALE_FAMILIES.flatMap(
    (family) => colorsByFamily.get(family) ?? [],
  );

  for (const family of DMC_COLOR_FAMILY_ORDER) {
    if (COMBINED_GREYSCALE_FAMILIES.includes(family)) {
      continue;
    }

    const familyColors = colorsByFamily.get(family);

    if (!familyColors || familyColors.length === 0) {
      continue;
    }

    sections.push({
      family,
      label: DMC_COLOR_FAMILY_LABELS[family],
      colors: familyColors,
    });
  }

  if (combinedGreyscaleColors.length > 0) {
    sections.push({
      family: "grey",
      label: "Grey / B&W",
      colors: combinedGreyscaleColors,
    });
  }

  const otherColors = colorsByFamily.get("other");
  if (otherColors && otherColors.length > 0) {
    sections.push({
      family: "other",
      label: "Other",
      colors: otherColors,
    });
  }

  return sections;
}
