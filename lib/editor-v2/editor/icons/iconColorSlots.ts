import { findClosestPaletteColorId, hexToRgb, type Rgb } from "../color-utils";
import { DMC_COLOR_LIBRARY_BY_ID } from "../color-library";

export interface IconColorSlot {
  id: string;
  sourceHex: string;
  paletteColorId: string | null;
  isLocked?: boolean;
}

const SVG_COLOR_ATTRIBUTE_REGEX = /\b(?:fill|stroke)=["']([^"']+)["']/gi;
const SVG_COLOR_STYLE_REGEX = /\b(?:fill|stroke)\s*:\s*([^;"']+)/gi;

export function extractIconColorSlotsFromSvg(svg: string): IconColorSlot[] {
  const colors = new Map<string, string>();

  collectSvgColors(svg, SVG_COLOR_ATTRIBUTE_REGEX, colors);
  collectSvgColors(svg, SVG_COLOR_STYLE_REGEX, colors);

  return Array.from(colors.values()).map((sourceHex, index) => ({
    id: `slot-${index + 1}`,
    sourceHex,
    paletteColorId: findClosestPaletteColorId(
      DMC_COLOR_LIBRARY_BY_ID,
      hexToRgb(sourceHex) as Rgb,
    ),
  }));
}

export function findNearestIconColorSlot(
  slots: IconColorSlot[],
  pixel: Rgb,
): IconColorSlot | null {
  let bestSlot: IconColorSlot | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const slot of slots) {
    const slotRgb = hexToRgb(slot.sourceHex);
    if (!slotRgb) {
      continue;
    }

    const distance = getRgbDistanceSquared(slotRgb, pixel);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestSlot = slot;
    }
  }

  return bestSlot;
}

function collectSvgColors(
  svg: string,
  pattern: RegExp,
  colors: Map<string, string>,
) {
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(svg)) !== null) {
    const normalized = normalizeSvgColor(match[1] ?? "");
    if (!normalized) {
      continue;
    }

    colors.set(normalized, normalized);
  }
}

function normalizeSvgColor(value: string): string | null {
  const normalized = value.trim().toLowerCase();

  if (
    normalized.length === 0 ||
    normalized === "none" ||
    normalized === "transparent" ||
    normalized === "currentcolor" ||
    normalized.startsWith("url(") ||
    normalized.startsWith("var(")
  ) {
    return null;
  }

  if (/^#[0-9a-f]{6}$/i.test(normalized)) {
    return normalized;
  }

  if (/^#[0-9a-f]{3}$/i.test(normalized)) {
    return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`;
  }

  const rgbMatch = normalized.match(
    /^rgba?\(\s*(\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})(?:\s*[,/]\s*[\d.]+)?\s*\)$/i,
  );
  if (rgbMatch) {
    const r = clampRgbChannel(rgbMatch[1]);
    const g = clampRgbChannel(rgbMatch[2]);
    const b = clampRgbChannel(rgbMatch[3]);
    return rgbToHex({ r, g, b });
  }

  return null;
}

function clampRgbChannel(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(Math.max(parsed, 0), 255);
}

function rgbToHex(rgb: Rgb): string {
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function toHex(value: number): string {
  return value.toString(16).padStart(2, "0");
}

function getRgbDistanceSquared(left: Rgb, right: Rgb): number {
  const dr = left.r - right.r;
  const dg = left.g - right.g;
  const db = left.b - right.b;
  return dr * dr + dg * dg + db * db;
}
