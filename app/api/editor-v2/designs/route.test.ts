import { beforeEach, describe, expect, it, vi } from "vitest";
import { SaveSource } from "@prisma/client";
import { createNewDesignState } from "@/lib/editor-v2/editor/store/createNewDesignState";
import { serializeEditorV2Document } from "@/lib/editor-v2/persistence/designs";

const {
  getCurrentUserIdMock,
  countMock,
  findManyMock,
  createMock,
  versionCreateMock,
  versionFindManyMock,
  versionDeleteManyMock,
  transactionMock,
  deleteBlobIfExistsMock,
} = vi.hoisted(() => ({
  getCurrentUserIdMock: vi.fn(),
  countMock: vi.fn(),
  findManyMock: vi.fn(),
  createMock: vi.fn(),
  versionCreateMock: vi.fn(),
  versionFindManyMock: vi.fn(),
  versionDeleteManyMock: vi.fn(),
  transactionMock: vi.fn(),
  deleteBlobIfExistsMock: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({
  getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: transactionMock,
    editorDesign: {
      count: countMock,
      findMany: findManyMock,
      create: createMock,
    },
    editorDesignVersion: {
      create: versionCreateMock,
      findMany: versionFindManyMock,
      deleteMany: versionDeleteManyMock,
    },
  },
}));

vi.mock("@/lib/blob", () => ({
  deleteBlobIfExists: deleteBlobIfExistsMock,
  extractEditorV2TraceBlobUrls: (data: unknown) => {
    if (!data || typeof data !== "object") return [];
    const trace = (data as { trace?: Record<string, unknown> }).trace;
    if (!trace) return [];
    return [
      trace.previewUrl,
      trace.thumbnailUrl,
      trace.originalUrl,
    ].filter((value): value is string => typeof value === "string");
  },
}));

import { GET, POST } from "./route";

describe("editor-v2 design collection routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionMock.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        editorDesign: {
          create: createMock,
        },
        editorDesignVersion: {
          create: versionCreateMock,
          findMany: versionFindManyMock,
          deleteMany: versionDeleteManyMock,
        },
      }),
    );
    versionFindManyMock.mockResolvedValue([]);
  });

  it("rejects unauthenticated create requests", async () => {
    getCurrentUserIdMock.mockResolvedValue(null);

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
    getCurrentUserIdMock.mockResolvedValue("user_1");
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
        createdAt: new Date("2026-04-15T12:00:00.000Z"),
        updatedAt: new Date("2026-04-16T12:00:00.000Z"),
        data: serializeEditorV2Document(state.document),
      },
    ]);

    const response = await GET(new Request("http://localhost/api/editor-v2/designs"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(countMock).toHaveBeenCalledWith({
      where: { appUserId: "user_1" },
    });
    expect(findManyMock).toHaveBeenCalledWith({
      where: { appUserId: "user_1" },
      orderBy: { updatedAt: "desc" },
      skip: 0,
      take: 7,
      select: {
        id: true,
        title: true,
        gridWidth: true,
        gridHeight: true,
        createdAt: true,
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
          createdAt: "2026-04-15T12:00:00.000Z",
          updatedAt: "2026-04-16T12:00:00.000Z",
          updatedLabel: expect.any(String),
          colorCount: expect.any(Number),
          previewUrl: null,
          thumbnailUrl: null,
          tracePlacement: null,
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
    getCurrentUserIdMock.mockResolvedValue("user_1");
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
          createdAt: new Date(`2026-04-0${index + 1}T12:00:00.000Z`),
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
      where: { appUserId: "user_1" },
      orderBy: { updatedAt: "desc" },
      skip: 6,
      take: 7,
      select: {
        id: true,
        title: true,
        gridWidth: true,
        gridHeight: true,
        createdAt: true,
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

    getCurrentUserIdMock.mockResolvedValue("user_1");
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
        appUserId: "user_1",
        userId: "user_1",
        title: "My New Design",
        data,
        gridWidth: 4,
        gridHeight: 3,
        lastSaveSource: SaveSource.MANUAL,
        lastVersionAt: expect.any(Date),
        lastVersionHash: expect.any(String),
      },
    });
    expect(versionCreateMock).toHaveBeenCalledWith({
      data: {
        designId: "design_123",
        data,
        dataHash: expect.any(String),
        saveSource: SaveSource.MANUAL,
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

  it("creates the initial version with autosave metadata when requested", async () => {
    const state = createNewDesignState(3, 3);
    const data = serializeEditorV2Document(state.document);

    getCurrentUserIdMock.mockResolvedValue("user_1");
    createMock.mockResolvedValue({
      id: "design_234",
      title: "Untitled Design",
      gridWidth: 3,
      gridHeight: 3,
      createdAt: new Date("2026-04-16T12:00:00.000Z"),
      updatedAt: new Date("2026-04-16T12:00:00.000Z"),
    });

    const response = await POST(
      new Request("http://localhost/api/editor-v2/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, saveSource: "autosave" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(versionCreateMock).toHaveBeenCalledWith({
      data: {
        designId: "design_234",
        data,
        dataHash: expect.any(String),
        saveSource: SaveSource.AUTOSAVE,
      },
    });
  });
});
