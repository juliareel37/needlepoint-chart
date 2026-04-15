import type {
  EditorCommand,
  EditorCommandSource,
  HistoryPolicy,
} from "@/lib/editor-v2/editor/commands";
import type { TraceUpdateChanges } from "@/lib/editor-v2/editor/store/patches";
import type {
  ActiveTool,
  EditorSidebarSection,
  GridPoint,
  SelectionState,
  SelectionPoint,
} from "@/lib/editor-v2/editor/store";

export function createUndoCommand(): EditorCommand {
  return createCommand("history.undo", {}, "toolbar", { mode: "skip" });
}

export function createRedoCommand(): EditorCommand {
  return createCommand("history.redo", {}, "toolbar", { mode: "skip" });
}

export function createSetProjectTitleCommand(title: string): EditorCommand {
  return createCommand(
    "project.setTitle",
    { title },
    "toolbar",
    { mode: "push", label: "Rename Project" },
  );
}

export function createSetToolCommand(tool: ActiveTool): EditorCommand {
  return createCommand("tool.setActive", { tool }, "toolbar", { mode: "skip" });
}

export function createSetToolWithColorCommand(
  tool: ActiveTool,
  colorId: string | null,
): EditorCommand {
  return createCommand(
    "tool.setActive",
    { tool, colorId },
    "toolbar",
    { mode: "skip" },
  );
}

export function createSetBrushSizeCommand(
  brushSize: number,
  tool: ActiveTool,
): EditorCommand {
  return createCommand(
    "tool.setActive",
    { tool, brushSize },
    "toolbar",
    { mode: "skip" },
  );
}

export function createSetActiveColorCommand(colorId: string): EditorCommand {
  return createCommand(
    "tool.setActive",
    { tool: "paint", colorId },
    "toolbar",
    { mode: "skip" },
  );
}

export function createPaintCellCommand(
  colorId: string,
  point: GridPoint,
  transactionKey?: string,
): EditorCommand {
  return createCommand(
    "grid.paint",
    { colorId, cells: [point] },
    "canvas",
    transactionKey
      ? { mode: "merge", label: "Paint", transactionKey }
      : { mode: "push", label: "Paint" },
  );
}

export function createPaintCellsCommand(
  colorId: string,
  cells: GridPoint[],
  transactionKey?: string,
): EditorCommand {
  return createCommand(
    "grid.paint",
    { colorId, cells },
    transactionKey ? "canvas" : "toolbar",
    transactionKey
      ? { mode: "merge", label: "Paint", transactionKey }
      : { mode: "push", label: "Paint Selection" },
  );
}

export function createEraseCellCommand(
  point: GridPoint,
  transactionKey?: string,
): EditorCommand {
  return createCommand(
    "grid.erase",
    { cells: [point] },
    "canvas",
    transactionKey
      ? { mode: "merge", label: "Erase", transactionKey }
      : { mode: "push", label: "Erase" },
  );
}

export function createEraseCellsCommand(
  cells: GridPoint[],
  transactionKey?: string,
): EditorCommand {
  return createCommand(
    "grid.erase",
    { cells },
    transactionKey ? "canvas" : "toolbar",
    transactionKey
      ? { mode: "merge", label: "Erase", transactionKey }
      : { mode: "push", label: "Erase Selection" },
  );
}

export function createClearCanvasCommand(): EditorCommand {
  return createCommand(
    "grid.clear",
    {},
    "toolbar",
    { mode: "push", label: "Clear Canvas" },
  );
}

export function createSwapPaletteColorCommand(
  fromColorId: string,
  toColorId: string,
): EditorCommand {
  return createCommand(
    "palette.swapColor",
    { fromColorId, toColorId },
    "toolbar",
    { mode: "push", label: "Swap Color" },
  );
}

export function createDeleteUsedColorsCommand(
  colorIds: string[],
): EditorCommand {
  return createCommand(
    "palette.deleteUsedColors",
    { colorIds },
    "toolbar",
    { mode: "push", label: "Delete Colors" },
  );
}

export function createMergeUsedColorsCommand(
  fromColorIds: string[],
  toColorId: string,
): EditorCommand {
  return createCommand(
    "palette.mergeUsedColors",
    { fromColorIds, toColorId },
    "toolbar",
    { mode: "push", label: "Merge Colors" },
  );
}

export function createSelectionStartCommand(point: SelectionPoint): EditorCommand {
  return createCommand(
    "selection.start",
    { point },
    "canvas",
    { mode: "skip" },
  );
}

export function createSelectionUpdateCommand(
  point: SelectionPoint,
): EditorCommand {
  return createCommand(
    "selection.update",
    { point },
    "canvas",
    { mode: "skip" },
  );
}

export function createSelectionCommitCommand(
  point: SelectionPoint | null,
): EditorCommand {
  return createCommand(
    "selection.commit",
    { point },
    "canvas",
    { mode: "skip" },
  );
}

export function createClearSelectionCommand(
  source: EditorCommandSource = "toolbar",
): EditorCommand {
  return createCommand("selection.clear", {}, source, { mode: "skip" });
}

export function createSetSelectionShapeCommand(
  shape: SelectionState["shape"],
): EditorCommand {
  return createCommand(
    "selection.setShape",
    { shape },
    "toolbar",
    { mode: "skip" },
  );
}

export function createStartMirrorSelectionCommand(point: GridPoint): EditorCommand {
  return createCommand(
    "mirror.start",
    { point },
    "canvas",
    { mode: "skip" },
  );
}

export function createUpdateMirrorSelectionCommand(point: GridPoint): EditorCommand {
  return createCommand(
    "mirror.update",
    { point },
    "canvas",
    { mode: "skip" },
  );
}

export function createCommitMirrorSelectionCommand(): EditorCommand {
  return createCommand(
    "mirror.commit",
    {},
    "canvas",
    { mode: "skip" },
  );
}

export function createApplyMirrorCommand(direction: "left" | "right" | "top" | "bottom"): EditorCommand {
  return createCommand(
    "mirror.apply",
    { direction },
    "canvas",
    { mode: "skip" },
  );
}

export function createResetMirrorSelectionCommand(): EditorCommand {
  return createCommand(
    "mirror.reset",
    {},
    "toolbar",
    { mode: "skip" },
  );
}

export function createCancelMirrorCommand(
  source: EditorCommandSource = "toolbar",
): EditorCommand {
  return createCommand(
    "mirror.cancel",
    {},
    source,
    { mode: "skip" },
  );
}

export function createDoneMirrorCommand(): EditorCommand {
  return createCommand(
    "mirror.done",
    {},
    "toolbar",
    { mode: "push", label: "Mirror" },
  );
}

export function createBeginTextPlacementCommand(payload: {
  text: string;
  intrinsicWidth: number;
  intrinsicHeight: number;
  baseFontSize: number;
  fontFamily: string;
  fontStyle: "normal" | "italic";
  fontWeight: number;
  underline: boolean;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
}): EditorCommand {
  return createCommand(
    "text.beginPlacement",
    payload,
    "toolbar",
    { mode: "skip" },
  );
}

export function createPreviewTextPlacementCommand(payload: {
  offsetX: number;
  offsetY: number;
  scale: number;
}): EditorCommand {
  return createCommand(
    "text.previewPlacement",
    payload,
    "canvas",
    { mode: "skip" },
  );
}

export function createUpdateTextPlacementCommand(payload: {
  text?: string;
  intrinsicWidth?: number;
  intrinsicHeight?: number;
  fontFamily?: string;
  fontStyle?: "normal" | "italic";
  fontWeight?: number;
  underline?: boolean;
}): EditorCommand {
  return createCommand(
    "text.updatePlacement",
    payload,
    "toolbar",
    { mode: "skip" },
  );
}

export function createCancelTextPlacementCommand(): EditorCommand {
  return createCommand(
    "text.cancelPlacement",
    {},
    "toolbar",
    { mode: "skip" },
  );
}

export function createBeginTraceRepositionCommand(): EditorCommand {
  return createCommand(
    "trace.beginReposition",
    {},
    "toolbar",
    { mode: "skip" },
  );
}

export function createCancelTraceRepositionCommand(): EditorCommand {
  return createCommand(
    "trace.cancelReposition",
    {},
    "toolbar",
    { mode: "skip" },
  );
}

export function createCommitTraceRepositionCommand(): EditorCommand {
  return createCommand(
    "trace.commitReposition",
    {},
    "toolbar",
    { mode: "push", label: "Reposition Trace" },
  );
}

export function createPreviewTraceRepositionCommand(payload: {
  offsetX: number;
  offsetY: number;
  scale: number;
}): EditorCommand {
  return createCommand(
    "trace.previewReposition",
    payload,
    "canvas",
    { mode: "skip" },
  );
}

export function createAttachTraceCommand(assetUrl: string): EditorCommand {
  return createCommand(
    "trace.attach",
    { assetUrl },
    "toolbar",
    { mode: "push", label: "Attach Trace" },
  );
}

export function createRemoveTraceCommand(): EditorCommand {
  return createCommand(
    "trace.remove",
    {},
    "toolbar",
    { mode: "push", label: "Remove Trace" },
  );
}

export function createUpdateTraceCommand(
  changes: TraceUpdateChanges,
  options?: {
    history?: HistoryPolicy;
    source?: EditorCommandSource;
    transactionKey?: string;
  },
): EditorCommand {
  return createCommand(
    "trace.update",
    { changes },
    options?.source ?? "toolbar",
    options?.history ??
      (options?.transactionKey
        ? { mode: "merge", label: "Update Trace", transactionKey: options.transactionKey }
        : { mode: "push", label: "Update Trace" }),
  );
}

export function createSetViewportZoomCommand(
  zoom: number,
  anchor?: { x: number; y: number },
): EditorCommand {
  return createCommand(
    "viewport.setZoom",
    { zoom, anchor },
    "toolbar",
    { mode: "skip" },
  );
}

export function createPanViewportCommand(
  deltaX: number,
  deltaY: number,
): EditorCommand {
  return createCommand(
    "viewport.pan",
    { deltaX, deltaY },
    "toolbar",
    { mode: "skip" },
  );
}

export function createSetSidebarCollapsedCommand(collapsed: boolean): EditorCommand {
  return createCommand(
    "ui.setSidebarCollapsed",
    { collapsed },
    "toolbar",
    { mode: "skip" },
  );
}

export function createSetActiveSidebarSectionCommand(
  section: EditorSidebarSection,
): EditorCommand {
  return createCommand(
    "ui.setActiveSidebarSection",
    { section },
    "toolbar",
    { mode: "skip" },
  );
}

export function createSetGridlinesVisibleCommand(visible: boolean): EditorCommand {
  return createCommand(
    "ui.setGridlinesVisible",
    { visible },
    "toolbar",
    { mode: "skip" },
  );
}

export function createSetRulerVisibleCommand(visible: boolean): EditorCommand {
  return createCommand(
    "ui.setRulerVisible",
    { visible },
    "toolbar",
    { mode: "skip" },
  );
}

export function createSetSymbolsVisibleCommand(visible: boolean): EditorCommand {
  return createCommand(
    "ui.setSymbolsVisible",
    { visible },
    "toolbar",
    { mode: "skip" },
  );
}

export function createSetPreviewModeCommand(visible: boolean): EditorCommand {
  return createCommand(
    "ui.setPreviewMode",
    { visible },
    "toolbar",
    { mode: "skip" },
  );
}


// export function createSetThreadViewCommand(visible: boolean): EditorCommand {
//   return createCommand(
//     "ui.setThreadView",
//     { visible },
//     "toolbar",
//     { mode: "skip" },
//   );
// }

function createCommand<TKind extends EditorCommand["kind"]>(
  kind: TKind,
  payload: Extract<EditorCommand, { kind: TKind }>["payload"],
  source: Extract<EditorCommand, { kind: TKind }>["meta"]["source"],
  history: HistoryPolicy,
): Extract<EditorCommand, { kind: TKind }> {
  return {
    id: createCommandId(),
    kind,
    payload,
    meta: {
      source,
      timestamp: Date.now(),
      history,
    },
  } as Extract<EditorCommand, { kind: TKind }>;
}

function createCommandId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
