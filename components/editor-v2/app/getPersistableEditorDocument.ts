import type {
  EditorDocumentState,
  EditorStoreState,
  TraceDocument,
} from "@/lib/editor-v2/editor/store";
import { applyDocumentPatches } from "@/lib/editor-v2/editor/store";

export function getPersistableEditorDocument(
  state: EditorStoreState,
): EditorDocumentState {
  const { document, session } = state;
  const { conversionPreview, repositionOrigin, repositionSnapshot, replacedTrace } =
    session.traceInteraction;
  const baseDocument = conversionPreview
    ? applyDocumentPatches(document, conversionPreview.inversePatches)
    : document;

  if (!repositionOrigin) {
    return baseDocument;
  }

  if (repositionOrigin === "upload") {
    if (baseDocument.trace === null) {
      return baseDocument;
    }

    return {
      ...baseDocument,
      trace: null,
    };
  }

  if (repositionOrigin === "replace") {
    return {
      ...baseDocument,
      trace: replacedTrace,
    };
  }

  if (!baseDocument.trace || !repositionSnapshot) {
    return baseDocument;
  }

  return {
    ...baseDocument,
    trace: applyTraceSnapshot(baseDocument.trace, repositionSnapshot),
  };
}

function applyTraceSnapshot(
  trace: TraceDocument,
  snapshot: NonNullable<
    EditorStoreState["session"]["traceInteraction"]["repositionSnapshot"]
  >,
): TraceDocument {
  return {
    ...trace,
    offsetX: snapshot.offsetX,
    offsetY: snapshot.offsetY,
    scale: snapshot.scale,
    rotation: snapshot.rotation,
    locked: snapshot.locked,
  };
}
