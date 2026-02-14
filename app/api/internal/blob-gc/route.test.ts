import { beforeEach, describe, expect, it, vi } from "vitest";

const { listMock, delMock, findManyMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  delMock: vi.fn(),
  findManyMock: vi.fn(),
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
  },
}));

import { GET } from "./route";

describe("GET /api/internal/blob-gc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BLOB_GC_SECRET = "secret";
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
    const orphanOld = "https://store.blob.vercel-storage.com/orphan-old.png";
    const orphanNew = "https://store.blob.vercel-storage.com/orphan-new.png";

    findManyMock.mockResolvedValue([
      {
        data: { trace: { imageDataUrl: referencedA } },
        versions: [{ data: { trace: { imageDataUrl: referencedB } } }],
      },
    ]);
    listMock.mockResolvedValue({
      blobs: [
        { url: referencedA, uploadedAt: new Date(Date.now() - 2 * dayMs) },
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
      deleted: 1,
      referenced: 2,
    });
  });
});
