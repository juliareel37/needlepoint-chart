// dmcColorLibrary.ts
import { DMC_COLORS, DMC_FAMILY_ORDER, type DmcColor } from "@/lib/dmcColors";
import type { PaletteColor, PaletteDocument } from "../store/state";

export const DEFAULT_DMC_COLOR_ID = "dmc-310";

const FAMILY_RANK: Record<string, number> = Object.fromEntries(
  DMC_FAMILY_ORDER.map((family, index) => [family, index]),
);

export const DMC_COLOR_LIBRARY: PaletteColor[] = [...DMC_COLORS]
  .sort(compareDmcColorsForPalette)
  .map((color) => ({
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

function compareDmcColorsForPalette(a: DmcColor, b: DmcColor): number {
  const familyDiff =
    getFamilyRank(a.family) - getFamilyRank(b.family);

  if (familyDiff !== 0) {
    return familyDiff;
  }

  const aHsl = hexToHsl(a.hex);
  const bHsl = hexToHsl(b.hex);

  const aNeutral = isNeutral(aHsl.s);
  const bNeutral = isNeutral(bHsl.s);

  // Within neutrals: dark -> light
  if (aNeutral && bNeutral) {
    if (aHsl.l !== bHsl.l) {
      return aHsl.l - bHsl.l;
    }
    return compareCode(a.code, b.code);
  }

  // Within chromatic families:
  // 1) hue
  // 2) saturation
  // 3) lightness
  if (aHsl.h !== bHsl.h) {
    return aHsl.h - bHsl.h;
  }

  if (aHsl.s !== bHsl.s) {
    return bHsl.s - aHsl.s;
  }

  if (aHsl.l !== bHsl.l) {
    return aHsl.l - bHsl.l;
  }

  return compareCode(a.code, b.code);
}

function getFamilyRank(family: string): number {
  return FAMILY_RANK[family] ?? Number.MAX_SAFE_INTEGER;
}

function isNeutral(saturation: number): boolean {
  return saturation < 0.12;
}

function compareCode(a: string, b: string): number {
  const aNum = Number(a);
  const bNum = Number(b);

  const aIsNum = Number.isFinite(aNum);
  const bIsNum = Number.isFinite(bNum);

  if (aIsNum && bIsNum) {
    return aNum - bNum;
  }

  return a.localeCompare(b);
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const normalized = normalizeHex(hex);
  const r = parseInt(normalized.slice(1, 3), 16) / 255;
  const g = parseInt(normalized.slice(3, 5), 16) / 255;
  const b = parseInt(normalized.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  const l = (max + min) / 2;
  let s = 0;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    switch (max) {
      case r:
        h = 60 * (((g - b) / delta) % 6);
        break;
      case g:
        h = 60 * ((b - r) / delta + 2);
        break;
      case b:
        h = 60 * ((r - g) / delta + 4);
        break;
    }
  }

  if (h < 0) {
    h += 360;
  }

  return { h, s, l };
}

function normalizeHex(hex: string): string {
  const value = hex.trim().toLowerCase();

  if (/^#[0-9a-f]{6}$/.test(value)) {
    return value;
  }

  if (/^#[0-9a-f]{3}$/.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }

  throw new Error(`Invalid hex color: ${hex}`);
}