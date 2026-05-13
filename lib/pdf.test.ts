import { describe, expect, it } from "vitest";

import { buildPdfFilename } from "@/lib/pdf";

describe("buildPdfFilename", () => {
  it("includes the sanitized title and stitch dimensions", () => {
    expect(buildPdfFilename("Lemon Cherry", 120, 80)).toBe("lemon-cherry-120x80.pdf");
  });

  it("falls back to a default title when empty", () => {
    expect(buildPdfFilename("", 42, 17)).toBe("needlepoint-pattern-42x17.pdf");
  });
});
