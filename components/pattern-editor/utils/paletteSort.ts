"use client";

import type { Color } from "../../../lib/grid";

type Hsv = { h: number; s: number; v: number };
type Hsl = { h: number; s: number; l: number };

const NEUTRAL_SATURATION_THRESHOLD = 0.12;
const NEUTRAL_LIGHTNESS_MIN = 0.08;
const NEUTRAL_LIGHTNESS_MAX = 0.92;
const HUE_BUCKET_DEGREES = 24;
const HUE_BUCKET_COUNT = Math.round(360 / HUE_BUCKET_DEGREES);
const FAMILY_ORDER = ["red", "orange", "yellow", "green", "blue", "violet", "neutrals"] as const;

function normalizeFamily(family?: string | null) {
  if (!family) return null;
  const key = family.trim().toLowerCase();
  const map: Record<string, string> = {
    red: "red",
    pink: "red",
    orange: "orange",
    yellow: "yellow",
    green: "green",
    blue: "blue",
    purple: "violet",
    violet: "violet",
    gray: "neutrals",
    grey: "neutrals",
    white: "neutrals",
    black: "neutrals",
    beige: "neutrals",
    brown: "neutrals",
    neutral: "neutrals",
    neutrals: "neutrals",
    custom: "neutrals",
  };
  return map[key] ?? key;
}

function distributeRowLengths(itemCount: number, preferredColumns: number) {
  const rowCount = Math.max(1, Math.ceil(itemCount / preferredColumns));
  const baseLength = Math.floor(itemCount / rowCount);
  const extraItems = itemCount % rowCount;

  return Array.from({ length: rowCount }, (_, index) => baseLength + (index < extraItems ? 1 : 0)).filter(
    (length) => length > 0
  );
}

function hexToHsv(hex: string): Hsv {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return { h: 0, s: 0, v: 0 };
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : delta / max;
  const v = max;
  return { h, s, v };
}

function hexToHsl(hex: string): Hsl {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return { h: 0, s: 0, l: 0 };
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h, s, l };
}

export function sortPaletteByHsv(palette: Color[]) {
  return [...palette].sort((a, b) => {
    const ahsv = hexToHsv(a.hex);
    const bhsv = hexToHsv(b.hex);
    if (ahsv.h !== bhsv.h) return ahsv.h - bhsv.h;
    if (ahsv.s !== bhsv.s) return ahsv.s - bhsv.s;
    return ahsv.v - bhsv.v;
  });
}

export function organizePaletteByHueAndLightness(palette: Color[], columnCount = 10) {
  const safeColumnCount = Math.max(1, Math.floor(columnCount));
  const enriched = palette.map((color) => {
    const hsl = hexToHsl(color.hex);
    const isNeutral =
      hsl.s < NEUTRAL_SATURATION_THRESHOLD || hsl.l < NEUTRAL_LIGHTNESS_MIN || hsl.l > NEUTRAL_LIGHTNESS_MAX;
    const family = normalizeFamily(color.family) ?? (isNeutral ? "neutrals" : null);
    return {
      color,
      family,
      hue: hsl.h,
      saturation: hsl.s,
      lightness: hsl.l,
      isNeutral,
    };
  });

  const grouped = new Map<string, typeof enriched>();
  for (const entry of enriched) {
    const key = entry.family ?? `hue-${Math.round(entry.hue / HUE_BUCKET_DEGREES) % HUE_BUCKET_COUNT}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.push(entry);
      continue;
    }
    grouped.set(key, [entry]);
  }

  const rows: Color[][] = [];
  const groupKeys = [
    ...FAMILY_ORDER.filter((family) => grouped.has(family)),
    ...Array.from(grouped.keys())
      .filter((key) => !FAMILY_ORDER.includes(key as (typeof FAMILY_ORDER)[number]))
      .sort((a, b) => {
        const aHue = grouped.get(a)?.[0]?.hue ?? 0;
        const bHue = grouped.get(b)?.[0]?.hue ?? 0;
        return aHue - bHue;
      }),
  ];

  for (const key of groupKeys) {
    const entries = grouped
      .get(key)!
      .slice()
      .sort((a, b) => {
        if (a.isNeutral || b.isNeutral) {
          if (a.lightness !== b.lightness) return a.lightness - b.lightness;
          if (a.saturation !== b.saturation) return a.saturation - b.saturation;
          return a.hue - b.hue;
        }
        if (a.hue !== b.hue) return a.hue - b.hue;
        if (a.saturation !== b.saturation) return b.saturation - a.saturation;
        return a.lightness - b.lightness;
      });

    const rowLengths = distributeRowLengths(entries.length, safeColumnCount);
    let start = 0;
    for (const rowLength of rowLengths) {
      const row = entries
        .slice(start, start + rowLength)
        .sort((a, b) => {
          if (a.lightness !== b.lightness) return a.lightness - b.lightness;
          if (a.saturation !== b.saturation) return b.saturation - a.saturation;
          return a.hue - b.hue;
        })
        .map((entry) => entry.color);
      if (row.length > 0) {
        rows.push(row);
      }
      start += rowLength;
    }
  }

  return rows;
}
