export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const PREVIEW_MAX_DIMENSION_PX = 4096;
export const THUMBNAIL_MAX_DIMENSION_PX = 160;
export const TRACE_UPLOAD_PATH_PATTERN =
  /^editor-v2-trace-\d+-[0-9a-f-]+\/original\.[a-z0-9]+$/i;

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

export async function getPreprocessedTraceAssets(input: Buffer): Promise<{
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

export function getFileExtension(fileName: string, mimeType: string): string {
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

export function getOrientedImageSize(
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

export function isSupportedTraceMimeType(mimeType: string): boolean {
  return [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ].includes(mimeType);
}

export function isValidTraceUploadPath(pathname: string): boolean {
  return TRACE_UPLOAD_PATH_PATTERN.test(pathname);
}

export function getTraceBaseName(pathname: string): string {
  return pathname.replace(/\/original\.[a-z0-9]+$/i, "");
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
