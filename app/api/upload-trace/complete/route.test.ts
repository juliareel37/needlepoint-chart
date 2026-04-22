import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  putMock,
  sharpFactoryMock,
  metadataMock,
  resizeMock,
  webpMock,
  toBufferMock,
} = vi.hoisted(() => {
  const metadataMock = vi.fn();
  const resizeMock = vi.fn();
  const webpMock = vi.fn();
  const toBufferMock = vi.fn();
  const rotateMock = vi.fn(() => ({
    resize: resizeMock,
  }));

  resizeMock.mockImplementation(() => ({
    webp: webpMock,
  }));
  webpMock.mockImplementation(() => ({
    toBuffer: toBufferMock,
  }));

  const sharpFactoryMock = vi.fn(() => ({
    metadata: metadataMock,
    rotate: rotateMock,
  }));

  return {
    authMock: vi.fn(),
    putMock: vi.fn(),
    sharpFactoryMock,
    metadataMock,
    resizeMock,
    webpMock,
    toBufferMock,
  };
});

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@vercel/blob", () => ({
  put: putMock,
}));

vi.mock("sharp", () => ({
  default: sharpFactoryMock,
}));

import { POST } from "./route";

describe("POST /api/upload-trace/complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resizeMock.mockImplementation(() => ({
      webp: webpMock,
    }));
    webpMock.mockImplementation(() => ({
      toBuffer: toBufferMock,
    }));
    metadataMock.mockResolvedValue({
      width: 2400,
      height: 1800,
      orientation: 1,
    });
    toBufferMock
      .mockResolvedValueOnce(Buffer.from("preview"))
      .mockResolvedValueOnce(Buffer.from("thumbnail"));
    putMock
      .mockResolvedValueOnce({ url: "https://blob.example.com/preview.webp" })
      .mockResolvedValueOnce({ url: "https://blob.example.com/thumbnail.webp" });
    vi.stubGlobal("fetch", vi.fn());
  });

  it("rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue({ userId: null });

    const req = new Request("http://localhost/api/upload-trace/complete", {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(putMock).not.toHaveBeenCalled();
  });

  it("rejects invalid blob urls", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });

    const req = new Request("http://localhost/api/upload-trace/complete", {
      method: "POST",
      body: JSON.stringify({
        originalPathname: "editor-v2-trace-1-123e4567-e89b-12d3-a456-426614174000/original.png",
        originalUrl: "https://example.com/original.png",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(putMock).not.toHaveBeenCalled();
  });

  it("preprocesses the uploaded original and returns trace asset metadata", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    vi.mocked(fetch).mockResolvedValue(
      new Response(Buffer.from("image-bytes"), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
        },
      }),
    );

    const req = new Request("http://localhost/api/upload-trace/complete", {
      method: "POST",
      body: JSON.stringify({
        fileName: "trace.png",
        mimeType: "image/png",
        originalPathname:
          "editor-v2-trace-1-123e4567-e89b-12d3-a456-426614174000/original.png",
        originalUrl: "https://store.blob.vercel-storage.com/original.png",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith("https://store.blob.vercel-storage.com/original.png", {
      cache: "no-store",
    });
    expect(resizeMock).toHaveBeenNthCalledWith(1, {
      width: 4096,
      height: 4096,
      fit: "inside",
      withoutEnlargement: true,
    });
    expect(resizeMock).toHaveBeenNthCalledWith(2, {
      width: 160,
      height: 160,
      fit: "inside",
      withoutEnlargement: true,
    });
    expect(putMock).toHaveBeenCalledTimes(2);
    expect(body).toEqual({
      originalUrl: "https://store.blob.vercel-storage.com/original.png",
      previewUrl: "https://blob.example.com/preview.webp",
      thumbnailUrl: "https://blob.example.com/thumbnail.webp",
      fileName: "trace.png",
      byteSize: 11,
      mimeType: "image/png",
      imageWidth: 2400,
      imageHeight: 1800,
    });
  });
});
