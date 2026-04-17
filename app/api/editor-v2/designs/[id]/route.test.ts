import { beforeEach, describe, expect, it, vi } from "vitest";
import { createNewDesignState } from "@/lib/editor-v2/editor/store/createNewDesignState";
import { serializeEditorV2Document } from "@/lib/editor-v2/persistence/designs";

const { authMock, findFirstMock, updateMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  findFirstMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    editorDesign: {
      findFirst: findFirstMock,
      update: updateMock,
    },
  },
}));

import { GET, PUT } from "./route";

describe("editor-v2 individual design routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 for cross-user GET access", async () => {
    authMock.mockResolvedValue({ userId: "user_1" });
    findFirstMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), {
      params: { id: "design_123" },
    });

    expect(response.status).toBe(404);
  });

  it("returns 404 for cross-user PUT access", async () => {
    authMock.mockResolvedValue({ userId: "user_1" });
    findFirstMock.mockResolvedValue(null);

    const response = await PUT(
      new Request("http://localhost", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: serializeEditorV2Document(createNewDesignState(2, 2).document) }),
      }),
      { params: { id: "design_123" } },
    );

    expect(response.status).toBe(404);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("updates a saved design for the owning user", async () => {
    const data = serializeEditorV2Document(createNewDesignState(5, 6).document);

    authMock.mockResolvedValue({ userId: "user_1" });
    findFirstMock.mockResolvedValue({ id: "design_123" });
    updateMock.mockResolvedValue({
      id: "design_123",
      title: "Untitled Design",
      gridWidth: 5,
      gridHeight: 6,
      createdAt: new Date("2026-04-16T12:00:00.000Z"),
      updatedAt: new Date("2026-04-16T12:10:00.000Z"),
    });

    const response = await PUT(
      new Request("http://localhost", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      }),
      { params: { id: "design_123" } },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "design_123" },
      data: {
        title: "Untitled Design",
        data,
        gridWidth: 5,
        gridHeight: 6,
      },
    });
    expect(body).toEqual({
      ok: true,
      id: "design_123",
      title: "Untitled Design",
      gridWidth: 5,
      gridHeight: 6,
      createdAt: "2026-04-16T12:00:00.000Z",
      updatedAt: "2026-04-16T12:10:00.000Z",
    });
  });
});
