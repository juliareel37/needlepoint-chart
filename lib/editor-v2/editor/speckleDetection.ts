import type { GridCellValue, PaletteColor } from "./store";
import { hexToRgb, type Rgb } from "./color-utils";

const NEIGHBOR_OFFSETS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
] as const;

const SHADE_CLUSTER_DISTANCE = 92;

interface NeighborColorSample {
  colorId: string;
  rgb: Rgb;
}

interface NeighborColorCluster {
  colorIds: Set<string>;
  count: number;
  centroid: Rgb;
  countsByColorId: Map<string, number>;
}

export interface SpeckleSmoothingReplacement {
  index: number;
  fromColorId: string;
  toColorId: string;
}

export function detectSpeckleCellIndexes(
  cells: GridCellValue[],
  gridWidth: number,
  gridHeight: number,
  eligibleCellIndexes?: Set<number> | null,
): number[] {
  if (gridWidth < 3 || gridHeight < 3) {
    return [];
  }

  const speckleCellIndexes: number[] = [];

  for (let y = 1; y < gridHeight - 1; y += 1) {
    for (let x = 1; x < gridWidth - 1; x += 1) {
      const index = y * gridWidth + x;
      const centerColorId = cells[index];

      if (eligibleCellIndexes && !eligibleCellIndexes.has(index)) {
        continue;
      }

      if (!centerColorId) {
        continue;
      }

      const surroundedByDifferentColors = NEIGHBOR_OFFSETS.every(([offsetX, offsetY]) => {
        const neighborColorId = cells[(y + offsetY) * gridWidth + x + offsetX];
        return Boolean(neighborColorId) && neighborColorId !== centerColorId;
      });

      if (surroundedByDifferentColors) {
        speckleCellIndexes.push(index);
      }
    }
  }

  return speckleCellIndexes;
}

export function buildSpeckleSmoothingReplacements(
  cells: GridCellValue[],
  gridWidth: number,
  gridHeight: number,
  colorsById: Record<string, PaletteColor>,
  eligibleCellIndexes?: Set<number> | null,
): SpeckleSmoothingReplacement[] {
  return detectSpeckleCellIndexes(
    cells,
    gridWidth,
    gridHeight,
    eligibleCellIndexes,
  ).flatMap((index) => {
    const fromColorId = cells[index];

    if (!fromColorId) {
      return [];
    }

    const toColorId = getSpeckleReplacementColorId(
      cells,
      gridWidth,
      index,
      colorsById,
    );

    if (!toColorId || toColorId === fromColorId) {
      return [];
    }

    return [{ index, fromColorId, toColorId }];
  });
}

export function getSpeckleReplacementColorId(
  cells: GridCellValue[],
  gridWidth: number,
  index: number,
  colorsById: Record<string, PaletteColor>,
): string | null {
  const x = index % gridWidth;
  const y = Math.floor(index / gridWidth);
  const samples = NEIGHBOR_OFFSETS.flatMap(([offsetX, offsetY]) => {
    const colorId = cells[(y + offsetY) * gridWidth + x + offsetX];
    const color = colorId ? colorsById[colorId] : null;
    const rgb = color ? hexToRgb(color.hex) : null;

    return colorId && rgb ? [{ colorId, rgb }] : [];
  });

  if (samples.length === 0) {
    return null;
  }

  const clusters = clusterNeighborColors(samples);
  const winningCluster = clusters.sort(compareNeighborColorClusters)[0] ?? null;

  if (!winningCluster) {
    return null;
  }

  return getRepresentativeColorId(winningCluster);
}

function clusterNeighborColors(samples: NeighborColorSample[]): NeighborColorCluster[] {
  const clusters: NeighborColorCluster[] = [];

  for (const sample of samples) {
    const matchingCluster = clusters
      .map((cluster) => ({
        cluster,
        distance: getRgbDistance(sample.rgb, cluster.centroid),
      }))
      .filter(({ distance }) => distance <= SHADE_CLUSTER_DISTANCE)
      .sort((left, right) => left.distance - right.distance)[0]?.cluster;

    if (!matchingCluster) {
      clusters.push({
        colorIds: new Set([sample.colorId]),
        count: 1,
        centroid: sample.rgb,
        countsByColorId: new Map([[sample.colorId, 1]]),
      });
      continue;
    }

    const nextCount = matchingCluster.count + 1;
    matchingCluster.centroid = {
      r: (matchingCluster.centroid.r * matchingCluster.count + sample.rgb.r) / nextCount,
      g: (matchingCluster.centroid.g * matchingCluster.count + sample.rgb.g) / nextCount,
      b: (matchingCluster.centroid.b * matchingCluster.count + sample.rgb.b) / nextCount,
    };
    matchingCluster.count = nextCount;
    matchingCluster.colorIds.add(sample.colorId);
    matchingCluster.countsByColorId.set(
      sample.colorId,
      (matchingCluster.countsByColorId.get(sample.colorId) ?? 0) + 1,
    );
  }

  return clusters;
}

function compareNeighborColorClusters(
  left: NeighborColorCluster,
  right: NeighborColorCluster,
): number {
  if (left.count !== right.count) {
    return right.count - left.count;
  }

  if (left.colorIds.size !== right.colorIds.size) {
    return right.colorIds.size - left.colorIds.size;
  }

  return getTopColorCount(right) - getTopColorCount(left);
}

function getRepresentativeColorId(cluster: NeighborColorCluster): string {
  return Array.from(cluster.countsByColorId.entries()).sort((left, right) => {
    if (left[1] !== right[1]) {
      return right[1] - left[1];
    }

    return left[0].localeCompare(right[0]);
  })[0][0];
}

function getTopColorCount(cluster: NeighborColorCluster): number {
  return Math.max(...cluster.countsByColorId.values());
}

function getRgbDistance(left: Rgb, right: Rgb): number {
  const dr = left.r - right.r;
  const dg = left.g - right.g;
  const db = left.b - right.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}
