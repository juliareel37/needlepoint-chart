"use client";

import { getContainedRect, getLocalPointWithinRotatedBounds, getPositionedBounds } from "../positioning";
import { getTraceAssetCropRect, getTraceDisplaySize } from "./crop";
import type { TraceMaskRenderSource } from "./mask";
import { drawMaskedTraceSourceToCanvas } from "./mask";
import type { PaletteColor, TraceDocument } from "../store/state";
import type { GridCellValue } from "../store/state";
import type { GridWorldMetrics } from "../viewport";

type PaletteLab = { id: string; L: number; A: number; B: number };

export interface ConvertTraceImageToPatternArgs {
  traceImage: HTMLImageElement;
  traceMaskImage?: TraceMaskRenderSource | null;
  trace: TraceDocument;
  metrics: GridWorldMetrics;
  palette: PaletteColor[];
  maxColors: number;
  smoothing: number;
  sampleCanvas?: HTMLCanvasElement | null;
}

export interface ConvertTraceImageToPatternResult {
  cells: GridCellValue[];
  coveredCellIndexes: number[];
  usedColorIds: string[];
  sampleCanvas: HTMLCanvasElement;
}

export async function loadTraceImage(previewUrl: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = "async";

  if (/^https?:\/\//i.test(previewUrl)) {
    image.crossOrigin = "anonymous";
  }

  return new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Couldn't load the trace image for conversion."));
    image.src = previewUrl;
  });
}

export function convertTraceImageToPattern(
  args: ConvertTraceImageToPatternArgs,
): ConvertTraceImageToPatternResult | null {
  const {
    traceImage,
    traceMaskImage = null,
    trace,
    metrics,
    palette,
    maxColors,
    smoothing,
    sampleCanvas,
  } = args;
  const imageWidth = traceImage.naturalWidth || traceImage.width;
  const imageHeight = traceImage.naturalHeight || traceImage.height;
  const displaySize = getTraceDisplaySize(trace, imageWidth, imageHeight);
  const cropRect = getTraceAssetCropRect(trace, imageWidth, imageHeight);

  if (imageWidth <= 0 || imageHeight <= 0) {
    return null;
  }

  const canvas = sampleCanvas ?? document.createElement("canvas");
  if (canvas.width !== imageWidth || canvas.height !== imageHeight) {
    canvas.width = imageWidth;
    canvas.height = imageHeight;
  }

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return null;
  }

  const maskedSourceCanvas = document.createElement("canvas");
  drawMaskedTraceSourceToCanvas(maskedSourceCanvas, traceImage, {
    trace: {
      ...trace,
      cropX: 0,
      cropY: 0,
      cropWidth: imageWidth,
      cropHeight: imageHeight,
    },
    width: imageWidth,
    height: imageHeight,
    mask: traceMaskImage,
  });
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(maskedSourceCanvas, 0, 0, canvas.width, canvas.height);

  let imageData: ImageData;
  try {
    imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  } catch {
    throw new Error("The trace image could not be sampled. Try re-uploading it and converting again.");
  }

  const paletteLabs = palette
    .map((color) => {
      const rgb = hexToRgbUnit(color.hex);
      if (!rgb) {
        return null;
      }

      const lab = rgbToOklab(rgb.r, rgb.g, rgb.b);
      return { id: color.id, L: lab.L, A: lab.A, B: lab.B };
    })
    .filter((entry): entry is PaletteLab => Boolean(entry));

  if (paletteLabs.length === 0) {
    return null;
  }

  let allowedPalette = paletteLabs;
  const clampedMaxColors = Math.max(2, Math.min(maxColors, paletteLabs.length));
  if (clampedMaxColors < paletteLabs.length) {
    const extractedHexes = extractPaletteFromImageData(imageData, clampedMaxColors);
    const pickedIds: string[] = [];
    const seenIds = new Set<string>();

    for (const hex of extractedHexes) {
      const rgb = hexToRgbUnit(hex);
      if (!rgb) {
        continue;
      }

      const lab = rgbToOklab(rgb.r, rgb.g, rgb.b);
      let bestId: string | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const candidate of paletteLabs) {
        if (seenIds.has(candidate.id)) {
          continue;
        }

        const distance = getLabDistanceSquared(lab, candidate);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestId = candidate.id;
        }
      }

      if (!bestId) {
        continue;
      }

      seenIds.add(bestId);
      pickedIds.push(bestId);
    }

    if (pickedIds.length > 0) {
      const allowedIds = new Set(pickedIds);
      const subset = paletteLabs.filter((entry) => allowedIds.has(entry.id));
      if (subset.length > 0) {
        allowedPalette = subset;
      }
    }
  }

  const cellCount = metrics.width * metrics.height;
  const rawR = new Float32Array(cellCount);
  const rawG = new Float32Array(cellCount);
  const rawB = new Float32Array(cellCount);
  const rawLabL = new Float32Array(cellCount);
  const rawLabA = new Float32Array(cellCount);
  const rawLabB = new Float32Array(cellCount);
  const mask = new Uint8Array(cellCount);

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
  const pitch = metrics.cellSize + metrics.cellGap;

  if (bounds.width <= 0 || bounds.height <= 0 || pitch <= 0) {
    return null;
  }

  for (let y = 0; y < metrics.height; y += 1) {
    const centerY = y * pitch + metrics.cellSize / 2;
    for (let x = 0; x < metrics.width; x += 1) {
      const centerX = x * pitch + metrics.cellSize / 2;
      const localPoint = getLocalPointWithinRotatedBounds(
        { x: centerX, y: centerY },
        bounds,
        trace.rotation,
      );

      if (
        localPoint.x < 0 ||
        localPoint.y < 0 ||
        localPoint.x >= bounds.width ||
        localPoint.y >= bounds.height
      ) {
        continue;
      }

      const pixelX = clampInt(
        Math.floor(cropRect.cropX + (localPoint.x / bounds.width) * cropRect.cropWidth),
        0,
        imageWidth - 1,
      );
      const pixelY = clampInt(
        Math.floor(cropRect.cropY + (localPoint.y / bounds.height) * cropRect.cropHeight),
        0,
        imageHeight - 1,
      );
      const dataIndex = (pixelY * imageWidth + pixelX) * 4;
      const alpha = imageData.data[dataIndex + 3];

      if (alpha < 10) {
        continue;
      }

      const r = imageData.data[dataIndex] / 255;
      const g = imageData.data[dataIndex + 1] / 255;
      const b = imageData.data[dataIndex + 2] / 255;
      const lab = rgbToOklab(r, g, b);
      const cellIndex = getCellIndex(x, y, metrics.width);

      mask[cellIndex] = 1;
      rawR[cellIndex] = r;
      rawG[cellIndex] = g;
      rawB[cellIndex] = b;
      rawLabL[cellIndex] = lab.L;
      rawLabA[cellIndex] = lab.A;
      rawLabB[cellIndex] = lab.B;
    }
  }

  const smoothStrength = clamp01(smoothing);
  const radius = smoothStrength > 0.66 ? 2 : 1;
  const spatialSigma = radius === 2 ? 1.6 : 1;
  const rangeSigma = 0.04 + 0.12 * smoothStrength;
  const rangeSigma2 = 2 * rangeSigma * rangeSigma;
  const offsets: Array<{ dx: number; dy: number; weight: number }> = [];

  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      const distanceSquared = dx * dx + dy * dy;
      offsets.push({
        dx,
        dy,
        weight: Math.exp(-distanceSquared / (2 * spatialSigma * spatialSigma)),
      });
    }
  }

  const smoothR = new Float32Array(cellCount);
  const smoothG = new Float32Array(cellCount);
  const smoothB = new Float32Array(cellCount);
  const smoothLabL = new Float32Array(cellCount);
  const smoothLabA = new Float32Array(cellCount);
  const smoothLabB = new Float32Array(cellCount);

  if (smoothStrength > 0.01) {
    for (let y = 0; y < metrics.height; y += 1) {
      for (let x = 0; x < metrics.width; x += 1) {
        const cellIndex = getCellIndex(x, y, metrics.width);
        if (mask[cellIndex] === 0) {
          continue;
        }

        const baseL = rawLabL[cellIndex];
        const baseA = rawLabA[cellIndex];
        const baseB = rawLabB[cellIndex];
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let sumWeight = 0;

        for (const offset of offsets) {
          const nextX = x + offset.dx;
          const nextY = y + offset.dy;
          if (nextX < 0 || nextY < 0 || nextX >= metrics.width || nextY >= metrics.height) {
            continue;
          }

          const neighborIndex = getCellIndex(nextX, nextY, metrics.width);
          if (mask[neighborIndex] === 0) {
            continue;
          }

          const dL = rawLabL[neighborIndex] - baseL;
          const dA = rawLabA[neighborIndex] - baseA;
          const dB = rawLabB[neighborIndex] - baseB;
          const rangeWeight = Math.exp(-(dL * dL + dA * dA + dB * dB) / rangeSigma2);
          const weight = offset.weight * rangeWeight;

          sumR += rawR[neighborIndex] * weight;
          sumG += rawG[neighborIndex] * weight;
          sumB += rawB[neighborIndex] * weight;
          sumWeight += weight;
        }

        const r = sumWeight > 0 ? sumR / sumWeight : rawR[cellIndex];
        const g = sumWeight > 0 ? sumG / sumWeight : rawG[cellIndex];
        const b = sumWeight > 0 ? sumB / sumWeight : rawB[cellIndex];
        const lab = rgbToOklab(r, g, b);

        smoothR[cellIndex] = r;
        smoothG[cellIndex] = g;
        smoothB[cellIndex] = b;
        smoothLabL[cellIndex] = lab.L;
        smoothLabA[cellIndex] = lab.A;
        smoothLabB[cellIndex] = lab.B;
      }
    }
  } else {
    smoothR.set(rawR);
    smoothG.set(rawG);
    smoothB.set(rawB);
    smoothLabL.set(rawLabL);
    smoothLabA.set(rawLabA);
    smoothLabB.set(rawLabB);
  }

  const quantized = new Array<string | null>(cellCount).fill(null);
  for (let y = 0; y < metrics.height; y += 1) {
    for (let x = 0; x < metrics.width; x += 1) {
      const cellIndex = getCellIndex(x, y, metrics.width);
      if (mask[cellIndex] === 0) {
        continue;
      }

      const cellLab = {
        L: smoothLabL[cellIndex],
        A: smoothLabA[cellIndex],
        B: smoothLabB[cellIndex],
      };
      let bestId = allowedPalette[0]?.id ?? null;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const candidate of allowedPalette) {
        const distance = getLabDistanceSquared(cellLab, candidate);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestId = candidate.id;
        }
      }

      quantized[cellIndex] = bestId;
    }
  }

  const edgeStrength = new Float32Array(cellCount);
  for (let y = 0; y < metrics.height; y += 1) {
    for (let x = 0; x < metrics.width; x += 1) {
      const cellIndex = getCellIndex(x, y, metrics.width);
      if (mask[cellIndex] === 0) {
        continue;
      }

      const l0 = smoothLabL[cellIndex];
      const a0 = smoothLabA[cellIndex];
      const b0 = smoothLabB[cellIndex];
      let maxDistance = 0;

      const maybeAccumulate = (neighborX: number, neighborY: number) => {
        if (
          neighborX < 0 ||
          neighborY < 0 ||
          neighborX >= metrics.width ||
          neighborY >= metrics.height
        ) {
          return;
        }

        const neighborIndex = getCellIndex(neighborX, neighborY, metrics.width);
        if (mask[neighborIndex] === 0) {
          return;
        }

        const dL = l0 - smoothLabL[neighborIndex];
        const dA = a0 - smoothLabA[neighborIndex];
        const dB = b0 - smoothLabB[neighborIndex];
        const distance = dL * dL + dA * dA + dB * dB;
        if (distance > maxDistance) {
          maxDistance = distance;
        }
      };

      maybeAccumulate(x - 1, y);
      maybeAccumulate(x + 1, y);
      maybeAccumulate(x, y - 1);
      maybeAccumulate(x, y + 1);

      edgeStrength[cellIndex] = maxDistance;
    }
  }

  let cleaned = quantized.slice();
  const visited = new Uint8Array(cellCount);
  const stack = new Int32Array(cellCount);
  const minBlobSize = Math.max(2, Math.round(2 + smoothStrength * 6));
  const edgeThreshold = 0.1 + (1 - smoothStrength) * 0.08;
  const edgeThresholdSquared = edgeThreshold * edgeThreshold;

  for (let index = 0; index < cellCount; index += 1) {
    const colorId = cleaned[index];
    if (!colorId || visited[index]) {
      continue;
    }

    let stackPointer = 0;
    stack[stackPointer++] = index;
    visited[index] = 1;
    let size = 0;
    let maxEdge = 0;
    const componentIndices: number[] = [];
    const neighborCounts = new Map<string | null, number>();

    while (stackPointer > 0) {
      const currentIndex = stack[--stackPointer];
      size += 1;
      if (size <= minBlobSize) {
        componentIndices.push(currentIndex);
      }
      if (edgeStrength[currentIndex] > maxEdge) {
        maxEdge = edgeStrength[currentIndex];
      }

      const x = currentIndex % metrics.width;
      const y = Math.floor(currentIndex / metrics.width);
      const checkNeighbor = (neighborX: number, neighborY: number) => {
        if (
          neighborX < 0 ||
          neighborY < 0 ||
          neighborX >= metrics.width ||
          neighborY >= metrics.height
        ) {
          return;
        }

        const neighborIndex = getCellIndex(neighborX, neighborY, metrics.width);
        const neighborId = cleaned[neighborIndex];
        if (neighborId === colorId) {
          if (!visited[neighborIndex]) {
            visited[neighborIndex] = 1;
            stack[stackPointer++] = neighborIndex;
          }
          return;
        }

        neighborCounts.set(
          neighborId,
          (neighborCounts.get(neighborId) ?? 0) + 1,
        );
      };

      checkNeighbor(x - 1, y);
      checkNeighbor(x + 1, y);
      checkNeighbor(x, y - 1);
      checkNeighbor(x, y + 1);
    }

    if (size <= minBlobSize && maxEdge < edgeThresholdSquared) {
      let replacementId = colorId;
      let bestCount = -1;

      for (const [neighborId, count] of neighborCounts) {
        if (!neighborId || count <= bestCount) {
          continue;
        }

        bestCount = count;
        replacementId = neighborId;
      }

      if (replacementId !== colorId) {
        for (const componentIndex of componentIndices) {
          cleaned[componentIndex] = replacementId;
        }
      }
    }
  }

  const majorityPasses = smoothStrength > 0.7 ? 2 : 1;
  for (let pass = 0; pass < majorityPasses; pass += 1) {
    cleaned = runMajorityCleanupPass(
      cleaned,
      mask,
      edgeStrength,
      edgeThresholdSquared,
      metrics.width,
      metrics.height,
    );
  }

  if (smoothStrength > 0.75) {
    cleaned = runMajorityCleanupPass(
      cleaned,
      mask,
      edgeStrength,
      edgeThresholdSquared,
      metrics.width,
      metrics.height,
    );
  }

  const usedColorIds: string[] = [];
  const seenColorIds = new Set<string>();
  const coveredCellIndexes: number[] = [];

  for (let index = 0; index < cleaned.length; index += 1) {
    if (mask[index]) {
      coveredCellIndexes.push(index);
    }

    const colorId = cleaned[index];
    if (!colorId || seenColorIds.has(colorId)) {
      continue;
    }

    seenColorIds.add(colorId);
    usedColorIds.push(colorId);
  }

  return {
    cells: cleaned,
    coveredCellIndexes,
    usedColorIds,
    sampleCanvas: canvas,
  };
}

function runMajorityCleanupPass(
  cells: Array<string | null>,
  mask: Uint8Array,
  edgeStrength: Float32Array,
  edgeThresholdSquared: number,
  width: number,
  height: number,
): Array<string | null> {
  const updated = cells.slice();

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const cellIndex = getCellIndex(x, y, width);
      if (mask[cellIndex] === 0 || edgeStrength[cellIndex] >= edgeThresholdSquared) {
        continue;
      }

      const currentId = cells[cellIndex];
      if (!currentId) {
        continue;
      }

      const counts = new Map<string, number>();
      const countNeighbor = (neighborX: number, neighborY: number) => {
        if (neighborX < 0 || neighborY < 0 || neighborX >= width || neighborY >= height) {
          return;
        }

        const neighborIndex = getCellIndex(neighborX, neighborY, width);
        if (mask[neighborIndex] === 0) {
          return;
        }

        const neighborId = cells[neighborIndex];
        if (!neighborId) {
          return;
        }

        counts.set(neighborId, (counts.get(neighborId) ?? 0) + 1);
      };

      countNeighbor(x - 1, y);
      countNeighbor(x + 1, y);
      countNeighbor(x, y - 1);
      countNeighbor(x, y + 1);
      countNeighbor(x - 1, y - 1);
      countNeighbor(x + 1, y - 1);
      countNeighbor(x - 1, y + 1);
      countNeighbor(x + 1, y + 1);

      let bestId = currentId;
      let bestCount = 0;
      for (const [neighborId, count] of counts) {
        if (count > bestCount) {
          bestCount = count;
          bestId = neighborId;
        }
      }

      if (bestId !== currentId && bestCount >= 5) {
        updated[cellIndex] = bestId;
      }
    }
  }

  return updated;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getCellIndex(x: number, y: number, width: number): number {
  return y * width + x;
}

function hexToRgbUnit(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace(/^#/, "");
  if (normalized.length !== 6) {
    return null;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
    return null;
  }

  return { r: r / 255, g: g / 255, b: b / 255 };
}

function getLabDistanceSquared(
  left: { L: number; A: number; B: number },
  right: { L: number; A: number; B: number },
): number {
  const dL = left.L - right.L;
  const dA = left.A - right.A;
  const dB = left.B - right.B;
  return dL * dL + dA * dA + dB * dB;
}

function srgbToLinear(value: number): number {
  return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}

function linearToSrgb(value: number): number {
  return value <= 0.0031308 ? value * 12.92 : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
}

function rgbToOklab(r: number, g: number, b: number): {
  L: number;
  A: number;
  B: number;
} {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);

  return {
    L: 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot,
    A: 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot,
    B: 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot,
  };
}

function oklabToRgb(L: number, A: number, B: number): {
  r: number;
  g: number;
  b: number;
} {
  const lRoot = L + 0.3963377774 * A + 0.2158037573 * B;
  const mRoot = L - 0.1055613458 * A - 0.0638541728 * B;
  const sRoot = L - 0.0894841775 * A - 1.291485548 * B;
  const l = lRoot * lRoot * lRoot;
  const m = mRoot * mRoot * mRoot;
  const s = sRoot * sRoot * sRoot;
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return {
    r: linearToSrgb(lr),
    g: linearToSrgb(lg),
    b: linearToSrgb(lb),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number) =>
    Math.round(clamp01(value) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function sampleImageOklab(imageData: ImageData, maxSamples: number): {
  values: Float32Array;
  count: number;
} {
  const { width, height, data } = imageData;
  if (width <= 0 || height <= 0) {
    return { values: new Float32Array(0), count: 0 };
  }

  const totalPixels = width * height;
  const step = Math.max(1, Math.floor(Math.sqrt(totalPixels / Math.max(maxSamples, 1))));
  const values = new Float32Array(Math.ceil(totalPixels / (step * step)) * 3);
  let count = 0;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const dataIndex = (y * width + x) * 4;
      if (data[dataIndex + 3] < 16) {
        continue;
      }

      const lab = rgbToOklab(
        data[dataIndex] / 255,
        data[dataIndex + 1] / 255,
        data[dataIndex + 2] / 255,
      );
      const offset = count * 3;
      values[offset] = lab.L;
      values[offset + 1] = lab.A;
      values[offset + 2] = lab.B;
      count += 1;
    }
  }

  return { values, count };
}

function kMeansOklab(
  samples: { values: Float32Array; count: number },
  k: number,
  iterations = 8,
): { centers: Float32Array; counts: Int32Array } {
  const count = samples.count;
  const values = samples.values;
  if (count === 0 || k <= 0) {
    return { centers: new Float32Array(0), counts: new Int32Array(0) };
  }

  const centers = new Float32Array(k * 3);
  const counts = new Int32Array(k);
  const nearestDistance = new Float32Array(count);

  let meanL = 0;
  let meanA = 0;
  let meanB = 0;
  for (let index = 0; index < count; index += 1) {
    meanL += values[index * 3];
    meanA += values[index * 3 + 1];
    meanB += values[index * 3 + 2];
  }
  meanL /= count;
  meanA /= count;
  meanB /= count;

  let firstCenterIndex = 0;
  let maxDistance = -1;
  for (let index = 0; index < count; index += 1) {
    const dL = values[index * 3] - meanL;
    const dA = values[index * 3 + 1] - meanA;
    const dB = values[index * 3 + 2] - meanB;
    const distance = dL * dL + dA * dA + dB * dB;
    if (distance > maxDistance) {
      maxDistance = distance;
      firstCenterIndex = index;
    }
  }

  centers[0] = values[firstCenterIndex * 3];
  centers[1] = values[firstCenterIndex * 3 + 1];
  centers[2] = values[firstCenterIndex * 3 + 2];

  for (let index = 0; index < count; index += 1) {
    const dL = values[index * 3] - centers[0];
    const dA = values[index * 3 + 1] - centers[1];
    const dB = values[index * 3 + 2] - centers[2];
    nearestDistance[index] = dL * dL + dA * dA + dB * dB;
  }

  for (let centerIndex = 1; centerIndex < k; centerIndex += 1) {
    let farthestIndex = 0;
    let farthestDistance = -1;
    for (let sampleIndex = 0; sampleIndex < count; sampleIndex += 1) {
      const distance = nearestDistance[sampleIndex];
      if (distance > farthestDistance) {
        farthestDistance = distance;
        farthestIndex = sampleIndex;
      }
    }

    const centerOffset = centerIndex * 3;
    centers[centerOffset] = values[farthestIndex * 3];
    centers[centerOffset + 1] = values[farthestIndex * 3 + 1];
    centers[centerOffset + 2] = values[farthestIndex * 3 + 2];

    for (let sampleIndex = 0; sampleIndex < count; sampleIndex += 1) {
      const dL = values[sampleIndex * 3] - centers[centerOffset];
      const dA = values[sampleIndex * 3 + 1] - centers[centerOffset + 1];
      const dB = values[sampleIndex * 3 + 2] - centers[centerOffset + 2];
      const distance = dL * dL + dA * dA + dB * dB;
      if (distance < nearestDistance[sampleIndex]) {
        nearestDistance[sampleIndex] = distance;
      }
    }
  }

  const sums = new Float32Array(k * 3);
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    counts.fill(0);
    sums.fill(0);

    for (let sampleIndex = 0; sampleIndex < count; sampleIndex += 1) {
      let bestCenter = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      const L = values[sampleIndex * 3];
      const A = values[sampleIndex * 3 + 1];
      const B = values[sampleIndex * 3 + 2];

      for (let centerIndex = 0; centerIndex < k; centerIndex += 1) {
        const centerOffset = centerIndex * 3;
        const dL = L - centers[centerOffset];
        const dA = A - centers[centerOffset + 1];
        const dB = B - centers[centerOffset + 2];
        const distance = dL * dL + dA * dA + dB * dB;
        if (distance < bestDistance) {
          bestDistance = distance;
          bestCenter = centerIndex;
        }
      }

      counts[bestCenter] += 1;
      const sumOffset = bestCenter * 3;
      sums[sumOffset] += L;
      sums[sumOffset + 1] += A;
      sums[sumOffset + 2] += B;
    }

    for (let centerIndex = 0; centerIndex < k; centerIndex += 1) {
      const countForCenter = counts[centerIndex];
      const centerOffset = centerIndex * 3;

      if (countForCenter > 0) {
        centers[centerOffset] = sums[centerOffset] / countForCenter;
        centers[centerOffset + 1] = sums[centerOffset + 1] / countForCenter;
        centers[centerOffset + 2] = sums[centerOffset + 2] / countForCenter;
      }
    }
  }

  return { centers, counts };
}

function selectDiverseClusters(
  centers: Float32Array,
  counts: Int32Array,
  targetCount: number,
): number[] {
  const available: number[] = [];
  let maxCount = 0;
  for (let index = 0; index < counts.length; index += 1) {
    const count = counts[index];
    if (count <= 0) {
      continue;
    }

    available.push(index);
    if (count > maxCount) {
      maxCount = count;
    }
  }

  if (available.length <= targetCount) {
    return available;
  }

  let bestSeed = available[0] ?? 0;
  for (const index of available) {
    if (counts[index] > counts[bestSeed]) {
      bestSeed = index;
    }
  }

  const selected = [bestSeed];
  const selectedSet = new Set<number>(selected);
  const chromaByIndex = new Float32Array(counts.length);
  const hueByIndex = new Float32Array(counts.length);

  for (let index = 0; index < counts.length; index += 1) {
    const offset = index * 3;
    const A = centers[offset + 1];
    const B = centers[offset + 2];
    chromaByIndex[index] = Math.sqrt(A * A + B * B);

    let hue = Math.atan2(B, A);
    if (hue < 0) {
      hue += Math.PI * 2;
    }
    hueByIndex[index] = hue;
  }

  const hueBins = 12;
  const hueBinCounts = new Int32Array(hueBins);
  hueBinCounts[Math.min(hueBins - 1, Math.floor((hueByIndex[bestSeed] / (Math.PI * 2)) * hueBins))] += 1;

  while (selected.length < targetCount) {
    let nextIndex = -1;
    let bestScore = -1;

    for (const index of available) {
      if (selectedSet.has(index)) {
        continue;
      }

      const importance = Math.log1p(counts[index]) / Math.log1p(maxCount || 1);
      const offset = index * 3;
      let minDistance = Number.POSITIVE_INFINITY;
      let minHueDistance = Number.POSITIVE_INFINITY;

      for (const selectedIndex of selected) {
        const selectedOffset = selectedIndex * 3;
        const dL = centers[offset] - centers[selectedOffset];
        const dA = centers[offset + 1] - centers[selectedOffset + 1];
        const dB = centers[offset + 2] - centers[selectedOffset + 2];
        const distance = Math.sqrt(dL * dL + dA * dA + dB * dB);
        if (distance < minDistance) {
          minDistance = distance;
        }

        const rawHueDistance = Math.abs(hueByIndex[index] - hueByIndex[selectedIndex]);
        const hueDistance = Math.min(rawHueDistance, Math.PI * 2 - rawHueDistance);
        if (hueDistance < minHueDistance) {
          minHueDistance = hueDistance;
        }
      }

      const chroma = chromaByIndex[index];
      const chromaFactor = chroma / (chroma + 0.05);
      const bin = Math.min(hueBins - 1, Math.floor((hueByIndex[index] / (Math.PI * 2)) * hueBins));
      const binPenalty = 1 / (1 + hueBinCounts[bin] * 0.8);
      const score =
        (
          0.6 * importance +
          1.8 * minDistance +
          1.2 * (1 - importance) * minDistance +
          0.6 * minHueDistance * chromaFactor +
          0.5 * chroma * (1 - importance)
        ) * binPenalty;

      if (score > bestScore) {
        bestScore = score;
        nextIndex = index;
      }
    }

    if (nextIndex === -1) {
      break;
    }

    selected.push(nextIndex);
    selectedSet.add(nextIndex);
    const bin = Math.min(hueBins - 1, Math.floor((hueByIndex[nextIndex] / (Math.PI * 2)) * hueBins));
    hueBinCounts[bin] += 1;
  }

  return selected;
}

function extractPaletteFromImageData(imageData: ImageData, maxColors: number): string[] {
  const samples = sampleImageOklab(imageData, 40_000);
  if (samples.count === 0) {
    return [];
  }

  const target = Math.max(2, Math.min(maxColors, samples.count));
  const overCluster = Math.min(samples.count, Math.max(target * 5, Math.round(target * 6)));
  const { centers, counts } = kMeansOklab(samples, overCluster, 8);
  const selected = selectDiverseClusters(centers, counts, target);
  const palette: string[] = [];
  const seenHexes = new Set<string>();

  for (const index of selected) {
    const offset = index * 3;
    const rgb = oklabToRgb(
      centers[offset],
      centers[offset + 1],
      centers[offset + 2],
    );
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    if (seenHexes.has(hex)) {
      continue;
    }

    seenHexes.add(hex);
    palette.push(hex);
    if (palette.length >= target) {
      break;
    }
  }

  if (palette.length < target) {
    const byCount = Array.from({ length: counts.length }, (_, index) => index).sort(
      (left, right) => counts[right] - counts[left],
    );

    for (const index of byCount) {
      const offset = index * 3;
      const rgb = oklabToRgb(
        centers[offset],
        centers[offset + 1],
        centers[offset + 2],
      );
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      if (seenHexes.has(hex)) {
        continue;
      }

      seenHexes.add(hex);
      palette.push(hex);
      if (palette.length >= target) {
        break;
      }
    }
  }

  return palette;
}
