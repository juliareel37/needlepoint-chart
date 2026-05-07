import { describe, expect, it } from "vitest";
import { getWorkspaceEscapeAction } from "./escapeKeyBehavior";

describe("getWorkspaceEscapeAction", () => {
  it("returns null when no escapable flow is active", () => {
    expect(
      getWorkspaceEscapeAction({
        iconPlacementActive: false,
        previewMode: false,
        textPlacementActive: false,
        traceConversionPreviewActive: false,
        traceCropEditing: false,
        traceRepositionActive: false,
      }),
    ).toBeNull();
  });

  it("prioritizes text editing flow over preview mode", () => {
    expect(
      getWorkspaceEscapeAction({
        iconPlacementActive: false,
        previewMode: true,
        textPlacementActive: true,
        traceConversionPreviewActive: false,
        traceCropEditing: false,
        traceRepositionActive: false,
      }),
    ).toBe("cancel-text-placement");
  });

  it("prioritizes trace conversion preview over every other flow", () => {
    expect(
      getWorkspaceEscapeAction({
        iconPlacementActive: true,
        previewMode: true,
        textPlacementActive: true,
        traceConversionPreviewActive: true,
        traceCropEditing: true,
        traceRepositionActive: true,
      }),
    ).toBe("exit-trace-conversion-preview");
  });

  it("prefers crop cancellation over trace reposition cancellation", () => {
    expect(
      getWorkspaceEscapeAction({
        iconPlacementActive: false,
        previewMode: false,
        textPlacementActive: false,
        traceConversionPreviewActive: false,
        traceCropEditing: true,
        traceRepositionActive: true,
      }),
    ).toBe("cancel-trace-crop");
  });
});
