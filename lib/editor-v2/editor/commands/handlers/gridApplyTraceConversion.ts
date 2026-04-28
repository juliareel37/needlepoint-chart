import type { EditorCommandHandler } from "./types";
import type { ApplyTraceConversionCommand } from "../types";
import { buildDirtySession } from "./gridMutationUtils";
import { buildAppendOnlyInverseSymbolPatches, buildAssignSymbolsPatch } from "./symbolAssignments";
import type {
  DocumentPatch,
  ReplaceGridCellsPatch,
  SetExtractedPaletteIdsPatch,
} from "../../store/patches";

export const gridApplyTraceConversionCommandHandler: EditorCommandHandler<ApplyTraceConversionCommand> =
  {
    canHandle(command): command is ApplyTraceConversionCommand {
      return command.kind === "grid.applyTraceConversion";
    },
    handle(state, command) {
      const { replacements, extractedColorIds, activeColorId } = command.payload;
      const nextActiveColorId =
        activeColorId ?? state.session.activeTool.colorId ?? extractedColorIds[0] ?? null;
      const symbolPatches = buildAssignSymbolsPatch(state, extractedColorIds);
      const replacementPatch: ReplaceGridCellsPatch | null =
        replacements.length > 0
          ? { type: "grid.replaceCells", cells: replacements }
          : null;
      const extractedColorPatch: SetExtractedPaletteIdsPatch = {
        type: "palette.setExtractedColorIds",
        colorIds: extractedColorIds,
      };
      const inverseReplacementPatch: ReplaceGridCellsPatch | null =
        replacements.length > 0
          ? {
              type: "grid.replaceCells",
              cells: replacements.map(({ index }) => ({
                index,
                value: state.document.grid.cells[index] ?? null,
              })),
            }
          : null;
      const inverseExtractedColorPatch: SetExtractedPaletteIdsPatch = {
        type: "palette.setExtractedColorIds",
        colorIds: [...state.document.palette.extractedPaletteIds],
      };
      const patches: DocumentPatch[] = [
        ...(replacementPatch ? [replacementPatch] : []),
        extractedColorPatch,
        ...symbolPatches,
      ];
      const inversePatches: DocumentPatch[] = [
        ...(inverseReplacementPatch ? [inverseReplacementPatch] : []),
        inverseExtractedColorPatch,
        ...buildAppendOnlyInverseSymbolPatches(symbolPatches),
      ];

      return {
        nextSession: {
          ...buildDirtySession(state),
          activeTool: {
            ...state.session.activeTool,
            colorId: nextActiveColorId,
          },
        },
        nextUi: state.ui,
        patches,
        inversePatches,
        effects: [],
        event: {
          type: "command",
          commandId: command.id,
          label:
            command.meta.history.mode === "skip"
              ? undefined
              : "Convert Image to Pattern",
        },
      };
    },
  };
