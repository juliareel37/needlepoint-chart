import type { GridWorldMetrics, WorldPoint } from "@/lib/editor-v2/editor/viewport";
import { getContainedRect } from "@/lib/editor-v2/editor/positioning";

export function getInitialPlacementTransform(options: {
  intrinsicWidth: number;
  intrinsicHeight: number;
  metrics: GridWorldMetrics;
  viewportCenter: WorldPoint | null;
  widthRatio: number;
}): { offsetX: number; offsetY: number; scale: number } {
  const baseRect = getContainedRect(
    options.intrinsicWidth,
    options.intrinsicHeight,
    options.metrics.surfaceWidth,
    options.metrics.surfaceHeight,
  );
  const targetWidth = options.metrics.surfaceWidth * options.widthRatio;
  const scale = clampScale(targetWidth / Math.max(baseRect.width, 1));
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

function clampScale(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(4, Math.max(0.1, Number(value.toFixed(4))));
}
