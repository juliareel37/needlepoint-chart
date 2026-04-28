import { beforeEach, describe, expect, it, vi } from "vitest";
import { createNewDesignState } from "@/lib/editor-v2/editor/store/createNewDesignState";
import { serializeEditorV2Document } from "@/lib/editor-v2/persistence/designs";

const { authMock, findManyMock, createMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  findManyMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    editorDesign: {
      findMany: findManyMock,
      create: createMock,
    },
  },
}));

import { GET, POST } from "./route";

describe("editor-v2 design collection routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated create requests", async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await POST(
      new Request("http://localhost/api/editor-v2/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: {} }),
      }),
    );

    expect(response.status).toBe(401);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("lists signed-in user designs", async () => {
    authMock.mockResolvedValue({ userId: "user_1" });
    findManyMock.mockResolvedValue([
      {
        id: "design_1",
        title: "Pattern One",
        gridWidth: 20,
        gridHeight: 15,
        updatedAt: new Date("2026-04-16T12:00:00.000Z"),
      },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      designs: [
        {
          id: "design_1",
          title: "Pattern One",
          gridWidth: 20,
          gridHeight: 15,
          updatedAt: "2026-04-16T12:00:00.000Z",
        },
      ],
    });
  });

  it("creates a profile-owned design from a persisted payload", async () => {
    const state = createNewDesignState(4, 3);
    state.document.project.title = "My New Design";
    const data = serializeEditorV2Document(state.document);

    authMock.mockResolvedValue({ userId: "user_1" });
    createMock.mockResolvedValue({
      id: "design_123",
      title: "My New Design",
      gridWidth: 4,
      gridHeight: 3,
      createdAt: new Date("2026-04-16T12:00:00.000Z"),
      updatedAt: new Date("2026-04-16T12:00:00.000Z"),
    });

    const response = await POST(
      new Request("http://localhost/api/editor-v2/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(createMock).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        title: "My New Design",
        data,
        gridWidth: 4,
        gridHeight: 3,
      },
    });
    expect(body).toEqual({
      ok: true,
      id: "design_123",
      title: "My New Design",
      gridWidth: 4,
      gridHeight: 3,
      createdAt: "2026-04-16T12:00:00.000Z",
      updatedAt: "2026-04-16T12:00:00.000Z",
      versionToken: "2026-04-16T12:00:00.000Z",
    });
  });
});
