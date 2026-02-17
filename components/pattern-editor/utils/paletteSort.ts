"use client";

import type { Color } from "../../../lib/grid";

type Hsv = { h: number; s: number; v: number };

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

export function sortPaletteByHsv(palette: Color[]) {
  return [...palette].sort((a, b) => {
    const ahsv = hexToHsv(a.hex);
    const bhsv = hexToHsv(b.hex);
    if (ahsv.h !== bhsv.h) return ahsv.h - bhsv.h;
    if (ahsv.s !== bhsv.s) return ahsv.s - bhsv.s;
    return ahsv.v - bhsv.v;
  });
}
