import { put } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
// Temporary escape hatch while we investigate upload-time image crashes.
// Flip this back to `true` to restore sharp-based preview/thumbnail generation.
const ENABLE_SERVER_TRACE_PREPROCESSING = false;
const PREVIEW_MAX_DIMENSION_PX = 1024;
const THUMBNAIL_MAX_DIMENSION_PX = 160;

type SharpLike = (input: Buffer) => {
  metadata(): Promise<{
    width?: number;
    height?: number;
    orientation?: number;
  }>;
  rotate(): {
    resize(options: {
      width: number;
      height: number;
      fit: "inside";
      withoutEnlargement: true;
    }): {
      webp(options: { quality: number }): {
        toBuffer(): Promise<Buffer>;
      };
    };
  };
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const originalBuffer = Buffer.from(await file.arrayBuffer());
  const originalExtension = getFileExtension(file.name, file.type);
  const baseName = `editor-v2-trace-${Date.now()}-${crypto.randomUUID()}`;
  const originalUpload = await put(`${baseName}/original.${originalExtension}`, originalBuffer, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type || "application/octet-stream",
  });

  let previewUrl = originalUpload.url;
  let thumbnailUrl = originalUpload.url;
  let originalWidth: number | null = null;
  let originalHeight: number | null = null;

  if (ENABLE_SERVER_TRACE_PREPROCESSING) {
    const { metadata, previewBuffer, thumbnailBuffer } =
      await getPreprocessedTraceAssets(originalBuffer);
    const orientedSize = getOrientedImageSize(
      metadata.width ?? null,
      metadata.height ?? null,
      metadata.orientation,
    );

    originalWidth = orientedSize.width;
    originalHeight = orientedSize.height;

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

    previewUrl = previewUpload.url;
    thumbnailUrl = thumbnailUpload.url;
  }

  return NextResponse.json({
    originalUrl: originalUpload.url,
    previewUrl,
    thumbnailUrl,
    fileName: file.name,
    byteSize: file.size,
    mimeType: file.type || null,
    imageWidth: originalWidth,
    imageHeight: originalHeight,
  });
}

async function getPreprocessedTraceAssets(input: Buffer): Promise<{
  metadata: {
    width?: number;
    height?: number;
    orientation?: number;
  };
  previewBuffer: Buffer;
  thumbnailBuffer: Buffer;
}> {
  const sharpModule = await import("sharp");
  const sharp = (("default" in sharpModule ? sharpModule.default : sharpModule) ??
    null) as SharpLike | null;

  if (!sharp) {
    throw new Error("sharp is unavailable for trace preprocessing");
  }

  const metadata = await sharp(input).metadata();
  const [previewBuffer, thumbnailBuffer] = await Promise.all([
    createDerivativeBuffer(sharp, input, PREVIEW_MAX_DIMENSION_PX),
    createDerivativeBuffer(sharp, input, THUMBNAIL_MAX_DIMENSION_PX),
  ]);

  return {
    metadata,
    previewBuffer,
    thumbnailBuffer,
  };
}

async function createDerivativeBuffer(
  sharp: SharpLike,
  input: Buffer,
  maxDimension: number,
): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toBuffer();
}

function getFileExtension(fileName: string, mimeType: string): string {
  const sanitized = fileName.trim().toLowerCase();
  const lastDotIndex = sanitized.lastIndexOf(".");

  if (lastDotIndex > 0 && lastDotIndex < sanitized.length - 1) {
    return sanitized.slice(lastDotIndex + 1).replace(/[^a-z0-9]/g, "") || "bin";
  }

  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";

  return "bin";
}

function getOrientedImageSize(
  width: number | null,
  height: number | null,
  orientation: number | undefined,
): { width: number | null; height: number | null } {
  if (!width || !height) {
    return { width, height };
  }

  if (orientation && [5, 6, 7, 8].includes(orientation)) {
    return { width: height, height: width };
  }

  return { width, height };
}
