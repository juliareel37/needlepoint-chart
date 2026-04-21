import { describe, expect, it } from "vitest";
import { getEffectiveSourceCanvasPixelRatio } from "./GridCanvasStage.source";

describe("getEffectiveSourceCanvasPixelRatio", () => {
  it("preserves device pixel ratio for modest canvas sizes", () => {
    expect(getEffectiveSourceCanvasPixelRatio(560, 840, 3)).toBe(3);
  });

  it("scales the backing preview with zoom instead of always using full device resolution", () => {
    expect(getEffectiveSourceCanvasPixelRatio(8_400, 8_400, 0.3)).toBeCloseTo(0.3, 6);
  });

  it("caps the ratio when the backing area would exceed the browser limit", () => {
    expect(getEffectiveSourceCanvasPixelRatio(5_600, 5_600, 3)).toBeCloseTo(
      Math.sqrt(16_777_216 / (5_600 * 5_600)),
      6,
    );
  });

  it("uses a stricter mobile cap equivalent to 2048 by 2048 backing pixels", () => {
    expect(
      getEffectiveSourceCanvasPixelRatio(5_600, 5_600, 3, { isMobile: true }),
    ).toBeCloseTo(Math.sqrt(4_194_304 / (5_600 * 5_600)), 6);
  });

  it("never drops below the minimum safety ratio for extremely large canvases", () => {
    expect(getEffectiveSourceCanvasPixelRatio(100_000, 100_000, 3)).toBe(0.125);
  });
});
