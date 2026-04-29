import { describe, expect, it } from "vitest";
import { createNewDesignState } from "@/lib/editor-v2/editor/store/createNewDesignState";
import type { DocumentPatch } from "@/lib/editor-v2/editor/store";
import {
  computeSerializedDocumentHash,
  createAutosaveSnapshotRecord,
  getDirtyChunksFromPatches,
  shouldRecoverLocalSnapshot,
} from "./editorV2AutosavePersistence";

describe("editor v2 autosave persistence helpers", () => {
  it("marks only the affected grid chunks for cell replacement patches", () => {
    const patches: DocumentPatch[] = [
      {
        type: "grid.replaceCells",
        cells: [
          { index: 0, value: "dmc:310" },
          { index: 33, value: "dmc:321" },
          { index: 1024, value: "dmc:666" },
        ],
      },
    ];

    expect(Array.from(getDirtyChunksFromPatches(patches, 64)).sort()).toEqual([
      "grid:0:0",
      "grid:1:0",
    ]);
  });

  it("produces a stable serialized hash for the same document", () => {
    const state = createNewDesignState(2, 2);
    state.document.grid.cells = ["dmc:310", null, null, "dmc:321"];

    const first = computeSerializedDocumentHash(state.document);
    const second = computeSerializedDocumentHash(state.document);

    expect(first.serialized).toBe(second.serialized);
    expect(first.hash).toBe(second.hash);
  });

  it("recovers local snapshots only when unsynced work exists on the current server base version", () => {
    const document = createNewDesignState(4, 4).document;
    const eligible = createAutosaveSnapshotRecord({
      key: "design_1",
      storageId: "design_1",
      document,
      latestLocalSequenceId: 4,
      latestSyncAppliedSequenceId: 2,
      latestSyncRequestedSequenceId: 4,
      baseServerVersion: "2026-04-16T12:00:00.000Z",
      lastKnownServerVersion: "2026-04-16T12:00:00.000Z",
    });
    const advancedServer = createAutosaveSnapshotRecord({
      key: "design_1",
      storageId: "design_1",
      document,
      latestLocalSequenceId: 4,
      latestSyncAppliedSequenceId: 2,
      latestSyncRequestedSequenceId: 4,
      baseServerVersion: "2026-04-16T12:00:00.000Z",
      lastKnownServerVersion: "2026-04-16T12:00:00.000Z",
    });
    const syncedSnapshot = createAutosaveSnapshotRecord({
      key: "design_1",
      storageId: "design_1",
      document,
      latestLocalSequenceId: 2,
      latestSyncAppliedSequenceId: 2,
      latestSyncRequestedSequenceId: 2,
      baseServerVersion: "2026-04-16T12:00:00.000Z",
      lastKnownServerVersion: "2026-04-16T12:00:00.000Z",
    });

    expect(
      shouldRecoverLocalSnapshot({
        localSnapshot: eligible,
        currentServerVersion: "2026-04-16T12:00:00.000Z",
      }),
    ).toBe(true);
    expect(
      shouldRecoverLocalSnapshot({
        localSnapshot: advancedServer,
        currentServerVersion: "2026-04-16T12:10:00.000Z",
      }),
    ).toBe(false);
    expect(
      shouldRecoverLocalSnapshot({
        localSnapshot: syncedSnapshot,
        currentServerVersion: "2026-04-16T12:00:00.000Z",
      }),
    ).toBe(false);
  });
});
