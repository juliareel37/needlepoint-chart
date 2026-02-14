export type LabSamples = { values: Float32Array; count: number };

export function contrastForHex(hex: string) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "#000000";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#ffffff";
}

function srgbToLinear(value: number) {
  return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}

function linearToSrgb(value: number) {
  return value <= 0.0031308 ? value * 12.92 : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
}

export function rgbToOklab(r: number, g: number, b: number) {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    A: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    B: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

function oklabToRgb(L: number, A: number, B: number) {
  const l_ = L + 0.3963377774 * A + 0.2158037573 * B;
  const m_ = L - 0.1055613458 * A - 0.0638541728 * B;
  const s_ = L - 0.0894841775 * A - 1.291485548 * B;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return { r: linearToSrgb(lr), g: linearToSrgb(lg), b: linearToSrgb(lb) };
}

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (value: number) => Math.round(clamp01(value) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function sampleTraceImageOklab(image: HTMLImageElement, maxSamples: number): LabSamples {
  const width = image.width;
  const height = image.height;
  if (width <= 0 || height <= 0) return { values: new Float32Array(0), count: 0 };
  const total = width * height;
  const scale = total > maxSamples ? Math.sqrt(maxSamples / total) : 1;
  const sampleW = Math.max(1, Math.round(width * scale));
  const sampleH = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { values: new Float32Array(0), count: 0 };
  ctx.drawImage(image, 0, 0, sampleW, sampleH);
  const data = ctx.getImageData(0, 0, sampleW, sampleH).data;
  const values = new Float32Array(sampleW * sampleH * 3);
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 16) continue;
    const { L, A, B } = rgbToOklab(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
    const offset = count * 3;
    values[offset] = L;
    values[offset + 1] = A;
    values[offset + 2] = B;
    count += 1;
  }
  return { values, count };
}

function kMeansOklab(samples: LabSamples, k: number, iterations = 8) {
  const count = samples.count;
  const values = samples.values;
  if (count === 0 || k <= 0) {
    return { centers: new Float32Array(0), counts: new Int32Array(0) };
  }
  const centers = new Float32Array(k * 3);
  const counts = new Int32Array(k);
  const nearestDist = new Float32Array(count);

  let meanL = 0;
  let meanA = 0;
  let meanB = 0;
  for (let i = 0; i < count; i++) {
    meanL += values[i * 3];
    meanA += values[i * 3 + 1];
    meanB += values[i * 3 + 2];
  }
  meanL /= count;
  meanA /= count;
  meanB /= count;
  let first = 0;
  let maxDist = -1;
  for (let i = 0; i < count; i++) {
    const dx = values[i * 3] - meanL;
    const dy = values[i * 3 + 1] - meanA;
    const dz = values[i * 3 + 2] - meanB;
    const dist = dx * dx + dy * dy + dz * dz;
    if (dist > maxDist) {
      maxDist = dist;
      first = i;
    }
  }
  centers[0] = values[first * 3];
  centers[1] = values[first * 3 + 1];
  centers[2] = values[first * 3 + 2];
  for (let i = 0; i < count; i++) {
    const dx = values[i * 3] - centers[0];
    const dy = values[i * 3 + 1] - centers[1];
    const dz = values[i * 3 + 2] - centers[2];
    nearestDist[i] = dx * dx + dy * dy + dz * dz;
  }

  for (let c = 1; c < k; c++) {
    let farthest = 0;
    let farthestDist = -1;
    for (let i = 0; i < count; i++) {
      const dist = nearestDist[i];
      if (dist > farthestDist) {
        farthestDist = dist;
        farthest = i;
      }
    }
    const base = c * 3;
    centers[base] = values[farthest * 3];
    centers[base + 1] = values[farthest * 3 + 1];
    centers[base + 2] = values[farthest * 3 + 2];
    for (let i = 0; i < count; i++) {
      const dx = values[i * 3] - centers[base];
      const dy = values[i * 3 + 1] - centers[base + 1];
      const dz = values[i * 3 + 2] - centers[base + 2];
      const dist = dx * dx + dy * dy + dz * dz;
      if (dist < nearestDist[i]) nearestDist[i] = dist;
    }
  }

  const sums = new Float32Array(k * 3);

  for (let iter = 0; iter < iterations; iter++) {
    counts.fill(0);
    sums.fill(0);
    for (let i = 0; i < count; i++) {
      let best = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      const px = values[i * 3];
      const py = values[i * 3 + 1];
      const pz = values[i * 3 + 2];
      for (let c = 0; c < k; c++) {
        const base = c * 3;
        const dx = px - centers[base];
        const dy = py - centers[base + 1];
        const dz = pz - centers[base + 2];
        const dist = dx * dx + dy * dy + dz * dz;
        if (dist < bestDist) {
          bestDist = dist;
          best = c;
        }
      }
      counts[best] += 1;
      const sumBase = best * 3;
      sums[sumBase] += px;
      sums[sumBase + 1] += py;
      sums[sumBase + 2] += pz;
    }
    for (let c = 0; c < k; c++) {
      const countC = counts[c];
      const base = c * 3;
      if (countC > 0) {
        centers[base] = sums[base] / countC;
        centers[base + 1] = sums[base + 1] / countC;
        centers[base + 2] = sums[base + 2] / countC;
      } else {
        let farthest = 0;
        let farthestDist = -1;
        for (let i = 0; i < count; i++) {
          let bestDist = Number.POSITIVE_INFINITY;
          const px = values[i * 3];
          const py = values[i * 3 + 1];
          const pz = values[i * 3 + 2];
          for (let s = 0; s < k; s++) {
            const sBase = s * 3;
            const dx = px - centers[sBase];
            const dy = py - centers[sBase + 1];
            const dz = pz - centers[sBase + 2];
            const dist = dx * dx + dy * dy + dz * dz;
            if (dist < bestDist) bestDist = dist;
          }
          if (bestDist > farthestDist) {
            farthestDist = bestDist;
            farthest = i;
          }
        }
        centers[base] = values[farthest * 3];
        centers[base + 1] = values[farthest * 3 + 1];
        centers[base + 2] = values[farthest * 3 + 2];
      }
    }
  }

  return { centers, counts };
}

function selectDiverseClusters(centers: Float32Array, counts: Int32Array, targetCount: number) {
  const k = counts.length;
  const available: number[] = [];
  let maxCount = 0;
  for (let c = 0; c < k; c++) {
    const count = counts[c];
    if (count > 0) {
      available.push(c);
      if (count > maxCount) maxCount = count;
    }
  }
  if (available.length <= targetCount) return available;
  let bestIndex = available[0];
  for (const idx of available) {
    if (counts[idx] > counts[bestIndex]) bestIndex = idx;
  }
  const selected = [bestIndex];
  const selectedSet = new Set<number>(selected);
  const distanceWeight = 1.8;
  const importanceWeight = 0.6;
  const rarityBoost = 1.2;
  const hueWeight = 0.6;
  const chromaWeight = 0.5;
  const hueBins = 12;

  const chromaByIndex = new Float32Array(k);
  const hueByIndex = new Float32Array(k);
  for (let i = 0; i < k; i++) {
    const base = i * 3;
    const a = centers[base + 1];
    const b = centers[base + 2];
    const chroma = Math.sqrt(a * a + b * b);
    chromaByIndex[i] = chroma;
    let hue = Math.atan2(b, a);
    if (hue < 0) hue += Math.PI * 2;
    hueByIndex[i] = hue;
  }
  const hueBinCounts = new Int32Array(hueBins);
  const startHue = hueByIndex[bestIndex];
  const startBin = Math.min(hueBins - 1, Math.floor((startHue / (Math.PI * 2)) * hueBins));
  hueBinCounts[startBin] += 1;

  while (selected.length < targetCount) {
    let nextIndex = -1;
    let bestScore = -1;
    for (const idx of available) {
      if (selectedSet.has(idx)) continue;
      const importance = Math.log1p(counts[idx]) / Math.log1p(maxCount);
      const base = idx * 3;
      let minDist = Number.POSITIVE_INFINITY;
      let minHueDist = Number.POSITIVE_INFINITY;
      for (const sel of selected) {
        const selBase = sel * 3;
        const dx = centers[base] - centers[selBase];
        const dy = centers[base + 1] - centers[selBase + 1];
        const dz = centers[base + 2] - centers[selBase + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < minDist) minDist = dist;
        const hueA = hueByIndex[idx];
        const hueB = hueByIndex[sel];
        const diff = Math.abs(hueA - hueB);
        const hueDist = Math.min(diff, Math.PI * 2 - diff);
        if (hueDist < minHueDist) minHueDist = hueDist;
      }
      const chroma = chromaByIndex[idx];
      const chromaFactor = chroma / (chroma + 0.05);
      const hueScore = hueWeight * minHueDist * chromaFactor;
      const bin = Math.min(hueBins - 1, Math.floor((hueByIndex[idx] / (Math.PI * 2)) * hueBins));
      const binPenalty = 1 / (1 + hueBinCounts[bin] * 0.8);
      const score =
        (importanceWeight * importance +
          distanceWeight * minDist +
          rarityBoost * (1 - importance) * minDist +
          hueScore +
          chromaWeight * chroma * (1 - importance)) *
        binPenalty;
      if (score > bestScore) {
        bestScore = score;
        nextIndex = idx;
      }
    }
    if (nextIndex === -1) break;
    selected.push(nextIndex);
    selectedSet.add(nextIndex);
    const hue = hueByIndex[nextIndex];
    const bin = Math.min(hueBins - 1, Math.floor((hue / (Math.PI * 2)) * hueBins));
    hueBinCounts[bin] += 1;
  }
  return selected;
}

export function extractPaletteFromImage(image: HTMLImageElement, maxColors: number) {
  const maxSamples = 40000;
  const samples = sampleTraceImageOklab(image, maxSamples);
  if (samples.count === 0) return [];
  const target = Math.max(2, Math.min(maxColors, samples.count));
  const overCluster = Math.min(samples.count, Math.max(target * 5, Math.round(target * 6)));
  const { centers, counts } = kMeansOklab(samples, overCluster, 8);
  const selected = selectDiverseClusters(centers, counts, target);
  const seen = new Set<string>();
  const palette: string[] = [];
  for (const idx of selected) {
    const base = idx * 3;
    const rgb = oklabToRgb(centers[base], centers[base + 1], centers[base + 2]);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    if (seen.has(hex)) continue;
    seen.add(hex);
    palette.push(hex);
    if (palette.length >= target) break;
  }
  if (palette.length < target) {
    const order = Array.from({ length: counts.length }, (_, i) => i).sort((a, b) => counts[b] - counts[a]);
    for (const idx of order) {
      const base = idx * 3;
      const rgb = oklabToRgb(centers[base], centers[base + 1], centers[base + 2]);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      if (seen.has(hex)) continue;
      seen.add(hex);
      palette.push(hex);
      if (palette.length >= target) break;
    }
  }
  return palette;
}

export function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "").trim();
  if (normalized.length !== 6) return null;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((value) => Number.isNaN(value))) return null;
  return [r, g, b] as const;
}
