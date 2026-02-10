import type { Color } from "../../../lib/grid";
import { idx } from "../../../lib/grid";
import { clamp01, extractPaletteFromImage, rgbToOklab } from "./colorUtils";

type PaletteLab = { id: number; L: number; A: number; B: number };

type ConvertImageToPatternArgs = {
  traceImage: HTMLImageElement;
  fitCellSize: number;
  traceScale: number;
  traceOffsetX: number;
  traceOffsetY: number;
  palette: Color[];
  maxColors: number;
  smoothing: number;
  gridW: number;
  gridH: number;
  sampleCanvas?: HTMLCanvasElement | null;
};

type ConvertImageToPatternResult = {
  grid: Uint16Array;
  sampleCanvas: HTMLCanvasElement;
};

export function convertImageToPattern(args: ConvertImageToPatternArgs): ConvertImageToPatternResult | null {
  const {
    traceImage,
    fitCellSize,
    traceScale,
    traceOffsetX,
    traceOffsetY,
    palette,
    maxColors,
    smoothing,
    gridW,
    gridH,
    sampleCanvas,
  } = args;

  if (!traceImage) return null;
  if (!Number.isFinite(fitCellSize) || fitCellSize <= 0) return null;
  if (!Number.isFinite(traceScale) || traceScale <= 0) return null;

  const canvas = sampleCanvas ?? document.createElement("canvas");
  if (canvas.width !== traceImage.width || canvas.height !== traceImage.height) {
    canvas.width = traceImage.width;
    canvas.height = traceImage.height;
  }
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(traceImage, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const paletteLabs = palette
    .map((color) => {
      const clean = color.hex.replace("#", "");
      if (clean.length !== 6) return null;
      const r = parseInt(clean.slice(0, 2), 16) / 255;
      const g = parseInt(clean.slice(2, 4), 16) / 255;
      const b = parseInt(clean.slice(4, 6), 16) / 255;
      if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
      const lab = rgbToOklab(r, g, b);
      return { id: color.id, L: lab.L, A: lab.A, B: lab.B };
    })
    .filter((entry): entry is PaletteLab => Boolean(entry));
  if (paletteLabs.length === 0) return null;

  let allowedPalette = paletteLabs;
  const clampedMaxColors = Math.max(2, Math.min(maxColors, paletteLabs.length));
  if (clampedMaxColors < paletteLabs.length) {
    const hexes = extractPaletteFromImage(traceImage, clampedMaxColors);
    const picked: number[] = [];
    const seen = new Set<number>();
    for (const hex of hexes) {
      const clean = hex.replace("#", "");
      if (clean.length !== 6) continue;
      const r = parseInt(clean.slice(0, 2), 16) / 255;
      const g = parseInt(clean.slice(2, 4), 16) / 255;
      const b = parseInt(clean.slice(4, 6), 16) / 255;
      if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) continue;
      const lab = rgbToOklab(r, g, b);
      let bestId: number | null = null;
      let bestDist = Number.POSITIVE_INFINITY;
      for (const candidate of paletteLabs) {
        if (seen.has(candidate.id)) continue;
        const dx = lab.L - candidate.L;
        const dy = lab.A - candidate.A;
        const dz = lab.B - candidate.B;
        const dist = dx * dx + dy * dy + dz * dz;
        if (dist < bestDist) {
          bestDist = dist;
          bestId = candidate.id;
        }
      }
      if (bestId == null) continue;
      seen.add(bestId);
      picked.push(bestId);
    }
    if (picked.length > 0) {
      const allowed = new Set(picked);
      const subset = paletteLabs.filter((entry) => allowed.has(entry.id));
      if (subset.length > 0) {
        allowedPalette = subset;
      }
    }
  }

  const imgW = canvas.width;
  const imgH = canvas.height;
  const cellCount = gridW * gridH;
  const rawR = new Float32Array(cellCount);
  const rawG = new Float32Array(cellCount);
  const rawB = new Float32Array(cellCount);
  const rawLabL = new Float32Array(cellCount);
  const rawLabA = new Float32Array(cellCount);
  const rawLabB = new Float32Array(cellCount);
  const mask = new Uint8Array(cellCount);

  for (let y = 0; y < gridH; y++) {
    const centerY = (y + 0.5) * fitCellSize;
    const imgY = (centerY - traceOffsetY) / traceScale;
    if (imgY < 0 || imgY >= imgH) continue;
    const iy = Math.floor(imgY);
    const rowOffset = iy * imgW * 4;
    for (let x = 0; x < gridW; x++) {
      const centerX = (x + 0.5) * fitCellSize;
      const imgX = (centerX - traceOffsetX) / traceScale;
      if (imgX < 0 || imgX >= imgW) continue;
      const ix = Math.floor(imgX);
      const idx4 = rowOffset + ix * 4;
      const alpha = data[idx4 + 3];
      if (alpha < 10) continue;
      const r = data[idx4] / 255;
      const g = data[idx4 + 1] / 255;
      const b = data[idx4 + 2] / 255;
      const lab = rgbToOklab(r, g, b);
      const cellIdx = idx(x, y, gridW);
      mask[cellIdx] = 1;
      rawR[cellIdx] = r;
      rawG[cellIdx] = g;
      rawB[cellIdx] = b;
      rawLabL[cellIdx] = lab.L;
      rawLabA[cellIdx] = lab.A;
      rawLabB[cellIdx] = lab.B;
    }
  }

  const smoothStrength = clamp01(smoothing);
  const radius = smoothStrength > 0.66 ? 2 : 1;
  const spatialSigma = radius === 2 ? 1.6 : 1;
  const rangeSigma = 0.04 + 0.12 * smoothStrength;
  const rangeSigma2 = 2 * rangeSigma * rangeSigma;
  const offsets: { dx: number; dy: number; w: number }[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const dist2 = dx * dx + dy * dy;
      const w = Math.exp(-dist2 / (2 * spatialSigma * spatialSigma));
      offsets.push({ dx, dy, w });
    }
  }

  const smoothR = new Float32Array(cellCount);
  const smoothG = new Float32Array(cellCount);
  const smoothB = new Float32Array(cellCount);
  const smoothLabL = new Float32Array(cellCount);
  const smoothLabA = new Float32Array(cellCount);
  const smoothLabB = new Float32Array(cellCount);

  if (smoothStrength > 0.01) {
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const cellIdx = idx(x, y, gridW);
        if (mask[cellIdx] === 0) continue;
        const baseL = rawLabL[cellIdx];
        const baseA = rawLabA[cellIdx];
        const baseB = rawLabB[cellIdx];
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let sumW = 0;
        for (const offset of offsets) {
          const nx = x + offset.dx;
          const ny = y + offset.dy;
          if (nx < 0 || ny < 0 || nx >= gridW || ny >= gridH) continue;
          const nIdx = idx(nx, ny, gridW);
          if (mask[nIdx] === 0) continue;
          const dL = rawLabL[nIdx] - baseL;
          const dA = rawLabA[nIdx] - baseA;
          const dB = rawLabB[nIdx] - baseB;
          const dist = dL * dL + dA * dA + dB * dB;
          const rangeW = Math.exp(-dist / rangeSigma2);
          const weight = offset.w * rangeW;
          sumR += rawR[nIdx] * weight;
          sumG += rawG[nIdx] * weight;
          sumB += rawB[nIdx] * weight;
          sumW += weight;
        }
        const r = sumW > 0 ? sumR / sumW : rawR[cellIdx];
        const g = sumW > 0 ? sumG / sumW : rawG[cellIdx];
        const b = sumW > 0 ? sumB / sumW : rawB[cellIdx];
        smoothR[cellIdx] = r;
        smoothG[cellIdx] = g;
        smoothB[cellIdx] = b;
        const lab = rgbToOklab(r, g, b);
        smoothLabL[cellIdx] = lab.L;
        smoothLabA[cellIdx] = lab.A;
        smoothLabB[cellIdx] = lab.B;
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

  const quantized = new Uint16Array(cellCount);
  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const cellIdx = idx(x, y, gridW);
      if (mask[cellIdx] === 0) continue;
      const labL = smoothLabL[cellIdx];
      const labA = smoothLabA[cellIdx];
      const labB = smoothLabB[cellIdx];
      let bestId = allowedPalette[0].id;
      let bestDist = Number.POSITIVE_INFINITY;
      for (const candidate of allowedPalette) {
        const dx = labL - candidate.L;
        const dy = labA - candidate.A;
        const dz = labB - candidate.B;
        const dist = dx * dx + dy * dy + dz * dz;
        if (dist < bestDist) {
          bestDist = dist;
          bestId = candidate.id;
        }
      }
      quantized[cellIdx] = bestId;
    }
  }

  const edgeStrength = new Float32Array(cellCount);
  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const cellIdx = idx(x, y, gridW);
      if (mask[cellIdx] === 0) continue;
      const l0 = smoothLabL[cellIdx];
      const a0 = smoothLabA[cellIdx];
      const b0 = smoothLabB[cellIdx];
      let maxDist = 0;
      if (x > 0) {
        const nIdx = cellIdx - 1;
        if (mask[nIdx]) {
          const dl = l0 - smoothLabL[nIdx];
          const da = a0 - smoothLabA[nIdx];
          const db = b0 - smoothLabB[nIdx];
          const dist = dl * dl + da * da + db * db;
          if (dist > maxDist) maxDist = dist;
        }
      }
      if (x < gridW - 1) {
        const nIdx = cellIdx + 1;
        if (mask[nIdx]) {
          const dl = l0 - smoothLabL[nIdx];
          const da = a0 - smoothLabA[nIdx];
          const db = b0 - smoothLabB[nIdx];
          const dist = dl * dl + da * da + db * db;
          if (dist > maxDist) maxDist = dist;
        }
      }
      if (y > 0) {
        const nIdx = cellIdx - gridW;
        if (mask[nIdx]) {
          const dl = l0 - smoothLabL[nIdx];
          const da = a0 - smoothLabA[nIdx];
          const db = b0 - smoothLabB[nIdx];
          const dist = dl * dl + da * da + db * db;
          if (dist > maxDist) maxDist = dist;
        }
      }
      if (y < gridH - 1) {
        const nIdx = cellIdx + gridW;
        if (mask[nIdx]) {
          const dl = l0 - smoothLabL[nIdx];
          const da = a0 - smoothLabA[nIdx];
          const db = b0 - smoothLabB[nIdx];
          const dist = dl * dl + da * da + db * db;
          if (dist > maxDist) maxDist = dist;
        }
      }
      edgeStrength[cellIdx] = maxDist;
    }
  }

  let cleaned = quantized;
  const visited = new Uint8Array(cellCount);
  const stack = new Int32Array(cellCount);
  const minBlobSize = Math.max(2, Math.round(2 + smoothStrength * 6));
  const edgeThreshold = 0.1 + (1 - smoothStrength) * 0.08;
  const edgeThresholdSq = edgeThreshold * edgeThreshold;

  for (let i = 0; i < cellCount; i++) {
    const colorId = cleaned[i];
    if (colorId === 0 || visited[i]) continue;
    let sp = 0;
    stack[sp++] = i;
    visited[i] = 1;
    let size = 0;
    let maxEdge = 0;
    const compIndices: number[] = [];
    const neighborCounts = new Map<number, number>();

    while (sp > 0) {
      const idxCell = stack[--sp];
      size += 1;
      if (size <= minBlobSize) compIndices.push(idxCell);
      if (edgeStrength[idxCell] > maxEdge) maxEdge = edgeStrength[idxCell];
      const x = idxCell % gridW;
      const y = Math.floor(idxCell / gridW);

      const checkNeighbor = (nx: number, ny: number) => {
        if (nx < 0 || ny < 0 || nx >= gridW || ny >= gridH) return;
        const nIdx = idx(nx, ny, gridW);
        const nId = cleaned[nIdx];
        if (nId === colorId) {
          if (!visited[nIdx]) {
            visited[nIdx] = 1;
            stack[sp++] = nIdx;
          }
        } else {
          neighborCounts.set(nId, (neighborCounts.get(nId) ?? 0) + 1);
        }
      };

      checkNeighbor(x - 1, y);
      checkNeighbor(x + 1, y);
      checkNeighbor(x, y - 1);
      checkNeighbor(x, y + 1);
    }

    if (size <= minBlobSize && maxEdge < edgeThresholdSq) {
      let replaceId = colorId;
      let bestCount = -1;
      for (const [id, count] of neighborCounts) {
        if (count > bestCount) {
          bestCount = count;
          replaceId = id;
        }
      }
      if (bestCount >= 0 && replaceId !== colorId) {
        for (const cellIdx of compIndices) {
          cleaned[cellIdx] = replaceId;
        }
      }
    }
  }

  const majorityPasses = smoothStrength > 0.7 ? 2 : 1;
  for (let pass = 0; pass < majorityPasses; pass++) {
    const updated = new Uint16Array(cleaned);
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const cellIdx = idx(x, y, gridW);
        if (mask[cellIdx] === 0) continue;
        if (edgeStrength[cellIdx] >= edgeThresholdSq) continue;
        const currentId = cleaned[cellIdx];
        const counts = new Map<number, number>();
        const check = (nx: number, ny: number) => {
          if (nx < 0 || ny < 0 || nx >= gridW || ny >= gridH) return;
          const nIdx = idx(nx, ny, gridW);
          if (mask[nIdx] === 0) return;
          const nId = cleaned[nIdx];
          if (nId === 0) return;
          counts.set(nId, (counts.get(nId) ?? 0) + 1);
        };
        check(x - 1, y);
        check(x + 1, y);
        check(x, y - 1);
        check(x, y + 1);
        check(x - 1, y - 1);
        check(x + 1, y - 1);
        check(x - 1, y + 1);
        check(x + 1, y + 1);
        let bestId = currentId;
        let bestCount = 0;
        for (const [id, count] of counts) {
          if (count > bestCount) {
            bestCount = count;
            bestId = id;
          }
        }
        if (bestId !== currentId && bestCount >= 5) {
          updated[cellIdx] = bestId;
        }
      }
    }
    cleaned = updated;
  }

  if (smoothStrength > 0.75) {
    const updated = new Uint16Array(cleaned);
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const cellIdx = idx(x, y, gridW);
        if (mask[cellIdx] === 0) continue;
        if (edgeStrength[cellIdx] >= edgeThresholdSq) continue;
        const currentId = cleaned[cellIdx];
        const counts = new Map<number, number>();
        const check = (nx: number, ny: number) => {
          if (nx < 0 || ny < 0 || nx >= gridW || ny >= gridH) return;
          const nIdx = idx(nx, ny, gridW);
          if (mask[nIdx] === 0) return;
          const nId = cleaned[nIdx];
          if (nId === 0) return;
          counts.set(nId, (counts.get(nId) ?? 0) + 1);
        };
        check(x - 1, y);
        check(x + 1, y);
        check(x, y - 1);
        check(x, y + 1);
        check(x - 1, y - 1);
        check(x + 1, y - 1);
        check(x - 1, y + 1);
        check(x + 1, y + 1);
        let bestId = currentId;
        let bestCount = 0;
        for (const [id, count] of counts) {
          if (count > bestCount) {
            bestCount = count;
            bestId = id;
          }
        }
        if (bestId !== currentId && bestCount >= 5) {
          updated[cellIdx] = bestId;
        }
      }
    }
    cleaned = updated;
  }

  return { grid: cleaned, sampleCanvas: canvas };
}
