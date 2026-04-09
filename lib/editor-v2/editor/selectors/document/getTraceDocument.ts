import type { EditorStoreState, TraceDocument } from "../../store/state";

export function getTraceDocument(
  state: EditorStoreState,
): TraceDocument | null {
  return state.document.trace;
}
