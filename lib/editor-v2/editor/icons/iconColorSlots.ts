import { findClosestPaletteColorId, hexToRgb, type Rgb } from "../color-utils";
import { DMC_COLOR_LIBRARY_BY_ID } from "../color-library";

export interface IconColorSlot {
  id: string;
  sourceHex: string;
  paletteColorId: string | null;
}

const SVG_COLOR_ATTRIBUTE_REGEX = /\b(?:fill|stroke)=["']([^"']+)["']/gi;
const SVG_COLOR_STYLE_REGEX = /\b(?:fill|stroke)\s*:\s*([^;"']+)/gi;
const DEFAULT_RASTER_SLOT_LIMIT = 6;
const RASTER_ALPHA_THRESHOLD = 16;

type SharpRawResult = {
  data: Uint8Array | Buffer;
  info: {
    width: number;
    height: number;
    channels: number;
  };
};

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

export async function extractIconColorSlotsFromRaster(
  input: Buffer,
  maxColors = DEFAULT_RASTER_SLOT_LIMIT,
): Promise<IconColorSlot[]> {
  if (maxColors <= 0) {
    return [];
  }

  const sharpModule = await import("sharp");
  const sharp = ("default" in sharpModule ? sharpModule.default : sharpModule) as
    | ((input: Buffer) => {
        resize(options: {
          width: number;
          height: number;
          fit: "inside";
          withoutEnlargement: boolean;
        }): {
          ensureAlpha(): {
            raw(): {
              toBuffer(options: { resolveWithObject: true }): Promise<SharpRawResult>;
            };
          };
        };
      })
    | undefined;

  if (!sharp) {
    return [];
  }

  const { data, info } = await sharp(input)
    .resize({
      width: 64,
      height: 64,
      fit: "inside",
      withoutEnlargement: true,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bucketMap = new Map<
    string,
    { count: number; sumR: number; sumG: number; sumB: number }
  >();

  for (let index = 0; index < data.length; index += info.channels) {
    const alpha = data[index + 3] ?? 255;
    if (alpha < RASTER_ALPHA_THRESHOLD) {
      continue;
    }

    const r = data[index] ?? 0;
    const g = data[index + 1] ?? 0;
    const b = data[index + 2] ?? 0;
    const key = `${quantizeChannel(r)}-${quantizeChannel(g)}-${quantizeChannel(b)}`;
    const existing = bucketMap.get(key);

    if (existing) {
      existing.count += 1;
      existing.sumR += r;
      existing.sumG += g;
      existing.sumB += b;
      continue;
    }

    bucketMap.set(key, {
      count: 1,
      sumR: r,
      sumG: g,
      sumB: b,
    });
  }

  const rankedColors = Array.from(bucketMap.values())
    .sort((left, right) => right.count - left.count)
    .map((entry) => ({
      r: Math.round(entry.sumR / entry.count),
      g: Math.round(entry.sumG / entry.count),
      b: Math.round(entry.sumB / entry.count),
    }));

  const selectedColors: Rgb[] = [];
  for (const candidate of rankedColors) {
    if (selectedColors.some((existing) => getRgbDistanceSquared(existing, candidate) < 24 * 24)) {
      continue;
    }

    selectedColors.push(candidate);
    if (selectedColors.length >= maxColors) {
      break;
    }
  }

  return selectedColors.map((rgb, index) => {
    const sourceHex = rgbToHex(rgb);
    return {
      id: `slot-${index + 1}`,
      sourceHex,
      paletteColorId: findClosestPaletteColorId(DMC_COLOR_LIBRARY_BY_ID, rgb),
    };
  });
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

function quantizeChannel(value: number): number {
  return Math.max(0, Math.min(15, Math.round(value / 17)));
}

function getRgbDistanceSquared(left: Rgb, right: Rgb): number {
  const dr = left.r - right.r;
  const dg = left.g - right.g;
  const db = left.b - right.b;
  return dr * dr + dg * dg + db * db;
}
