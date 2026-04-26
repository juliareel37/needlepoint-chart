import { isPrimitiveFrameKind } from "@/lib/editor-v2/editor/icons/primitiveIcon";
import type {
  GridDocument,
  GridPoint,
  IconPlacementSession,
} from "@/lib/editor-v2/editor/store";
import type { IconPlacementPaintGroup } from "@/lib/editor-v2/editor/icons/convertIconPlacementToCells";

const OVERWRITE_WARNING_SUPPRESSION_KEY = "wippa:editor-v2:overwrite-warning-suppressed-until";
const OVERWRITE_WARNING_SUPPRESSION_MS = 24 * 60 * 60 * 1000;

function getCellKey(cell: GridPoint): string {
  return `${cell.x}:${cell.y}`;
}

export function countOverwrittenGridCells(
  grid: GridDocument,
  cells: Iterable<GridPoint>,
): number {
  const seen = new Set<string>();
  let count = 0;

  for (const cell of cells) {
    const key = getCellKey(cell);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    const index = cell.y * grid.width + cell.x;
    if (grid.cells[index]) {
      count += 1;
    }
  }

  return count;
}

export function countOverwrittenPaintGroupCells(
  grid: GridDocument,
  groups: IconPlacementPaintGroup[],
): number {
  return countOverwrittenGridCells(
    grid,
    groups.flatMap((group) => group.cells),
  );
}

export function getConversionSubjectLabel(
  subject: "text" | IconPlacementSession,
): "text" | "shape" | "frame" | "icon" {
  if (subject === "text") {
    return "text";
  }

  if (isPrimitiveFrameKind(subject.primitiveKind)) {
    return "frame";
  }

  if (subject.primitiveKind) {
    return "shape";
  }

  return "icon";
}

export function shouldShowOverwriteWarning(now = Date.now()): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  const rawValue = window.localStorage.getItem(OVERWRITE_WARNING_SUPPRESSION_KEY);
  const suppressedUntil = rawValue ? Number(rawValue) : NaN;

  if (!Number.isFinite(suppressedUntil)) {
    return true;
  }

  if (suppressedUntil <= now) {
    window.localStorage.removeItem(OVERWRITE_WARNING_SUPPRESSION_KEY);
    return true;
  }

  return false;
}

export function suppressOverwriteWarningForOneDay(now = Date.now()): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    OVERWRITE_WARNING_SUPPRESSION_KEY,
    String(now + OVERWRITE_WARNING_SUPPRESSION_MS),
  );
}
