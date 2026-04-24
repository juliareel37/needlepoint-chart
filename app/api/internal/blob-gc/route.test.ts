import { beforeEach, describe, expect, it, vi } from "vitest";

const { listMock, delMock, findManyMock, editorDesignFindManyMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  delMock: vi.fn(),
  findManyMock: vi.fn(),
  editorDesignFindManyMock: vi.fn(),
}));

vi.mock("@vercel/blob", () => ({
  list: listMock,
  del: delMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    patternDraft: {
      findMany: findManyMock,
    },
    editorDesign: {
      findMany: editorDesignFindManyMock,
    },
  },
}));

import { GET } from "./route";

describe("GET /api/internal/blob-gc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BLOB_GC_SECRET = "secret";
    editorDesignFindManyMock.mockResolvedValue([]);
  });

  it("rejects missing secret header", async () => {
    const req = new Request("http://localhost/api/internal/blob-gc");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("deletes only old unreferenced blobs", async () => {
    const dayMs = 24 * 60 * 60 * 1000;
    const referencedA = "https://store.blob.vercel-storage.com/a.png";
    const referencedB = "https://store.blob.vercel-storage.com/b.png";
    const referencedC = "https://store.blob.vercel-storage.com/c.png";
    const orphanOld = "https://store.blob.vercel-storage.com/orphan-old.png";
    const orphanNew = "https://store.blob.vercel-storage.com/orphan-new.png";

    findManyMock.mockResolvedValue([
      {
        data: { trace: { imageDataUrl: referencedA } },
        versions: [{ data: { trace: { imageDataUrl: referencedB } } }],
      },
    ]);
    editorDesignFindManyMock.mockResolvedValue([
      {
        data: {
          trace: {
            previewUrl: referencedC,
            thumbnailUrl: referencedC,
            originalUrl: referencedC,
          },
        },
      },
    ]);
    listMock.mockResolvedValue({
      blobs: [
        { url: referencedA, uploadedAt: new Date(Date.now() - 2 * dayMs) },
        { url: referencedC, uploadedAt: new Date(Date.now() - 2 * dayMs) },
        { url: orphanOld, uploadedAt: new Date(Date.now() - 2 * dayMs) },
        { url: orphanNew, uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      ],
      hasMore: false,
      cursor: undefined,
    });

    const req = new Request("http://localhost/api/internal/blob-gc", {
      headers: { "x-cron-secret": "secret" },
    });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(delMock).toHaveBeenCalledTimes(1);
    expect(delMock).toHaveBeenCalledWith(orphanOld);
    expect(body).toEqual({
      ok: true,
      dryRun: false,
      deleted: 1,
      candidates: 1,
      referenced: 3,
      minAgeHours: 24,
    });
  });

  it("supports dry-run mode without deleting blobs", async () => {
    const dayMs = 24 * 60 * 60 * 1000;
    const orphanOld = "https://store.blob.vercel-storage.com/orphan-old.png";

    findManyMock.mockResolvedValue([]);
    listMock.mockResolvedValue({
      blobs: [{ url: orphanOld, uploadedAt: new Date(Date.now() - 2 * dayMs) }],
      hasMore: false,
      cursor: undefined,
    });

    const req = new Request("http://localhost/api/internal/blob-gc?dryRun=1&minAgeHours=1", {
      headers: { "x-cron-secret": "secret" },
    });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(delMock).not.toHaveBeenCalled();
    expect(body).toEqual({
      ok: true,
      dryRun: true,
      deleted: 0,
      candidates: 1,
      referenced: 0,
      minAgeHours: 1,
    });
  });
});
