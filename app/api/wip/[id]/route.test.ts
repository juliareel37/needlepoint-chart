import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, findFirstMock, deleteManyMock, deleteBlobIfExistsMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  findFirstMock: vi.fn(),
  deleteManyMock: vi.fn(),
  deleteBlobIfExistsMock: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    patternDraft: {
      findFirst: findFirstMock,
      deleteMany: deleteManyMock,
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/blob", async () => {
  const actual = await vi.importActual<typeof import("@/lib/blob")>("@/lib/blob");
  return {
    ...actual,
    deleteBlobIfExists: deleteBlobIfExistsMock,
  };
});

import { DELETE } from "./route";

describe("DELETE /api/wip/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue({ userId: null });

    const res = await DELETE(new Request("http://localhost"), { params: { id: "draft_1" } });
    expect(res.status).toBe(401);
    expect(findFirstMock).not.toHaveBeenCalled();
    expect(deleteBlobIfExistsMock).not.toHaveBeenCalled();
  });

  it("returns 404 when draft does not exist", async () => {
    authMock.mockResolvedValue({ userId: "user_1" });
    findFirstMock.mockResolvedValue(null);

    const res = await DELETE(new Request("http://localhost"), { params: { id: "draft_1" } });
    expect(res.status).toBe(404);
    expect(deleteManyMock).not.toHaveBeenCalled();
    expect(deleteBlobIfExistsMock).not.toHaveBeenCalled();
  });

  it("cleans up unique blob URLs from draft and versions", async () => {
    const blobA = "https://store.blob.vercel-storage.com/a.png";
    const blobB = "https://store.blob.vercel-storage.com/b.png";

    authMock.mockResolvedValue({ userId: "user_1" });
    findFirstMock.mockResolvedValue({
      data: { trace: { imageDataUrl: blobA } },
      versions: [
        { data: { trace: { imageDataUrl: blobA } } },
        { data: { trace: { imageDataUrl: blobB } } },
        { data: { trace: { imageDataUrl: "https://example.com/not-managed.png" } } },
      ],
    });
    deleteManyMock.mockResolvedValue({ count: 1 });

    const res = await DELETE(new Request("http://localhost"), { params: { id: "draft_1" } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(deleteBlobIfExistsMock).toHaveBeenCalledTimes(2);
    expect(deleteBlobIfExistsMock).toHaveBeenNthCalledWith(1, blobA);
    expect(deleteBlobIfExistsMock).toHaveBeenNthCalledWith(2, blobB);
  });
});
