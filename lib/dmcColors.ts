import type { Color } from "./grid";
import { DMC_COLORS } from "./dmcColors.generated";

export type DmcColor = Color & {
  code: string;
  family: string;
  nameMaxx: string;
};

export const DMC_MATRIX_COLUMNS = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "neutral",
] as const;

export type DmcMatrixColumn = (typeof DMC_MATRIX_COLUMNS)[number];

export const DMC_MATRIX_ROWS = [
  "veryDark",
  "dark",
  "medium",
  "light",
  "veryLight",
  "ultraLight",
] as const;

export type DmcMatrixRow = (typeof DMC_MATRIX_ROWS)[number];

export { DMC_COLORS };
