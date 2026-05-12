import { describe, expect, it } from "vitest";
import { createInitialEditorStoreState } from "@/lib/editor-v2/editor/store";
import type { DocumentPatch } from "@/lib/editor-v2/editor/store";
import type { EditorStoreState, TraceDocument } from "@/lib/editor-v2/editor/store";
import { getPersistableEditorDocument } from "./getPersistableEditorDocument";

describe("getPersistableEditorDocument", () => {
  it("restores the committed trace transform while reposition is active", () => {
    const baseState = createStateWithTrace();

    const state: EditorStoreState = {
      ...baseState,
      document: {
        ...baseState.document,
        trace: {
          ...baseState.document.trace!,
          offsetX: 18,
          offsetY: 22,
          scale: 1.75,
          rotation: 30,
          locked: false,
          opacity: 0.6,
        },
      },
      session: {
        ...baseState.session,
        traceInteraction: {
          ...baseState.session.traceInteraction,
          repositionOrigin: "panel",
          repositionSnapshot: {
            offsetX: 2,
            offsetY: 4,
            scale: 1.1,
            rotation: 8,
            cropX: 0,
            cropY: 0,
            cropWidth: 640,
            cropHeight: 480,
            locked: true,
          },
        },
      },
    };

    expect(getPersistableEditorDocument(state)).toEqual({
      ...state.document,
      trace: {
        ...state.document.trace!,
        offsetX: 2,
        offsetY: 4,
        scale: 1.1,
        rotation: 8,
        locked: true,
      },
    });
  });

  it("hides a newly uploaded trace until placement is committed", () => {
    const baseState = createInitialEditorStoreState();
    const uploadedTrace = createTrace();

    const state: EditorStoreState = {
      ...baseState,
      document: {
        ...baseState.document,
        trace: uploadedTrace,
      },
      session: {
        ...baseState.session,
        traceInteraction: {
          ...baseState.session.traceInteraction,
          repositionOrigin: "upload",
          repositionSnapshot: {
            offsetX: 0,
            offsetY: 0,
            scale: 1,
            rotation: 0,
            cropX: 0,
            cropY: 0,
            cropWidth: 640,
            cropHeight: 480,
            locked: true,
          },
        },
      },
    };

    expect(getPersistableEditorDocument(state).trace).toBeNull();
  });

  it("keeps the previous trace while a replacement is still uncommitted", () => {
    const baseState = createStateWithTrace();
    const previousTrace = baseState.document.trace!;
    const replacementTrace: TraceDocument = {
      ...previousTrace,
      previewUrl: "https://example.com/replacement.png",
      originalUrl: "https://example.com/replacement-full.png",
      thumbnailUrl: "https://example.com/replacement-thumb.png",
    };

    const state: EditorStoreState = {
      ...baseState,
      document: {
        ...baseState.document,
        trace: replacementTrace,
      },
      session: {
        ...baseState.session,
        traceInteraction: {
          ...baseState.session.traceInteraction,
          repositionOrigin: "replace",
          replacedTrace: previousTrace,
          repositionSnapshot: {
            offsetX: previousTrace.offsetX,
            offsetY: previousTrace.offsetY,
            scale: previousTrace.scale,
            rotation: previousTrace.rotation,
            cropX: previousTrace.cropX,
            cropY: previousTrace.cropY,
            cropWidth: previousTrace.cropWidth,
            cropHeight: previousTrace.cropHeight,
            locked: true,
          },
        },
      },
    };

    expect(getPersistableEditorDocument(state).trace).toEqual(previousTrace);
  });

  it("restores the committed grid while a trace conversion preview is active", () => {
    const baseState = createInitialEditorStoreState();
    const inversePatches: DocumentPatch[] = [
      {
        type: "grid.replaceCells",
        cells: [{ index: 0, value: "dmc-310" }],
      },
      {
        type: "palette.setExtractedColorIds",
        colorIds: ["dmc-310", "dmc-666"],
      },
    ];
    const state: EditorStoreState = {
      ...baseState,
      document: {
        ...baseState.document,
        grid: {
          ...baseState.document.grid,
          width: 2,
          height: 2,
          cells: ["dmc-321", null, "dmc-666", null],
        },
        palette: {
          ...baseState.document.palette,
          extractedPaletteIds: ["dmc-321", "dmc-666"],
        },
      },
      session: {
        ...baseState.session,
        traceInteraction: {
          ...baseState.session.traceInteraction,
          conversionPreview: {
            forwardPatches: [],
            inversePatches,
            previousActiveColorId: "dmc-310",
            previewActiveColorId: "dmc-321",
          },
        },
      },
    };

    expect(getPersistableEditorDocument(state).grid.cells).toEqual([
      "dmc-310",
      null,
      "dmc-666",
      null,
    ]);
    expect(getPersistableEditorDocument(state).palette.extractedPaletteIds).toEqual([
      "dmc-310",
      "dmc-666",
    ]);
  });
});

function createStateWithTrace(): EditorStoreState {
  const state = createInitialEditorStoreState();

  return {
    ...state,
    document: {
      ...state.document,
      trace: createTrace(),
    },
  };
}

function createTrace(): TraceDocument {
  return {
    previewUrl: "https://example.com/trace.png",
    thumbnailUrl: "https://example.com/trace-thumb.png",
    originalUrl: "https://example.com/trace-full.png",
    maskUrl: null,
    fileName: "trace.png",
    byteSize: 1024,
    mimeType: "image/png",
    imageWidth: 640,
    imageHeight: 480,
    cropX: 0,
    cropY: 0,
    cropWidth: 640,
    cropHeight: 480,
    blendMode: "image",
    opacity: 0.35,
    offsetX: 2,
    offsetY: 4,
    scale: 1.1,
    rotation: 8,
    locked: true,
    visible: true,
  };
}
