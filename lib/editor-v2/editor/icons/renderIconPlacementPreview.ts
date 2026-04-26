import { hexToRgb } from "../color-utils";
import type { PaletteColor } from "../store/state";
import type { IconColorSlot } from "./iconColorSlots";
import { findNearestIconColorSlot } from "./iconColorSlots";

export async function renderIconPlacementPreview(
  src: string,
  width: number,
  height: number,
  slots: IconColorSlot[],
  paletteById: Record<string, PaletteColor>,
  options?: {
    strokeWidthScale?: number;
    supportsStrokeWidth?: boolean;
  },
): Promise<string> {
  const recoloredSvgSrc = renderRecoloredSvgPreview(
    src,
    slots,
    paletteById,
    options?.strokeWidthScale ?? 1,
    options?.supportsStrokeWidth ?? false,
  );
  if (recoloredSvgSrc) {
    return recoloredSvgSrc;
  }

  if (slots.length === 0) {
    return src;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return src;
  }

  const image = await loadImage(src);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] ?? 0;
    if (alpha <= 1) {
      continue;
    }

    const slot = findNearestIconColorSlot(slots, {
      r: data[index] ?? 0,
      g: data[index + 1] ?? 0,
      b: data[index + 2] ?? 0,
    });
    if (!slot?.paletteColorId) {
      continue;
    }

    const paletteColor = paletteById[slot.paletteColorId];
    const rgb = paletteColor ? hexToRgb(paletteColor.hex) : null;
    if (!rgb) {
      continue;
    }

    data[index] = rgb.r;
    data[index + 1] = rgb.g;
    data[index + 2] = rgb.b;
  }

  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

export async function renderFlatColorIconPreview(
  src: string,
  width: number,
  height: number,
  color: string,
): Promise<string> {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return src;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return src;
  }

  const image = await loadImage(src);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] ?? 0;
    if (alpha <= 1) {
      continue;
    }

    data[index] = rgb.r;
    data[index + 1] = rgb.g;
    data[index + 2] = rgb.b;
  }

  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

function renderRecoloredSvgPreview(
  src: string,
  slots: IconColorSlot[],
  paletteById: Record<string, PaletteColor>,
  strokeWidthScale: number,
  supportsStrokeWidth: boolean,
): string | null {
  const svg = decodeSvgDataUrl(src);
  if (!svg) {
    return null;
  }

  const replacements = new Map<string, string>();
  for (const slot of slots) {
    if (!slot.paletteColorId) {
      continue;
    }

    const paletteColor = paletteById[slot.paletteColorId];
    if (!paletteColor) {
      continue;
    }

    replacements.set(slot.sourceHex.toLowerCase(), paletteColor.hex.toLowerCase());
  }

  if (replacements.size === 0 && (!supportsStrokeWidth || Math.abs(strokeWidthScale - 1) < 0.001)) {
    return src;
  }

  let nextSvg = replacements.size > 0 ? recolorSvgPaints(svg, replacements) : svg;
  if (supportsStrokeWidth) {
    nextSvg = scaleSvgStrokeWidths(nextSvg, strokeWidthScale);
  }

  return buildSvgDataUrl(nextSvg);
}

function recolorSvgPaints(svg: string, replacements: Map<string, string>): string {
  let nextSvg = svg.replace(
    /\b(fill|stroke)=["']([^"']+)["']/gi,
    (fullMatch, attributeName: string, value: string) => {
      const nextValue = replacePaintValue(value, replacements);
      return `${attributeName}="${nextValue}"`;
    },
  );

  nextSvg = nextSvg.replace(/\bstyle=["']([^"']*)["']/gi, (fullMatch, styleValue: string) => {
    const nextStyle = styleValue.replace(
      /\b(fill|stroke)\s*:\s*([^;"]+)/gi,
      (styleMatch, propertyName: string, value: string) => {
        const nextValue = replacePaintValue(value, replacements);
        return `${propertyName}: ${nextValue}`;
      },
    );

    return `style="${nextStyle}"`;
  });

  return nextSvg;
}

function replacePaintValue(value: string, replacements: Map<string, string>): string {
  const normalized = normalizeSvgPaintValue(value);
  if (!normalized) {
    return value;
  }

  const replacement = replacements.get(normalized.colorHex);
  if (!replacement) {
    return value;
  }

  if (normalized.format === "rgba" && normalized.alpha !== null) {
    const rgb = hexToRgb(replacement);
    if (!rgb) {
      return value;
    }

    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${normalized.alpha})`;
  }

  if (normalized.format === "rgb") {
    const rgb = hexToRgb(replacement);
    if (!rgb) {
      return value;
    }

    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }

  return replacement;
}

function scaleSvgStrokeWidths(svg: string, strokeWidthScale: number): string {
  if (!Number.isFinite(strokeWidthScale) || strokeWidthScale <= 0) {
    return svg;
  }

  let nextSvg = svg.replace(
    /\bstroke-width=["']([^"']+)["']/gi,
    (fullMatch, value: string) => {
      const scaled = scaleStrokeWidthValue(value, strokeWidthScale);
      return scaled ? `stroke-width="${scaled}"` : fullMatch;
    },
  );

  nextSvg = nextSvg.replace(/\bstyle=["']([^"']*)["']/gi, (fullMatch, styleValue: string) => {
    const nextStyle = styleValue.replace(
      /\bstroke-width\s*:\s*([^;"']+)/gi,
      (styleMatch, value: string) => {
        const scaled = scaleStrokeWidthValue(value, strokeWidthScale);
        return scaled ? `stroke-width: ${scaled}` : styleMatch;
      },
    );

    return `style="${nextStyle}"`;
  });

  return nextSvg;
}

function scaleStrokeWidthValue(value: string, strokeWidthScale: number): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^(-?\d*\.?\d+)([a-z%]*)$/i);
  if (!match) {
    return null;
  }

  const numericValue = Number.parseFloat(match[1] ?? "");
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return `${Number.parseFloat((numericValue * strokeWidthScale).toFixed(3)).toString()}${match[2] ?? ""}`;
}

function normalizeSvgPaintValue(
  value: string,
): { colorHex: string; format: "hex" | "rgb" | "rgba"; alpha: string | null } | null {
  const trimmed = value.trim().toLowerCase();
  if (
    trimmed.length === 0 ||
    trimmed === "none" ||
    trimmed === "transparent" ||
    trimmed === "currentcolor" ||
    trimmed.startsWith("url(") ||
    trimmed.startsWith("var(")
  ) {
    return null;
  }

  if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
    return { colorHex: trimmed, format: "hex", alpha: null };
  }

  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    return {
      colorHex: `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`,
      format: "hex",
      alpha: null,
    };
  }

  const rgbaMatch = trimmed.match(
    /^rgba?\(\s*(\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})(?:\s*[,/]\s*([\d.]+))?\s*\)$/i,
  );
  if (!rgbaMatch) {
    return null;
  }

  const r = clampChannel(rgbaMatch[1]);
  const g = clampChannel(rgbaMatch[2]);
  const b = clampChannel(rgbaMatch[3]);
  return {
    colorHex: rgbToHex(r, g, b),
    format: rgbaMatch[4] ? "rgba" : "rgb",
    alpha: rgbaMatch[4] ?? null,
  };
}

function decodeSvgDataUrl(src: string): string | null {
  if (!src.startsWith("data:image/svg+xml")) {
    return null;
  }

  const commaIndex = src.indexOf(",");
  if (commaIndex === -1) {
    return null;
  }

  const metadata = src.slice(0, commaIndex).toLowerCase();
  const payload = src.slice(commaIndex + 1);

  try {
    if (metadata.includes(";base64")) {
      return atob(payload);
    }

    return decodeURIComponent(payload);
  } catch {
    return null;
  }
}

function buildSvgDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function clampChannel(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(Math.max(parsed, 0), 255);
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load icon asset: ${src}`));
    image.src = src;
  });
}
