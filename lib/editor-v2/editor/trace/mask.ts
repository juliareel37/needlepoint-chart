import type { TraceDocument } from "../store/state";
import { getTraceAssetCropRect } from "./crop";

export interface TraceMaskRenderSource {
  image: CanvasImageSource;
  width: number;
  height: number;
}

export function drawMaskedTraceSourceToCanvas(
  canvas: HTMLCanvasElement,
  imageSource: CanvasImageSource,
  size: {
    trace: TraceDocument;
    width: number;
    height: number;
    mask?: TraceMaskRenderSource | null;
  },
): void {
  const cropRect = getTraceAssetCropRect(size.trace, size.width, size.height);

  canvas.width = Math.max(1, Math.round(cropRect.cropWidth));
  canvas.height = Math.max(1, Math.round(cropRect.cropHeight));

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = "source-over";
  context.drawImage(
    imageSource,
    cropRect.cropX,
    cropRect.cropY,
    cropRect.cropWidth,
    cropRect.cropHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  if (!size.mask) {
    return;
  }

  const maskCropRect = getTraceAssetCropRect(size.trace, size.mask.width, size.mask.height);
  context.globalCompositeOperation = "destination-in";
  context.drawImage(
    size.mask.image,
    maskCropRect.cropX,
    maskCropRect.cropY,
    maskCropRect.cropWidth,
    maskCropRect.cropHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  context.globalCompositeOperation = "source-over";
}

export function isMaskCanvasFullyVisible(canvas: HTMLCanvasElement): boolean {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return true;
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let index = 3; index < imageData.data.length; index += 4) {
    if (imageData.data[index] < 255) {
      return false;
    }
  }

  return true;
}
