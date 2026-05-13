import { describe, expect, it } from "vitest";
import { shouldUseCompactThumbnailPreview } from "./StitchThumbnailCanvas";

describe("shouldUseCompactThumbnailPreview", () => {
  it("keeps stitched previews on high-density displays when cells still have enough device pixels", () => {
    expect(shouldUseCompactThumbnailPreview(1.2, 2)).toBe(false);
    expect(shouldUseCompactThumbnailPreview(1.6, 2)).toBe(false);
  });

  it("still falls back to compact previews when cells are genuinely tiny", () => {
    expect(shouldUseCompactThumbnailPreview(0.8, 2)).toBe(true);
    expect(shouldUseCompactThumbnailPreview(1.6, 1)).toBe(true);
  });
});
