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
  measureUserAgentSpecificMemory?: () => Promise<{
    bytes: number;
    breakdown?: Array<{
      attribution?: Array<{
        scope?: string;
        url?: string;
      }>;
      bytes: number;
      types?: string[];
    }>;
  }>;
}

export interface TraceTotalMemorySample {
  bytes: number | null;
  mebibytes: number | null;
  source: "js-heap" | "user-agent-specific-memory" | "unavailable";
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

export async function measureTotalPageMemory(): Promise<TraceTotalMemorySample> {
  if (typeof performance === "undefined") {
    return {
      bytes: null,
      mebibytes: null,
      source: "unavailable",
    };
  }

  const performanceWithMemory = performance as PerformanceWithMemory;

  if (
    typeof performanceWithMemory.measureUserAgentSpecificMemory === "function" &&
    typeof window !== "undefined" &&
    window.crossOriginIsolated
  ) {
    try {
      const measurement =
        await performanceWithMemory.measureUserAgentSpecificMemory();

      return {
        bytes: measurement.bytes,
        mebibytes: measurement.bytes / (1024 * 1024),
        source: "user-agent-specific-memory",
      };
    } catch {
      // Fall back to the legacy heap-only sample if the broader measurement fails.
    }
  }

  const usedJsHeapMiB = getUsedJsHeapMiB();
  if (usedJsHeapMiB !== null) {
    return {
      bytes: Math.round(usedJsHeapMiB * 1024 * 1024),
      mebibytes: usedJsHeapMiB,
      source: "js-heap",
    };
  }

  return {
    bytes: null,
    mebibytes: null,
    source: "unavailable",
  };
}
