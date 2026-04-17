"use client";

export interface LoadedTraceAsset {
  assetUrl: string;
  height: number;
  image: HTMLImageElement | null;
  ready: boolean;
  width: number;
}

export interface CanvasSizing {
  width: number;
  height: number;
  pixelRatio: number;
}
