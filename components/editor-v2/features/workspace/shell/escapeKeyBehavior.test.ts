import { describe, expect, it } from "vitest";
import { getWorkspaceEscapeAction } from "./escapeKeyBehavior";

describe("getWorkspaceEscapeAction", () => {
  it("returns null when no escapable flow is active", () => {
    expect(
      getWorkspaceEscapeAction({
        highlightedColorActive: false,
        iconPlacementActive: false,
        previewMode: false,
        traceEditModeActive: false,
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
        highlightedColorActive: false,
        iconPlacementActive: false,
        previewMode: true,
        traceEditModeActive: false,
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
        highlightedColorActive: false,
        iconPlacementActive: true,
        previewMode: true,
        traceEditModeActive: true,
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
        highlightedColorActive: false,
        iconPlacementActive: false,
        previewMode: false,
        traceEditModeActive: true,
        textPlacementActive: false,
        traceConversionPreviewActive: false,
        traceCropEditing: true,
        traceRepositionActive: true,
      }),
    ).toBe("cancel-trace-crop");
  });

  it("clears an active highlight before exiting preview mode", () => {
    expect(
      getWorkspaceEscapeAction({
        highlightedColorActive: true,
        iconPlacementActive: false,
        previewMode: true,
        traceEditModeActive: false,
        textPlacementActive: false,
        traceConversionPreviewActive: false,
        traceCropEditing: false,
        traceRepositionActive: false,
      }),
    ).toBe("clear-highlight");
  });

  it("exits image edit mode before text or preview flows", () => {
    expect(
      getWorkspaceEscapeAction({
        highlightedColorActive: false,
        iconPlacementActive: false,
        previewMode: true,
        traceEditModeActive: true,
        textPlacementActive: true,
        traceConversionPreviewActive: false,
        traceCropEditing: false,
        traceRepositionActive: false,
      }),
    ).toBe("exit-trace-edit");
  });
});
