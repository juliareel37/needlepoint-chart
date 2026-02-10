"use client";

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
}

function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h /= 6;
    if (h < 0) h += 1;
  }
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number) {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hueToRgb = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const r = Math.round(hueToRgb(h + 1 / 3) * 255);
  const g = Math.round(hueToRgb(h) * 255);
  const b = Math.round(hueToRgb(h - 1 / 3) * 255);
  return { r, g, b };
}

function adjustLightness(hex: string, amount: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return { r: 0, g: 0, b: 0 };
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const nextL = Math.min(1, Math.max(0, hsl.l + amount));
  return hslToRgb(hsl.h, hsl.s, nextL);
}

function hashString(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function getThreadRadii(size: number) {
  const s = Math.max(1, Math.round(size));
  const padding = -0.2;
  const half = Math.max(1, s / 2 - padding);
  const ratio = 1.28;
  const b = (Math.SQRT2 * half) / Math.sqrt(ratio * ratio + 1);
  const a = b * ratio;
  return { radiusX: Math.max(1, a), radiusY: Math.max(1, b) };
}

export function getThreadStitchCanvas(
  hex: string,
  size: number,
  cache: Map<string, HTMLCanvasElement>,
  styleVersion: number
) {
  const rounded = Math.max(1, Math.round(size));
  const key = `${styleVersion}|${hex}|${rounded}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = rounded;
  canvas.height = rounded;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.clearRect(0, 0, rounded, rounded);

  const center = rounded / 2;
  const { radiusX, radiusY } = getThreadRadii(rounded);

  const light = adjustLightness(hex, 0.18);
  const dark = adjustLightness(hex, -0.18);
  const highlightColor = `rgba(${light.r}, ${light.g}, ${light.b}, 0.3)`;
  const shadowColor = `rgba(${dark.r}, ${dark.g}, ${dark.b}, 0.25)`;
  const ridgeColor = `rgba(${light.r}, ${light.g}, ${light.b}, 0.12)`;
  const glintColor = `rgba(${light.r}, ${light.g}, ${light.b}, 0.12)`;

  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(-Math.PI / 4);

  ctx.fillStyle = hex;
  ctx.beginPath();
  ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();

  const highlight = ctx.createLinearGradient(-radiusX, 0, radiusX, 0);
  highlight.addColorStop(0, highlightColor);
  highlight.addColorStop(0.45, "rgba(0,0,0,0)");
  highlight.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = highlight;
  ctx.beginPath();
  ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();

  const shadow = ctx.createLinearGradient(-radiusX, 0, radiusX, 0);
  shadow.addColorStop(0, "rgba(0,0,0,0)");
  shadow.addColorStop(0.55, "rgba(0,0,0,0)");
  shadow.addColorStop(1, shadowColor);
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = ridgeColor;
  ctx.lineWidth = Math.max(0.6, rounded * 0.04);
  const ridgeCount = rounded >= 18 ? 4 : 3;
  const offsets =
    ridgeCount === 4
      ? [-0.35, -0.12, 0.12, 0.35]
      : [-0.25, 0, 0.25];
  offsets.forEach((t) => {
    const y = t * radiusY;
    ctx.beginPath();
    ctx.moveTo(-radiusX * 0.85, y);
    ctx.lineTo(radiusX * 0.85, y);
    ctx.stroke();
  });

  ctx.strokeStyle = glintColor;
  ctx.lineWidth = Math.max(0.5, rounded * 0.03);
  ctx.beginPath();
  ctx.moveTo(-radiusX * 0.2, -radiusY * 0.05);
  ctx.lineTo(radiusX * 0.2, -radiusY * 0.05);
  ctx.stroke();

  const rand = mulberry32(hashString(key));
  ctx.strokeStyle = `rgba(${light.r}, ${light.g}, ${light.b}, 0.1)`;
  ctx.lineWidth = Math.max(0.4, rounded * 0.02);
  const fuzzLines = rounded >= 18 ? 10 : 8;
  for (let i = 0; i < fuzzLines; i++) {
    const y = (rand() * 2 - 1) * radiusY * 0.65;
    const x0 = -radiusX * 0.75 + rand() * radiusX * 1.5;
    const len = radiusX * (0.08 + rand() * 0.22);
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x0 + len, y);
    ctx.stroke();
  }

  ctx.restore();
  cache.set(key, canvas);
  return canvas;
}
