import type { Prisma, PrismaClient } from "@prisma/client";
import { extractEditorV2TraceBlobUrls, isBlobUrl } from "@/lib/blob";

type GuestTraceAssetClient = PrismaClient | Prisma.TransactionClient;

export const GUEST_TRACE_ASSET_RETENTION_MS = 1000 * 60 * 60 * 24 * 7;

export function isGuestDraftId(value: string | null | undefined): value is string {
  return typeof value === "string" && value.startsWith("local_") && value !== "local_initial";
}

export async function trackGuestTraceAsset(
  client: GuestTraceAssetClient,
  input: {
    guestDraftId: string;
    originalUrl: string;
    previewUrl: string;
    thumbnailUrl: string;
    fileName: string | null;
    byteSize: number;
    mimeType: string | null;
    imageWidth: number | null;
    imageHeight: number | null;
  },
): Promise<void> {
  if (!isGuestDraftId(input.guestDraftId)) {
    return;
  }

  if (
    !isBlobUrl(input.originalUrl) ||
    !isBlobUrl(input.previewUrl) ||
    !isBlobUrl(input.thumbnailUrl)
  ) {
    return;
  }

  const expiresAt = new Date(Date.now() + GUEST_TRACE_ASSET_RETENTION_MS);

  await client.guestTraceAsset.upsert({
    where: {
      originalUrl: input.originalUrl,
    },
    update: {
      guestDraftId: input.guestDraftId,
      previewUrl: input.previewUrl,
      thumbnailUrl: input.thumbnailUrl,
      fileName: input.fileName,
      byteSize: input.byteSize,
      mimeType: input.mimeType,
      imageWidth: input.imageWidth,
      imageHeight: input.imageHeight,
      claimedAt: null,
      claimedDesignId: null,
      expiresAt,
    },
    create: {
      guestDraftId: input.guestDraftId,
      originalUrl: input.originalUrl,
      previewUrl: input.previewUrl,
      thumbnailUrl: input.thumbnailUrl,
      fileName: input.fileName,
      byteSize: input.byteSize,
      mimeType: input.mimeType,
      imageWidth: input.imageWidth,
      imageHeight: input.imageHeight,
      expiresAt,
    },
  });
}

export async function claimGuestTraceAssetsForDesign(
  client: GuestTraceAssetClient,
  designId: string,
  data: unknown,
): Promise<void> {
  const urls = extractEditorV2TraceBlobUrls(data);

  if (urls.length === 0) {
    return;
  }

  await client.guestTraceAsset.updateMany({
    where: {
      claimedDesignId: null,
      OR: [
        { originalUrl: { in: urls } },
        { previewUrl: { in: urls } },
        { thumbnailUrl: { in: urls } },
      ],
    },
    data: {
      claimedDesignId: designId,
      claimedAt: new Date(),
    },
  });
}

export async function listActiveGuestTraceAssetUrls(
  client: GuestTraceAssetClient,
  now = new Date(),
): Promise<string[]> {
  const assets = await client.guestTraceAsset.findMany({
    where: {
      claimedAt: null,
      expiresAt: {
        gt: now,
      },
    },
    select: {
      originalUrl: true,
      previewUrl: true,
      thumbnailUrl: true,
    },
  });

  const urls = new Set<string>();
  for (const asset of assets) {
    urls.add(asset.originalUrl);
    urls.add(asset.previewUrl);
    urls.add(asset.thumbnailUrl);
  }

  return [...urls];
}

export async function purgeExpiredGuestTraceAssets(
  client: GuestTraceAssetClient,
  now = new Date(),
): Promise<string[]> {
  const assets = await client.guestTraceAsset.findMany({
    where: {
      claimedAt: null,
      expiresAt: {
        lte: now,
      },
    },
    select: {
      id: true,
      originalUrl: true,
      previewUrl: true,
      thumbnailUrl: true,
    },
  });

  if (assets.length === 0) {
    return [];
  }

  await client.guestTraceAsset.deleteMany({
    where: {
      id: {
        in: assets.map((asset) => asset.id),
      },
    },
  });

  const urls = new Set<string>();
  for (const asset of assets) {
    urls.add(asset.originalUrl);
    urls.add(asset.previewUrl);
    urls.add(asset.thumbnailUrl);
  }

  return [...urls];
}

export async function deleteGuestTraceAssetsByDraftId(
  client: GuestTraceAssetClient,
  guestDraftId: string,
): Promise<string[]> {
  if (!isGuestDraftId(guestDraftId)) {
    return [];
  }

  const assets = await client.guestTraceAsset.findMany({
    where: {
      guestDraftId,
      claimedAt: null,
    },
    select: {
      id: true,
      originalUrl: true,
      previewUrl: true,
      thumbnailUrl: true,
    },
  });

  if (assets.length === 0) {
    return [];
  }

  await client.guestTraceAsset.deleteMany({
    where: {
      id: {
        in: assets.map((asset) => asset.id),
      },
    },
  });

  const urls = new Set<string>();
  for (const asset of assets) {
    urls.add(asset.originalUrl);
    urls.add(asset.previewUrl);
    urls.add(asset.thumbnailUrl);
  }

  return [...urls];
}
