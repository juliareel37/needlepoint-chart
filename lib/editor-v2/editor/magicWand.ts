export type EraserEditMode = "brush" | "magic";
export type EraserMode = "erase" | "restore";

export interface ConnectedMagicSelection {
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } | null;
  pixels: Uint8Array;
  selectedPixelCount: number;
  tolerance: number;
}

const MAGIC_WAND_MAX_TOLERANCE = 220;
const MAGIC_WAND_MAX_DRAG_DISTANCE = 180;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getMagicWandToleranceFromDragDistance(dragDistance: number): number {
  if (!Number.isFinite(dragDistance) || dragDistance <= 0) {
    return 0;
  }

  const normalizedDistance = clamp(dragDistance / MAGIC_WAND_MAX_DRAG_DISTANCE, 0, 1);
  return Math.round(MAGIC_WAND_MAX_TOLERANCE * normalizedDistance);
}

function getPixelOffset(x: number, y: number, width: number): number {
  return (y * width + x) * 4;
}

function getPixelIndex(x: number, y: number, width: number): number {
  return y * width + x;
}

function getSeedColor(
  imageData: ImageData,
  seedX: number,
  seedY: number,
): [number, number, number, number] {
  const offset = getPixelOffset(seedX, seedY, imageData.width);
  const { data } = imageData;
  return [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]];
}

function colorDistance(
  colorA: [number, number, number, number],
  colorB: [number, number, number, number],
): number {
  const redDelta = colorA[0] - colorB[0];
  const greenDelta = colorA[1] - colorB[1];
  const blueDelta = colorA[2] - colorB[2];
  const alphaDelta = colorA[3] - colorB[3];

  return Math.sqrt(
    redDelta * redDelta +
      greenDelta * greenDelta +
      blueDelta * blueDelta +
      alphaDelta * alphaDelta,
  );
}

export function createConnectedMagicSelection(options: {
  imageData: ImageData;
  seedX: number;
  seedY: number;
  tolerance: number;
}): ConnectedMagicSelection {
  const { imageData } = options;
  const { width, height } = imageData;
  const seedX = clamp(Math.floor(options.seedX), 0, Math.max(width - 1, 0));
  const seedY = clamp(Math.floor(options.seedY), 0, Math.max(height - 1, 0));
  const tolerance = clamp(options.tolerance, 0, MAGIC_WAND_MAX_TOLERANCE);
  const pixels = new Uint8Array(width * height);

  if (width <= 0 || height <= 0) {
    return {
      bounds: null,
      pixels,
      selectedPixelCount: 0,
      tolerance,
    };
  }

  const visited = new Uint8Array(width * height);
  const queueX = new Int32Array(width * height);
  const queueY = new Int32Array(width * height);
  const seedColor = getSeedColor(imageData, seedX, seedY);
  let head = 0;
  let tail = 0;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let selectedPixelCount = 0;

  queueX[tail] = seedX;
  queueY[tail] = seedY;
  tail += 1;
  visited[getPixelIndex(seedX, seedY, width)] = 1;

  while (head < tail) {
    const x = queueX[head];
    const y = queueY[head];
    head += 1;

    const offset = getPixelOffset(x, y, width);
    const candidateColor: [number, number, number, number] = [
      imageData.data[offset],
      imageData.data[offset + 1],
      imageData.data[offset + 2],
      imageData.data[offset + 3],
    ];

    if (colorDistance(candidateColor, seedColor) > tolerance) {
      continue;
    }

    const pixelIndex = getPixelIndex(x, y, width);
    pixels[pixelIndex] = 1;
    selectedPixelCount += 1;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);

    if (x > 0) {
      const leftIndex = getPixelIndex(x - 1, y, width);
      if (visited[leftIndex] === 0) {
        visited[leftIndex] = 1;
        queueX[tail] = x - 1;
        queueY[tail] = y;
        tail += 1;
      }
    }

    if (x + 1 < width) {
      const rightIndex = getPixelIndex(x + 1, y, width);
      if (visited[rightIndex] === 0) {
        visited[rightIndex] = 1;
        queueX[tail] = x + 1;
        queueY[tail] = y;
        tail += 1;
      }
    }

    if (y > 0) {
      const upIndex = getPixelIndex(x, y - 1, width);
      if (visited[upIndex] === 0) {
        visited[upIndex] = 1;
        queueX[tail] = x;
        queueY[tail] = y - 1;
        tail += 1;
      }
    }

    if (y + 1 < height) {
      const downIndex = getPixelIndex(x, y + 1, width);
      if (visited[downIndex] === 0) {
        visited[downIndex] = 1;
        queueX[tail] = x;
        queueY[tail] = y + 1;
        tail += 1;
      }
    }
  }

  return {
    bounds:
      selectedPixelCount > 0
        ? {
            minX,
            minY,
            maxX,
            maxY,
          }
        : null,
    pixels,
    selectedPixelCount,
    tolerance,
  };
}

export function applyMagicSelectionToMaskCanvas(options: {
  maskCanvas: HTMLCanvasElement;
  selection: ConnectedMagicSelection;
}): void {
  const { maskCanvas, selection } = options;
  if (!selection.bounds || selection.selectedPixelCount === 0) {
    return;
  }

  const context = maskCanvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return;
  }

  const { minX, minY, maxX, maxY } = selection.bounds;
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const imageData = context.getImageData(minX, minY, width, height);

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const selectedIndex = getPixelIndex(x, y, maskCanvas.width);
      if (selection.pixels[selectedIndex] === 0) {
        continue;
      }

      const localIndex = getPixelOffset(x - minX, y - minY, width);
      imageData.data[localIndex] = 255;
      imageData.data[localIndex + 1] = 255;
      imageData.data[localIndex + 2] = 255;
      imageData.data[localIndex + 3] = 0;
    }
  }

  context.putImageData(imageData, minX, minY);
}
