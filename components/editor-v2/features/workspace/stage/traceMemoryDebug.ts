"use client";

export const TRACE_MEMORY_DEBUG_ENABLED = process.env.NODE_ENV !== "production";

export interface TraceSurfaceEstimate {
  bytes: number;
  height: number;
  mebibytes: number;
  width: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
}

export function estimateTraceSurface(
  width: number,
  height: number,
): TraceSurfaceEstimate {
  const safeWidth = Math.max(0, Math.round(width));
  const safeHeight = Math.max(0, Math.round(height));
  const bytes = safeWidth * safeHeight * 4;

  return {
    bytes,
    height: safeHeight,
    mebibytes: bytes / (1024 * 1024),
    width: safeWidth,
  };
}

export function formatTraceSurfaceForLog(
  label: string,
  estimate: TraceSurfaceEstimate,
): Record<string, number | string> {
  return {
    label,
    width: estimate.width,
    height: estimate.height,
    bytes: estimate.bytes,
    mebibytes: Number(estimate.mebibytes.toFixed(2)),
  };
}

export function getUsedJsHeapMiB(): number | null {
  if (typeof performance === "undefined") {
    return null;
  }

  const performanceWithMemory = performance as PerformanceWithMemory;
  const usedJsHeapSize = performanceWithMemory.memory?.usedJSHeapSize;
  if (typeof usedJsHeapSize !== "number" || !Number.isFinite(usedJsHeapSize)) {
    return null;
  }

  return usedJsHeapSize / (1024 * 1024);
}
