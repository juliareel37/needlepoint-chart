"use client";

import { getContainedRect, getPositionedBounds } from "@/lib/editor-v2/editor/positioning";
import type { Rgb } from "@/lib/editor-v2/editor/color-utils";
import type { TraceDocument } from "@/lib/editor-v2/editor/store";
import {
  getConstrainedTraceImageSize,
} from "./traceAssetSizing";

type CachedTraceSampler = {
  assetUrl: string;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  ready: boolean;
  width: number;
  height: number;
};

const traceSamplerCache = new Map<string, CachedTraceSampler>();

export function sampleTraceRgbAtWorldPoint(
  trace: TraceDocument,
  metrics: { surfaceWidth: number; surfaceHeight: number },
  point: { x: number; y: number },
): Rgb | null {
  if (!trace.visible) {
    return null;
  }

  const sampler = getOrCreateSampler(trace.assetUrl);
  if (!sampler.ready || sampler.width <= 0 || sampler.height <= 0) {
    return null;
  }

  const baseRect = getContainedRect(
    sampler.width,
    sampler.height,
    metrics.surfaceWidth,
    metrics.surfaceHeight,
  );
  const bounds = getPositionedBounds(baseRect, {
    offsetX: trace.offsetX,
    offsetY: trace.offsetY,
    scale: trace.scale,
  });

  if (
    point.x < bounds.left ||
    point.y < bounds.top ||
    point.x >= bounds.left + bounds.width ||
    point.y >= bounds.top + bounds.height
  ) {
    return null;
  }

  const u = (point.x - bounds.left) / bounds.width;
  const v = (point.y - bounds.top) / bounds.height;
  const pixelX = clampInt(Math.round(u * sampler.width), 0, sampler.width - 1);
  const pixelY = clampInt(Math.round(v * sampler.height), 0, sampler.height - 1);

  const data = sampler.context.getImageData(pixelX, pixelY, 1, 1).data;
  if (data[3] < 10) {
    return null;
  }

  return { r: data[0], g: data[1], b: data[2] };
}

function getOrCreateSampler(assetUrl: string): CachedTraceSampler {
  const cached = traceSamplerCache.get(assetUrl);
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
      assetUrl,
      canvas: fallbackCanvas,
      context: fallbackContext,
      ready: false,
      width: 0,
      height: 0,
    };
    traceSamplerCache.set(assetUrl, sampler);
    image.src = assetUrl;
    image.onload = () => {
      const targetSize = getConstrainedTraceImageSize(
        image.naturalWidth,
        image.naturalHeight,
      );
      sampler.width = targetSize.width;
      sampler.height = targetSize.height;
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
    assetUrl,
    canvas,
    context,
    ready: false,
    width: 0,
    height: 0,
  };
  traceSamplerCache.set(assetUrl, sampler);

  image.onload = () => {
    const targetSize = getConstrainedTraceImageSize(
      image.naturalWidth,
      image.naturalHeight,
    );
    sampler.width = targetSize.width;
    sampler.height = targetSize.height;
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
  image.src = assetUrl;

  return sampler;
}
function clampInt(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
