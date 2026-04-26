import type { GridWorldMetrics, WorldPoint } from "@/lib/editor-v2/editor/viewport";
import { getContainedRect } from "@/lib/editor-v2/editor/positioning";

export function getInitialPlacementTransform(options: {
  intrinsicWidth: number;
  intrinsicHeight: number;
  metrics: GridWorldMetrics;
  viewportCenter: WorldPoint | null;
  viewportWidth?: number | null;
  widthRatio: number;
  clampReferenceToSurface?: boolean;
  minScale?: number;
  maxScale?: number;
}): { offsetX: number; offsetY: number; scale: number } {
  const baseRect = getContainedRect(
    options.intrinsicWidth,
    options.intrinsicHeight,
    options.metrics.surfaceWidth,
    options.metrics.surfaceHeight,
  );
  const referenceWidth = (() => {
    if (!options.viewportWidth || options.viewportWidth <= 0) {
      return options.metrics.surfaceWidth;
    }

    if (options.clampReferenceToSurface ?? true) {
      return Math.min(options.viewportWidth, options.metrics.surfaceWidth);
    }

    return options.viewportWidth;
  })();
  const targetWidth = referenceWidth * options.widthRatio;
  const scale = clampScale(
    targetWidth / Math.max(baseRect.width, 1),
    options.minScale,
    options.maxScale,
  );
  const targetCenterX = options.viewportCenter?.x ?? options.metrics.surfaceWidth / 2;
  const targetCenterY = options.viewportCenter?.y ?? options.metrics.surfaceHeight / 2;
  const targetLeft = targetCenterX - (baseRect.width * scale) / 2;
  const targetTop = targetCenterY - (baseRect.height * scale) / 2;

  return {
    scale,
    offsetX: targetLeft - baseRect.left,
    offsetY: targetTop - baseRect.top,
  };
}

function clampScale(
  value: number,
  minScale = 0.1,
  maxScale = 4,
): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(maxScale, Math.max(minScale, Number(value.toFixed(4))));
}
