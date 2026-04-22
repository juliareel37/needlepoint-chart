"use client";

export const MAX_TRACE_IMAGE_DIMENSION_PX = 4096;
export const MAX_TRACE_IMAGE_PIXELS = 4_096 * 4_096;

export interface TraceImageSize {
  width: number;
  height: number;
}

export function getConstrainedTraceImageSize(
  width: number,
  height: number,
): TraceImageSize {
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));
  const scaleByDimension =
    MAX_TRACE_IMAGE_DIMENSION_PX / Math.max(safeWidth, safeHeight);
  const scaleByPixels = Math.sqrt(
    MAX_TRACE_IMAGE_PIXELS / Math.max(safeWidth * safeHeight, 1),
  );
  const scale = Math.min(1, scaleByDimension, scaleByPixels);

  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
  };
}

export function rasterizeTraceImageToSafeSize(
  image: HTMLImageElement,
): {
  imageSource: CanvasImageSource;
  height: number;
  width: number;
} | null {
  const naturalWidth = image.naturalWidth;
  const naturalHeight = image.naturalHeight;

  if (naturalWidth <= 0 || naturalHeight <= 0) {
    return null;
  }

  const targetSize = getConstrainedTraceImageSize(naturalWidth, naturalHeight);

  if (
    targetSize.width === naturalWidth &&
    targetSize.height === naturalHeight
  ) {
    return {
      imageSource: image,
      width: naturalWidth,
      height: naturalHeight,
    };
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetSize.width;
  canvas.height = targetSize.height;

  const context = canvas.getContext("2d");
  if (!context) {
    canvas.width = 0;
    canvas.height = 0;
    return null;
  }

  context.drawImage(image, 0, 0, targetSize.width, targetSize.height);

  return {
    imageSource: canvas,
    width: targetSize.width,
    height: targetSize.height,
  };
}
