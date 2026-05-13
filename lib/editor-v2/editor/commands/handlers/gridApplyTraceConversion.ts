import type { EditorCommandHandler } from "./types";
import type {
  ApplyTraceConversionCommand,
  CancelTraceConversionPreviewCommand,
  CommitTraceConversionPreviewCommand,
  PreviewTraceConversionCommand,
} from "../types";
import { buildDirtySession } from "./gridMutationUtils";
import {
  buildAppendOnlyInverseSymbolPatches,
  buildAssignSymbolsPatch,
} from "./symbolAssignments";
import type {
  DocumentPatch,
  ReplaceGridCellsPatch,
  SetExtractedPaletteIdsPatch,
} from "../../store/patches";

interface TraceConversionPatchSet {
  patches: DocumentPatch[];
  inversePatches: DocumentPatch[];
  nextActiveColorId: string | null;
}

export const gridApplyTraceConversionCommandHandler: EditorCommandHandler<ApplyTraceConversionCommand> =
  {
    canHandle(command): command is ApplyTraceConversionCommand {
      return command.kind === "grid.applyTraceConversion";
    },
    handle(state, command) {
      const { patches, inversePatches, nextActiveColorId } =
        buildTraceConversionPatchSet(state, command.payload);

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

export const previewTraceConversionCommandHandler: EditorCommandHandler<PreviewTraceConversionCommand> =
  {
    canHandle(command): command is PreviewTraceConversionCommand {
      return command.kind === "grid.previewTraceConversion";
    },
    handle(state, command) {
      if (state.session.traceInteraction.conversionPreview) {
        return {
          nextSession: state.session,
          nextUi: state.ui,
          patches: [],
          inversePatches: [],
          effects: [],
          event: {
            type: "session",
            commandId: command.id,
          },
        };
      }

      const { patches, inversePatches, nextActiveColorId } =
        buildTraceConversionPatchSet(state, command.payload);

      return {
        nextSession: {
          ...state.session,
          activeTool: {
            ...state.session.activeTool,
            colorId: nextActiveColorId,
          },
          traceInteraction: {
            ...state.session.traceInteraction,
            conversionPreview: {
              forwardPatches: patches,
              inversePatches,
              previousActiveColorId: state.session.activeTool.colorId,
              previewActiveColorId: nextActiveColorId,
            },
          },
        },
        nextUi: state.ui,
        patches,
        inversePatches: [],
        effects: [],
        event: {
          type: "session",
          commandId: command.id,
        },
      };
    },
  };

export const commitTraceConversionPreviewCommandHandler: EditorCommandHandler<CommitTraceConversionPreviewCommand> =
  {
    canHandle(command): command is CommitTraceConversionPreviewCommand {
      return command.kind === "grid.commitTraceConversionPreview";
    },
    handle(state, command) {
      const preview = state.session.traceInteraction.conversionPreview;

      if (!preview) {
        return {
          nextSession: state.session,
          nextUi: state.ui,
          patches: [],
          inversePatches: [],
          effects: [],
          event: {
            type: "session",
            commandId: command.id,
          },
        };
      }

      return {
        nextSession: {
          ...buildDirtySession(state),
          traceInteraction: {
            ...state.session.traceInteraction,
            conversionPreview: null,
          },
          activeTool: {
            ...state.session.activeTool,
            colorId: preview.previewActiveColorId,
          },
        },
        nextUi: state.ui,
        patches: preview.forwardPatches,
        inversePatches: preview.inversePatches,
        effects: [],
        event: {
          type: "command",
          commandId: command.id,
          label: "Convert Image to Pattern",
        },
      };
    },
  };

export const cancelTraceConversionPreviewCommandHandler: EditorCommandHandler<CancelTraceConversionPreviewCommand> =
  {
    canHandle(command): command is CancelTraceConversionPreviewCommand {
      return command.kind === "grid.cancelTraceConversionPreview";
    },
    handle(state, command) {
      const preview = state.session.traceInteraction.conversionPreview;

      if (!preview) {
        return {
          nextSession: state.session,
          nextUi: state.ui,
          patches: [],
          inversePatches: [],
          effects: [],
          event: {
            type: "session",
            commandId: command.id,
          },
        };
      }

      return {
        nextSession: {
          ...state.session,
          activeTool: {
            ...state.session.activeTool,
            colorId: preview.previousActiveColorId,
          },
          traceInteraction: {
            ...state.session.traceInteraction,
            conversionPreview: null,
          },
        },
        nextUi: state.ui,
        patches: preview.inversePatches,
        inversePatches: [],
        effects: [],
        event: {
          type: "session",
          commandId: command.id,
        },
      };
    },
  };

function buildTraceConversionPatchSet(
  state: Parameters<
    EditorCommandHandler<ApplyTraceConversionCommand>["handle"]
  >[0],
  payload: ApplyTraceConversionCommand["payload"],
): TraceConversionPatchSet {
  const { replacements, extractedColorIds, activeColorId } = payload;
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

  return {
    nextActiveColorId,
    patches: [
      ...(replacementPatch ? [replacementPatch] : []),
      extractedColorPatch,
      ...symbolPatches,
    ],
    inversePatches: [
      ...(inverseReplacementPatch ? [inverseReplacementPatch] : []),
      inverseExtractedColorPatch,
      ...buildAppendOnlyInverseSymbolPatches(symbolPatches),
    ],
  };
}
