import { describe, expect, it } from "vitest";
import { buildPrimitiveIconDataUrl } from "./primitiveIcon";

function decodeDataUrlSvg(dataUrl: string): string {
  const [, base64 = ""] = dataUrl.split(",", 2);
  return Buffer.from(base64, "base64").toString("utf8");
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
});
