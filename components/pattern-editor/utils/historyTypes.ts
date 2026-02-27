"use client";

export type TraceSnapshot = {
  imageUrl: string | null;
  image: HTMLImageElement | null;
  scale: number;
  offsetX: number;
  offsetY: number;
  cellSizeBasis?: number;
  locked: boolean;
  editMode: boolean;
  postUpload: boolean;
  fileName: string | null;
  fileSize: number | null;
};

export type Snapshot = {
  gridW: number;
  gridH: number;
  grid: Uint16Array;
  trace?: TraceSnapshot | null;
};
