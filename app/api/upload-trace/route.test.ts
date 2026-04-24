import { beforeEach, describe, expect, it, vi } from "vitest";

const { handleUploadMock } = vi.hoisted(() => ({
  handleUploadMock: vi.fn(),
}));

vi.mock("@vercel/blob/client", () => ({
  handleUpload: handleUploadMock,
}));

import { POST } from "./route";

describe("POST /api/upload-trace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid upload requests", async () => {
    const req = new Request("http://localhost/api/upload-trace", {
      method: "POST",
      body: "not json",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(handleUploadMock).not.toHaveBeenCalled();
  });

  it("returns a client token for anonymous uploads", async () => {
    handleUploadMock.mockImplementation(async ({ onBeforeGenerateToken }) => {
      const tokenConfig = await onBeforeGenerateToken(
        "editor-v2-trace-123-123e4567-e89b-12d3-a456-426614174000/original.png",
        null,
        false,
      );

      expect(tokenConfig).toEqual({
        addRandomSuffix: false,
        allowedContentTypes: [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
        ],
        maximumSizeInBytes: 10 * 1024 * 1024,
      });

      return { type: "blob.generate-client-token", clientToken: "token" };
    });

    const req = new Request("http://localhost/api/upload-trace", {
      method: "POST",
      body: JSON.stringify({ type: "blob.generate-client-token" }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      type: "blob.generate-client-token",
      clientToken: "token",
    });
  });

  it("rejects invalid upload paths during token generation", async () => {
    handleUploadMock.mockImplementation(async ({ onBeforeGenerateToken }) => {
      await onBeforeGenerateToken("bad-path.png", null, false);
      return { type: "blob.generate-client-token", clientToken: "token_123" };
    });

    const req = new Request("http://localhost/api/upload-trace", {
      method: "POST",
      body: JSON.stringify({ type: "blob.generate-client-token" }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid upload path" });
  });

  it("accepts upload completion callbacks without user auth", async () => {
    handleUploadMock.mockImplementation(async ({ onUploadCompleted }) => {
      await onUploadCompleted({
        blob: {
          contentType: "image/png",
          pathname: "editor-v2-trace-123-123e4567-e89b-12d3-a456-426614174000/original.png",
          url: "https://blob.example.com/original.png",
        },
        tokenPayload: null,
      });

      return { type: "blob.upload-completed", response: "ok" };
    });

    const req = new Request("http://localhost/api/upload-trace", {
      method: "POST",
      body: JSON.stringify({ type: "blob.upload-completed" }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      type: "blob.upload-completed",
      response: "ok",
    });
  });
});
