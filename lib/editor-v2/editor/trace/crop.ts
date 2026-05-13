import type { TraceDocument } from "../store/state";

type TraceCropShape = Pick<
  TraceDocument,
  | "imageWidth"
  | "imageHeight"
  | "cropX"
  | "cropY"
  | "cropWidth"
  | "cropHeight"
>;

export interface TraceCropRect {
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
}

export interface TraceSize {
  width: number;
  height: number;
}

export function createFullTraceCrop(
  imageWidth: number | null,
  imageHeight: number | null,
): TraceCropRect {
  return {
    cropX: 0,
    cropY: 0,
    cropWidth: getSafeTraceDimension(imageWidth),
    cropHeight: getSafeTraceDimension(imageHeight),
  };
}

export function getNormalizedTraceCrop(
  trace: Partial<TraceCropShape>,
  fallbackWidth?: number | null,
  fallbackHeight?: number | null,
): TraceCropRect {
  const referenceWidth =
    getPositiveDimension(trace.imageWidth) ?? getPositiveDimension(fallbackWidth) ?? 1;
  const referenceHeight =
    getPositiveDimension(trace.imageHeight) ?? getPositiveDimension(fallbackHeight) ?? 1;
  const requestedWidth =
    getPositiveDimension(trace.cropWidth) ?? referenceWidth;
  const requestedHeight =
    getPositiveDimension(trace.cropHeight) ?? referenceHeight;
  const cropWidth = clamp(requestedWidth, 1, referenceWidth);
  const cropHeight = clamp(requestedHeight, 1, referenceHeight);
  const maxCropX = Math.max(0, referenceWidth - cropWidth);
  const maxCropY = Math.max(0, referenceHeight - cropHeight);
  const cropX = clamp(trace.cropX ?? 0, 0, maxCropX);
  const cropY = clamp(trace.cropY ?? 0, 0, maxCropY);

  return {
    cropX,
    cropY,
    cropWidth,
    cropHeight,
  };
}

export function getTraceDisplaySize(
  trace: Partial<TraceCropShape>,
  fallbackWidth?: number | null,
  fallbackHeight?: number | null,
): TraceSize {
  const crop = getNormalizedTraceCrop(trace, fallbackWidth, fallbackHeight);

  return {
    width: crop.cropWidth,
    height: crop.cropHeight,
  };
}

export function getTraceAssetCropRect(
  trace: Partial<TraceCropShape>,
  assetWidth: number,
  assetHeight: number,
): TraceCropRect {
  const safeAssetWidth = Math.max(1, assetWidth);
  const safeAssetHeight = Math.max(1, assetHeight);
  const normalizedCrop = getNormalizedTraceCrop(
    trace,
    safeAssetWidth,
    safeAssetHeight,
  );
  const referenceWidth =
    getPositiveDimension(trace.imageWidth) ?? safeAssetWidth;
  const referenceHeight =
    getPositiveDimension(trace.imageHeight) ?? safeAssetHeight;
  const scaleX = safeAssetWidth / referenceWidth;
  const scaleY = safeAssetHeight / referenceHeight;
  const cropX = clamp(normalizedCrop.cropX * scaleX, 0, safeAssetWidth - 1);
  const cropY = clamp(normalizedCrop.cropY * scaleY, 0, safeAssetHeight - 1);
  const maxCropWidth = safeAssetWidth - cropX;
  const maxCropHeight = safeAssetHeight - cropY;

  return {
    cropX,
    cropY,
    cropWidth: clamp(normalizedCrop.cropWidth * scaleX, 1, maxCropWidth),
    cropHeight: clamp(normalizedCrop.cropHeight * scaleY, 1, maxCropHeight),
  };
}

function getSafeTraceDimension(value: number | null): number {
  return getPositiveDimension(value) ?? 1;
}

function getPositiveDimension(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return value;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
