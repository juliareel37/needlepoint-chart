import { describe, expect, it } from "vitest";
import {
  buildPrimitiveIconDataUrl,
  getPrimitiveDefaultColorSlots,
  getPrimitiveDefaultSpacingScale,
  getPrimitiveIconKind,
  getPrimitiveSpacingScaleRange,
} from "./primitiveIcon";

function decodeDataUrlSvg(dataUrl: string): string {
  const [, base64 = ""] = dataUrl.split(",", 2);
  return Buffer.from(base64, "base64").toString("utf8");
}

function extractPathCommands(svg: string): string[] {
  return Array.from(svg.matchAll(/<path d="([^"]+)"/g), (match) => match[1] ?? "");
}

function extractStrokeWidths(svg: string): string[] {
  return Array.from(svg.matchAll(/stroke-width="([^"]+)"/g), (match) => match[1] ?? "");
}

function extractRectXValues(svg: string): number[] {
  return Array.from(svg.matchAll(/<rect x="([^"]+)"/g), (match) => Number(match[1] ?? "0"));
}

describe("buildPrimitiveIconDataUrl", () => {
  it("renders the circle primitive as an ellipse when resized non-uniformly", () => {
    const svg = decodeDataUrlSvg(
      buildPrimitiveIconDataUrl({
        kind: "circle",
        width: 120,
        height: 80,
        strokeColor: "#121923",
      }),
    );

    expect(svg).toContain("<ellipse");
    expect(svg).toContain('rx="56.667"');
    expect(svg).toContain('ry="36.667"');
  });

  it("keeps a perfect circle when width and height match", () => {
    const svg = decodeDataUrlSvg(
      buildPrimitiveIconDataUrl({
        kind: "circle",
        width: 80,
        height: 80,
        strokeColor: "#121923",
      }),
    );

    expect(svg).toContain('rx="36.667"');
    expect(svg).toContain('ry="36.667"');
  });

  it("renders the vintage label frame as a responsive single-stroke path", () => {
    const svg = decodeDataUrlSvg(
      buildPrimitiveIconDataUrl({
        kind: "vintage-label-frame",
        width: 180,
        height: 120,
        strokeColor: "#121923",
      }),
    );

    expect(svg.match(/<path /g)?.length).toBe(1);
    expect(svg).toContain('stroke-linejoin="round"');
    expect(svg).toContain('viewBox="0 0 180.000 120.000"');
    expect(svg).toMatch(/L [\d.]+ [\d.]+ C [\d.]+ [\d.]+ [\d.]+ [\d.]+ [\d.]+ [\d.]+ L [\d.]+ [\d.]+ C /);
    expect(svg).toMatch(/C [\d.]+ [\d.]+ [\d.]+ [\d.]+ [\d.]+ [\d.]+ L [\d.]+ [\d.]+ C [\d.]+ [\d.]+/);
  });

  it("renders the double scalloped frame as two scalloped paths", () => {
    const svg = decodeDataUrlSvg(
      buildPrimitiveIconDataUrl({
        kind: "double-scalloped-frame",
        width: 180,
        height: 120,
        strokeColor: "#121923",
        strokeColorsBySlotId: {
          "stroke-outer": "#111111",
          "stroke-inner": "#222222",
        },
        spacingScale: getPrimitiveDefaultSpacingScale("double-scalloped-frame"),
      }),
    );

    const [outerPath = "", innerPath = ""] = extractPathCommands(svg);

    expect(svg.match(/<path /g)?.length).toBe(2);
    expect(svg).toContain('stroke-linejoin="round"');
    expect(svg).toContain('shape-rendering="crispEdges"');
    expect((outerPath.match(/L/g) ?? []).length).toBe((innerPath.match(/L/g) ?? []).length);
    expect(new Set(extractStrokeWidths(svg))).toHaveLength(1);
    expect(svg).toContain('stroke="#111111"');
    expect(svg).toContain('stroke="#222222"');
  });

  it("renders the triple rectangle frame as three nested rectangles", () => {
    const svg = decodeDataUrlSvg(
      buildPrimitiveIconDataUrl({
        kind: "triple-rectangle-frame",
        width: 180,
        height: 120,
        strokeColor: "#121923",
        strokeColorsBySlotId: {
          "stroke-outer": "#111111",
          "stroke-middle": "#222222",
          "stroke-inner": "#333333",
        },
        spacingScale: getPrimitiveDefaultSpacingScale("triple-rectangle-frame"),
      }),
    );

    expect(svg.match(/<rect /g)?.length).toBe(3);
    expect(svg).toContain('shape-rendering="crispEdges"');
    expect(new Set(extractStrokeWidths(svg))).toHaveLength(1);
    expect(svg).toContain('stroke="#111111"');
    expect(svg).toContain('stroke="#222222"');
    expect(svg).toContain('stroke="#333333"');
  });

  it("keeps both strokes the same width on the double rectangle frame", () => {
    const svg = decodeDataUrlSvg(
      buildPrimitiveIconDataUrl({
        kind: "double-rectangle-frame",
        width: 180,
        height: 120,
        strokeColor: "#121923",
        strokeColorsBySlotId: {
          "stroke-outer": "#111111",
          "stroke-inner": "#222222",
        },
        spacingScale: getPrimitiveDefaultSpacingScale("double-rectangle-frame"),
      }),
    );

    expect(svg.match(/<rect /g)?.length).toBe(2);
    expect(new Set(extractStrokeWidths(svg))).toHaveLength(1);
    expect(svg).toContain('stroke="#111111"');
    expect(svg).toContain('stroke="#222222"');
  });

  it("lets rectangular frame gaps close fully without overlapping at the minimum", () => {
    const doubleSvg = decodeDataUrlSvg(
      buildPrimitiveIconDataUrl({
        kind: "double-rectangle-frame",
        width: 180,
        height: 120,
        strokeColor: "#121923",
        spacingScale: 0,
      }),
    );
    const tripleSvg = decodeDataUrlSvg(
      buildPrimitiveIconDataUrl({
        kind: "triple-rectangle-frame",
        width: 180,
        height: 120,
        strokeColor: "#121923",
        spacingScale: 0,
      }),
    );

    expect(extractRectXValues(doubleSvg)).toEqual([3, 9]);
    expect(extractRectXValues(tripleSvg)).toEqual([3, 9, 15]);
  });

  it("renders the linked circle frame with circular cutouts and a solid body", () => {
    const svg = decodeDataUrlSvg(
      buildPrimitiveIconDataUrl({
        kind: "linked-circle-frame",
        width: 180,
        height: 120,
        strokeColor: "#121923",
      }),
    );

    expect(svg).toContain("<mask");
    expect(svg).toContain('mask="url(#linked-circle-frame-180-120-600-100)"');
    expect(svg).toContain("<circle");
    expect(svg).toContain("<line");
    expect(svg.match(/<circle /g)?.length).toBeGreaterThan(16);
    expect(svg).toContain('<rect x="');
  });

  it("renders the striped rectangle frame with hard-coded white alternating ticks", () => {
    const svg = decodeDataUrlSvg(
      buildPrimitiveIconDataUrl({
        kind: "striped-rectangle-frame",
        width: 180,
        height: 120,
        strokeColor: "#7aa000",
      }),
    );

    expect(svg).toContain('fill-rule="evenodd"');
    expect(svg).toContain('fill="#7aa000"');
    expect(svg).toContain('fill="#ffffff"');
    expect(svg.match(/<rect /g)?.length).toBeGreaterThan(20);
  });
});

describe("getPrimitiveIconKind", () => {
  it("maps the vintage label frame asset to its primitive kind", () => {
    expect(getPrimitiveIconKind("frames/vintage-label-frame.svg")).toBe("vintage-label-frame");
  });

  it("maps the double scalloped frame asset to its primitive kind", () => {
    expect(getPrimitiveIconKind("frames/double-scalloped-frame.svg")).toBe(
      "double-scalloped-frame",
    );
  });

  it("maps the linked circle frame asset to its primitive kind", () => {
    expect(getPrimitiveIconKind("frames/linked-circle-frame.svg")).toBe("linked-circle-frame");
  });

  it("maps the triple rectangle frame asset to its primitive kind", () => {
    expect(getPrimitiveIconKind("frames/triple-rectangle-frame.svg")).toBe(
      "triple-rectangle-frame",
    );
  });

  it("maps the striped rectangle frame asset to its primitive kind", () => {
    expect(getPrimitiveIconKind("frames/striped-rectangle-frame.svg")).toBe(
      "striped-rectangle-frame",
    );
  });
});

describe("getPrimitiveDefaultColorSlots", () => {
  it("gives multi-line rectangle frames separate stroke slots", () => {
    expect(getPrimitiveDefaultColorSlots("double-rectangle-frame").map((slot) => slot.id)).toEqual([
      "stroke-outer",
      "stroke-inner",
    ]);
    expect(getPrimitiveDefaultColorSlots("triple-rectangle-frame").map((slot) => slot.id)).toEqual([
      "stroke-outer",
      "stroke-middle",
      "stroke-inner",
    ]);
  });

  it("keeps the white stripe slot locked on the striped rectangle frame", () => {
    expect(getPrimitiveDefaultColorSlots("striped-rectangle-frame")).toEqual([
      expect.objectContaining({ id: "stroke", isLocked: undefined }),
      expect.objectContaining({ id: "stripe-white", isLocked: true }),
    ]);
  });
});

describe("double scalloped spacing defaults", () => {
  it("starts with a wider default gap", () => {
    expect(getPrimitiveDefaultSpacingScale("double-scalloped-frame")).toBe(2.25);
  });

  it("allows a wider spacing range", () => {
    expect(getPrimitiveSpacingScaleRange("double-scalloped-frame")).toEqual({
      min: 0.8,
      max: 3,
    });
  });

  it("reuses rectangle frame spacing defaults for the triple frame", () => {
    expect(getPrimitiveDefaultSpacingScale("triple-rectangle-frame")).toBe(0.75);
    expect(getPrimitiveSpacingScaleRange("triple-rectangle-frame")).toEqual({
      min: 0,
      max: 2,
    });
  });

  it("allows rectangular frame spacing to close completely", () => {
    expect(getPrimitiveSpacingScaleRange("double-rectangle-frame")).toEqual({
      min: 0,
      max: 2,
    });
  });
});
