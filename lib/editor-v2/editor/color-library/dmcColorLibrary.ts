import {
  DMC_COLORS,
  DMC_MATRIX_COLUMNS,
  DMC_MATRIX_ROWS,
  type DmcColor,
  type DmcMatrixColumn,
  type DmcMatrixRow,
} from "@/lib/dmcColors";
import type { PaletteColor, PaletteDocument } from "../store/state";

export const DEFAULT_DMC_COLOR_ID = "dmc-310";

export type DmcMatrixCell = {
  column: DmcMatrixColumn;
  row: DmcMatrixRow;
  colors: PaletteColor[];
};

export type DmcMatrixColumnData = {
  column: DmcMatrixColumn;
  rows: Record<DmcMatrixRow, PaletteColor[]>;
};

type MatrixPlacement = {
  column: DmcMatrixColumn;
  row: DmcMatrixRow;
};

export const DMC_COLOR_LIBRARY: PaletteColor[] = buildFlatMatrixOrderedLibrary(DMC_COLORS);

export const DMC_COLOR_LIBRARY_BY_ID: Record<string, PaletteColor> =
  Object.fromEntries(DMC_COLOR_LIBRARY.map((color) => [color.id, color]));

export const DMC_COLOR_LIBRARY_MATRIX: DmcMatrixColumnData[] =
  buildDmcColorLibraryMatrix(DMC_COLORS);

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

export function getDmcColorLibraryMatrix(): DmcMatrixColumnData[] {
  return DMC_COLOR_LIBRARY_MATRIX;
}

function buildFlatMatrixOrderedLibrary(colors: DmcColor[]): PaletteColor[] {
  const matrix = buildDmcColorLibraryMatrix(colors);
  const flattened: PaletteColor[] = [];

  for (const column of matrix) {
    for (const rowKey of DMC_MATRIX_ROWS) {
      flattened.push(...column.rows[rowKey]);
    }
  }

  return flattened;
}

function buildDmcColorLibraryMatrix(colors: DmcColor[]): DmcMatrixColumnData[] {
  const matrix = createEmptyMatrix();

  for (const color of colors) {
    const placement = getMatrixPlacement(color);
    matrix[placement.column][placement.row].push(toPaletteColor(color));
  }

  for (const column of DMC_MATRIX_COLUMNS) {
    for (const row of DMC_MATRIX_ROWS) {
      matrix[column][row].sort(comparePaletteColorsInCell);
    }
  }

  return DMC_MATRIX_COLUMNS.map((column) => ({
    column,
    rows: matrix[column],
  }));
}

function createEmptyMatrix(): Record<
  DmcMatrixColumn,
  Record<DmcMatrixRow, PaletteColor[]>
> {
  return DMC_MATRIX_COLUMNS.reduce((columnAcc, column) => {
    columnAcc[column] = DMC_MATRIX_ROWS.reduce((rowAcc, row) => {
      rowAcc[row] = [];
      return rowAcc;
    }, {} as Record<DmcMatrixRow, PaletteColor[]>);

    return columnAcc;
  }, {} as Record<DmcMatrixColumn, Record<DmcMatrixRow, PaletteColor[]>>);
}

function toPaletteColor(color: DmcColor): PaletteColor {
  return {
    id: getDmcColorId(color.code),
    brand: "dmc",
    code: color.code,
    name: color.name,
    hex: color.hex,
  };
}

function getDmcColorId(code: string): string {
  return `dmc-${code.toLowerCase()}`;
}

function getMatrixPlacement(color: DmcColor): MatrixPlacement {
  const hsl = hexToHsl(color.hex);

  return {
    column: getMatrixColumn(hsl.h, hsl.s),
    row: getMatrixRow(hsl.l),
  };
}

function getMatrixColumn(hue: number, saturation: number): DmcMatrixColumn {
  if (saturation < 0.12) {
    return "neutral";
  }

  if (hue >= 345 || hue < 20) {
    return "red";
  }
  if (hue < 50) {
    return "orange";
  }
  if (hue < 75) {
    return "yellow";
  }
  if (hue < 165) {
    return "green";
  }
  if (hue < 200) {
    return "teal";
  }
  if (hue < 255) {
    return "blue";
  }
  return "purple";
}

function getMatrixRow(lightness: number): DmcMatrixRow {
  if (lightness < 0.18) {
    return "veryDark";
  }
  if (lightness < 0.32) {
    return "dark";
  }
  if (lightness < 0.5) {
    return "medium";
  }
  if (lightness < 0.68) {
    return "light";
  }
  if (lightness < 0.84) {
    return "veryLight";
  }
  return "ultraLight";
}

function comparePaletteColorsInCell(a: PaletteColor, b: PaletteColor): number {
  const aHsl = hexToHsl(a.hex);
  const bHsl = hexToHsl(b.hex);

  const hueDiff = circularHueDistanceFromAnchor(aHsl.h) - circularHueDistanceFromAnchor(bHsl.h);
  if (hueDiff !== 0) {
    return hueDiff;
  }

  if (aHsl.s !== bHsl.s) {
    return bHsl.s - aHsl.s;
  }

  if (aHsl.l !== bHsl.l) {
    return aHsl.l - bHsl.l;
  }

  return compareCode(a.code, b.code);
}

function circularHueDistanceFromAnchor(hue: number): number {
  return hue;
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