import { beforeEach, describe, expect, it, vi } from "vitest";
import { SaveSource } from "@prisma/client";
import { createNewDesignState } from "@/lib/editor-v2/editor/store/createNewDesignState";
import { serializeEditorV2Document } from "@/lib/editor-v2/persistence/designs";

const {
  authMock,
  findFirstMock,
  updateMock,
  deleteMock,
  versionCreateMock,
  versionFindManyMock,
  versionDeleteManyMock,
  transactionMock,
  deleteBlobIfExistsMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  findFirstMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
  versionCreateMock: vi.fn(),
  versionFindManyMock: vi.fn(),
  versionDeleteManyMock: vi.fn(),
  transactionMock: vi.fn(),
  deleteBlobIfExistsMock: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: transactionMock,
    editorDesign: {
      findFirst: findFirstMock,
      update: updateMock,
      delete: deleteMock,
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

import { DELETE, GET, PUT } from "./route";

describe("editor-v2 individual design routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionMock.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        editorDesign: {
          update: updateMock,
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
    findFirstMock.mockResolvedValue({
      id: "design_123",
      data: { trace: null },
      updatedAt: new Date("2026-04-16T12:10:00.000Z"),
      lastVersionAt: null,
      lastVersionHash: null,
    });
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
      title: "Untitled Design",
      gridWidth: 5,
      gridHeight: 6,
      createdAt: "2026-04-16T12:00:00.000Z",
      updatedAt: "2026-04-16T12:10:00.000Z",
      versionToken: "2026-04-16T12:10:00.000Z",
    });
  });

  it("creates a version snapshot when forceVersion is requested in autosave mode", async () => {
    const data = serializeEditorV2Document(createNewDesignState(5, 6).document);

    authMock.mockResolvedValue({ userId: "user_1" });
    findFirstMock.mockResolvedValue({
      id: "design_123",
      data: { trace: null },
      updatedAt: new Date("2026-04-16T12:10:00.000Z"),
      lastVersionAt: new Date("2026-04-16T12:09:00.000Z"),
      lastVersionHash: "older_hash",
    });
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
        body: JSON.stringify({
          data,
          forceVersion: true,
          saveSource: "autosave",
        }),
      }),
      { params: { id: "design_123" } },
    );

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "design_123" },
      data: {
        title: "Untitled Design",
        data,
        gridWidth: 5,
        gridHeight: 6,
        lastSaveSource: SaveSource.AUTOSAVE,
        lastVersionAt: expect.any(Date),
        lastVersionHash: expect.any(String),
      },
    });
    expect(versionCreateMock).toHaveBeenCalledWith({
      data: {
        designId: "design_123",
        data,
        dataHash: expect.any(String),
        saveSource: SaveSource.AUTOSAVE,
      },
    });
  });

  it("rejects stale baseVersion updates", async () => {
    const data = serializeEditorV2Document(createNewDesignState(5, 6).document);

    authMock.mockResolvedValue({ userId: "user_1" });
    findFirstMock.mockResolvedValue({
      id: "design_123",
      data: { trace: null },
      updatedAt: new Date("2026-04-16T12:10:00.000Z"),
      lastVersionAt: null,
      lastVersionHash: null,
    });

    const response = await PUT(
      new Request("http://localhost", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data,
          baseVersion: "2026-04-16T12:00:00.000Z",
        }),
      }),
      { params: { id: "design_123" } },
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(updateMock).not.toHaveBeenCalled();
    expect(body).toEqual({
      error: "This design changed on the server before your save completed.",
      versionToken: "2026-04-16T12:10:00.000Z",
    });
  });

  it("cleans up replaced trace blobs after saving", async () => {
    const state = createNewDesignState(2, 2);
    state.document.trace = {
      previewUrl: "https://blob.example.com/new-preview.webp",
      thumbnailUrl: "https://blob.example.com/new-thumbnail.webp",
      originalUrl: "https://blob.example.com/new-original.png",
      fileName: "trace.png",
      byteSize: 123,
      mimeType: "image/png",
      imageWidth: 200,
      imageHeight: 100,
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      rotation: 0,
      visible: true,
      blendMode: "image",
      opacity: 0.35,
      locked: true,
    };
    const data = serializeEditorV2Document(state.document);

    authMock.mockResolvedValue({ userId: "user_1" });
    findFirstMock.mockResolvedValue({
      id: "design_123",
      data: {
        trace: {
          previewUrl: "https://blob.example.com/old-preview.webp",
          thumbnailUrl: "https://blob.example.com/old-thumbnail.webp",
          originalUrl: "https://blob.example.com/old-original.png",
        },
      },
      updatedAt: new Date("2026-04-16T12:10:00.000Z"),
      lastVersionAt: null,
      lastVersionHash: null,
    });
    updateMock.mockResolvedValue({
      id: "design_123",
      title: "Untitled Design",
      gridWidth: 2,
      gridHeight: 2,
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

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      id: "design_123",
      title: "Untitled Design",
      gridWidth: 2,
      gridHeight: 2,
      createdAt: "2026-04-16T12:00:00.000Z",
      updatedAt: "2026-04-16T12:10:00.000Z",
      versionToken: "2026-04-16T12:10:00.000Z",
    });
    expect(deleteBlobIfExistsMock).toHaveBeenCalledTimes(3);
    expect(deleteBlobIfExistsMock).toHaveBeenCalledWith("https://blob.example.com/old-preview.webp");
    expect(deleteBlobIfExistsMock).toHaveBeenCalledWith("https://blob.example.com/old-thumbnail.webp");
    expect(deleteBlobIfExistsMock).toHaveBeenCalledWith("https://blob.example.com/old-original.png");
  });

  it("skips creating a duplicate version when autosave content is unchanged", async () => {
    const document = createNewDesignState(2, 2).document;
    const data = serializeEditorV2Document(document);

    authMock.mockResolvedValue({ userId: "user_1" });
    findFirstMock.mockResolvedValue({
      id: "design_123",
      data: { trace: null },
      updatedAt: new Date("2026-04-16T12:10:00.000Z"),
      lastVersionAt: new Date("2026-04-16T12:07:00.000Z"),
      lastVersionHash: "same_hash",
    });
    updateMock.mockResolvedValue({
      id: "design_123",
      title: "Untitled Design",
      gridWidth: 2,
      gridHeight: 2,
      createdAt: new Date("2026-04-16T12:00:00.000Z"),
      updatedAt: new Date("2026-04-16T12:10:00.000Z"),
    });

    const routeModule = await import("./route");
    const hash = (await import("@/lib/editor-v2/server/versioning")).hashPersistedEditorV2Design(data);
    findFirstMock.mockResolvedValueOnce({
      id: "design_123",
      data: { trace: null },
      updatedAt: new Date("2026-04-16T12:10:00.000Z"),
      lastVersionAt: new Date("2026-04-16T12:07:00.000Z"),
      lastVersionHash: hash,
    });

    const response = await routeModule.PUT(
      new Request("http://localhost", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, saveSource: "autosave" }),
      }),
      { params: { id: "design_123" } },
    );

    expect(response.status).toBe(200);
    expect(versionCreateMock).not.toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "design_123" },
      data: {
        title: "Untitled Design",
        data,
        gridWidth: 2,
        gridHeight: 2,
        lastSaveSource: SaveSource.AUTOSAVE,
      },
    });
  });

  it("prunes the oldest retained version when the cap is exceeded", async () => {
    const data = serializeEditorV2Document(createNewDesignState(5, 6).document);

    authMock.mockResolvedValue({ userId: "user_1" });
    findFirstMock.mockResolvedValue({
      id: "design_123",
      data: { trace: null },
      updatedAt: new Date("2026-04-16T12:10:00.000Z"),
      lastVersionAt: null,
      lastVersionHash: null,
    });
    updateMock.mockResolvedValue({
      id: "design_123",
      title: "Untitled Design",
      gridWidth: 5,
      gridHeight: 6,
      createdAt: new Date("2026-04-16T12:00:00.000Z"),
      updatedAt: new Date("2026-04-16T12:10:00.000Z"),
    });
    versionFindManyMock
      .mockResolvedValueOnce([
        {
          id: "old_version",
          data: { trace: null },
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const response = await PUT(
      new Request("http://localhost", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      }),
      { params: { id: "design_123" } },
    );

    expect(response.status).toBe(200);
    expect(versionDeleteManyMock).toHaveBeenCalledWith({
      where: {
        id: {
          in: ["old_version"],
        },
      },
    });
  });

  it("collects live and version blobs when deleting a design", async () => {
    authMock.mockResolvedValue({ userId: "user_1" });
    findFirstMock.mockResolvedValue({
      id: "design_123",
      data: {
        trace: {
          previewUrl: "https://blob.example.com/live-preview.webp",
          thumbnailUrl: "https://blob.example.com/live-thumbnail.webp",
          originalUrl: "https://blob.example.com/live-original.png",
        },
      },
      versions: [
        {
          data: {
            trace: {
              previewUrl: "https://blob.example.com/version-preview.webp",
              thumbnailUrl: "https://blob.example.com/version-thumbnail.webp",
              originalUrl: "https://blob.example.com/version-original.png",
            },
          },
        },
      ],
    });

    const response = await DELETE(new Request("http://localhost"), {
      params: { id: "design_123" },
    });

    expect(response.status).toBe(200);
    expect(deleteMock).toHaveBeenCalledWith({
      where: { id: "design_123" },
    });
    expect(deleteBlobIfExistsMock).toHaveBeenCalledWith(
      "https://blob.example.com/version-original.png",
    );
  });
});
