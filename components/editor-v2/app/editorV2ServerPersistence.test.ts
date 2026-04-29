import { afterEach, describe, expect, it, vi } from "vitest";
import { createNewDesignState } from "@/lib/editor-v2/editor/store/createNewDesignState";
import {
  restoreEditorV2DesignVersion,
  saveEditorV2Document,
} from "./editorV2ServerPersistence";
import { serializeEditorV2Document } from "@/lib/editor-v2/persistence/designs";

describe("editorV2ServerPersistence", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends autosave as the save source", async () => {
    const document = createNewDesignState(3, 3).document;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "design_123",
        title: "Untitled Design",
        gridWidth: 3,
        gridHeight: 3,
        createdAt: "2026-04-16T12:00:00.000Z",
        updatedAt: "2026-04-16T12:00:00.000Z",
        versionToken: "2026-04-16T12:00:00.000Z",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await saveEditorV2Document(document, "design_123", "2026-04-16T11:00:00.000Z", "autosave");

    expect(fetchMock).toHaveBeenCalledWith("/api/editor-v2/designs/design_123", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        data: serializeEditorV2Document(document),
        baseVersion: "2026-04-16T11:00:00.000Z",
        saveSource: "autosave",
      }),
    });
  });

  it("defaults manual save source for explicit saves", async () => {
    const document = createNewDesignState(2, 2).document;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "design_123",
        title: "Untitled Design",
        gridWidth: 2,
        gridHeight: 2,
        createdAt: "2026-04-16T12:00:00.000Z",
        updatedAt: "2026-04-16T12:00:00.000Z",
        versionToken: "2026-04-16T12:00:00.000Z",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await saveEditorV2Document(document);

    expect(fetchMock).toHaveBeenCalledWith("/api/editor-v2/designs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        data: serializeEditorV2Document(document),
        baseVersion: null,
        saveSource: "manual",
      }),
    });
  });

  it("hydrates restored versions back into editor documents", async () => {
    const document = createNewDesignState(4, 4).document;
    const data = serializeEditorV2Document(document);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        storageId: "design_123",
        title: "Untitled Design",
        gridWidth: 4,
        gridHeight: 4,
        updatedAt: "2026-04-16T12:10:00.000Z",
        versionToken: "2026-04-16T12:10:00.000Z",
        restoredVersionId: "version_7",
        data,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const restored = await restoreEditorV2DesignVersion("design_123", "version_7");

    expect(restored.storageId).toBe("design_123");
    expect(restored.document.project.id).toBe("design_123");
    expect(restored.document.metadata.persistedVersionId).toBe("version_7");
    expect(restored.document.grid.width).toBe(4);
  });
});
