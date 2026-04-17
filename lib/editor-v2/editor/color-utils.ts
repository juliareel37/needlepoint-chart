import type { PaletteColor } from "./store/state";

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): Rgb | null {
  const value = hex.trim().replace(/^#/, "");
  if (value.length !== 6) {
    return null;
  }

  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);

  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
    return null;
  }

  return { r, g, b };
}

export function findClosestPaletteColorId(
  colors: Record<string, PaletteColor>,
  target: Rgb,
): string | null {
  let bestId: string | null = null;
  let bestDist = Number.POSITIVE_INFINITY;

  for (const color of Object.values(colors)) {
    const rgb = hexToRgb(color.hex);
    if (!rgb) {
      continue;
    }

    const dr = rgb.r - target.r;
    const dg = rgb.g - target.g;
    const db = rgb.b - target.b;
    const dist = dr * dr + dg * dg + db * db;

    if (dist < bestDist) {
      bestDist = dist;
      bestId = color.id;
    }
  }

  return bestId;
}

export function findClosestColorIdFromCandidates(
  colors: Record<string, PaletteColor>,
  candidateIds: string[],
  targetColorId: string,
): string | null {
  const target = colors[targetColorId];
  const targetRgb = target ? hexToRgb(target.hex) : null;
  if (!targetRgb) {
    return null;
  }

  let bestId: string | null = null;
  let bestDist = Number.POSITIVE_INFINITY;

  for (const candidateId of candidateIds) {
    if (candidateId === targetColorId) {
      continue;
    }

    const candidate = colors[candidateId];
    const candidateRgb = candidate ? hexToRgb(candidate.hex) : null;
    if (!candidateRgb) {
      continue;
    }

    const dr = candidateRgb.r - targetRgb.r;
    const dg = candidateRgb.g - targetRgb.g;
    const db = candidateRgb.b - targetRgb.b;
    const dist = dr * dr + dg * dg + db * db;

    if (dist < bestDist) {
      bestDist = dist;
      bestId = candidateId;
    }
  }

  return bestId;
}
