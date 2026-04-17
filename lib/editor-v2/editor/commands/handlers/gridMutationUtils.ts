import type { ReplaceGridCellsPatch } from "../../store/patches";
import type {
  EditorStoreState,
  GridCellValue,
  GridPoint,
} from "../../store/state";
import { getSelectionBounds } from "../../selectors/session/getSelectionBounds";
import { isCellInSelection } from "../../selection/lassoGeometry";

export function buildDirtySession(
  state: EditorStoreState,
): EditorStoreState["session"] {
  return {
    ...state.session,
    persistence: {
      ...state.session.persistence,
      dirty: true,
    },
    inFlightCommand: null,
  };
}

export function filterValidCells(
  cells: GridPoint[],
  state: EditorStoreState,
): GridPoint[] {
  return cells.filter(
    (cell) =>
      cell.x >= 0 &&
      cell.y >= 0 &&
      cell.x < state.document.grid.width &&
      cell.y < state.document.grid.height,
  );
}

export function filterCellsWithinSelection(
  cells: GridPoint[],
  state: EditorStoreState,
): GridPoint[] {
  const selection = getSelectionBounds(state);

  if (!selection) {
    return cells;
  }

  return cells.filter((cell) => isCellInSelection(state, cell));
}

export function buildReplaceCellsPatch(
  state: EditorStoreState,
  cells: GridPoint[],
  value: GridCellValue,
): ReplaceGridCellsPatch[] {
  const replacements = cells
    .map((cell) => ({
      index: getGridCellIndex(state, cell),
      value,
    }))
    .filter(({ index }) => state.document.grid.cells[index] !== value);

  return replacements.length === 0
    ? []
    : [{ type: "grid.replaceCells", cells: replacements }];
}

export function buildInverseReplaceCellsPatch(
  state: EditorStoreState,
  cells: GridPoint[],
): ReplaceGridCellsPatch[] {
  const replacements = cells.map((cell) => {
    const index = getGridCellIndex(state, cell);

    return {
      index,
      value: state.document.grid.cells[index] ?? null,
    };
  });

  return replacements.length === 0
    ? []
    : [{ type: "grid.replaceCells", cells: replacements }];
}

export function getFilledGridPoints(state: EditorStoreState): GridPoint[] {
  const points: GridPoint[] = [];
  const { width, cells } = state.document.grid;

  for (let index = 0; index < cells.length; index += 1) {
    if (cells[index] === null) {
      continue;
    }

    points.push({
      x: index % width,
      y: Math.floor(index / width),
    });
  }

  return points;
}

function getGridCellIndex(state: EditorStoreState, cell: GridPoint): number {
  return cell.y * state.document.grid.width + cell.x;
}
