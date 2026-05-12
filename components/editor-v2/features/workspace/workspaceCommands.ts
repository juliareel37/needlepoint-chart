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

export function createApplyProjectServerStateCommand(payload: {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastSavedAt?: number;
}): EditorCommand {
  return createCommand(
    "project.applyServerState",
    {
      ...payload,
      lastSavedAt: payload.lastSavedAt ?? Date.now(),
    },
    "system",
    { mode: "skip" },
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

export function createApplyTraceConversionCommand(payload: {
  replacements: Array<{ index: number; value: string | null }>;
  extractedColorIds: string[];
  activeColorId: string | null;
}): EditorCommand {
  return createCommand(
    "grid.applyTraceConversion",
    payload,
    "toolbar",
    { mode: "push", label: "Convert Image to Pattern" },
  );
}

export function createPreviewTraceConversionCommand(payload: {
  replacements: Array<{ index: number; value: string | null }>;
  extractedColorIds: string[];
  activeColorId: string | null;
}): EditorCommand {
  return createCommand(
    "grid.previewTraceConversion",
    payload,
    "toolbar",
    { mode: "skip" },
  );
}

export function createCommitTraceConversionPreviewCommand(): EditorCommand {
  return createCommand(
    "grid.commitTraceConversionPreview",
    {},
    "toolbar",
    { mode: "push", label: "Convert Image to Pattern" },
  );
}

export function createCancelTraceConversionPreviewCommand(): EditorCommand {
  return createCommand(
    "grid.cancelTraceConversionPreview",
    {},
    "toolbar",
    { mode: "skip" },
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

export function createCustomPaletteCommand(
  paletteId: string,
  name: string,
  colorIds?: string[],
): EditorCommand {
  return createCommand(
    "palette.createCustomPalette",
    { paletteId, name, colorIds },
    "toolbar",
    { mode: "push", label: "Create Palette" },
  );
}

export function createRenameCustomPaletteCommand(
  paletteId: string,
  name: string,
): EditorCommand {
  return createCommand(
    "palette.renameCustomPalette",
    { paletteId, name },
    "toolbar",
    { mode: "push", label: "Rename Palette" },
  );
}

export function createDeleteCustomPaletteCommand(
  paletteId: string,
): EditorCommand {
  return createCommand(
    "palette.deleteCustomPalette",
    { paletteId },
    "toolbar",
    { mode: "push", label: "Delete Palette" },
  );
}

export function createAddColorToCustomPaletteCommand(
  paletteId: string,
  colorId: string,
): EditorCommand {
  return createCommand(
    "palette.addColorToCustomPalette",
    { paletteId, colorId },
    "toolbar",
    { mode: "push", label: "Add Color to Palette" },
  );
}

export function createRemoveColorFromCustomPaletteCommand(
  paletteId: string,
  colorId: string,
): EditorCommand {
  return createCommand(
    "palette.removeColorFromCustomPalette",
    { paletteId, colorId },
    "toolbar",
    { mode: "push", label: "Remove Color from Palette" },
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

export function createMoveSelectionCommand(
  deltaX: number,
  deltaY: number,
): EditorCommand {
  return createCommand(
    "selection.move",
    { deltaX, deltaY },
    "canvas",
    { mode: "skip" },
  );
}

export function createResizeSelectionCommand(
  handle: "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w",
  current: GridPoint,
): EditorCommand {
  return createCommand(
    "selection.resize",
    { handle, current },
    "canvas",
    { mode: "skip" },
  );
}

export function createBeginDuplicatePlacementCommand(): EditorCommand {
  return createCommand(
    "selection.beginDuplicatePlacement",
    {},
    "toolbar",
    { mode: "skip" },
  );
}

export function createBeginCutPlacementCommand(): EditorCommand {
  return createCommand(
    "selection.beginCutPlacement",
    {},
    "toolbar",
    { mode: "skip" },
  );
}

export function createCancelDuplicatePlacementCommand(): EditorCommand {
  return createCommand(
    "selection.cancelDuplicatePlacement",
    {},
    "toolbar",
    { mode: "skip" },
  );
}

export function createCommitDuplicatePlacementCommand(
  deltaX: number,
  deltaY: number,
): EditorCommand {
  return createCommand(
    "selection.commitDuplicatePlacement",
    { deltaX, deltaY },
    "toolbar",
    { mode: "push", label: "Duplicate Selection" },
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

export function createBeginMirrorFromSelectionCommand(): EditorCommand {
  return createCommand(
    "mirror.beginFromSelection",
    {},
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

export function createApplyMirrorFromSelectionCommand(
  direction: "left" | "right" | "top" | "bottom",
): EditorCommand {
  return createCommand(
    "mirror.apply",
    { direction },
    "canvas",
    { mode: "push", label: "Mirror" },
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
  rotation?: number;
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
  rotation: number;
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
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  rotation?: number;
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

export function createBeginIconPlacementCommand(payload: {
  iconId: string;
  name: string;
  src: string;
  mimeType: string | null;
  intrinsicWidth: number;
  intrinsicHeight: number;
  colorSlots: import("@/lib/editor-v2/editor/icons/iconColorSlots").IconColorSlot[];
  primitiveKind: import("@/lib/editor-v2/editor/icons/primitiveIcon").PrimitiveIconKind | null;
  isUserUploaded: boolean;
  lockAspectRatio: boolean;
  primitiveStrokeReferenceSize: number | null;
  supportsStrokeWidth: boolean;
  strokeWidthScale: number;
  primitivePatternScale: number;
  primitiveSpacingScale: number;
  selectedColorSlotId: string | null;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
}): EditorCommand {
  return createCommand(
    "icon.beginPlacement",
    payload,
    "toolbar",
    { mode: "skip" },
  );
}

export function createPreviewIconPlacementCommand(payload: {
  offsetX: number;
  offsetY: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotation: number;
}): EditorCommand {
  return createCommand(
    "icon.previewPlacement",
    payload,
    "canvas",
    { mode: "skip" },
  );
}

export function createUpdateIconPlacementCommand(payload: {
  iconId?: string;
  name?: string;
  src?: string;
  mimeType?: string | null;
  intrinsicWidth?: number;
  intrinsicHeight?: number;
  colorSlots?: import("@/lib/editor-v2/editor/icons/iconColorSlots").IconColorSlot[];
  primitiveKind?: import("@/lib/editor-v2/editor/icons/primitiveIcon").PrimitiveIconKind | null;
  isUserUploaded?: boolean;
  lockAspectRatio?: boolean;
  primitiveStrokeReferenceSize?: number | null;
  supportsStrokeWidth?: boolean;
  strokeWidthScale?: number;
  primitivePatternScale?: number;
  primitiveSpacingScale?: number;
  selectedColorSlotId?: string | null;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
}): EditorCommand {
  return createCommand(
    "icon.updatePlacement",
    payload,
    "toolbar",
    { mode: "skip" },
  );
}

export function createCancelIconPlacementCommand(): EditorCommand {
  return createCommand(
    "icon.cancelPlacement",
    {},
    "toolbar",
    { mode: "skip" },
  );
}

export function createBeginTraceRepositionCommand(
  origin: "upload" | "replace" | "panel" | "toolbar",
): EditorCommand {
  return createCommand(
    "trace.beginReposition",
    { origin },
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
  rotation: number;
}): EditorCommand {
  return createCommand(
    "trace.previewReposition",
    payload,
    "canvas",
    { mode: "skip" },
  );
}

export function createAttachTraceCommand(payload: {
  previewUrl: string;
  thumbnailUrl: string;
  originalUrl: string;
  fileName: string | null;
  byteSize: number | null;
  mimeType: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  origin: "upload" | "replace";
}): EditorCommand {
  return createCommand(
    "trace.attach",
    payload,
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

export function createSetTouchSnappingEnabledCommand(enabled: boolean): EditorCommand {
  return createCommand(
    "ui.setTouchSnappingEnabled",
    { enabled },
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
