import { findClosestPaletteColorId, type Rgb } from "../color-utils";
import { DMC_COLOR_LIBRARY_BY_ID } from "../color-library";
import type { IconColorSlot } from "./iconColorSlots";

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

type SharpMetadata = {
  width?: number;
  height?: number;
};

type SharpLike = (input: Buffer) => {
  metadata(): Promise<SharpMetadata>;
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
};

export async function getRasterImageDimensions(
  input: Buffer,
  absolutePath: string,
): Promise<{ width: number; height: number }> {
  const sharp = await loadSharp();
  if (!sharp) {
    throw new Error(`sharp is unavailable for raster icon metadata: ${absolutePath}`);
  }

  const metadata = await sharp(input).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    throw new Error(`Unable to read raster dimensions from ${absolutePath}`);
  }

  return { width, height };
}

export async function extractIconColorSlotsFromRaster(
  input: Buffer,
  maxColors = DEFAULT_RASTER_SLOT_LIMIT,
): Promise<IconColorSlot[]> {
  if (maxColors <= 0) {
    return [];
  }

  const sharp = await loadSharp();
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

  return selectedColors.map((rgb, index) => ({
    id: `slot-${index + 1}`,
    sourceHex: rgbToHex(rgb),
    paletteColorId: findClosestPaletteColorId(DMC_COLOR_LIBRARY_BY_ID, rgb),
  }));
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

async function loadSharp(): Promise<SharpLike | undefined> {
  const sharpModule = await import("sharp");
  return ("default" in sharpModule ? sharpModule.default : sharpModule) as
    | SharpLike
    | undefined;
}
