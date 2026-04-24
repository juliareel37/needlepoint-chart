import { describe, expect, it } from "vitest";
import { getConstrainedTraceImageSize } from "./traceAssetSizing";

describe("getConstrainedTraceImageSize", () => {
  it("preserves modest images", () => {
    expect(getConstrainedTraceImageSize(1600, 1200)).toEqual({
      width: 1600,
      height: 1200,
    });
  });

  it("caps images by maximum dimension", () => {
    expect(getConstrainedTraceImageSize(4096, 1024)).toEqual({
      width: 4096,
      height: 1024,
    });
  });

  it("caps images by total pixel budget", () => {
    expect(getConstrainedTraceImageSize(5000, 5000)).toEqual({
      width: 4096,
      height: 4096,
    });
  });
});
