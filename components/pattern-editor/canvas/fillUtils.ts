"use client";

export type FillResult = { next: Uint16Array; filled: boolean; indices?: number[] };
export type FillBounds = { minX: number; maxX: number; minY: number; maxY: number };

type ScanlineArgs = {
  gridSnapshot: Uint16Array;
  width: number;
  height: number;
  startX: number;
  startY: number;
  targetColor: number;
  newColorId: number;
  collectIndices: boolean;
  bounds?: FillBounds;
};

export function scanlineFillSync({
  gridSnapshot,
  width,
  height,
  startX,
  startY,
  targetColor,
  newColorId,
  collectIndices,
  bounds,
}: ScanlineArgs): FillResult {
  const w = width;
  const h = height;
  const minX = bounds?.minX ?? 0;
  const maxX = bounds?.maxX ?? w - 1;
  const minY = bounds?.minY ?? 0;
  const maxY = bounds?.maxY ?? h - 1;
  if (startX < minX || startX > maxX || startY < minY || startY > maxY) {
    return { next: new Uint16Array(gridSnapshot), filled: false };
  }
  const next = new Uint16Array(gridSnapshot);
  const max = w * h;
  const stackX = new Int32Array(max);
  const stackY = new Int32Array(max);
  let sp = 0;
  stackX[sp] = startX;
  stackY[sp] = startY;
  sp++;
  let filledAny = false;
  const indices: number[] | undefined = collectIndices ? [] : undefined;

  const scanRow = (ny: number, xL: number, xR: number) => {
    if (ny < minY || ny > maxY) return;
    const row = ny * w;
    let i = row + Math.max(minX, xL);
    const end = row + Math.min(maxX, xR);
    while (i <= end) {
      if (next[i] === targetColor) {
        stackX[sp] = i - row;
        stackY[sp] = ny;
        sp++;
        i++;
        while (i <= end && next[i] === targetColor) i++;
      } else {
        i++;
      }
    }
  };

  while (sp > 0) {
    sp--;
    const x0 = stackX[sp];
    const y0 = stackY[sp];
    if (x0 < minX || x0 > maxX || y0 < minY || y0 > maxY) continue;
    const row = y0 * w;
    if (next[row + x0] !== targetColor) continue;

    let xL = x0;
    while (xL >= minX && next[row + xL] === targetColor) xL--;
    xL++;
    let xR = x0;
    while (xR <= maxX && next[row + xR] === targetColor) xR++;
    xR--;

    for (let x = xL; x <= xR; x++) {
      const i = row + x;
      next[i] = newColorId;
      if (indices) indices.push(i);
    }
    filledAny = true;
    scanRow(y0 - 1, xL, xR);
    scanRow(y0 + 1, xL, xR);
  }

  return { next, filled: filledAny, indices };
}

type ChunkedArgs = ScanlineArgs & {
  token: number;
  shouldContinue: () => boolean;
  chunkSeedsPerFrame: number;
};

export async function scanlineFillChunked({
  gridSnapshot,
  width,
  height,
  startX,
  startY,
  targetColor,
  newColorId,
  collectIndices,
  bounds,
  token,
  shouldContinue,
  chunkSeedsPerFrame,
}: ChunkedArgs): Promise<FillResult | null> {
  const w = width;
  const h = height;
  const minX = bounds?.minX ?? 0;
  const maxX = bounds?.maxX ?? w - 1;
  const minY = bounds?.minY ?? 0;
  const maxY = bounds?.maxY ?? h - 1;
  if (startX < minX || startX > maxX || startY < minY || startY > maxY) {
    return { next: new Uint16Array(gridSnapshot), filled: false };
  }
  const next = new Uint16Array(gridSnapshot);
  const max = w * h;
  const stackX = new Int32Array(max);
  const stackY = new Int32Array(max);
  let sp = 0;
  stackX[sp] = startX;
  stackY[sp] = startY;
  sp++;
  let filledAny = false;
  const indices: number[] | undefined = collectIndices ? [] : undefined;

  const scanRow = (ny: number, xL: number, xR: number) => {
    if (ny < minY || ny > maxY) return;
    const row = ny * w;
    let i = row + Math.max(minX, xL);
    const end = row + Math.min(maxX, xR);
    while (i <= end) {
      if (next[i] === targetColor) {
        stackX[sp] = i - row;
        stackY[sp] = ny;
        sp++;
        i++;
        while (i <= end && next[i] === targetColor) i++;
      } else {
        i++;
      }
    }
  };

  const seedsPerFrame = Math.max(1, Math.floor(chunkSeedsPerFrame));

  return new Promise((resolve) => {
    const step = () => {
      if (!shouldContinue() || token === 0) {
        resolve(null);
        return;
      }
      let processed = 0;
      while (sp > 0 && processed < seedsPerFrame) {
        sp--;
        const x0 = stackX[sp];
        const y0 = stackY[sp];
        if (x0 < minX || x0 > maxX || y0 < minY || y0 > maxY) {
          processed++;
          continue;
        }
        const row = y0 * w;
        if (next[row + x0] !== targetColor) {
          processed++;
          continue;
        }

        let xL = x0;
        while (xL >= minX && next[row + xL] === targetColor) xL--;
        xL++;
        let xR = x0;
        while (xR <= maxX && next[row + xR] === targetColor) xR++;
        xR--;

        for (let x = xL; x <= xR; x++) {
          const i = row + x;
          next[i] = newColorId;
          if (indices) indices.push(i);
        }
        filledAny = true;
        scanRow(y0 - 1, xL, xR);
        scanRow(y0 + 1, xL, xR);
        processed++;
      }

      if (sp > 0) {
        requestAnimationFrame(step);
      } else {
        resolve({ next, filled: filledAny, indices });
      }
    };
    requestAnimationFrame(step);
  });
}
