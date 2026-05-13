"use client";

import type { TraceCropRect } from "@/lib/editor-v2/editor/trace/crop";

export interface LoadedTraceAsset {
  previewUrl: string;
  height: number;
  image: CanvasImageSource | null;
  mask: {
    url: string;
    width: number;
    height: number;
    image: CanvasImageSource;
  } | null;
  ready: boolean;
  width: number;
}

export interface CanvasSizing {
  width: number;
  height: number;
  pixelRatio: number;
}

export type TraceDisplayOverride = TraceCropRect | null;
