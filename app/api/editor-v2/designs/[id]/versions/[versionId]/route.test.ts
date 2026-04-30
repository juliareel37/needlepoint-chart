import { beforeEach, describe, expect, it, vi } from "vitest";
import { SaveSource } from "@prisma/client";
import { createNewDesignState } from "@/lib/editor-v2/editor/store/createNewDesignState";
import { serializeEditorV2Document } from "@/lib/editor-v2/persistence/designs";

const { getCurrentUserIdMock, designFindFirstMock, versionFindFirstMock } = vi.hoisted(() => ({
  getCurrentUserIdMock: vi.fn(),
  designFindFirstMock: vi.fn(),
  versionFindFirstMock: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({
  getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    editorDesign: {
      findFirst: designFindFirstMock,
    },
    editorDesignVersion: {
      findFirst: versionFindFirstMock,
    },
  },
}));

import { GET } from "./route";

describe("editor-v2 individual version routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects cross-user version access", async () => {
    getCurrentUserIdMock.mockResolvedValue("user_1");
    designFindFirstMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), {
      params: { id: "design_123", versionId: "version_1" },
    });

    expect(response.status).toBe(404);
  });

  it("loads a specific saved version", async () => {
    const data = serializeEditorV2Document(createNewDesignState(2, 2).document);

    getCurrentUserIdMock.mockResolvedValue("user_1");
    designFindFirstMock.mockResolvedValue({
      id: "design_123",
      createdAt: new Date("2026-04-16T10:00:00.000Z"),
    });
    versionFindFirstMock.mockResolvedValue({
      id: "version_1",
      data,
      createdAt: new Date("2026-04-16T10:30:00.000Z"),
      saveSource: SaveSource.AUTOSAVE,
    });

    const response = await GET(new Request("http://localhost"), {
      params: { id: "design_123", versionId: "version_1" },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      id: "version_1",
      versionId: "version_1",
      designId: "design_123",
      createdAt: "2026-04-16T10:30:00.000Z",
      saveSource: SaveSource.AUTOSAVE,
      data,
      designCreatedAt: "2026-04-16T10:00:00.000Z",
    });
  });
});
