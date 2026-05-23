import { describe, expect, it } from "vitest";
import {
  buildPrimitiveIconDataUrl,
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
        spacingScale: getPrimitiveDefaultSpacingScale("double-scalloped-frame"),
      }),
    );

    const [outerPath = "", innerPath = ""] = extractPathCommands(svg);

    expect(svg.match(/<path /g)?.length).toBe(2);
    expect(svg).toContain('stroke-linejoin="round"');
    expect(svg).toContain('shape-rendering="crispEdges"');
    expect((outerPath.match(/L/g) ?? []).length).toBe((innerPath.match(/L/g) ?? []).length);
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
});
