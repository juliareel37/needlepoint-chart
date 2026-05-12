import type {
  ActiveTool,
  EditorSidebarSection,
  GridPoint,
  IconPlacementSession,
  MirrorDirection,
  PanelUiState,
  SelectionState,
  SelectionPoint,
} from "../store/state";
import type { TraceUpdateChanges } from "../store/patches";

export type EditorCommandSource =
  | "canvas"
  | "toolbar"
  | "dialog"
  | "autosave"
  | "hotkey"
  | "system";

export type HistoryPolicy =
  | { mode: "skip" }
  | { mode: "push"; label: string }
  | { mode: "merge"; label: string; transactionKey: string };

export type EditorCommandKind =
  | "project.setTitle"
  | "project.applyServerState"
  | "grid.paint"
  | "grid.erase"
  | "grid.clear"
  | "grid.applyTraceConversion"
  | "grid.previewTraceConversion"
  | "grid.commitTraceConversionPreview"
  | "grid.cancelTraceConversionPreview"
  | "palette.swapColor"
  | "palette.deleteUsedColors"
  | "palette.mergeUsedColors"
  | "palette.createCustomPalette"
  | "palette.renameCustomPalette"
  | "palette.deleteCustomPalette"
  | "palette.addColorToCustomPalette"
  | "palette.removeColorFromCustomPalette"
  | "selection.start"
  | "selection.update"
  | "selection.commit"
  | "selection.move"
  | "selection.resize"
  | "selection.beginDuplicatePlacement"
  | "selection.beginCutPlacement"
  | "selection.cancelDuplicatePlacement"
  | "selection.commitDuplicatePlacement"
  | "selection.clear"
  | "selection.setShape"
  | "mirror.beginFromSelection"
  | "mirror.start"
  | "mirror.update"
  | "mirror.commit"
  | "mirror.apply"
  | "mirror.reset"
  | "mirror.cancel"
  | "mirror.done"
  | "text.beginPlacement"
  | "text.updatePlacement"
  | "text.previewPlacement"
  | "text.cancelPlacement"
  | "icon.beginPlacement"
  | "icon.updatePlacement"
  | "icon.previewPlacement"
  | "icon.cancelPlacement"
  | "trace.attach"
  | "trace.remove"
  | "trace.update"
  | "trace.beginReposition"
  | "trace.previewReposition"
  | "trace.cancelReposition"
  | "trace.commitReposition"
  | "viewport.setZoom"
  | "viewport.pan"
  | "tool.setActive"
  | "ui.setSidebarCollapsed"
  | "ui.setActiveSidebarSection"
  | "ui.setGridlinesVisible"
  | "ui.setRulerVisible"
  | "ui.setSymbolsVisible"
  | "ui.setTouchSnappingEnabled"
  | "ui.setPreviewMode"
  | "ui.openPanel"
  | "history.undo"
  | "history.redo";

export interface BaseEditorCommand<TKind extends EditorCommandKind, TPayload> {
  id: string;
  kind: TKind;
  payload: TPayload;
  meta: EditorCommandMeta;
}

export interface EditorCommandMeta {
  source: EditorCommandSource;
  timestamp: number;
  history: HistoryPolicy;
}

export type SetProjectTitleCommand = BaseEditorCommand<
  "project.setTitle",
  { title: string }
>;

export type ApplyProjectServerStateCommand = BaseEditorCommand<
  "project.applyServerState",
  {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    lastSavedAt: number;
  }
>;

export type PaintCellsCommand = BaseEditorCommand<
  "grid.paint",
  { colorId: string; cells: GridPoint[] }
>;

export type EraseCellsCommand = BaseEditorCommand<
  "grid.erase",
  { cells: GridPoint[] }
>;

export type ClearCanvasCommand = BaseEditorCommand<"grid.clear", object>;

export type ApplyTraceConversionCommand = BaseEditorCommand<
  "grid.applyTraceConversion",
  {
    replacements: Array<{ index: number; value: string | null }>;
    extractedColorIds: string[];
    activeColorId: string | null;
  }
>;

export type PreviewTraceConversionCommand = BaseEditorCommand<
  "grid.previewTraceConversion",
  {
    replacements: Array<{ index: number; value: string | null }>;
    extractedColorIds: string[];
    activeColorId: string | null;
  }
>;

export type CommitTraceConversionPreviewCommand = BaseEditorCommand<
  "grid.commitTraceConversionPreview",
  object
>;

export type CancelTraceConversionPreviewCommand = BaseEditorCommand<
  "grid.cancelTraceConversionPreview",
  object
>;

export type SwapPaletteColorCommand = BaseEditorCommand<
  "palette.swapColor",
  { fromColorId: string; toColorId: string }
>;

export type DeleteUsedColorsCommand = BaseEditorCommand<
  "palette.deleteUsedColors",
  { colorIds: string[] }
>;

export type MergeUsedColorsCommand = BaseEditorCommand<
  "palette.mergeUsedColors",
  { fromColorIds: string[]; toColorId: string }
>;

export type CreateCustomPaletteCommand = BaseEditorCommand<
  "palette.createCustomPalette",
  { paletteId: string; name: string; colorIds?: string[] }
>;

export type RenameCustomPaletteCommand = BaseEditorCommand<
  "palette.renameCustomPalette",
  { paletteId: string; name: string }
>;

export type DeleteCustomPaletteCommand = BaseEditorCommand<
  "palette.deleteCustomPalette",
  { paletteId: string }
>;

export type AddColorToCustomPaletteCommand = BaseEditorCommand<
  "palette.addColorToCustomPalette",
  { paletteId: string; colorId: string }
>;

export type RemoveColorFromCustomPaletteCommand = BaseEditorCommand<
  "palette.removeColorFromCustomPalette",
  { paletteId: string; colorId: string }
>;

export type StartSelectionCommand = BaseEditorCommand<
  "selection.start",
  { point: SelectionPoint }
>;

export type UpdateSelectionCommand = BaseEditorCommand<
  "selection.update",
  { point: SelectionPoint }
>;

export type CommitSelectionCommand = BaseEditorCommand<
  "selection.commit",
  { point: SelectionPoint | null }
>;

export type MoveSelectionCommand = BaseEditorCommand<
  "selection.move",
  { deltaX: number; deltaY: number }
>;

export type ResizeSelectionCommand = BaseEditorCommand<
  "selection.resize",
  {
    handle: "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
    current: GridPoint;
  }
>;

export type BeginDuplicatePlacementCommand = BaseEditorCommand<
  "selection.beginDuplicatePlacement",
  object
>;

export type BeginCutPlacementCommand = BaseEditorCommand<
  "selection.beginCutPlacement",
  object
>;

export type CancelDuplicatePlacementCommand = BaseEditorCommand<
  "selection.cancelDuplicatePlacement",
  object
>;

export type CommitDuplicatePlacementCommand = BaseEditorCommand<
  "selection.commitDuplicatePlacement",
  { deltaX: number; deltaY: number }
>;

export type ClearSelectionCommand = BaseEditorCommand<"selection.clear", object>;

export type SetSelectionShapeCommand = BaseEditorCommand<
  "selection.setShape",
  { shape: SelectionState["shape"] }
>;

export type BeginMirrorFromSelectionCommand = BaseEditorCommand<
  "mirror.beginFromSelection",
  object
>;

export type StartMirrorCommand = BaseEditorCommand<
  "mirror.start",
  { point: GridPoint }
>;

export type UpdateMirrorCommand = BaseEditorCommand<
  "mirror.update",
  { point: GridPoint }
>;

export type CommitMirrorCommand = BaseEditorCommand<
  "mirror.commit",
  object
>;

export type ApplyMirrorCommand = BaseEditorCommand<
  "mirror.apply",
  { direction: MirrorDirection }
>;

export type ResetMirrorCommand = BaseEditorCommand<
  "mirror.reset",
  object
>;

export type CancelMirrorCommand = BaseEditorCommand<
  "mirror.cancel",
  object
>;

export type DoneMirrorCommand = BaseEditorCommand<
  "mirror.done",
  object
>;

export type BeginTextPlacementCommand = BaseEditorCommand<
  "text.beginPlacement",
  {
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
  }
>;

export type PreviewTextPlacementCommand = BaseEditorCommand<
  "text.previewPlacement",
  { offsetX: number; offsetY: number; scale: number; rotation: number }
>;

export type UpdateTextPlacementCommand = BaseEditorCommand<
  "text.updatePlacement",
  {
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
  }
>;

export type CancelTextPlacementCommand = BaseEditorCommand<
  "text.cancelPlacement",
  object
>;

export type BeginIconPlacementCommand = BaseEditorCommand<
  "icon.beginPlacement",
  Pick<
    IconPlacementSession,
    | "iconId"
    | "name"
    | "src"
    | "mimeType"
    | "intrinsicWidth"
    | "intrinsicHeight"
    | "colorSlots"
    | "primitiveKind"
    | "isUserUploaded"
    | "lockAspectRatio"
    | "primitiveStrokeReferenceSize"
    | "supportsStrokeWidth"
    | "strokeWidthScale"
    | "primitivePatternScale"
    | "primitiveSpacingScale"
    | "selectedColorSlotId"
  > & {
    offsetX?: number;
    offsetY?: number;
    scale?: number;
    scaleX?: number;
    scaleY?: number;
    rotation?: number;
  }
>;

export type PreviewIconPlacementCommand = BaseEditorCommand<
  "icon.previewPlacement",
  {
    offsetX: number;
    offsetY: number;
    scale?: number;
    scaleX?: number;
    scaleY?: number;
    rotation: number;
  }
>;

export type UpdateIconPlacementCommand = BaseEditorCommand<
  "icon.updatePlacement",
  Partial<
    Pick<
      IconPlacementSession,
      | "iconId"
      | "name"
      | "src"
      | "mimeType"
      | "intrinsicWidth"
      | "intrinsicHeight"
      | "colorSlots"
      | "primitiveKind"
      | "isUserUploaded"
      | "lockAspectRatio"
      | "primitiveStrokeReferenceSize"
      | "supportsStrokeWidth"
      | "strokeWidthScale"
      | "primitivePatternScale"
      | "primitiveSpacingScale"
      | "selectedColorSlotId"
      | "offsetX"
      | "offsetY"
      | "scaleX"
      | "scaleY"
    >
  > & {
    scale?: number;
    rotation?: number;
  }
>;

export type CancelIconPlacementCommand = BaseEditorCommand<
  "icon.cancelPlacement",
  object
>;

export type BeginTraceRepositionCommand = BaseEditorCommand<
  "trace.beginReposition",
  { origin: "upload" | "replace" | "panel" | "toolbar" }
>;

export type PreviewTraceRepositionCommand = BaseEditorCommand<
  "trace.previewReposition",
  { offsetX: number; offsetY: number; scale: number; rotation: number }
>;

export type CancelTraceRepositionCommand = BaseEditorCommand<
  "trace.cancelReposition",
  object
>;

export type CommitTraceRepositionCommand = BaseEditorCommand<
  "trace.commitReposition",
  object
>;

export type AttachTraceCommand = BaseEditorCommand<
  "trace.attach",
  {
    previewUrl: string;
    thumbnailUrl: string;
    originalUrl: string;
    fileName: string | null;
    byteSize: number | null;
    mimeType: string | null;
    imageWidth: number | null;
    imageHeight: number | null;
    origin: "upload" | "replace";
  }
>;

export type RemoveTraceCommand = BaseEditorCommand<"trace.remove", object>;

export type UpdateTraceCommand = BaseEditorCommand<
  "trace.update",
  {
    changes: TraceUpdateChanges;
  }
>;

export type SetViewportZoomCommand = BaseEditorCommand<
  "viewport.setZoom",
  { zoom: number; anchor?: { x: number; y: number } }
>;

export type PanViewportCommand = BaseEditorCommand<
  "viewport.pan",
  { deltaX: number; deltaY: number }
>;

export type SetActiveToolCommand = BaseEditorCommand<
  "tool.setActive",
  { tool: ActiveTool; brushSize?: number; colorId?: string | null }
>;

export type OpenPanelCommand = BaseEditorCommand<
  "ui.openPanel",
  { panel: keyof PanelUiState }
>;

export type SetSidebarCollapsedCommand = BaseEditorCommand<
  "ui.setSidebarCollapsed",
  { collapsed: boolean }
>;

export type SetActiveSidebarSectionCommand = BaseEditorCommand<
  "ui.setActiveSidebarSection",
  { section: EditorSidebarSection }
>;

export type SetGridlinesVisibleCommand = BaseEditorCommand<
  "ui.setGridlinesVisible",
  { visible: boolean }
>;

export type SetRulerVisibleCommand = BaseEditorCommand<
  "ui.setRulerVisible",
  { visible: boolean }
>;

export type SetSymbolsVisibleCommand = BaseEditorCommand<
  "ui.setSymbolsVisible",
  { visible: boolean }
>;

export type SetTouchSnappingEnabledCommand = BaseEditorCommand<
  "ui.setTouchSnappingEnabled",
  { enabled: boolean }
>;

export type SetPreviewModeCommand = BaseEditorCommand<
  "ui.setPreviewMode",
  { visible: boolean }
>;

export type UndoCommand = BaseEditorCommand<"history.undo", object>;
export type RedoCommand = BaseEditorCommand<"history.redo", object>;

export type EditorCommand =
  | SetProjectTitleCommand
  | ApplyProjectServerStateCommand
  | PaintCellsCommand
  | EraseCellsCommand
  | ClearCanvasCommand
  | ApplyTraceConversionCommand
  | PreviewTraceConversionCommand
  | CommitTraceConversionPreviewCommand
  | CancelTraceConversionPreviewCommand
  | SwapPaletteColorCommand
  | DeleteUsedColorsCommand
  | MergeUsedColorsCommand
  | CreateCustomPaletteCommand
  | RenameCustomPaletteCommand
  | DeleteCustomPaletteCommand
  | AddColorToCustomPaletteCommand
  | RemoveColorFromCustomPaletteCommand
  | StartSelectionCommand
  | UpdateSelectionCommand
  | CommitSelectionCommand
  | MoveSelectionCommand
  | ResizeSelectionCommand
  | BeginDuplicatePlacementCommand
  | BeginCutPlacementCommand
  | CancelDuplicatePlacementCommand
  | CommitDuplicatePlacementCommand
  | ClearSelectionCommand
  | SetSelectionShapeCommand
  | BeginMirrorFromSelectionCommand
  | StartMirrorCommand
  | UpdateMirrorCommand
  | CommitMirrorCommand
  | ApplyMirrorCommand
  | ResetMirrorCommand
  | CancelMirrorCommand
  | DoneMirrorCommand
  | BeginTextPlacementCommand
  | UpdateTextPlacementCommand
  | PreviewTextPlacementCommand
  | CancelTextPlacementCommand
  | BeginIconPlacementCommand
  | UpdateIconPlacementCommand
  | PreviewIconPlacementCommand
  | CancelIconPlacementCommand
  | BeginTraceRepositionCommand
  | PreviewTraceRepositionCommand
  | CancelTraceRepositionCommand
  | CommitTraceRepositionCommand
  | AttachTraceCommand
  | RemoveTraceCommand
  | UpdateTraceCommand
  | SetViewportZoomCommand
  | PanViewportCommand
  | SetActiveToolCommand
  | SetSidebarCollapsedCommand
  | SetActiveSidebarSectionCommand
  | SetGridlinesVisibleCommand
  | SetRulerVisibleCommand
  | SetSymbolsVisibleCommand
  | SetTouchSnappingEnabledCommand
  | SetPreviewModeCommand
  | OpenPanelCommand
  | UndoCommand
  | RedoCommand;

export interface EditorCommandContext {
  now(): number;
  generateId(): string;
}
