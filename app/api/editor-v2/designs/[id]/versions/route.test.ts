import { beforeEach, describe, expect, it, vi } from "vitest";
import { SaveSource } from "@prisma/client";
import { createNewDesignState } from "@/lib/editor-v2/editor/store/createNewDesignState";
import { serializeEditorV2Document } from "@/lib/editor-v2/persistence/designs";

const {
  authMock,
  designFindFirstMock,
  designCreateMock,
  designUpdateMock,
  versionFindManyMock,
  versionFindFirstMock,
  versionCreateMock,
  versionDeleteManyMock,
  transactionMock,
  deleteBlobIfExistsMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  designFindFirstMock: vi.fn(),
  designCreateMock: vi.fn(),
  designUpdateMock: vi.fn(),
  versionFindManyMock: vi.fn(),
  versionFindFirstMock: vi.fn(),
  versionCreateMock: vi.fn(),
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
      findFirst: designFindFirstMock,
      create: designCreateMock,
      update: designUpdateMock,
    },
    editorDesignVersion: {
      findMany: versionFindManyMock,
      findFirst: versionFindFirstMock,
      create: versionCreateMock,
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

describe("editor-v2 design version routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionMock.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        editorDesign: {
          create: designCreateMock,
          update: designUpdateMock,
        },
        editorDesignVersion: {
          create: versionCreateMock,
          findMany: versionFindManyMock,
          deleteMany: versionDeleteManyMock,
        },
      }),
    );
  });

  it("lists versions for the owning user in newest-first order", async () => {
    authMock.mockResolvedValue({ userId: "user_1" });
    designFindFirstMock.mockResolvedValue({ id: "design_123" });
    versionFindManyMock.mockResolvedValue([
      {
        id: "version_2",
        createdAt: new Date("2026-04-16T12:05:00.000Z"),
        saveSource: SaveSource.MANUAL,
      },
      {
        id: "version_1",
        createdAt: new Date("2026-04-16T12:00:00.000Z"),
        saveSource: SaveSource.AUTOSAVE,
      },
    ]);

    const response = await GET(new Request("http://localhost"), {
      params: { id: "design_123" },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      versions: [
        {
          id: "version_2",
          createdAt: "2026-04-16T12:05:00.000Z",
          saveSource: SaveSource.MANUAL,
        },
        {
          id: "version_1",
          createdAt: "2026-04-16T12:00:00.000Z",
          saveSource: SaveSource.AUTOSAVE,
        },
      ],
    });
  });

  it("rejects cross-user version list access", async () => {
    authMock.mockResolvedValue({ userId: "user_1" });
    designFindFirstMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), {
      params: { id: "design_123" },
    });

    expect(response.status).toBe(404);
  });

  it("restores a version and returns a new version token", async () => {
    const state = createNewDesignState(4, 3);
    state.document.project.title = "Restored Design";
    const data = serializeEditorV2Document(state.document);

    authMock.mockResolvedValue({ userId: "user_1" });
    designFindFirstMock.mockResolvedValue({
      id: "design_123",
      title: "Current Design",
      data: { trace: null },
      createdAt: new Date("2026-04-16T11:00:00.000Z"),
      updatedAt: new Date("2026-04-16T12:00:00.000Z"),
      lastVersionAt: null,
      lastVersionHash: null,
    });
    versionFindFirstMock.mockResolvedValue({
      id: "version_2",
      data,
      dataHash: "hash_2",
      createdAt: new Date("2026-04-16T11:30:00.000Z"),
      saveSource: SaveSource.MANUAL,
    });
    designUpdateMock.mockResolvedValue({
      id: "design_123",
      title: "Restored Design",
      gridWidth: 4,
      gridHeight: 3,
      createdAt: new Date("2026-04-16T11:00:00.000Z"),
      updatedAt: new Date("2026-04-16T12:15:00.000Z"),
    });
    versionFindManyMock.mockResolvedValue([]);

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: "version_2" }),
      }),
      { params: { id: "design_123" } },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(designUpdateMock).toHaveBeenCalledWith({
      where: { id: "design_123" },
      data: {
        title: "Restored Design",
        data,
        gridWidth: 4,
        gridHeight: 3,
        lastSaveSource: SaveSource.RESTORE,
        lastVersionAt: expect.any(Date),
        lastVersionHash: "hash_2",
      },
    });
    expect(versionCreateMock).toHaveBeenCalledWith({
      data: {
        designId: "design_123",
        data,
        dataHash: "hash_2",
        saveSource: SaveSource.RESTORE,
      },
    });
    expect(body).toEqual({
      ok: true,
      id: "design_123",
      storageId: "design_123",
      title: "Restored Design",
      gridWidth: 4,
      gridHeight: 3,
      createdAt: "2026-04-16T11:00:00.000Z",
      updatedAt: "2026-04-16T12:15:00.000Z",
      versionToken: "2026-04-16T12:15:00.000Z",
      restoredVersionId: "version_2",
      data,
    });
  });

  it("creates a new design copy from a historical version", async () => {
    const state = createNewDesignState(5, 4);
    state.document.project.title = "Copied From History";
    const data = serializeEditorV2Document(state.document);

    authMock.mockResolvedValue({ userId: "user_1" });
    designFindFirstMock.mockResolvedValue({
      id: "design_123",
      title: "Current Design",
      data: { trace: null },
      createdAt: new Date("2026-04-16T11:00:00.000Z"),
      updatedAt: new Date("2026-04-16T12:00:00.000Z"),
      lastVersionAt: null,
      lastVersionHash: null,
    });
    versionFindFirstMock.mockResolvedValue({
      id: "version_3",
      data,
      dataHash: "hash_3",
      createdAt: new Date("2026-04-16T11:40:00.000Z"),
      saveSource: SaveSource.MANUAL,
    });
    designCreateMock.mockResolvedValue({
      id: "design_copy_1",
      title: "Copied From History",
      gridWidth: 5,
      gridHeight: 4,
      createdAt: new Date("2026-04-16T12:20:00.000Z"),
      updatedAt: new Date("2026-04-16T12:20:00.000Z"),
    });
    versionFindManyMock.mockResolvedValue([]);

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: "version_3", mode: "copy" }),
      }),
      { params: { id: "design_123" } },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(designCreateMock).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        title: "Copied From History",
        data,
        gridWidth: 5,
        gridHeight: 4,
        lastSaveSource: SaveSource.RESTORE,
        lastVersionAt: expect.any(Date),
        lastVersionHash: "hash_3",
      },
    });
    expect(versionCreateMock).toHaveBeenCalledWith({
      data: {
        designId: "design_copy_1",
        data,
        dataHash: "hash_3",
        saveSource: SaveSource.RESTORE,
      },
    });
    expect(body).toEqual({
      ok: true,
      id: "design_copy_1",
      storageId: "design_copy_1",
      title: "Copied From History",
      gridWidth: 5,
      gridHeight: 4,
      createdAt: "2026-04-16T12:20:00.000Z",
      updatedAt: "2026-04-16T12:20:00.000Z",
      versionToken: "2026-04-16T12:20:00.000Z",
      restoredVersionId: "version_3",
      data,
    });
  });
});
