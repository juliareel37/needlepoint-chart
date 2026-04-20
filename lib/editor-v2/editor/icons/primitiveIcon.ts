import type { PaletteColor } from "../store/state";
import type { IconColorSlot } from "./iconColorSlots";

export type PrimitiveIconKind =
  | "circle"
  | "rectangle"
  | "triangle"
  | "heart"
  | "star"
  | "greek-key-frame"
  | "greek-key-frame-shadow";

interface PrimitiveIconSvgOptions {
  kind: PrimitiveIconKind;
  width: number;
  height: number;
  strokeColor: string;
  secondaryStrokeColor?: string | null;
  strokeReferenceSize?: number | null;
  strokeWidthScale?: number;
}

const DEFAULT_STROKE_COLOR = "#121923";
const HEART_PARAMETRIC_SAMPLE_COUNT = 240;
const DEFAULT_PRIMITIVE_STROKE_RATIO = 2 / 24;
const FRAME_PRIMITIVE_STROKE_RATIO = 1.2 / 24;

export function getPrimitiveIconKind(relativePath: string): PrimitiveIconKind | null {
  switch (relativePath) {
    case "shapes/circle.svg":
      return "circle";
    case "shapes/heart.svg":
      return "heart";
    case "frames/greek-key-frame.svg":
      return "greek-key-frame";
    case "frames/greek-key-frame-shadow.svg":
      return "greek-key-frame-shadow";
    case "shapes/star.svg":
      return "star";
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
  secondaryStrokeColor,
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
    case "star": {
      const centerX = normalizedWidth / 2;
      const centerY = normalizedHeight / 2;
      const outerRadius = Math.max(0, Math.min(normalizedWidth, normalizedHeight) / 2 - halfStroke);
      const innerRadius = outerRadius * 0.45;
      const starPoints = Array.from({ length: 10 }, (_, index) => {
        const angle = -Math.PI / 2 + (index * Math.PI) / 5;
        const radius = index % 2 === 0 ? outerRadius : innerRadius;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        return `${x.toFixed(3)},${y.toFixed(3)}`;
      }).join(" ");
      shapeMarkup = `<polygon points="${starPoints}" fill="none" stroke="${escapedStroke}" stroke-width="${strokeWidth.toFixed(
        3,
      )}" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>`;
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
    case "greek-key-frame": {
      const pathData = buildGreekKeyFramePathData(
        normalizedWidth,
        normalizedHeight,
        halfStroke,
      );
      shapeMarkup = `<path d="${pathData}" fill="none" stroke="${escapedStroke}" stroke-width="${strokeWidth.toFixed(
        3,
      )}" vector-effect="non-scaling-stroke" stroke-linecap="square" stroke-linejoin="miter"/>`;
      break;
    }
    case "greek-key-frame-shadow": {
      const shadowStrokeWidth = Math.max(1, strokeWidth * 0.5);
      const shadowHalfStroke = shadowStrokeWidth / 2;
      // Place the lighter stroke directly against the inside edge of the main border.
      const shadowInset = strokeWidth + shadowHalfStroke;
      const basePathData = buildGreekKeyFramePathData(
        normalizedWidth,
        normalizedHeight,
        halfStroke,
      );
      const shadowPathData = buildGreekKeyFramePathData(
        normalizedWidth,
        normalizedHeight,
        shadowInset,
      );
      const shadowStroke = escapeXmlAttribute(
        secondaryStrokeColor || mixHexWithWhite(strokeColor, 0.45),
      );

      shapeMarkup = [
        `<path d="${shadowPathData}" fill="none" stroke="${shadowStroke}" stroke-width="${shadowStrokeWidth.toFixed(
          3,
        )}" vector-effect="non-scaling-stroke" stroke-linecap="square" stroke-linejoin="miter"/>`,
        `<path d="${basePathData}" fill="none" stroke="${escapedStroke}" stroke-width="${strokeWidth.toFixed(
          3,
        )}" vector-effect="non-scaling-stroke" stroke-linecap="square" stroke-linejoin="miter"/>`,
      ].join("");
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
  return resolvePrimitiveColorSlots(slots, paletteById, fallbackColor).primary;
}

export function resolvePrimitiveColorSlots(
  slots: IconColorSlot[],
  paletteById: Record<string, PaletteColor>,
  fallbackColor: string | null,
): { primary: string; secondary: string | null } {
  const resolvedColors = slots.map((slot) => {
    if (!slot.paletteColorId) {
      return slot.sourceHex;
    }

    return paletteById[slot.paletteColorId]?.hex ?? slot.sourceHex;
  });

  const primary = resolvedColors[0] ?? fallbackColor ?? DEFAULT_STROKE_COLOR;
  const secondary = resolvedColors[1] ?? null;

  return {
    primary,
    secondary,
  };
}

export function getPrimitiveDefaultColorSlots(kind: PrimitiveIconKind): IconColorSlot[] {
  if (kind === "greek-key-frame-shadow") {
    return [
      {
        id: "slot-1",
        sourceHex: "#121923",
        paletteColorId: null,
      },
      {
        id: "slot-2",
        sourceHex: "#8e99ab",
        paletteColorId: null,
      },
    ];
  }

  return [];
}

function getPrimitiveStrokeWidth(
  kind: PrimitiveIconKind,
  width: number,
  height: number,
  strokeReferenceSize: number | null | undefined,
  strokeWidthScale: number,
): number {
  const baseStrokeRatio =
    kind === "greek-key-frame" || kind === "greek-key-frame-shadow"
      ? FRAME_PRIMITIVE_STROKE_RATIO
      : DEFAULT_PRIMITIVE_STROKE_RATIO;
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

function buildGreekKeyFramePathData(
  width: number,
  height: number,
  inset: number,
): string {
  const left = inset;
  const top = inset;
  const right = Math.max(left, width - inset);
  const bottom = Math.max(top, height - inset);
  const cornerUnit = Math.max(1, Math.min(right - left, bottom - top) * 0.1);
  const shortStep = cornerUnit;
  const longStep = shortStep * 2;

  const topLeftExitX = left + longStep;
  const topRightEntryX = right - longStep;
  const topRightInsetX = right - shortStep;
  const bottomRightEntryY = bottom - longStep;
  const bottomRightInsetY = bottom - shortStep;
  const bottomLeftExitX = left + longStep;
  const bottomLeftInsetX = left + shortStep;
  const topLeftEntryY = top + longStep;
  const topLeftInsetY = top + shortStep;

  return [
    `M ${topLeftExitX.toFixed(3)} ${top.toFixed(3)}`,
    `L ${topRightEntryX.toFixed(3)} ${top.toFixed(3)}`,
    `L ${topRightEntryX.toFixed(3)} ${(top + shortStep).toFixed(3)}`,
    `L ${right.toFixed(3)} ${(top + shortStep).toFixed(3)}`,
    `L ${right.toFixed(3)} ${top.toFixed(3)}`,
    `L ${topRightInsetX.toFixed(3)} ${top.toFixed(3)}`,
    `L ${topRightInsetX.toFixed(3)} ${(top + longStep).toFixed(3)}`,
    `L ${right.toFixed(3)} ${(top + longStep).toFixed(3)}`,
    `L ${right.toFixed(3)} ${bottomRightEntryY.toFixed(3)}`,
    `L ${topRightInsetX.toFixed(3)} ${bottomRightEntryY.toFixed(3)}`,
    `L ${topRightInsetX.toFixed(3)} ${bottom.toFixed(3)}`,
    `L ${right.toFixed(3)} ${bottom.toFixed(3)}`,
    `L ${right.toFixed(3)} ${bottomRightInsetY.toFixed(3)}`,
    `L ${topRightEntryX.toFixed(3)} ${bottomRightInsetY.toFixed(3)}`,
    `L ${topRightEntryX.toFixed(3)} ${bottom.toFixed(3)}`,
    `L ${bottomLeftExitX.toFixed(3)} ${bottom.toFixed(3)}`,
    `L ${bottomLeftExitX.toFixed(3)} ${bottomRightInsetY.toFixed(3)}`,
    `L ${left.toFixed(3)} ${bottomRightInsetY.toFixed(3)}`,
    `L ${left.toFixed(3)} ${bottom.toFixed(3)}`,
    `L ${bottomLeftInsetX.toFixed(3)} ${bottom.toFixed(3)}`,
    `L ${bottomLeftInsetX.toFixed(3)} ${bottomRightEntryY.toFixed(3)}`,
    `L ${left.toFixed(3)} ${bottomRightEntryY.toFixed(3)}`,
    `L ${left.toFixed(3)} ${topLeftEntryY.toFixed(3)}`,
    `L ${bottomLeftInsetX.toFixed(3)} ${topLeftEntryY.toFixed(3)}`,
    `L ${bottomLeftInsetX.toFixed(3)} ${top.toFixed(3)}`,
    `L ${left.toFixed(3)} ${top.toFixed(3)}`,
    `L ${left.toFixed(3)} ${topLeftInsetY.toFixed(3)}`,
    `L ${topLeftExitX.toFixed(3)} ${topLeftInsetY.toFixed(3)}`,
    `L ${topLeftExitX.toFixed(3)} ${top.toFixed(3)}`,
  ].join(" ");
}

function mixHexWithWhite(hex: string, whiteMix: number): string {
  const normalizedHex = normalizeHexColor(hex);
  if (!normalizedHex) {
    return DEFAULT_STROKE_COLOR;
  }

  const mix = Math.max(0, Math.min(1, whiteMix));
  const r = Number.parseInt(normalizedHex.slice(1, 3), 16);
  const g = Number.parseInt(normalizedHex.slice(3, 5), 16);
  const b = Number.parseInt(normalizedHex.slice(5, 7), 16);
  const blend = (channel: number) =>
    Math.round(channel + (255 - channel) * mix)
      .toString(16)
      .padStart(2, "0");

  return `#${blend(r)}${blend(g)}${blend(b)}`;
}

function normalizeHexColor(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/i.test(normalized)) {
    return normalized;
  }

  if (/^#[0-9a-f]{3}$/i.test(normalized)) {
    return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`;
  }

  return null;
}

function escapeXmlAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
