import { beforeEach, describe, expect, it, vi } from "vitest";
import { createNewDesignState } from "@/lib/editor-v2/editor/store/createNewDesignState";
import { serializeEditorV2Document } from "@/lib/editor-v2/persistence/designs";

const { authMock, countMock, findManyMock, createMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  countMock: vi.fn(),
  findManyMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    editorDesign: {
      count: countMock,
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
    countMock.mockResolvedValue(1);
    const state = createNewDesignState(20, 15);
    state.document.project.title = "Pattern One";
    const [firstColorId, secondColorId] = Object.keys(state.document.palette.colorsById);
    const firstColorHex = state.document.palette.colorsById[firstColorId]?.hex;
    const secondColorHex = state.document.palette.colorsById[secondColorId]?.hex;
    state.document.grid.cells[0] = firstColorId;
    state.document.grid.cells[1] = secondColorId;
    findManyMock.mockResolvedValue([
      {
        id: "design_1",
        title: "Pattern One",
        gridWidth: 20,
        gridHeight: 15,
        updatedAt: new Date("2026-04-16T12:00:00.000Z"),
        data: serializeEditorV2Document(state.document),
      },
    ]);

    const response = await GET(new Request("http://localhost/api/editor-v2/designs"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(countMock).toHaveBeenCalledWith({
      where: { userId: "user_1" },
    });
    expect(findManyMock).toHaveBeenCalledWith({
      where: { userId: "user_1" },
      orderBy: { updatedAt: "desc" },
      skip: 0,
      take: 7,
      select: {
        id: true,
        title: true,
        gridWidth: true,
        gridHeight: true,
        updatedAt: true,
        data: true,
      },
    });
    expect(body).toEqual({
      designs: [
        {
          id: "design_1",
          title: "Pattern One",
          gridWidth: 20,
          gridHeight: 15,
          updatedAt: "2026-04-16T12:00:00.000Z",
          updatedLabel: expect.any(String),
          colorCount: expect.any(Number),
          thumbnailUrl: null,
          stitchSnapshot: {
            width: 20,
            height: 15,
            cells: expect.arrayContaining([firstColorHex, secondColorHex]),
          },
        },
      ],
      totalCount: 1,
      hasMore: false,
      nextOffset: null,
    });
  });

  it("pages signed-in user designs", async () => {
    authMock.mockResolvedValue({ userId: "user_1" });
    countMock.mockResolvedValue(13);
    findManyMock.mockResolvedValue(
      Array.from({ length: 7 }, (_, index) => {
        const state = createNewDesignState(20 + index, 15 + index);
        state.document.project.title = `Pattern ${index + 1}`;

        return {
          id: `design_${index + 1}`,
          title: `Pattern ${index + 1}`,
          gridWidth: 20 + index,
          gridHeight: 15 + index,
          updatedAt: new Date(`2026-04-1${index}T12:00:00.000Z`),
          data: serializeEditorV2Document(state.document),
        };
      }),
    );

    const response = await GET(
      new Request("http://localhost/api/editor-v2/designs?limit=6&offset=6"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledWith({
      where: { userId: "user_1" },
      orderBy: { updatedAt: "desc" },
      skip: 6,
      take: 7,
      select: {
        id: true,
        title: true,
        gridWidth: true,
        gridHeight: true,
        updatedAt: true,
        data: true,
      },
    });
    expect(body.designs).toHaveLength(6);
    expect(body.totalCount).toBe(13);
    expect(body.hasMore).toBe(true);
    expect(body.nextOffset).toBe(12);
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
