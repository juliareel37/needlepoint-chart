import { DMC_COLOR_LIBRARY_BY_ID } from "../color-library";
import { findClosestPaletteColorId, hexToRgb, type Rgb } from "../color-utils";
import type { PaletteColor } from "../store/state";
import type { IconColorSlot } from "./iconColorSlots";

export type PrimitiveIconKind =
  | "circle"
  | "rectangle"
  | "triangle"
  | "heart"
  | "star"
  | "double-rectangle-frame"
  | "triple-rectangle-frame"
  | "striped-rectangle-frame"
  | "linked-circle-frame"
  | "scalloped-frame"
  | "double-scalloped-frame"
  | "greek-key-frame"
  | "greek-key-frame-shadow"
  | "vintage-label-frame";

interface PrimitiveIconSvgOptions {
  kind: PrimitiveIconKind;
  width: number;
  height: number;
  strokeColor: string;
  secondaryStrokeColor?: string | null;
  strokeColorsBySlotId?: Partial<Record<string, string | null>>;
  fillColor?: string | null;
  strokeReferenceSize?: number | null;
  strokeWidthScale?: number;
  patternScale?: number;
  spacingScale?: number;
}

const DEFAULT_STROKE_COLOR = "#121923";
const HEART_PARAMETRIC_SAMPLE_COUNT = 240;
const DEFAULT_PRIMITIVE_STROKE_RATIO = 2 / 24;
const FRAME_PRIMITIVE_STROKE_RATIO = 1.2 / 24;
const FRAME_PRIMITIVE_MIN_STROKE_WIDTH = 0.45;
const FRAME_PRIMITIVE_SECONDARY_MIN_STROKE_WIDTH = 0.3;
const DEFAULT_SHAPE_STROKE_WIDTH_SCALE = 0.45;
const DEFAULT_FRAME_STROKE_WIDTH_SCALE = 0.7;
const DOUBLE_RECTANGLE_FRAME_DEFAULT_SPACING_SCALE = 0.75;
const TRIPLE_RECTANGLE_FRAME_DEFAULT_SPACING_SCALE = 0.75;
const DOUBLE_SCALLOPED_FRAME_DEFAULT_SPACING_SCALE = 2.25;
const DOUBLE_SCALLOPED_INNER_CORNER_CRAMP = 0.18;
const DOUBLE_SCALLOPED_INNER_EDGE_WAVE_ELONGATION = 0.05;
const SCALLOP_JOIN_INSET_RATIO = 0.32;
const SCALLOP_CORNER_WIDENING_STRENGTH = 0.8;
const SCALLOP_CORNER_MIN_RADIUS_RATIO = 0.58;
const RESPONSIVE_STROKE_REFERENCE_MIN = 96;
const RESPONSIVE_STROKE_REFERENCE_MAX = 180;
const RESPONSIVE_STROKE_SCALE_MULTIPLIER_MIN = 0.7;

export function isPrimitiveFrameKind(kind: PrimitiveIconKind | null | undefined): boolean {
  return (
    kind === "double-rectangle-frame" ||
    kind === "triple-rectangle-frame" ||
    kind === "striped-rectangle-frame" ||
    kind === "linked-circle-frame" ||
    kind === "scalloped-frame" ||
    kind === "double-scalloped-frame" ||
    kind === "greek-key-frame" ||
    kind === "greek-key-frame-shadow" ||
    kind === "vintage-label-frame"
  );
}

export function getPrimitiveDefaultStrokeWidthScale(
  kind: PrimitiveIconKind | null | undefined,
  strokeReferenceSize?: number | null,
): number {
  const baseDefaultScale = isPrimitiveFrameKind(kind)
    ? DEFAULT_FRAME_STROKE_WIDTH_SCALE
    : DEFAULT_SHAPE_STROKE_WIDTH_SCALE;
  return clampPrimitiveStrokeWidthScale(
    applyResponsiveStrokeScale(baseDefaultScale, strokeReferenceSize),
    kind,
    strokeReferenceSize,
  );
}

export function getPrimitiveStrokeWidthScaleRange(
  kind: PrimitiveIconKind | null | undefined,
  strokeReferenceSize?: number | null,
): { min: number; max: number } {
  const responsiveMultiplier = getResponsiveStrokeScaleMultiplier(strokeReferenceSize);

  if (!isPrimitiveFrameKind(kind)) {
    return {
      min: roundStrokeScale(Math.max(0.15, 0.2 * responsiveMultiplier)),
      max: roundStrokeScale(Math.max(1.1, 1.8 * responsiveMultiplier)),
    };
  }

  return {
      min: roundStrokeScale(Math.max(0.25, 0.3 * responsiveMultiplier)),
      max: roundStrokeScale(
      Math.max(
        0.9,
        (kind === "double-rectangle-frame" || kind === "triple-rectangle-frame" ? 1.4 : 2.2) *
          responsiveMultiplier,
      ),
    ),
  };
}

export function getPrimitiveDefaultSpacingScale(
  kind: PrimitiveIconKind | null | undefined,
): number {
  if (kind === "double-rectangle-frame") {
    return DOUBLE_RECTANGLE_FRAME_DEFAULT_SPACING_SCALE;
  }

  if (kind === "triple-rectangle-frame") {
    return TRIPLE_RECTANGLE_FRAME_DEFAULT_SPACING_SCALE;
  }

  if (kind === "linked-circle-frame") {
    return 1;
  }

  if (kind === "double-scalloped-frame") {
    return DOUBLE_SCALLOPED_FRAME_DEFAULT_SPACING_SCALE;
  }

  return 1;
}

export function getPrimitiveSpacingScaleRange(
  kind: PrimitiveIconKind | null | undefined,
): { min: number; max: number } {
  if (kind === "double-rectangle-frame" || kind === "triple-rectangle-frame") {
    return { min: 0, max: 2 };
  }

  if (kind === "double-scalloped-frame") {
    return { min: 0.8, max: 3 };
  }

  if (kind === "linked-circle-frame") {
    return { min: 0.6, max: 2.4 };
  }

  return { min: 0.5, max: 2 };
}

export function getPrimitiveIconKind(relativePath: string): PrimitiveIconKind | null {
  switch (relativePath) {
    case "shapes/circle.svg":
      return "circle";
    case "shapes/heart.svg":
      return "heart";
    case "frames/double-rectangle-frame.svg":
      return "double-rectangle-frame";
    case "frames/triple-rectangle-frame.svg":
      return "triple-rectangle-frame";
    case "frames/striped-rectangle-frame.svg":
      return "striped-rectangle-frame";
    case "frames/linked-circle-frame.svg":
      return "linked-circle-frame";
    case "frames/scalloped-frame.svg":
      return "scalloped-frame";
    case "frames/double-scalloped-frame.svg":
      return "double-scalloped-frame";
    case "frames/greek-key-frame.svg":
      return "greek-key-frame";
    case "frames/greek-key-frame-shadow.svg":
      return "greek-key-frame-shadow";
    case "frames/vintage-label-frame.svg":
      return "vintage-label-frame";
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
  strokeColorsBySlotId,
  fillColor,
  strokeReferenceSize,
  strokeWidthScale = 1,
  patternScale = 1,
  spacingScale = 1,
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
  const resolveStrokeSlotColor = (slotId: string, fallback: string) =>
    escapeXmlAttribute(strokeColorsBySlotId?.[slotId] || fallback);
  const escapedFill = normalizePrimitiveFillPaint(fillColor);

  let shapeMarkup = "";
  switch (kind) {
    case "circle": {
      const radiusX = Math.max(0, normalizedWidth / 2 - halfStroke);
      const radiusY = Math.max(0, normalizedHeight / 2 - halfStroke);
      shapeMarkup = `<ellipse cx="${(normalizedWidth / 2).toFixed(3)}" cy="${(
        normalizedHeight / 2
      ).toFixed(3)}" rx="${radiusX.toFixed(3)}" ry="${radiusY.toFixed(
        3,
      )}" fill="${escapedFill}" stroke="${escapedStroke}" stroke-width="${strokeWidth.toFixed(
        3,
      )}" stroke-linecap="round" stroke-linejoin="round"/>`;
      break;
    }
    case "rectangle": {
      shapeMarkup = `<rect x="${halfStroke.toFixed(3)}" y="${halfStroke.toFixed(
        3,
      )}" width="${Math.max(0, normalizedWidth - strokeWidth).toFixed(3)}" height="${Math.max(
        0,
        normalizedHeight - strokeWidth,
      ).toFixed(3)}" fill="${escapedFill}" stroke="${escapedStroke}" stroke-width="${strokeWidth.toFixed(
        3,
      )}"/>`;
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
      shapeMarkup = `<polygon points="${points}" fill="${escapedFill}" stroke="${escapedStroke}" stroke-width="${strokeWidth.toFixed(
        3,
      )}"/>`;
      break;
    }
    case "star": {
      const starPoints = buildNormalizedStarPoints(
        normalizedWidth,
        normalizedHeight,
        halfStroke,
      );
      shapeMarkup = `<polygon points="${starPoints}" fill="${escapedFill}" stroke="${escapedStroke}" stroke-width="${strokeWidth.toFixed(
        3,
      )}" stroke-linecap="round" stroke-linejoin="round"/>`;
      break;
    }
    case "heart": {
      const pathData = buildHeartParametricPathData(
        normalizedWidth,
        normalizedHeight,
        halfStroke,
      );

      shapeMarkup = `<path d="${pathData}" fill="${escapedFill}" stroke="${escapedStroke}" stroke-width="${strokeWidth.toFixed(
        3,
      )}" stroke-linecap="round" stroke-linejoin="round"/>`;
      break;
    }
    case "double-rectangle-frame": {
      const referenceSize =
        typeof strokeReferenceSize === "number" && Number.isFinite(strokeReferenceSize)
          ? Math.max(strokeReferenceSize, 1)
          : Math.min(normalizedWidth, normalizedHeight);
      const normalizedSpacingScale =
        Number.isFinite(spacingScale) && spacingScale >= 0 ? spacingScale : 1;
      const innerStrokeWidth = strokeWidth;
      const innerGap = referenceSize * 0.055 * normalizedSpacingScale;
      const innerHalfStroke = innerStrokeWidth / 2;
      const innerOffset = strokeWidth + innerGap + innerHalfStroke;
      const outerStrokeColor = resolveStrokeSlotColor("stroke-outer", escapedStroke);
      const innerStrokeColor = resolveStrokeSlotColor("stroke-inner", escapedStroke);

      shapeMarkup = [
        `<rect x="${halfStroke.toFixed(3)}" y="${halfStroke.toFixed(3)}" width="${Math.max(
          0,
          normalizedWidth - strokeWidth,
        ).toFixed(3)}" height="${Math.max(0, normalizedHeight - strokeWidth).toFixed(
          3,
        )}" fill="none" stroke="${outerStrokeColor}" stroke-width="${strokeWidth.toFixed(
          3,
        )}"/>`,
        `<rect x="${innerOffset.toFixed(3)}" y="${innerOffset.toFixed(3)}" width="${Math.max(
          0,
          normalizedWidth - innerOffset * 2,
        ).toFixed(3)}" height="${Math.max(
          0,
          normalizedHeight - innerOffset * 2,
        ).toFixed(3)}" fill="none" stroke="${innerStrokeColor}" stroke-width="${innerStrokeWidth.toFixed(
          3,
        )}"/>`,
      ].join("");
      break;
    }
    case "triple-rectangle-frame": {
      const referenceSize =
        typeof strokeReferenceSize === "number" && Number.isFinite(strokeReferenceSize)
          ? Math.max(strokeReferenceSize, 1)
          : Math.min(normalizedWidth, normalizedHeight);
      const normalizedSpacingScale =
        Number.isFinite(spacingScale) && spacingScale >= 0 ? spacingScale : 1;
      const innerStrokeWidth = strokeWidth;
      const centerStrokeWidth = strokeWidth;
      const gap = referenceSize * 0.04 * normalizedSpacingScale;
      const centerHalfStroke = centerStrokeWidth / 2;
      const innerHalfStroke = innerStrokeWidth / 2;
      const centerOffset = strokeWidth + gap + centerHalfStroke;
      const innerOffset = centerOffset + centerHalfStroke + gap + innerHalfStroke;
      const outerStrokeColor = resolveStrokeSlotColor("stroke-outer", escapedStroke);
      const centerStrokeColor = resolveStrokeSlotColor("stroke-middle", escapedStroke);
      const innerStrokeColor = resolveStrokeSlotColor("stroke-inner", escapedStroke);

      shapeMarkup = [
        `<rect x="${halfStroke.toFixed(3)}" y="${halfStroke.toFixed(3)}" width="${Math.max(
          0,
          normalizedWidth - strokeWidth,
        ).toFixed(3)}" height="${Math.max(0, normalizedHeight - strokeWidth).toFixed(
          3,
        )}" fill="none" stroke="${outerStrokeColor}" stroke-width="${strokeWidth.toFixed(
          3,
        )}"/>`,
        `<rect x="${centerOffset.toFixed(3)}" y="${centerOffset.toFixed(3)}" width="${Math.max(
          0,
          normalizedWidth - centerOffset * 2,
        ).toFixed(3)}" height="${Math.max(
          0,
          normalizedHeight - centerOffset * 2,
        ).toFixed(3)}" fill="none" stroke="${centerStrokeColor}" stroke-width="${centerStrokeWidth.toFixed(
          3,
        )}"/>`,
        `<rect x="${innerOffset.toFixed(3)}" y="${innerOffset.toFixed(3)}" width="${Math.max(
          0,
          normalizedWidth - innerOffset * 2,
        ).toFixed(3)}" height="${Math.max(
          0,
          normalizedHeight - innerOffset * 2,
        ).toFixed(3)}" fill="none" stroke="${innerStrokeColor}" stroke-width="${innerStrokeWidth.toFixed(
          3,
        )}"/>`,
      ].join("");
      break;
    }
    case "striped-rectangle-frame": {
      const minDimension = Math.max(1, Math.min(normalizedWidth, normalizedHeight));
      const accentColor = resolveStrokeSlotColor("stroke", escapedStroke);
      const stripeWhite = resolveStrokeSlotColor("stripe-white", "#ffffff");
      const stripeThickness = Math.max(1.4, minDimension * 0.016);
      const tickLength = Math.max(stripeThickness * 2.5, minDimension * 0.075);
      const bandThickness = Math.max(stripeThickness * 2.7, minDimension * 0.09);
      const outerMargin = Math.max(halfStroke, minDimension * 0.02);
      const solidLeft = outerMargin + tickLength;
      const solidTop = outerMargin + tickLength;
      const solidRight = Math.max(solidLeft, normalizedWidth - outerMargin - tickLength);
      const solidBottom = Math.max(solidTop, normalizedHeight - outerMargin - tickLength);
      const innerLeft = solidLeft + bandThickness;
      const innerTop = solidTop + bandThickness;
      const innerRight = Math.max(innerLeft, solidRight - bandThickness);
      const innerBottom = Math.max(innerTop, solidBottom - bandThickness);
      const solidBandPath = [
        `M ${solidLeft.toFixed(3)} ${solidTop.toFixed(3)}`,
        `H ${solidRight.toFixed(3)}`,
        `V ${solidBottom.toFixed(3)}`,
        `H ${solidLeft.toFixed(3)}`,
        "Z",
        `M ${innerLeft.toFixed(3)} ${innerTop.toFixed(3)}`,
        `H ${innerRight.toFixed(3)}`,
        `V ${innerBottom.toFixed(3)}`,
        `H ${innerLeft.toFixed(3)}`,
        "Z",
      ].join(" ");
      const stripes = [
        ...buildStripedBandRectangles({
          start: solidLeft,
          end: solidRight,
          thickness: stripeThickness,
          horizontal: true,
          bandStart: outerMargin,
          bandEnd: solidTop,
          accentColor,
          whiteColor: stripeWhite,
        }),
        ...buildStripedBandRectangles({
          start: solidLeft,
          end: solidRight,
          thickness: stripeThickness,
          horizontal: true,
          bandStart: solidBottom,
          bandEnd: normalizedHeight - outerMargin,
          accentColor,
          whiteColor: stripeWhite,
        }),
        ...buildStripedBandRectangles({
          start: solidTop,
          end: solidBottom,
          thickness: stripeThickness,
          horizontal: false,
          bandStart: outerMargin,
          bandEnd: solidLeft,
          accentColor,
          whiteColor: stripeWhite,
        }),
        ...buildStripedBandRectangles({
          start: solidTop,
          end: solidBottom,
          thickness: stripeThickness,
          horizontal: false,
          bandStart: solidRight,
          bandEnd: normalizedWidth - outerMargin,
          accentColor,
          whiteColor: stripeWhite,
        }),
      ].join("");

      shapeMarkup = [
        `<path d="${solidBandPath}" fill="${accentColor}" fill-rule="evenodd"/>`,
        stripes,
      ].join("");
      break;
    }
    case "linked-circle-frame": {
      const referenceSize =
        typeof strokeReferenceSize === "number" && Number.isFinite(strokeReferenceSize)
          ? Math.max(strokeReferenceSize, 1)
          : Math.min(normalizedWidth, normalizedHeight);
      const normalizedSpacingScale =
        Number.isFinite(spacingScale) && spacingScale > 0 ? spacingScale : 1;
      shapeMarkup = buildLinkedCircleFrameMarkup({
        width: normalizedWidth,
        height: normalizedHeight,
        strokeWidth,
        strokeColor: escapedStroke,
        referenceSize,
        spacingScale: normalizedSpacingScale,
      });
      break;
    }
    case "scalloped-frame": {
      const pathData = buildScallopedFramePathData(
        normalizedWidth,
        normalizedHeight,
        halfStroke,
        patternScale,
      );
      shapeMarkup = `<path d="${pathData}" fill="none" stroke="${escapedStroke}" stroke-width="${strokeWidth.toFixed(
        3,
      )}" stroke-linecap="round" stroke-linejoin="round"/>`;
      break;
    }
    case "double-scalloped-frame": {
      const referenceSize =
        typeof strokeReferenceSize === "number" && Number.isFinite(strokeReferenceSize)
          ? Math.max(strokeReferenceSize, 1)
          : Math.min(normalizedWidth, normalizedHeight);
      const normalizedSpacingScale =
        Number.isFinite(spacingScale) && spacingScale > 0 ? spacingScale : 1;
      const innerStrokeWidth = strokeWidth;
      const innerGap = Math.max(referenceSize * 0.055 * normalizedSpacingScale, 3);
      const innerInset = strokeWidth + innerGap + innerStrokeWidth / 2;
      const outerScallopMetrics = getScallopedFrameMetrics(
        normalizedWidth,
        normalizedHeight,
        halfStroke,
        patternScale,
      );
      const outerPoints = buildScallopedFramePoints(outerScallopMetrics);
      const centerlineInsetDelta = Math.max(0.1, innerInset - halfStroke);
      const innerPoints = crampClosedPathCorners(
        elongateClosedPathEdgeWaves(
          scaleClosedPathPointsInward(
            outerPoints,
            centerlineInsetDelta,
            centerlineInsetDelta,
          ),
          DOUBLE_SCALLOPED_INNER_EDGE_WAVE_ELONGATION,
        ),
        DOUBLE_SCALLOPED_INNER_CORNER_CRAMP,
      );
      const outerPathData = buildClosedPointPathData(outerPoints);
      const innerPathData = buildClosedPointPathData(innerPoints);
      const outerStrokeColor = resolveStrokeSlotColor("stroke-outer", escapedStroke);
      const innerStrokeColor = resolveStrokeSlotColor("stroke-inner", escapedStroke);

      shapeMarkup = [
        `<path d="${outerPathData}" fill="none" stroke="${outerStrokeColor}" stroke-width="${strokeWidth.toFixed(
          3,
        )}" stroke-linecap="round" stroke-linejoin="round"/>`,
        `<path d="${innerPathData}" fill="none" stroke="${innerStrokeColor}" stroke-width="${innerStrokeWidth.toFixed(
          3,
        )}" stroke-linecap="round" stroke-linejoin="round"/>`,
      ].join("");
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
      )}" stroke-linecap="square" stroke-linejoin="miter"/>`;
      break;
    }
    case "greek-key-frame-shadow": {
      const shadowStrokeWidth = Math.max(FRAME_PRIMITIVE_SECONDARY_MIN_STROKE_WIDTH, strokeWidth * 0.5);
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
        )}" stroke-linecap="square" stroke-linejoin="miter"/>`,
        `<path d="${basePathData}" fill="none" stroke="${escapedStroke}" stroke-width="${strokeWidth.toFixed(
          3,
        )}" stroke-linecap="square" stroke-linejoin="miter"/>`,
      ].join("");
      break;
    }
    case "vintage-label-frame": {
      const frameShapeOptions = {
        sideBulgeMultiplier: 1.32,
        shoulderInsetMultiplier: 1.32,
      } as const;
      const outerPathData = buildVintageLabelFramePathData(
        normalizedWidth,
        normalizedHeight,
        halfStroke,
        frameShapeOptions,
      );
      // Double-frame experiment kept here for reference:
      // const referenceSize =
      //   typeof strokeReferenceSize === "number" && Number.isFinite(strokeReferenceSize)
      //     ? Math.max(strokeReferenceSize, 1)
      //     : Math.min(normalizedWidth, normalizedHeight);
      // const horizontalStretch = Math.max(0, normalizedWidth / Math.max(normalizedHeight, 1) - 1);
      // const verticalStretch = Math.max(0, normalizedHeight / Math.max(normalizedWidth, 1) - 1);
      // const aspectRatio =
      //   Math.max(normalizedWidth, normalizedHeight) /
      //   Math.max(1, Math.min(normalizedWidth, normalizedHeight));
      // const aspectStretch = Math.max(0, aspectRatio - 1);
      // const innerStrokeWidth = Math.max(
      //   FRAME_PRIMITIVE_SECONDARY_MIN_STROKE_WIDTH,
      //   strokeWidth * 0.58,
      // );
      // const innerGap = Math.max(
      //   referenceSize * (0.038 + Math.min(aspectStretch, 2) * 0.02),
      //   2.4,
      // );
      // const innerLandscapeFactor = Math.min(horizontalStretch, 2);
      // const innerPortraitFactor = Math.min(verticalStretch, 2);
      // const outerSpanX = Math.max(1, normalizedWidth - strokeWidth);
      // const outerSpanY = Math.max(1, normalizedHeight - strokeWidth);
      // const innerHorizontalGap = Math.max(
      //   innerGap *
      //     Math.min(
      //       1.14,
      //       Math.max(0.72, 1 - innerLandscapeFactor * 0.18 + innerPortraitFactor * 0.1),
      //     ),
      //   1.8,
      // );
      // const innerVerticalGap = Math.max(
      //   innerGap * Math.min(1.04, Math.max(0.74, 1 - innerLandscapeFactor * 0.12)),
      //   1.8,
      // );
      // const innerScaleX = Math.max(0.1, (outerSpanX - innerHorizontalGap * 2) / outerSpanX);
      // const innerScaleY = Math.max(0.1, (outerSpanY - innerVerticalGap * 2) / outerSpanY);
      // const centerX = normalizedWidth / 2;
      // const centerY = normalizedHeight / 2;
      // const negativeCenterX = (-centerX).toFixed(3);
      // const negativeCenterY = (-centerY).toFixed(3);
      // const innerTransform = `translate(${centerX.toFixed(3)} ${centerY.toFixed(
      //   3,
      // )}) scale(${innerScaleX.toFixed(4)} ${innerScaleY.toFixed(4)}) translate(${negativeCenterX} ${negativeCenterY})`;
      shapeMarkup = `<path d="${outerPathData}" fill="none" stroke="${escapedStroke}" stroke-width="${strokeWidth.toFixed(
        3,
      )}" stroke-linecap="round" stroke-linejoin="round"/>`;
      break;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" fill="none" shape-rendering="crispEdges" color-rendering="optimizeQuality">${shapeMarkup}</svg>`;
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
): {
  primary: string;
  secondary: string | null;
  fill: string | null;
  bySlotId: Record<string, string>;
} {
  const resolvedById = new Map<string, string>();

  for (const slot of slots) {
    resolvedById.set(
      slot.id,
      slot.paletteColorId ? (paletteById[slot.paletteColorId]?.hex ?? slot.sourceHex) : slot.sourceHex,
    );
  }
  const resolvedColors = slots.map((slot) => resolvedById.get(slot.id) ?? slot.sourceHex);

  const primary =
    resolvedById.get("stroke") ??
    resolvedById.get("stroke-outer") ??
    resolvedColors[0] ??
    fallbackColor ??
    DEFAULT_STROKE_COLOR;
  const secondary = resolvedById.get("shadow") ?? resolvedColors[1] ?? null;
  const fill = resolvedById.get("fill") ?? null;

  return {
    primary,
    secondary,
    fill,
    bySlotId: Object.fromEntries(resolvedById.entries()),
  };
}

export function getPrimitiveDefaultColorSlots(kind: PrimitiveIconKind): IconColorSlot[] {
  if (kind === "double-rectangle-frame") {
    return [
      createPrimitiveColorSlot("stroke-outer", "#121923"),
      createPrimitiveColorSlot("stroke-inner", "#121923"),
    ];
  }

  if (kind === "triple-rectangle-frame") {
    return [
      createPrimitiveColorSlot("stroke-outer", "#121923"),
      createPrimitiveColorSlot("stroke-middle", "#121923"),
      createPrimitiveColorSlot("stroke-inner", "#121923"),
    ];
  }

  if (kind === "double-scalloped-frame") {
    return [
      createPrimitiveColorSlot("stroke-outer", "#121923"),
      createPrimitiveColorSlot("stroke-inner", "#121923"),
    ];
  }

  if (kind === "striped-rectangle-frame") {
    return [
      createPrimitiveColorSlot("stroke", "#121923"),
      createPrimitiveColorSlot("stripe-white", "#ffffff", { isLocked: true }),
    ];
  }

  if (
    kind === "circle" ||
    kind === "rectangle" ||
    kind === "triangle" ||
    kind === "heart" ||
    kind === "star"
  ) {
    return [
      createPrimitiveColorSlot("stroke", "#121923"),
      {
        id: "fill",
        sourceHex: "transparent",
        paletteColorId: null,
      },
    ];
  }

  if (kind === "greek-key-frame-shadow") {
    return [
      createPrimitiveColorSlot("stroke", "#121923"),
      createPrimitiveColorSlot("shadow", "#8e99ab"),
    ];
  }

  return [];
}

function createPrimitiveColorSlot(
  id: string,
  sourceHex: string,
  options: { isLocked?: boolean } = {},
): IconColorSlot {
  return {
    id,
    sourceHex,
    paletteColorId: findClosestPaletteColorId(
      DMC_COLOR_LIBRARY_BY_ID,
      hexToRgb(sourceHex) as Rgb,
    ),
    isLocked: options.isLocked,
  };
}

function buildStripedBandRectangles(options: {
  start: number;
  end: number;
  thickness: number;
  horizontal: boolean;
  bandStart: number;
  bandEnd: number;
  accentColor: string;
  whiteColor: string;
}): string[] {
  const { start, end, thickness, horizontal, bandStart, bandEnd, accentColor, whiteColor } = options;
  const span = Math.max(0, end - start);
  const bandSize = Math.max(0, bandEnd - bandStart);
  if (span <= 0 || bandSize <= 0) {
    return [];
  }

  const stripeCount = Math.max(1, Math.ceil(span / thickness));

  return Array.from({ length: stripeCount }, (_, index) => {
    const stripeStart = start + index * thickness;
    const stripeSpan = Math.min(thickness, end - stripeStart);
    const fill = index % 2 === 0 ? accentColor : whiteColor;

    if (horizontal) {
      return `<rect x="${stripeStart.toFixed(3)}" y="${bandStart.toFixed(3)}" width="${stripeSpan.toFixed(
        3,
      )}" height="${bandSize.toFixed(3)}" fill="${fill}"/>`;
    }

    return `<rect x="${bandStart.toFixed(3)}" y="${stripeStart.toFixed(3)}" width="${bandSize.toFixed(
      3,
    )}" height="${stripeSpan.toFixed(3)}" fill="${fill}"/>`;
  });
}

function getPrimitiveStrokeWidth(
  kind: PrimitiveIconKind,
  width: number,
  height: number,
  _strokeReferenceSize: number | null | undefined,
  strokeWidthScale: number,
): number {
  const baseStrokeRatio =
    kind === "double-rectangle-frame" ||
    kind === "triple-rectangle-frame" ||
    kind === "linked-circle-frame" ||
    kind === "scalloped-frame" ||
    kind === "double-scalloped-frame" ||
    kind === "greek-key-frame" ||
    kind === "greek-key-frame-shadow" ||
    kind === "vintage-label-frame"
      ? FRAME_PRIMITIVE_STROKE_RATIO
      : DEFAULT_PRIMITIVE_STROKE_RATIO;
  const renderedSize = Math.min(width, height);
  const baseStrokeWidth = renderedSize * baseStrokeRatio;
  const normalizedScale =
    Number.isFinite(strokeWidthScale) && strokeWidthScale > 0 ? strokeWidthScale : 1;
  const minimumStrokeWidth = isPrimitiveFrameKind(kind) ? FRAME_PRIMITIVE_MIN_STROKE_WIDTH : 1;
  return Math.max(minimumStrokeWidth, baseStrokeWidth * normalizedScale);
}

function buildNormalizedStarPoints(
  width: number,
  height: number,
  inset: number,
): string {
  const pointSet = Array.from({ length: 10 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    const radius = index % 2 === 0 ? 1 : 0.45;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  });
  const bounds = pointSet.reduce(
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
  const innerWidth = Math.max(1, width - inset * 2);
  const innerHeight = Math.max(1, height - inset * 2);
  const rangeX = Math.max(bounds.maxX - bounds.minX, 0.0001);
  const rangeY = Math.max(bounds.maxY - bounds.minY, 0.0001);

  return pointSet
    .map((point) => {
      const x = inset + ((point.x - bounds.minX) / rangeX) * innerWidth;
      const y = inset + ((point.y - bounds.minY) / rangeY) * innerHeight;
      return `${x.toFixed(3)},${y.toFixed(3)}`;
    })
    .join(" ");
}

function getResponsiveStrokeScaleMultiplier(
  strokeReferenceSize: number | null | undefined,
): number {
  if (typeof strokeReferenceSize !== "number" || !Number.isFinite(strokeReferenceSize)) {
    return 1;
  }

  const referenceSize = Math.max(strokeReferenceSize, 1);
  if (referenceSize <= RESPONSIVE_STROKE_REFERENCE_MIN) {
    return RESPONSIVE_STROKE_SCALE_MULTIPLIER_MIN;
  }

  if (referenceSize >= RESPONSIVE_STROKE_REFERENCE_MAX) {
    return 1;
  }

  const progress =
    (referenceSize - RESPONSIVE_STROKE_REFERENCE_MIN) /
    (RESPONSIVE_STROKE_REFERENCE_MAX - RESPONSIVE_STROKE_REFERENCE_MIN);
  return (
    RESPONSIVE_STROKE_SCALE_MULTIPLIER_MIN +
    (1 - RESPONSIVE_STROKE_SCALE_MULTIPLIER_MIN) * progress
  );
}

function applyResponsiveStrokeScale(
  scale: number,
  strokeReferenceSize: number | null | undefined,
): number {
  return roundStrokeScale(scale * getResponsiveStrokeScaleMultiplier(strokeReferenceSize));
}

function clampPrimitiveStrokeWidthScale(
  scale: number,
  kind: PrimitiveIconKind | null | undefined,
  strokeReferenceSize: number | null | undefined,
): number {
  const { min, max } = getPrimitiveStrokeWidthScaleRange(kind, strokeReferenceSize);
  return roundStrokeScale(Math.min(Math.max(scale, min), max));
}

function roundStrokeScale(value: number): number {
  return Number(value.toFixed(2));
}

function normalizePrimitiveFillPaint(fillColor: string | null | undefined): string {
  const normalized = fillColor?.trim().toLowerCase();

  if (!normalized || normalized === "transparent" || normalized === "none") {
    return "none";
  }

  return escapeXmlAttribute(fillColor ?? normalized);
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

function buildLinkedCircleFrameMarkup(options: {
  width: number;
  height: number;
  strokeWidth: number;
  strokeColor: string;
  referenceSize: number;
  spacingScale: number;
}): string {
  const { width, height, strokeWidth, strokeColor, referenceSize, spacingScale } = options;
  const outerInset = Math.max(strokeWidth * 0.3, 0.5);
  const minDimension = Math.max(1, Math.min(width, height));
  const circleDiameter = Math.min(
    minDimension * 0.22,
    Math.max(strokeWidth * 2.6, minDimension * 0.135),
  );
  const outerCircleRadius = Math.max(1, circleDiameter / 2);
  const grooveThickness = Math.max(strokeWidth * 0.44, outerCircleRadius * 0.14, 0.5);
  const connectorThickness = grooveThickness;
  const restoredCenterRadius = Math.max(0.8, outerCircleRadius - grooveThickness);
  const innerOutlineStrokeWidth = Math.max(
    FRAME_PRIMITIVE_SECONDARY_MIN_STROKE_WIDTH,
    strokeWidth * 0.5,
  );
  const motifOuterPadding = Math.max(grooveThickness * 1.15, outerCircleRadius * 0.2, 1);
  const motifInnerPadding = Math.max(grooveThickness * 0.25, outerCircleRadius * 0.03, 0.2);
  const bandThickness = motifOuterPadding + circleDiameter + motifInnerPadding;
  const windowInset = outerInset + bandThickness;
  const innerOutlineInset = windowInset + innerOutlineStrokeWidth / 2;
  const innerWidth = Math.max(1, width - windowInset * 2);
  const innerHeight = Math.max(1, height - windowInset * 2);
  const outlineWidth = Math.max(1, innerWidth - innerOutlineStrokeWidth);
  const outlineHeight = Math.max(1, innerHeight - innerOutlineStrokeWidth);

  const centerOffset = outerInset + motifOuterPadding + outerCircleRadius;
  const leftX = centerOffset;
  const rightX = Math.max(leftX, width - centerOffset);
  const topY = centerOffset;
  const bottomY = Math.max(topY, height - centerOffset);
  const targetPitch = Math.max(outerCircleRadius * 2.2, referenceSize * 0.09);
  const topBottomCenters = buildDistributedEdgeCenters(leftX, rightX, targetPitch);
  const leftRightCenters = buildDistributedEdgeCenters(topY, bottomY, targetPitch);
  const cutoutShapes = buildLinkedCircleMaskShapes({
    topBottomCenters,
    leftRightCenters,
    leftX,
    rightX,
    topY,
    bottomY,
    circleRadius: outerCircleRadius,
    connectorThickness,
    circleFill: "black",
    connectorFill: "black",
    restoreRadius: restoredCenterRadius,
  });
  const maskId = [
    "linked-circle-frame",
    Math.round(width),
    Math.round(height),
    Math.round(strokeWidth * 100),
    Math.round(spacingScale * 100),
  ].join("-");

  return [
    `<defs><mask id="${maskId}" maskUnits="userSpaceOnUse" x="0" y="0" width="${width.toFixed(
      3,
    )}" height="${height.toFixed(3)}">`,
    `<rect x="${outerInset.toFixed(3)}" y="${outerInset.toFixed(3)}" width="${Math.max(
      1,
      width - outerInset * 2,
    ).toFixed(3)}" height="${Math.max(1, height - outerInset * 2).toFixed(
      3,
    )}" fill="white"/>`,
    `<rect x="${windowInset.toFixed(3)}" y="${windowInset.toFixed(3)}" width="${innerWidth.toFixed(
      3,
    )}" height="${innerHeight.toFixed(3)}" fill="black"/>`,
    cutoutShapes,
    "</mask></defs>",
    `<rect x="${outerInset.toFixed(3)}" y="${outerInset.toFixed(3)}" width="${Math.max(
      1,
      width - outerInset * 2,
    ).toFixed(3)}" height="${Math.max(1, height - outerInset * 2).toFixed(
      3,
    )}" fill="${strokeColor}" mask="url(#${maskId})"/>`,
    `<rect x="${innerOutlineInset.toFixed(3)}" y="${innerOutlineInset.toFixed(
      3,
    )}" width="${outlineWidth.toFixed(3)}" height="${outlineHeight.toFixed(
      3,
    )}" fill="none" stroke="${strokeColor}" stroke-width="${innerOutlineStrokeWidth.toFixed(
      3,
    )}"/>`,
  ].join("");
}

function buildDistributedEdgeCenters(
  start: number,
  end: number,
  targetPitch: number,
): number[] {
  const span = Math.max(0, end - start);
  if (span === 0) {
    return [start];
  }

  const count = Math.max(3, Math.round(span / Math.max(targetPitch, 1)) + 1);
  return Array.from({ length: count }, (_, index) => {
    const progress = count === 1 ? 0 : index / (count - 1);
    return start + span * progress;
  });
}

function buildLinkedCircleMaskShapes(options: {
  topBottomCenters: number[];
  leftRightCenters: number[];
  leftX: number;
  rightX: number;
  topY: number;
  bottomY: number;
  circleRadius: number;
  connectorThickness: number;
  circleFill: "white" | "black";
  connectorFill: "white" | "black";
  restoreRadius?: number;
}): string {
  const {
    topBottomCenters,
    leftRightCenters,
    leftX,
    rightX,
    topY,
    bottomY,
    circleRadius,
    connectorThickness,
    circleFill,
    connectorFill,
    restoreRadius,
  } = options;
  const circleMarkup: string[] = [];
  const connectorMarkup: string[] = [];
  const restoreMarkup: string[] = [];
  const circleKeys = new Set<string>();

  const appendCircle = (cx: number, cy: number) => {
    const key = `${cx.toFixed(3)}:${cy.toFixed(3)}`;
    if (circleKeys.has(key)) {
      return;
    }

    circleKeys.add(key);
    circleMarkup.push(
      `<circle cx="${cx.toFixed(3)}" cy="${cy.toFixed(3)}" r="${circleRadius.toFixed(
        3,
      )}" fill="${circleFill}"/>`,
    );
    if (typeof restoreRadius === "number" && restoreRadius > 0) {
      restoreMarkup.push(
        `<circle cx="${cx.toFixed(3)}" cy="${cy.toFixed(3)}" r="${restoreRadius.toFixed(
          3,
        )}" fill="white"/>`,
      );
    }
  };

  const appendHorizontalRuns = (y: number) => {
    topBottomCenters.forEach((cx) => appendCircle(cx, y));
    for (let index = 0; index < topBottomCenters.length - 1; index += 1) {
      connectorMarkup.push(
        `<line x1="${topBottomCenters[index].toFixed(3)}" y1="${y.toFixed(
          3,
        )}" x2="${topBottomCenters[index + 1].toFixed(3)}" y2="${y.toFixed(
          3,
        )}" stroke="${connectorFill}" stroke-width="${connectorThickness.toFixed(
          3,
        )}" stroke-linecap="round"/>`,
      );
    }
  };

  const appendVerticalRuns = (x: number) => {
    leftRightCenters.forEach((cy) => appendCircle(x, cy));
    for (let index = 0; index < leftRightCenters.length - 1; index += 1) {
      connectorMarkup.push(
        `<line x1="${x.toFixed(3)}" y1="${leftRightCenters[index].toFixed(
          3,
        )}" x2="${x.toFixed(3)}" y2="${leftRightCenters[index + 1].toFixed(
          3,
        )}" stroke="${connectorFill}" stroke-width="${connectorThickness.toFixed(
          3,
        )}" stroke-linecap="round"/>`,
      );
    }
  };

  appendHorizontalRuns(topY);
  appendHorizontalRuns(bottomY);
  appendVerticalRuns(leftX);
  appendVerticalRuns(rightX);

  return [...connectorMarkup, ...circleMarkup, ...restoreMarkup].join("");
}

function buildVintageLabelFramePathData(
  width: number,
  height: number,
  inset: number,
  options?: {
    flatInsetProgressMultiplier?: number;
    proportionReferenceMinDimension?: number;
    sideBulgeMultiplier?: number;
    shoulderInsetMultiplier?: number;
    shoulderLedgeMultiplier?: number;
    shoulderDropMultiplier?: number;
    shoulderLineMultiplier?: number;
    horizontalInsetMultiplier?: number;
    verticalInsetMultiplier?: number;
  },
): string {
  const horizontalInsetMultiplier =
    typeof options?.horizontalInsetMultiplier === "number" &&
    Number.isFinite(options.horizontalInsetMultiplier)
      ? options.horizontalInsetMultiplier
      : 1;
  const verticalInsetMultiplier =
    typeof options?.verticalInsetMultiplier === "number" &&
    Number.isFinite(options.verticalInsetMultiplier)
      ? options.verticalInsetMultiplier
      : 1;
  const horizontalInset = inset * horizontalInsetMultiplier;
  const verticalInset = inset * verticalInsetMultiplier;
  const left = horizontalInset;
  const top = verticalInset;
  const right = Math.max(left, width - horizontalInset);
  const bottom = Math.max(top, height - verticalInset);
  const innerWidth = Math.max(1, right - left);
  const innerHeight = Math.max(1, bottom - top);
  const minDimension = Math.max(1, Math.min(innerWidth, innerHeight));
  const proportionReferenceMinDimension =
    typeof options?.proportionReferenceMinDimension === "number" &&
    Number.isFinite(options.proportionReferenceMinDimension)
      ? Math.max(options.proportionReferenceMinDimension, 1)
      : minDimension;
  const flatInsetProgressMultiplier =
    typeof options?.flatInsetProgressMultiplier === "number" &&
    Number.isFinite(options.flatInsetProgressMultiplier)
      ? options.flatInsetProgressMultiplier
      : 1;
  const flatInset = Math.min(
    Math.max(proportionReferenceMinDimension * 0.3 * flatInsetProgressMultiplier, 22),
    innerWidth / 2 - Math.max(proportionReferenceMinDimension * 0.12, 10),
  );
  const baseShoulderInset = Math.min(
    Math.max(proportionReferenceMinDimension * 0.085, 6),
    flatInset - Math.max(proportionReferenceMinDimension * 0.08, 6),
  );
  const shoulderInsetMultiplier =
    typeof options?.shoulderInsetMultiplier === "number" &&
    Number.isFinite(options.shoulderInsetMultiplier)
      ? options.shoulderInsetMultiplier
      : 1;
  const shoulderInset = Math.min(
    baseShoulderInset * shoulderInsetMultiplier,
    flatInset - Math.max(proportionReferenceMinDimension * 0.04, 4),
  );
  const shoulderLedgeMultiplier =
    typeof options?.shoulderLedgeMultiplier === "number" &&
    Number.isFinite(options.shoulderLedgeMultiplier)
      ? options.shoulderLedgeMultiplier
      : 1;
  const shoulderDropMultiplier =
    typeof options?.shoulderDropMultiplier === "number" &&
    Number.isFinite(options.shoulderDropMultiplier)
      ? options.shoulderDropMultiplier
      : 1;
  const shoulderDrop = Math.min(
    Math.max(proportionReferenceMinDimension * 0.13 * shoulderDropMultiplier, 10),
    innerHeight / 2 - Math.max(proportionReferenceMinDimension * 0.18, 10),
  );
  const shoulderLineMultiplier =
    typeof options?.shoulderLineMultiplier === "number" &&
    Number.isFinite(options.shoulderLineMultiplier)
      ? options.shoulderLineMultiplier
      : 1;
  const shoulderLedgeLength = Math.max(
    proportionReferenceMinDimension * 0.11 * shoulderLedgeMultiplier,
    8,
  );
  const shoulderLineLength = Math.max(
    proportionReferenceMinDimension * 0.12 * shoulderLineMultiplier,
    10,
  );
  const sideCurveStartY = top + shoulderDrop + shoulderLineLength;
  const sideCurveEndY = bottom - shoulderDrop - shoulderLineLength;
  const rightShoulderX = right - shoulderInset;
  const leftShoulderX = left + shoulderInset;
  const rightShoulderCurveEndX = rightShoulderX - shoulderLedgeLength;
  const leftShoulderCurveEndX = leftShoulderX + shoulderLedgeLength;
  const sideBulgeBase = Math.max(innerWidth * 0.42, proportionReferenceMinDimension * 0.56);
  const sideBulgeMultiplier =
    typeof options?.sideBulgeMultiplier === "number" && Number.isFinite(options.sideBulgeMultiplier)
      ? options.sideBulgeMultiplier
      : 1;
  const sideBulgeOffset = sideBulgeBase * sideBulgeMultiplier;
  const rightBulgeX = Math.min(width - inset / 2, right + sideBulgeOffset);
  const leftBulgeX = Math.max(inset / 2, left - sideBulgeOffset);
  const topFlatStartX = left + flatInset;
  const topFlatEndX = right - flatInset;
  const bottomFlatStartX = left + flatInset;
  const bottomFlatEndX = right - flatInset;
  const topShoulderY = top + shoulderDrop;
  const bottomShoulderY = bottom - shoulderDrop;
  const upperCurveControlY = top + innerHeight * 0.32;
  const lowerCurveControlY = bottom - innerHeight * 0.32;
  const topShoulderSteepControlY = top + shoulderDrop * 1.02;
  const topShoulderTaperControlY = top + shoulderDrop * 1.005;
  const bottomShoulderSteepControlY = bottom - shoulderDrop * 1.02;
  const bottomShoulderTaperControlY = bottom - shoulderDrop * 1.005;
  const shoulderSteepControlOffset = shoulderInset * 0.015;
  const shoulderTaperControlOffset = shoulderInset * 0.72;

  return [
    `M ${topFlatStartX.toFixed(3)} ${top.toFixed(3)}`,
    `L ${topFlatEndX.toFixed(3)} ${top.toFixed(3)}`,
    `C ${(topFlatEndX + shoulderSteepControlOffset).toFixed(3)} ${topShoulderSteepControlY.toFixed(3)} ${(rightShoulderCurveEndX - shoulderTaperControlOffset).toFixed(3)} ${topShoulderTaperControlY.toFixed(3)} ${rightShoulderCurveEndX.toFixed(3)} ${topShoulderY.toFixed(3)}`,
    `L ${rightShoulderX.toFixed(3)} ${topShoulderY.toFixed(3)}`,
    `L ${rightShoulderX.toFixed(3)} ${sideCurveStartY.toFixed(3)}`,
    `C ${rightBulgeX.toFixed(3)} ${upperCurveControlY.toFixed(3)} ${rightBulgeX.toFixed(3)} ${lowerCurveControlY.toFixed(3)} ${rightShoulderX.toFixed(3)} ${sideCurveEndY.toFixed(3)}`,
    `L ${rightShoulderX.toFixed(3)} ${bottomShoulderY.toFixed(3)}`,
    `L ${rightShoulderCurveEndX.toFixed(3)} ${bottomShoulderY.toFixed(3)}`,
    `C ${(rightShoulderCurveEndX - shoulderTaperControlOffset).toFixed(3)} ${bottomShoulderTaperControlY.toFixed(3)} ${(bottomFlatEndX + shoulderSteepControlOffset).toFixed(3)} ${bottomShoulderSteepControlY.toFixed(3)} ${bottomFlatEndX.toFixed(3)} ${bottom.toFixed(3)}`,
    `L ${bottomFlatStartX.toFixed(3)} ${bottom.toFixed(3)}`,
    `C ${(bottomFlatStartX - shoulderSteepControlOffset).toFixed(3)} ${bottomShoulderSteepControlY.toFixed(3)} ${(leftShoulderCurveEndX + shoulderTaperControlOffset).toFixed(3)} ${bottomShoulderTaperControlY.toFixed(3)} ${leftShoulderCurveEndX.toFixed(3)} ${bottomShoulderY.toFixed(3)}`,
    `L ${leftShoulderX.toFixed(3)} ${bottomShoulderY.toFixed(3)}`,
    `L ${leftShoulderX.toFixed(3)} ${sideCurveEndY.toFixed(3)}`,
    `C ${leftBulgeX.toFixed(3)} ${lowerCurveControlY.toFixed(3)} ${leftBulgeX.toFixed(3)} ${upperCurveControlY.toFixed(3)} ${leftShoulderX.toFixed(3)} ${sideCurveStartY.toFixed(3)}`,
    `L ${leftShoulderX.toFixed(3)} ${topShoulderY.toFixed(3)}`,
    `L ${leftShoulderCurveEndX.toFixed(3)} ${topShoulderY.toFixed(3)}`,
    `C ${(leftShoulderCurveEndX + shoulderTaperControlOffset).toFixed(3)} ${topShoulderTaperControlY.toFixed(3)} ${(topFlatStartX - shoulderSteepControlOffset).toFixed(3)} ${topShoulderSteepControlY.toFixed(3)} ${topFlatStartX.toFixed(3)} ${top.toFixed(3)}`,
    "Z",
  ].join(" ");
}

function buildScallopedFramePathData(
  width: number,
  height: number,
  inset: number,
  patternScale: number,
  referenceMetrics?: {
    scallopAmplitude: number;
    cornerRadius: number;
    waveCount: number;
    sampleCount: number;
  },
): string {
  const metrics = getScallopedFrameMetrics(
    width,
    height,
    inset,
    patternScale,
    referenceMetrics,
  );
  return buildClosedPointPathData(buildScallopedFramePoints(metrics));
}

function buildScallopedFramePoints(metrics: {
  scallopAmplitude: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
  cornerRadius: number;
  perimeter: number;
  waveCount: number;
  sampleCount: number;
}): { x: number; y: number }[] {
  const { scallopAmplitude, left, top, right, bottom, cornerRadius, perimeter, waveCount, sampleCount } =
    metrics;
  const targetWavelength = perimeter / Math.max(waveCount, 1);
  const cornerRadiusAdjustment =
    (targetWavelength - cornerRadius * 2) * SCALLOP_CORNER_WIDENING_STRENGTH;
  const adjustedCornerRadius = Math.max(
    cornerRadius * SCALLOP_CORNER_MIN_RADIUS_RATIO,
    cornerRadius + cornerRadiusAdjustment,
  );
  const widenedCornerRadius = Math.min(
    Math.min(right - left, bottom - top) / 2,
    adjustedCornerRadius,
  );
  const straightWidth = Math.max(0, right - left - widenedCornerRadius * 2);
  const straightHeight = Math.max(0, bottom - top - widenedCornerRadius * 2);
  const cornerArcLength = (Math.PI / 2) * widenedCornerRadius;
  const horizontalWaveCount = Math.max(
    1,
    Math.round(straightWidth / Math.max(targetWavelength, 1)),
  );
  const verticalWaveCount = Math.max(
    1,
    Math.round(straightHeight / Math.max(targetWavelength, 1)),
  );
  const horizontalSamples = Math.max(16, Math.round((straightWidth / Math.max(perimeter, 1)) * sampleCount));
  const verticalSamples = Math.max(16, Math.round((straightHeight / Math.max(perimeter, 1)) * sampleCount));
  const cornerSamples = Math.max(12, Math.round((cornerArcLength / Math.max(perimeter, 1)) * sampleCount));

  const points: { x: number; y: number }[] = [];

  appendScallopedLineSegment(points, {
    startX: left + widenedCornerRadius,
    startY: top,
    endX: right - widenedCornerRadius,
    endY: top,
    normalX: 0,
    normalY: -1,
    amplitude: scallopAmplitude,
    waveCount: horizontalWaveCount,
    sampleCount: horizontalSamples,
    includeStart: true,
  });
  appendScallopedCornerSegment(points, {
    centerX: right - widenedCornerRadius,
    centerY: top + widenedCornerRadius,
    radius: widenedCornerRadius,
    startAngle: -Math.PI / 2,
    endAngle: 0,
    amplitude: scallopAmplitude,
    sampleCount: cornerSamples,
  });
  appendScallopedLineSegment(points, {
    startX: right,
    startY: top + widenedCornerRadius,
    endX: right,
    endY: bottom - widenedCornerRadius,
    normalX: 1,
    normalY: 0,
    amplitude: scallopAmplitude,
    waveCount: verticalWaveCount,
    sampleCount: verticalSamples,
    includeStart: false,
  });
  appendScallopedCornerSegment(points, {
    centerX: right - widenedCornerRadius,
    centerY: bottom - widenedCornerRadius,
    radius: widenedCornerRadius,
    startAngle: 0,
    endAngle: Math.PI / 2,
    amplitude: scallopAmplitude,
    sampleCount: cornerSamples,
  });
  appendScallopedLineSegment(points, {
    startX: right - widenedCornerRadius,
    startY: bottom,
    endX: left + widenedCornerRadius,
    endY: bottom,
    normalX: 0,
    normalY: 1,
    amplitude: scallopAmplitude,
    waveCount: horizontalWaveCount,
    sampleCount: horizontalSamples,
    includeStart: false,
  });
  appendScallopedCornerSegment(points, {
    centerX: left + widenedCornerRadius,
    centerY: bottom - widenedCornerRadius,
    radius: widenedCornerRadius,
    startAngle: Math.PI / 2,
    endAngle: Math.PI,
    amplitude: scallopAmplitude,
    sampleCount: cornerSamples,
  });
  appendScallopedLineSegment(points, {
    startX: left,
    startY: bottom - widenedCornerRadius,
    endX: left,
    endY: top + widenedCornerRadius,
    normalX: -1,
    normalY: 0,
    amplitude: scallopAmplitude,
    waveCount: verticalWaveCount,
    sampleCount: verticalSamples,
    includeStart: false,
  });
  appendScallopedCornerSegment(points, {
    centerX: left + widenedCornerRadius,
    centerY: top + widenedCornerRadius,
    radius: widenedCornerRadius,
    startAngle: Math.PI,
    endAngle: (Math.PI * 3) / 2,
    amplitude: scallopAmplitude,
    sampleCount: cornerSamples,
  });

  return points;
}

function getScallopedFrameMetrics(
  width: number,
  height: number,
  inset: number,
  patternScale: number,
  referenceMetrics?: {
    scallopAmplitude: number;
    cornerRadius: number;
    waveCount: number;
    sampleCount: number;
  },
): {
  scallopAmplitude: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
  cornerRadius: number;
  perimeter: number;
  waveCount: number;
  sampleCount: number;
} {
  const safeWidth = Math.max(1, width - inset * 2);
  const safeHeight = Math.max(1, height - inset * 2);
  const minDimension = Math.max(1, Math.min(safeWidth, safeHeight));
  const scallopAmplitude = referenceMetrics
    ? referenceMetrics.scallopAmplitude
    : Math.max(minDimension * 0.028, 2);
  const baseInset = inset + scallopAmplitude;
  const left = baseInset;
  const top = baseInset;
  const right = Math.max(left, width - baseInset);
  const bottom = Math.max(top, height - baseInset);
  const baseWidth = Math.max(1, right - left);
  const baseHeight = Math.max(1, bottom - top);
  const cornerRadius = Math.min(
    referenceMetrics
      ? referenceMetrics.cornerRadius
      : Math.max(minDimension * 0.06, scallopAmplitude * 1.8),
    Math.min(baseWidth, baseHeight) / 2,
  );
  const straightWidth = Math.max(0, baseWidth - cornerRadius * 2);
  const straightHeight = Math.max(0, baseHeight - cornerRadius * 2);
  const cornerArcLength = (Math.PI / 2) * cornerRadius;
  const perimeter = straightWidth * 2 + straightHeight * 2 + cornerArcLength * 4;
  const normalizedPatternScale =
    Number.isFinite(patternScale) && patternScale > 0 ? patternScale : 1;
  const targetScallopWavelength = Math.max(
    minDimension * 0.14 * normalizedPatternScale,
    10 * normalizedPatternScale,
  );
  const waveCount = referenceMetrics
    ? referenceMetrics.waveCount
    : Math.max(12, Math.round(perimeter / targetScallopWavelength));
  const sampleCount = referenceMetrics
    ? referenceMetrics.sampleCount
    : Math.max(180, waveCount * 24);

  return {
    scallopAmplitude,
    left,
    top,
    right,
    bottom,
    cornerRadius,
    perimeter,
    waveCount,
    sampleCount,
  };
}

function buildClosedPointPathData(points: { x: number; y: number }[]): string {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(3)} ${point.y.toFixed(3)}`)
    .concat("Z")
    .join(" ");
}

function scaleClosedPathPointsInward(
  points: { x: number; y: number }[],
  insetX: number,
  insetY: number,
): { x: number; y: number }[] {
  if (points.length === 0) {
    return [];
  }

  const bounds = points.reduce(
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
  const spanX = Math.max(1, bounds.maxX - bounds.minX);
  const spanY = Math.max(1, bounds.maxY - bounds.minY);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const scaleX = Math.max(0.1, (spanX - insetX * 2) / spanX);
  const scaleY = Math.max(0.1, (spanY - insetY * 2) / spanY);

  return points.map((point) => ({
    x: centerX + (point.x - centerX) * scaleX,
    y: centerY + (point.y - centerY) * scaleY,
  }));
}

function crampClosedPathCorners(
  points: { x: number; y: number }[],
  amount: number,
): { x: number; y: number }[] {
  if (points.length === 0 || amount <= 0) {
    return points;
  }

  const bounds = points.reduce(
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
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const halfSpanX = Math.max(1, (bounds.maxX - bounds.minX) / 2);
  const halfSpanY = Math.max(1, (bounds.maxY - bounds.minY) / 2);

  return points.map((point) => {
    const normalizedX = Math.abs(point.x - centerX) / halfSpanX;
    const normalizedY = Math.abs(point.y - centerY) / halfSpanY;
    const cornerMix = smoothstep(0.34, 0.86, Math.min(normalizedX, normalizedY));
    const cornerX = point.x < centerX ? bounds.minX : bounds.maxX;
    const cornerY = point.y < centerY ? bounds.minY : bounds.maxY;
    const pull = amount * cornerMix;

    return {
      x: point.x + (cornerX - point.x) * pull,
      y: point.y + (cornerY - point.y) * pull,
    };
  });
}

function elongateClosedPathEdgeWaves(
  points: { x: number; y: number }[],
  amount: number,
): { x: number; y: number }[] {
  if (points.length === 0 || amount <= 0) {
    return points;
  }

  const bounds = points.reduce(
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
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const halfSpanX = Math.max(1, (bounds.maxX - bounds.minX) / 2);
  const halfSpanY = Math.max(1, (bounds.maxY - bounds.minY) / 2);

  return points.map((point) => {
    const normalizedX = Math.abs(point.x - centerX) / halfSpanX;
    const normalizedY = Math.abs(point.y - centerY) / halfSpanY;
    const edgeMix = smoothstep(0.32, 0.82, Math.max(normalizedX, normalizedY));
    const cornerMix = smoothstep(0.48, 0.9, Math.min(normalizedX, normalizedY));
    const localAmount = amount * edgeMix * (1 - cornerMix * 0.55);

    if (normalizedY >= normalizedX) {
      return {
        x: centerX + (point.x - centerX) * (1 + localAmount),
        y: point.y,
      };
    }

    return {
      x: point.x,
      y: centerY + (point.y - centerY) * (1 + localAmount),
    };
  });
}

function appendScallopedLineSegment(
  points: { x: number; y: number }[],
  options: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    normalX: number;
    normalY: number;
    amplitude: number;
    waveCount: number;
    sampleCount: number;
    includeStart: boolean;
  },
): void {
  const {
    startX,
    startY,
    endX,
    endY,
    normalX,
    normalY,
    amplitude,
    waveCount,
    sampleCount,
    includeStart,
  } = options;
  const firstIndex = includeStart ? 0 : 1;

  for (let index = firstIndex; index <= sampleCount; index += 1) {
    const t = sampleCount === 0 ? 1 : index / sampleCount;
    const baseX = startX + (endX - startX) * t;
    const baseY = startY + (endY - startY) * t;
    const waveOffset =
      amplitude * getRepeatedScallopProfile(t, waveCount, SCALLOP_JOIN_INSET_RATIO);
    points.push({
      x: baseX + normalX * waveOffset,
      y: baseY + normalY * waveOffset,
    });
  }
}

function appendScallopedCornerSegment(
  points: { x: number; y: number }[],
  options: {
    centerX: number;
    centerY: number;
    radius: number;
    startAngle: number;
    endAngle: number;
    amplitude: number;
    sampleCount: number;
  },
): void {
  const {
    centerX,
    centerY,
    radius,
    startAngle,
    endAngle,
    amplitude,
    sampleCount,
  } = options;

  for (let index = 1; index <= sampleCount; index += 1) {
    const t = sampleCount === 0 ? 1 : index / sampleCount;
    const angle = startAngle + (endAngle - startAngle) * t;
    const normalX = Math.cos(angle);
    const normalY = Math.sin(angle);
    const waveOffset =
      amplitude * getSingleScallopProfile(t, SCALLOP_JOIN_INSET_RATIO);
    points.push({
      x: centerX + normalX * (radius + waveOffset),
      y: centerY + normalY * (radius + waveOffset),
    });
  }
}

function getRepeatedScallopProfile(
  t: number,
  waveCount: number,
  joinInsetRatio: number,
): number {
  const cycle = ((t * waveCount) % 1 + 1) % 1;
  return getSingleScallopProfile(cycle, joinInsetRatio);
}

function getSingleScallopProfile(t: number, joinInsetRatio: number): number {
  return ((1 + joinInsetRatio) * (1 - Math.cos(Math.PI * 2 * t))) / 2 - joinInsetRatio;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  if (edge0 === edge1) {
    return value < edge0 ? 0 : 1;
  }

  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function getRoundedRectPerimeterPoint(
  left: number,
  top: number,
  right: number,
  bottom: number,
  radius: number,
  distance: number,
): { x: number; y: number; normalX: number; normalY: number } {
  const straightWidth = Math.max(0, right - left - radius * 2);
  const straightHeight = Math.max(0, bottom - top - radius * 2);
  const cornerArcLength = (Math.PI / 2) * radius;
  const segments = [
    { kind: "line-top", length: straightWidth },
    { kind: "arc-tr", length: cornerArcLength },
    { kind: "line-right", length: straightHeight },
    { kind: "arc-br", length: cornerArcLength },
    { kind: "line-bottom", length: straightWidth },
    { kind: "arc-bl", length: cornerArcLength },
    { kind: "line-left", length: straightHeight },
    { kind: "arc-tl", length: cornerArcLength },
  ] as const;
  const perimeter = segments.reduce((sum, segment) => sum + segment.length, 0);
  let remaining = ((distance % perimeter) + perimeter) % perimeter;

  for (const segment of segments) {
    if (remaining > segment.length && segment.length > 0) {
      remaining -= segment.length;
      continue;
    }

    switch (segment.kind) {
      case "line-top": {
        const t = straightWidth === 0 ? 0 : remaining / straightWidth;
        return {
          x: left + radius + straightWidth * t,
          y: top,
          normalX: 0,
          normalY: -1,
        };
      }
      case "arc-tr":
        return getCornerArcPoint(
          right - radius,
          top + radius,
          radius,
          -Math.PI / 2,
          0,
          remaining,
          cornerArcLength,
        );
      case "line-right": {
        const t = straightHeight === 0 ? 0 : remaining / straightHeight;
        return {
          x: right,
          y: top + radius + straightHeight * t,
          normalX: 1,
          normalY: 0,
        };
      }
      case "arc-br":
        return getCornerArcPoint(
          right - radius,
          bottom - radius,
          radius,
          0,
          Math.PI / 2,
          remaining,
          cornerArcLength,
        );
      case "line-bottom": {
        const t = straightWidth === 0 ? 0 : remaining / straightWidth;
        return {
          x: right - radius - straightWidth * t,
          y: bottom,
          normalX: 0,
          normalY: 1,
        };
      }
      case "arc-bl":
        return getCornerArcPoint(
          left + radius,
          bottom - radius,
          radius,
          Math.PI / 2,
          Math.PI,
          remaining,
          cornerArcLength,
        );
      case "line-left": {
        const t = straightHeight === 0 ? 0 : remaining / straightHeight;
        return {
          x: left,
          y: bottom - radius - straightHeight * t,
          normalX: -1,
          normalY: 0,
        };
      }
      case "arc-tl":
        return getCornerArcPoint(
          left + radius,
          top + radius,
          radius,
          Math.PI,
          (Math.PI * 3) / 2,
          remaining,
          cornerArcLength,
        );
    }
  }

  return {
    x: left + radius,
    y: top,
    normalX: 0,
    normalY: -1,
  };
}

function getCornerArcPoint(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  distance: number,
  arcLength: number,
): { x: number; y: number; normalX: number; normalY: number } {
  const t = arcLength === 0 ? 0 : distance / arcLength;
  const angle = startAngle + (endAngle - startAngle) * t;
  const normalX = Math.cos(angle);
  const normalY = Math.sin(angle);

  return {
    x: centerX + normalX * radius,
    y: centerY + normalY * radius,
    normalX,
    normalY,
  };
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
