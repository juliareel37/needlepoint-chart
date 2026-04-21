import { beforeEach, describe, expect, it, vi } from "vitest";

const { delMock } = vi.hoisted(() => ({
  delMock: vi.fn(),
}));

vi.mock("@vercel/blob", () => ({
  del: delMock,
}));

import {
  deleteBlobIfExists,
  extractBlobUrl,
  extractEditorV2TraceBlobUrls,
  isBlobUrl,
} from "./blob";

describe("lib/blob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("identifies managed blob URLs", () => {
    expect(isBlobUrl("https://foo.blob.vercel-storage.com/image.png")).toBe(true);
    expect(isBlobUrl("https://example.com/image.png")).toBe(false);
    expect(isBlobUrl("data:image/png;base64,abc")).toBe(false);
    expect(isBlobUrl(null)).toBe(false);
  });

  it("extracts blob URLs from draft payloads", () => {
    const valid = {
      trace: {
        imageDataUrl: "https://foo.blob.vercel-storage.com/a.png",
      },
    };
    const invalid = {
      trace: {
        imageDataUrl: "https://example.com/a.png",
      },
    };

    expect(extractBlobUrl(valid)).toBe("https://foo.blob.vercel-storage.com/a.png");
    expect(extractBlobUrl(invalid)).toBeNull();
    expect(extractBlobUrl({})).toBeNull();
    expect(extractBlobUrl(null)).toBeNull();
  });

  it("deletes only managed blob URLs", async () => {
    await deleteBlobIfExists("https://foo.blob.vercel-storage.com/a.png");
    await deleteBlobIfExists("https://example.com/a.png");
    await deleteBlobIfExists(null);

    expect(delMock).toHaveBeenCalledTimes(1);
    expect(delMock).toHaveBeenCalledWith("https://foo.blob.vercel-storage.com/a.png");
  });

  it("swallows delete errors", async () => {
    delMock.mockRejectedValueOnce(new Error("boom"));

    await expect(deleteBlobIfExists("https://foo.blob.vercel-storage.com/a.png")).resolves.toBeUndefined();
    expect(delMock).toHaveBeenCalledTimes(1);
  });

  it("extracts all editor-v2 trace blob URLs", () => {
    expect(
      extractEditorV2TraceBlobUrls({
        trace: {
          previewUrl: "https://foo.blob.vercel-storage.com/preview.webp",
          thumbnailUrl: "https://foo.blob.vercel-storage.com/thumb.webp",
          originalUrl: "https://foo.blob.vercel-storage.com/original.png",
        },
      }),
    ).toEqual([
      "https://foo.blob.vercel-storage.com/preview.webp",
      "https://foo.blob.vercel-storage.com/thumb.webp",
      "https://foo.blob.vercel-storage.com/original.png",
    ]);
  });
});
