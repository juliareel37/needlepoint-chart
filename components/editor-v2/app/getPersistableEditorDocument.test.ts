import { describe, expect, it } from "vitest";
import { createInitialEditorStoreState } from "@/lib/editor-v2/editor/store";
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
            locked: true,
          },
        },
      },
    };

    expect(getPersistableEditorDocument(state).trace).toEqual(previousTrace);
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
