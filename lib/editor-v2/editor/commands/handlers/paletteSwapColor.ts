import type {
  ReplaceGridCellsPatch,
} from "../../store/patches";
import type { SwapPaletteColorCommand } from "../types";
import { buildDirtySession } from "./gridMutationUtils";
import type { EditorCommandHandler } from "./types";
import {
  buildAppendOnlyInverseSymbolPatches,
  buildAssignSymbolsPatch,
} from "./symbolAssignments";

export const paletteSwapColorCommandHandler: EditorCommandHandler<SwapPaletteColorCommand> = {
  canHandle(command): command is SwapPaletteColorCommand {
    return command.kind === "palette.swapColor";
  },
  handle(state, command) {
    const { fromColorId, toColorId } = command.payload;
    const fromColor = state.document.palette.colorsById[fromColorId];
    const toColor = state.document.palette.colorsById[toColorId];
    const shouldSwap =
      Boolean(fromColor) &&
      Boolean(toColor) &&
      fromColorId !== toColorId &&
      state.document.grid.cells.some((cell) => cell === fromColorId);

    const swappedCells = shouldSwap
      ? state.document.grid.cells.flatMap((cell, index) =>
          cell === fromColorId ? [{ index, value: toColorId }] : [],
        )
      : [];
    const patches: ReplaceGridCellsPatch[] = swappedCells.length > 0
      ? [{ type: "grid.replaceCells", cells: swappedCells }]
      : [];
    const symbolPatches =
      swappedCells.length > 0 &&
      !state.document.palette.symbolAssignments[toColorId]
        ? buildAssignSymbolsPatch(state, [toColorId])
        : [];
    const inversePatches: ReplaceGridCellsPatch[] = swappedCells.length > 0
      ? [
          {
            type: "grid.replaceCells",
            cells: swappedCells.map(({ index }) => ({
              index,
              value: fromColorId,
            })),
          },
        ]
      : [];

    return {
      nextSession: swappedCells.length > 0 ? buildDirtySession(state) : state.session,
      nextUi: state.ui,
      patches: [...patches, ...symbolPatches],
      inversePatches: [
        ...inversePatches,
        ...buildAppendOnlyInverseSymbolPatches(symbolPatches),
      ],
      effects: [],
      event: {
        type: "command",
        commandId: command.id,
        label: command.meta.history.mode === "skip" ? undefined : "Swap Color",
      },
    };
  },
};
