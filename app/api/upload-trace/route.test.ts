import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, handleUploadMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  handleUploadMock: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@vercel/blob/client", () => ({
  handleUpload: handleUploadMock,
}));

import { POST } from "./route";

describe("POST /api/upload-trace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue({ userId: null });

    const req = new Request("http://localhost/api/upload-trace", { method: "POST" });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(handleUploadMock).not.toHaveBeenCalled();
  });

  it("passes token-generation config to handleUpload", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    handleUploadMock.mockResolvedValue({ token: "t" });

    const req = new Request("http://localhost/api/upload-trace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "blob.generate-client-token",
        payload: { pathname: "trace.png", callbackUrl: "http://localhost" },
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ token: "t" });
    expect(handleUploadMock).toHaveBeenCalledTimes(1);

    const args = handleUploadMock.mock.calls[0][0] as {
      onBeforeGenerateToken: () => Promise<{
        allowedContentTypes: string[];
        maximumSizeInBytes: number;
        tokenPayload: string;
      }>;
      onUploadCompleted: () => Promise<void>;
    };
    const tokenConfig = await args.onBeforeGenerateToken();

    expect(tokenConfig.allowedContentTypes).toEqual(["image/png", "image/jpeg", "image/webp", "image/gif"]);
    expect(tokenConfig.maximumSizeInBytes).toBe(10 * 1024 * 1024);
    expect(tokenConfig.tokenPayload).toContain("user_123");
    await expect(args.onUploadCompleted()).resolves.toBeUndefined();
  });
});
