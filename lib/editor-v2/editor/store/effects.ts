import type { EditorDocumentState } from "./state";

export type EditorEffect =
  | SaveDraftEffect
  | LoadDraftEffect
  | RestoreVersionEffect
  | UploadTraceEffect;

export interface SaveDraftEffect {
  type: "effect.saveDraft";
  request: SaveDraftRequest;
}

export interface LoadDraftEffect {
  type: "effect.loadDraft";
  draftId: string;
}

export interface RestoreVersionEffect {
  type: "effect.restoreVersion";
  draftId: string;
  versionId: string;
}

export interface UploadTraceEffect {
  type: "effect.uploadTrace";
  fileRefId: string;
}

export interface SaveDraftRequest {
  draftId: string | null;
  document: EditorDocumentState;
  reason: "manual" | "autosave";
}

export interface EditorEffectRunner {
  run(effect: EditorEffect): Promise<void>;
}

export class NoopEditorEffectRunner implements EditorEffectRunner {
  async run(_effect: EditorEffect): Promise<void> {}
}
