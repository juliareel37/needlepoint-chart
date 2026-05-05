import type {
  EditorStoreState,
  GridPoint,
  GridRect,
  SelectionPoint,
} from "../store/state";

const LASSO_CELL_SAMPLE_OFFSETS = [1 / 6, 0.5, 5 / 6] as const;
const LASSO_MIN_SAMPLES_INSIDE = 5;

export function getLassoBounds(points: SelectionPoint[]): GridRect | null {
  if (points.length === 0) {
    return null;
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  const x = Math.max(0, Math.floor(minX));
  const y = Math.max(0, Math.floor(minY));
  const width = Math.max(1, Math.ceil(maxX) - x);
  const height = Math.max(1, Math.ceil(maxY) - y);

  return { x, y, width, height };
}

export function isCellSelectedByLasso(
  points: SelectionPoint[],
  cellX: number,
  cellY: number,
): boolean {
  if (points.length < 3) {
    return false;
  }

  let insideSamples = 0;

  for (const offsetY of LASSO_CELL_SAMPLE_OFFSETS) {
    for (const offsetX of LASSO_CELL_SAMPLE_OFFSETS) {
      const samplePoint = {
        x: cellX + offsetX,
        y: cellY + offsetY,
      };

      if (pointInPolygon(samplePoint, points)) {
        insideSamples += 1;
      }
    }
  }

  return insideSamples >= LASSO_MIN_SAMPLES_INSIDE;
}

export function isCellInSelection(
  state: EditorStoreState,
  cell: GridPoint,
): boolean {
  const selection = state.session.selection;

  if (selection.mode === "lasso") {
    const bounds = selection.rect;

    if (!bounds) {
      return false;
    }

    if (
      cell.x < bounds.x ||
      cell.y < bounds.y ||
      cell.x >= bounds.x + bounds.width ||
      cell.y >= bounds.y + bounds.height
    ) {
      return false;
    }

    return isCellSelectedByLasso(selection.lassoPoints, cell.x, cell.y);
  }

  if (selection.mode === "circle") {
    const bounds = selection.rect;

    if (!bounds) {
      return false;
    }

    if (
      cell.x < bounds.x ||
      cell.y < bounds.y ||
      cell.x >= bounds.x + bounds.width ||
      cell.y >= bounds.y + bounds.height
    ) {
      return false;
    }

    return isCellSelectedByEllipse(bounds, cell.x, cell.y);
  }

  if (!selection.rect) {
    return false;
  }

  return (
    cell.x >= selection.rect.x &&
    cell.y >= selection.rect.y &&
    cell.x < selection.rect.x + selection.rect.width &&
    cell.y < selection.rect.y + selection.rect.height
  );
}

export function isPointInSelection(
  state: EditorStoreState,
  point: SelectionPoint,
): boolean {
  const selection = state.session.selection;

  if (!selection.rect) {
    return false;
  }

  const { rect } = selection;

  if (
    point.x < rect.x ||
    point.y < rect.y ||
    point.x >= rect.x + rect.width ||
    point.y >= rect.y + rect.height
  ) {
    return false;
  }

  if (selection.mode === "lasso") {
    return pointInPolygon(point, selection.lassoPoints);
  }

  if (selection.mode === "circle") {
    const radiusX = rect.width / 2;
    const radiusY = rect.height / 2;

    if (radiusX <= 0 || radiusY <= 0) {
      return false;
    }

    const centerX = rect.x + radiusX;
    const centerY = rect.y + radiusY;
    const normalizedX = (point.x - centerX) / radiusX;
    const normalizedY = (point.y - centerY) / radiusY;

    return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
  }

  return true;
}

export function pointInPolygon(
  point: SelectionPoint,
  polygon: SelectionPoint[],
): boolean {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

function isCellSelectedByEllipse(
  bounds: GridRect,
  cellX: number,
  cellY: number,
): boolean {
  const radiusX = bounds.width / 2;
  const radiusY = bounds.height / 2;

  if (radiusX <= 0 || radiusY <= 0) {
    return false;
  }

  const centerX = bounds.x + radiusX;
  const centerY = bounds.y + radiusY;
  let insideSamples = 0;

  for (const offsetY of LASSO_CELL_SAMPLE_OFFSETS) {
    for (const offsetX of LASSO_CELL_SAMPLE_OFFSETS) {
      const sampleX = cellX + offsetX;
      const sampleY = cellY + offsetY;
      const normalizedX = (sampleX - centerX) / radiusX;
      const normalizedY = (sampleY - centerY) / radiusY;

      if (normalizedX * normalizedX + normalizedY * normalizedY <= 1) {
        insideSamples += 1;
      }
    }
  }

  return insideSamples >= LASSO_MIN_SAMPLES_INSIDE;
}
