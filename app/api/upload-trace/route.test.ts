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

describe("POST /api/upload-trace", () => {
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
      .mockResolvedValueOnce({ url: "https://blob.example.com/original.png" })
      .mockResolvedValueOnce({ url: "https://blob.example.com/preview.webp" })
      .mockResolvedValueOnce({ url: "https://blob.example.com/thumbnail.webp" });
  });

  it("rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue({ userId: null });

    const req = new Request("http://localhost/api/upload-trace", { method: "POST" });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(putMock).not.toHaveBeenCalled();
  });

  it("rejects requests without a file", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    const formData = new FormData();

    const req = new Request("http://localhost/api/upload-trace", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(putMock).not.toHaveBeenCalled();
  });

  it("uploads only the original asset while preprocessing is paused", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    const formData = new FormData();
    formData.append(
      "file",
      new File([Buffer.from("image-bytes")], "trace.png", { type: "image/png" }),
    );

    const req = new Request("http://localhost/api/upload-trace", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(putMock).toHaveBeenCalledTimes(1);
    expect(sharpFactoryMock).not.toHaveBeenCalled();
    expect(body).toEqual({
      originalUrl: "https://blob.example.com/original.png",
      previewUrl: "https://blob.example.com/original.png",
      thumbnailUrl: "https://blob.example.com/original.png",
      fileName: "trace.png",
      byteSize: 11,
      mimeType: "image/png",
      imageWidth: null,
      imageHeight: null,
    });
  });
});
