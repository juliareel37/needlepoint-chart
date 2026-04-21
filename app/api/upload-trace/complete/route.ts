import { put } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isBlobUrl } from "@/lib/blob";
import {
  MAX_UPLOAD_BYTES,
  getOrientedImageSize,
  getPreprocessedTraceAssets,
  getTraceBaseName,
  isSupportedTraceMimeType,
  isValidTraceUploadPath,
} from "../shared";

export const runtime = "nodejs";

interface CompleteTraceUploadRequest {
  fileName?: unknown;
  mimeType?: unknown;
  originalPathname?: unknown;
  originalUrl?: unknown;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as CompleteTraceUploadRequest | null;
  const originalUrl =
    body && typeof body.originalUrl === "string" ? body.originalUrl : null;
  const originalPathname =
    body && typeof body.originalPathname === "string" ? body.originalPathname : null;
  const fileName = body && typeof body.fileName === "string" ? body.fileName : null;
  const requestedMimeType =
    body && typeof body.mimeType === "string" ? body.mimeType : null;

  if (!originalUrl || !isBlobUrl(originalUrl)) {
    return NextResponse.json({ error: "Missing uploaded blob URL" }, { status: 400 });
  }

  if (!originalPathname || !isValidTraceUploadPath(originalPathname)) {
    return NextResponse.json({ error: "Invalid uploaded blob path" }, { status: 400 });
  }

  const originalResponse = await fetch(originalUrl, {
    cache: "no-store",
  }).catch(() => null);

  if (!originalResponse?.ok) {
    return NextResponse.json(
      { error: "Unable to read the uploaded image from blob storage" },
      { status: 502 },
    );
  }

  const mimeType = originalResponse.headers.get("content-type") ?? requestedMimeType ?? "";
  if (!isSupportedTraceMimeType(mimeType)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  const originalBuffer = Buffer.from(await originalResponse.arrayBuffer());
  if (originalBuffer.length > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const { metadata, previewBuffer, thumbnailBuffer } =
    await getPreprocessedTraceAssets(originalBuffer);
  const orientedSize = getOrientedImageSize(
    metadata.width ?? null,
    metadata.height ?? null,
    metadata.orientation,
  );
  const baseName = getTraceBaseName(originalPathname);

  const [previewUpload, thumbnailUpload] = await Promise.all([
    put(`${baseName}/preview.webp`, previewBuffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: "image/webp",
    }),
    put(`${baseName}/thumbnail.webp`, thumbnailBuffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: "image/webp",
    }),
  ]);

  return NextResponse.json({
    originalUrl,
    previewUrl: previewUpload.url,
    thumbnailUrl: thumbnailUpload.url,
    fileName,
    byteSize: originalBuffer.length,
    mimeType,
    imageWidth: orientedSize.width,
    imageHeight: orientedSize.height,
  });
}
