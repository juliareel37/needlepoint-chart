import { put } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const PREVIEW_MAX_DIMENSION_PX = 1024;
const THUMBNAIL_MAX_DIMENSION_PX = 160;

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
  const metadata = await sharp(originalBuffer).metadata();
  const originalWidth = metadata.width ?? null;
  const originalHeight = metadata.height ?? null;
  const originalExtension = getFileExtension(file.name, file.type);
  const baseName = `editor-v2-trace-${Date.now()}-${crypto.randomUUID()}`;

  const [previewBuffer, thumbnailBuffer] = await Promise.all([
    createDerivativeBuffer(originalBuffer, PREVIEW_MAX_DIMENSION_PX),
    createDerivativeBuffer(originalBuffer, THUMBNAIL_MAX_DIMENSION_PX),
  ]);

  const [originalUpload, previewUpload, thumbnailUpload] = await Promise.all([
    put(`${baseName}/original.${originalExtension}`, originalBuffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type || "application/octet-stream",
    }),
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
    originalUrl: originalUpload.url,
    previewUrl: previewUpload.url,
    thumbnailUrl: thumbnailUpload.url,
    fileName: file.name,
    byteSize: file.size,
    mimeType: file.type || null,
    imageWidth: originalWidth,
    imageHeight: originalHeight,
  });
}

async function createDerivativeBuffer(
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
