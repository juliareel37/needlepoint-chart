import type {
  EditorDocumentState,
  EditorStoreState,
  TraceDocument,
} from "@/lib/editor-v2/editor/store";

export function getPersistableEditorDocument(
  state: EditorStoreState,
): EditorDocumentState {
  const { document, session } = state;
  const { repositionOrigin, repositionSnapshot, replacedTrace } =
    session.traceInteraction;

  if (!repositionOrigin) {
    return document;
  }

  if (repositionOrigin === "upload") {
    if (document.trace === null) {
      return document;
    }

    return {
      ...document,
      trace: null,
    };
  }

  if (repositionOrigin === "replace") {
    return {
      ...document,
      trace: replacedTrace,
    };
  }

  if (!document.trace || !repositionSnapshot) {
    return document;
  }

  return {
    ...document,
    trace: applyTraceSnapshot(document.trace, repositionSnapshot),
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
