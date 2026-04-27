import { isCellInSelection } from "../../selection/lassoGeometry";
import type { EditorStoreState } from "../../store/state";

export interface UsedColorSummary {
  colorId: string;
  count: number;
}

export interface GetUsedColorsOptions {
  scope?: "document" | "selection" | "auto";
}

export function getUsedColors(
  state: EditorStoreState,
  options?: GetUsedColorsOptions,
): UsedColorSummary[] {
  const scope = resolveUsedColorScope(state, options?.scope ?? "document");
  const counts = new Map<string, number>();
  const gridWidth = state.document.grid.width;

  for (let index = 0; index < state.document.grid.cells.length; index += 1) {
    const cell = state.document.grid.cells[index];
    if (!cell) {
      continue;
    }

    if (
      scope === "selection" &&
      !isCellInSelection(state, {
        x: index % gridWidth,
        y: Math.floor(index / gridWidth),
      })
    ) {
      continue;
    }

    counts.set(cell, (counts.get(cell) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([colorId, count]) => ({ colorId, count }))
    .sort((left, right) => right.count - left.count);
}

function resolveUsedColorScope(
  state: EditorStoreState,
  scope: NonNullable<GetUsedColorsOptions["scope"]>,
): "document" | "selection" {
  if (scope === "document") {
    return "document";
  }

  return hasActiveSelection(state) ? "selection" : "document";
}

function hasActiveSelection(state: EditorStoreState): boolean {
  return state.session.selection.mode !== "none" && state.session.selection.rect !== null;
}
