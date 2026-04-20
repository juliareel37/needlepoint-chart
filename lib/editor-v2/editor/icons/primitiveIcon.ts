import type { PaletteColor } from "../store/state";
import type { IconColorSlot } from "./iconColorSlots";

export type PrimitiveIconKind = "circle" | "rectangle" | "triangle" | "heart";

interface PrimitiveIconSvgOptions {
  kind: PrimitiveIconKind;
  width: number;
  height: number;
  strokeColor: string;
  strokeReferenceSize?: number | null;
  strokeWidthScale?: number;
}

const DEFAULT_STROKE_COLOR = "#121923";
const HEART_PARAMETRIC_SAMPLE_COUNT = 240;

export function getPrimitiveIconKind(relativePath: string): PrimitiveIconKind | null {
  switch (relativePath) {
    case "shapes/circle.svg":
      return "circle";
    case "shapes/heart.svg":
      return "heart";
    case "shapes/square.svg":
      return "rectangle";
    case "shapes/triangle.svg":
      return "triangle";
    default:
      return null;
  }
}

export function buildPrimitiveIconDataUrl({
  kind,
  width,
  height,
  strokeColor,
  strokeReferenceSize,
  strokeWidthScale = 1,
}: PrimitiveIconSvgOptions): string {
  const normalizedWidth = Math.max(1, width);
  const normalizedHeight = Math.max(1, height);
  const strokeWidth = getPrimitiveStrokeWidth(
    kind,
    normalizedWidth,
    normalizedHeight,
    strokeReferenceSize,
    strokeWidthScale,
  );
  const halfStroke = strokeWidth / 2;
  const svgWidth = normalizedWidth.toFixed(3);
  const svgHeight = normalizedHeight.toFixed(3);
  const escapedStroke = escapeXmlAttribute(strokeColor || DEFAULT_STROKE_COLOR);

  let shapeMarkup = "";
  switch (kind) {
    case "circle": {
      const radius = Math.max(0, Math.min(normalizedWidth, normalizedHeight) / 2 - halfStroke);
      shapeMarkup = `<ellipse cx="${(normalizedWidth / 2).toFixed(3)}" cy="${(
        normalizedHeight / 2
      ).toFixed(3)}" rx="${radius.toFixed(3)}" ry="${radius.toFixed(
        3,
      )}" fill="none" stroke="${escapedStroke}" stroke-width="${strokeWidth.toFixed(
        3,
      )}" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>`;
      break;
    }
    case "rectangle": {
      shapeMarkup = `<rect x="${halfStroke.toFixed(3)}" y="${halfStroke.toFixed(
        3,
      )}" width="${Math.max(0, normalizedWidth - strokeWidth).toFixed(3)}" height="${Math.max(
        0,
        normalizedHeight - strokeWidth,
      ).toFixed(3)}" fill="none" stroke="${escapedStroke}" stroke-width="${strokeWidth.toFixed(
        3,
      )}" vector-effect="non-scaling-stroke"/>`;
      break;
    }
    case "triangle": {
      const points = [
        `${(normalizedWidth / 2).toFixed(3)},${halfStroke.toFixed(3)}`,
        `${(normalizedWidth - halfStroke).toFixed(3)},${(normalizedHeight - halfStroke).toFixed(
          3,
        )}`,
        `${halfStroke.toFixed(3)},${(normalizedHeight - halfStroke).toFixed(3)}`,
      ].join(" ");
      shapeMarkup = `<polygon points="${points}" fill="none" stroke="${escapedStroke}" stroke-width="${strokeWidth.toFixed(
        3,
      )}" vector-effect="non-scaling-stroke"/>`;
      break;
    }
    case "heart": {
      const pathData = buildHeartParametricPathData(
        normalizedWidth,
        normalizedHeight,
        halfStroke,
      );

      shapeMarkup = `<path d="${pathData}" fill="none" stroke="${escapedStroke}" stroke-width="${strokeWidth.toFixed(
        3,
      )}" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>`;
      break;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" fill="none">${shapeMarkup}</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function resolveIconPreviewStrokeColor(
  slots: IconColorSlot[],
  paletteById: Record<string, PaletteColor>,
  fallbackColor: string | null,
): string {
  for (const slot of slots) {
    if (!slot.paletteColorId) {
      continue;
    }

    const paletteColor = paletteById[slot.paletteColorId];
    if (paletteColor?.hex) {
      return paletteColor.hex;
    }
  }

  return fallbackColor ?? slots[0]?.sourceHex ?? DEFAULT_STROKE_COLOR;
}

function getPrimitiveStrokeWidth(
  kind: PrimitiveIconKind,
  width: number,
  height: number,
  strokeReferenceSize: number | null | undefined,
  strokeWidthScale: number,
): number {
  const baseStrokeRatio = kind === "circle" ? 2 / 24 : kind === "heart" ? 20.525 / 297 : 1.2 / 25;
  const referenceSize =
    typeof strokeReferenceSize === "number" && Number.isFinite(strokeReferenceSize)
      ? Math.max(strokeReferenceSize, 1)
      : Math.min(width, height);
  const baseStrokeWidth = Math.max(Math.min(width, height), referenceSize) * baseStrokeRatio;
  const normalizedScale =
    Number.isFinite(strokeWidthScale) && strokeWidthScale > 0 ? strokeWidthScale : 1;
  return Math.max(1, baseStrokeWidth * normalizedScale);
}

function buildHeartParametricPathData(
  width: number,
  height: number,
  inset: number,
): string {
  const innerWidth = Math.max(1, width - inset * 2);
  const innerHeight = Math.max(1, height - inset * 2);
  const sampledPoints = Array.from(
    { length: HEART_PARAMETRIC_SAMPLE_COUNT + 1 },
    (_, index) => {
      const t = (index / HEART_PARAMETRIC_SAMPLE_COUNT) * Math.PI * 2;
      return {
        x: 16 * Math.sin(t) ** 3,
        y:
          -(
            13 * Math.cos(t) -
            5 * Math.cos(2 * t) -
            2 * Math.cos(3 * t) -
            Math.cos(4 * t)
          ),
      };
    },
  );

  const bounds = sampledPoints.reduce(
    (accumulator, point) => ({
      minX: Math.min(accumulator.minX, point.x),
      maxX: Math.max(accumulator.maxX, point.x),
      minY: Math.min(accumulator.minY, point.y),
      maxY: Math.max(accumulator.maxY, point.y),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  );

  const rangeX = Math.max(bounds.maxX - bounds.minX, 0.0001);
  const rangeY = Math.max(bounds.maxY - bounds.minY, 0.0001);
  const mapPoint = (point: { x: number; y: number }) =>
    `${(inset + ((point.x - bounds.minX) / rangeX) * innerWidth).toFixed(3)} ${(
      inset + ((point.y - bounds.minY) / rangeY) * innerHeight
    ).toFixed(3)}`;

  return sampledPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${mapPoint(point)}`)
    .join(" ");
}

function escapeXmlAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
