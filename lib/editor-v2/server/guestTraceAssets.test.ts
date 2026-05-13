import { describe, expect, it, vi } from "vitest";
import {
  claimGuestTraceAssetsForDesign,
  isGuestDraftId,
} from "./guestTraceAssets";

describe("guestTraceAssets", () => {
  it("recognizes persisted local draft ids but not the placeholder initial id", () => {
    expect(isGuestDraftId("local_123")).toBe(true);
    expect(isGuestDraftId("local_initial")).toBe(false);
    expect(isGuestDraftId("design_123")).toBe(false);
  });

  it("claims guest trace assets referenced by a saved design payload", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const client = {
      guestTraceAsset: {
        updateMany,
      },
    } as never;

    await claimGuestTraceAssetsForDesign(client, "design_123", {
      trace: {
        originalUrl: "https://example.blob.vercel-storage.com/original.webp",
        previewUrl: "https://example.blob.vercel-storage.com/preview.webp",
        thumbnailUrl: "https://example.blob.vercel-storage.com/thumb.webp",
      },
    });

    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          claimedDesignId: null,
        }),
        data: expect.objectContaining({
          claimedDesignId: "design_123",
          claimedAt: expect.any(Date),
        }),
      }),
    );
  });
});
