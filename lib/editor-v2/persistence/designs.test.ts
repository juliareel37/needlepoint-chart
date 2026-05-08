import { describe, expect, it } from "vitest";
import { createNewDesignState } from "@/lib/editor-v2/editor/store/createNewDesignState";
import {
  hydrateEditorV2Document,
  serializeEditorV2Document,
} from "./designs";

describe("editor-v2 persisted designs", () => {
  it("serializes durable canvas state without transient trace fields", () => {
    const state = createNewDesignState(2, 2);
    state.document.project.title = "Summer Flowers";
    state.document.grid.cells = ["dmc:310", null, "dmc:321", null];
    state.document.palette.customPalettesById = {
      custom_1: {
        id: "custom_1",
        name: "Favorites",
        colorIds: ["custom:red"],
      },
    };
    state.document.palette.colorsById["custom:red"] = {
      id: "custom:red",
      brand: "custom",
      code: "R1",
      name: "Cherry",
      hex: "#aa0000",
    };
    state.document.palette.extractedPaletteIds = ["dmc:310", "custom:red"];
    state.document.palette.symbolAssignments = {
      "dmc:310": "!",
      "custom:red": "@",
    };
    state.document.canvasPreferences = {
      showGridlines: false,
      showRuler: false,
      showSymbols: true,
      touchSnappingEnabled: false,
    };
    state.document.trace = {
      previewUrl: "https://blob.example.com/trace-preview.webp",
      thumbnailUrl: "https://blob.example.com/trace-thumb.webp",
      originalUrl: "https://blob.example.com/trace.png",
      fileName: "trace.png",
      byteSize: 12345,
      mimeType: "image/png",
      imageWidth: 900,
      imageHeight: 700,
      cropX: 120,
      cropY: 40,
      cropWidth: 600,
      cropHeight: 500,
      offsetX: 4,
      offsetY: 8,
      scale: 1.5,
      rotation: 12,
      visible: false,
      blendMode: "crossfade",
      opacity: 0.8,
      locked: false,
    };

    const persisted = serializeEditorV2Document(state.document);

    expect(persisted.grid).toEqual({
      width: 2,
      height: 2,
      sizingMode: "stitches",
      meshCount: null,
      widthInches: null,
      heightInches: null,
      cells: ["dmc:310", null, "dmc:321", null],
    });
    expect(persisted.palette.customPalettesById).toEqual({
      custom_1: {
        id: "custom_1",
        name: "Favorites",
        colorIds: ["custom:red"],
      },
    });
    expect(persisted.canvasPreferences).toEqual({
      showGridlines: false,
      showRuler: false,
      showSymbols: true,
      touchSnappingEnabled: false,
    });
    expect(persisted.trace).toEqual({
      previewUrl: "https://blob.example.com/trace-preview.webp",
      thumbnailUrl: "https://blob.example.com/trace-thumb.webp",
      originalUrl: "https://blob.example.com/trace.png",
      fileName: "trace.png",
      byteSize: 12345,
      mimeType: "image/png",
      imageWidth: 900,
      imageHeight: 700,
      cropX: 120,
      cropY: 40,
      cropWidth: 600,
      cropHeight: 500,
      offsetX: 4,
      offsetY: 8,
      scale: 1.5,
      rotation: 12,
    });
    expect(persisted.trace).not.toHaveProperty("visible");
    expect(persisted.trace).not.toHaveProperty("blendMode");
    expect(persisted.trace).not.toHaveProperty("opacity");
    expect(persisted.trace).not.toHaveProperty("locked");
  });

  it("hydrates persisted designs with runtime trace defaults and server metadata", () => {
    const hydrated = hydrateEditorV2Document({
      id: "design_123",
      createdAt: "2026-04-16T12:00:00.000Z",
      updatedAt: "2026-04-16T12:15:00.000Z",
      data: {
        schemaVersion: 1,
        project: {
          title: "Hydrated Design",
        },
        grid: {
          width: 3,
          height: 2,
          sizingMode: "stitches",
          meshCount: null,
          widthInches: null,
          heightInches: null,
          cells: ["dmc:310", null, "dmc:321", null, null, null],
        },
        palette: {
          colorsById: {
            "dmc:310": {
              id: "dmc:310",
              brand: "dmc",
              code: "310",
              name: "Black",
              hex: "#000000",
            },
          },
          customPalettesById: {},
          extractedPaletteIds: ["dmc:310"],
          symbolAssignments: {
            "dmc:310": "!",
          },
        },
        trace: {
          previewUrl: "https://blob.example.com/trace-preview.webp",
          thumbnailUrl: "https://blob.example.com/trace-thumb.webp",
          originalUrl: "https://blob.example.com/trace.png",
          fileName: "trace.png",
          byteSize: 12345,
          mimeType: "image/png",
          imageWidth: 900,
          imageHeight: 700,
          cropX: 120,
          cropY: 40,
          cropWidth: 600,
          cropHeight: 500,
          offsetX: 4,
          offsetY: 8,
          scale: 1.5,
          rotation: 12,
        },
        text: {
          mode: "destructive-grid",
          entities: [],
        },
      },
    });

    expect(hydrated.project.id).toBe("design_123");
    expect(hydrated.project.createdAt).toBe("2026-04-16T12:00:00.000Z");
    expect(hydrated.project.updatedAt).toBe("2026-04-16T12:15:00.000Z");
    expect(hydrated.canvasPreferences).toEqual({
      showGridlines: true,
      showRuler: true,
      showSymbols: true,
      touchSnappingEnabled: true,
    });
    expect(hydrated.trace).toMatchObject({
      previewUrl: "https://blob.example.com/trace-preview.webp",
      thumbnailUrl: "https://blob.example.com/trace-thumb.webp",
      originalUrl: "https://blob.example.com/trace.png",
      fileName: "trace.png",
      byteSize: 12345,
      mimeType: "image/png",
      imageWidth: 900,
      imageHeight: 700,
      cropX: 120,
      cropY: 40,
      cropWidth: 600,
      cropHeight: 500,
      offsetX: 4,
      offsetY: 8,
      scale: 1.5,
      rotation: 12,
      visible: true,
      blendMode: "image",
      opacity: 0.35,
      locked: true,
    });
  });

  it("hydrates legacy persisted traces that only stored assetUrl", () => {
    const hydrated = hydrateEditorV2Document({
      id: "design_legacy",
      createdAt: "2026-04-16T12:00:00.000Z",
      updatedAt: "2026-04-16T12:15:00.000Z",
      data: {
        schemaVersion: 1,
        project: {
          title: "Legacy Design",
        },
        grid: {
          width: 1,
          height: 1,
          sizingMode: "stitches",
          meshCount: null,
          widthInches: null,
          heightInches: null,
          cells: [null],
        },
        palette: {
          colorsById: {},
          customPalettesById: {},
          extractedPaletteIds: [],
          symbolAssignments: {},
        },
        canvasPreferences: {
          showGridlines: false,
          showRuler: true,
          showSymbols: false,
          touchSnappingEnabled: true,
        },
        trace: {
          assetUrl: "https://blob.example.com/legacy.png",
          fileName: "legacy.png",
          byteSize: 500,
          mimeType: "image/png",
          imageWidth: 400,
          imageHeight: 300,
          offsetX: 0,
          offsetY: 0,
          scale: 1,
          rotation: 0,
        } as never,
        text: {
          mode: "destructive-grid",
          entities: [],
        },
      },
    });

    expect(hydrated.canvasPreferences).toEqual({
      showGridlines: false,
      showRuler: true,
      showSymbols: false,
      touchSnappingEnabled: true,
    });
    expect(hydrated.trace).toMatchObject({
      previewUrl: "https://blob.example.com/legacy.png",
      thumbnailUrl: "https://blob.example.com/legacy.png",
      originalUrl: "https://blob.example.com/legacy.png",
      cropX: 0,
      cropY: 0,
      cropWidth: 400,
      cropHeight: 300,
    });
  });
});
