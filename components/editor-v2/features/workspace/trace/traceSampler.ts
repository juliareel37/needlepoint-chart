"use client";

import {
  getContainedRect,
  getLocalPointWithinRotatedBounds,
  getPositionedBounds,
} from "@/lib/editor-v2/editor/positioning";
import {
  getTraceAssetCropRect,
  getTraceDisplaySize,
} from "@/lib/editor-v2/editor/trace/crop";
import type { Rgb } from "@/lib/editor-v2/editor/color-utils";
import type { TraceDocument } from "@/lib/editor-v2/editor/store";

type CachedTraceSampler = {
  previewUrl: string;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  ready: boolean;
  width: number;
  height: number;
};

const traceSamplerCache = new Map<string, CachedTraceSampler>();

export function clearTraceSampler(previewUrl?: string): void {
  if (typeof previewUrl === "string") {
    const sampler = traceSamplerCache.get(previewUrl);
    if (!sampler) {
      return;
    }

    sampler.canvas.width = 0;
    sampler.canvas.height = 0;
    traceSamplerCache.delete(previewUrl);
    return;
  }

  for (const [url, sampler] of traceSamplerCache) {
    sampler.canvas.width = 0;
    sampler.canvas.height = 0;
    traceSamplerCache.delete(url);
  }
}

export function sampleTraceRgbAtWorldPoint(
  trace: TraceDocument,
  metrics: { surfaceWidth: number; surfaceHeight: number },
  point: { x: number; y: number },
): Rgb | null {
  if (!trace.visible) {
    return null;
  }

  const sampler = getOrCreateSampler(trace.previewUrl);
  if (!sampler.ready || sampler.width <= 0 || sampler.height <= 0) {
    return null;
  }

  const displaySize = getTraceDisplaySize(trace, sampler.width, sampler.height);
  const cropRect = getTraceAssetCropRect(trace, sampler.width, sampler.height);
  const baseRect = getContainedRect(
    displaySize.width,
    displaySize.height,
    metrics.surfaceWidth,
    metrics.surfaceHeight,
  );
  const bounds = getPositionedBounds(baseRect, {
    offsetX: trace.offsetX,
    offsetY: trace.offsetY,
    scale: trace.scale,
    rotation: trace.rotation,
  });
  const localPoint = getLocalPointWithinRotatedBounds(point, bounds, trace.rotation);
  if (
    localPoint.x < 0 ||
    localPoint.y < 0 ||
    localPoint.x >= bounds.width ||
    localPoint.y >= bounds.height
  ) {
    return null;
  }

  const u = localPoint.x / bounds.width;
  const v = localPoint.y / bounds.height;
  const pixelX = clampInt(
    Math.round(cropRect.cropX + u * cropRect.cropWidth),
    0,
    sampler.width - 1,
  );
  const pixelY = clampInt(
    Math.round(cropRect.cropY + v * cropRect.cropHeight),
    0,
    sampler.height - 1,
  );

  const data = sampler.context.getImageData(pixelX, pixelY, 1, 1).data;
  if (data[3] < 10) {
    return null;
  }

  return { r: data[0], g: data[1], b: data[2] };
}

function getOrCreateSampler(previewUrl: string): CachedTraceSampler {
  const cached = traceSamplerCache.get(previewUrl);
  if (cached) {
    return cached;
  }

  const image = new Image();
  // The trace asset is expected to be same-origin/object URL; setting crossOrigin
  // to anonymous keeps the canvas usable when possible while not breaking local urls.
  image.crossOrigin = "anonymous";

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    // Should be effectively impossible in modern browsers, but keep a safe fallback.
    canvas.remove();
    const fallbackCanvas = document.createElement("canvas");
    const fallbackContext = fallbackCanvas.getContext("2d");
    if (!fallbackContext) {
      throw new Error("Unable to create 2d canvas context for trace sampling.");
    }

    const sampler: CachedTraceSampler = {
      previewUrl,
      canvas: fallbackCanvas,
      context: fallbackContext,
      ready: false,
      width: 0,
      height: 0,
    };
    traceSamplerCache.set(previewUrl, sampler);
    image.src = previewUrl;
    image.onload = () => {
      sampler.width = image.naturalWidth;
      sampler.height = image.naturalHeight;
      sampler.ready = sampler.width > 0 && sampler.height > 0;
      if (sampler.ready) {
        sampler.canvas.width = sampler.width;
        sampler.canvas.height = sampler.height;
        sampler.context.clearRect(0, 0, sampler.width, sampler.height);
        sampler.context.drawImage(image, 0, 0, sampler.width, sampler.height);
      }
    };
    return sampler;
  }

  const sampler: CachedTraceSampler = {
    previewUrl,
    canvas,
    context,
    ready: false,
    width: 0,
    height: 0,
  };
  traceSamplerCache.set(previewUrl, sampler);

  image.onload = () => {
    sampler.width = image.naturalWidth;
    sampler.height = image.naturalHeight;
    sampler.ready = sampler.width > 0 && sampler.height > 0;
    if (sampler.ready) {
      sampler.canvas.width = sampler.width;
      sampler.canvas.height = sampler.height;
      sampler.context.clearRect(0, 0, sampler.width, sampler.height);
      sampler.context.drawImage(image, 0, 0, sampler.width, sampler.height);
    }
  };
  image.onerror = () => {
    sampler.ready = false;
  };
  image.src = previewUrl;

  return sampler;
}
function clampInt(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
