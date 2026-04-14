import type {
  ActiveTool,
  EditorSidebarSection,
  GridPoint,
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
  | "grid.paint"
  | "grid.erase"
  | "grid.clear"
  | "palette.swapColor"
  | "selection.start"
  | "selection.update"
  | "selection.commit"
  | "selection.clear"
  | "selection.setShape"
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

export type PaintCellsCommand = BaseEditorCommand<
  "grid.paint",
  { colorId: string; cells: GridPoint[] }
>;

export type EraseCellsCommand = BaseEditorCommand<
  "grid.erase",
  { cells: GridPoint[] }
>;

export type ClearCanvasCommand = BaseEditorCommand<"grid.clear", object>;

export type SwapPaletteColorCommand = BaseEditorCommand<
  "palette.swapColor",
  { fromColorId: string; toColorId: string }
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

export type ClearSelectionCommand = BaseEditorCommand<"selection.clear", object>;

export type SetSelectionShapeCommand = BaseEditorCommand<
  "selection.setShape",
  { shape: SelectionState["shape"] }
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
  }
>;

export type PreviewTextPlacementCommand = BaseEditorCommand<
  "text.previewPlacement",
  { offsetX: number; offsetY: number; scale: number }
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
  }
>;

export type CancelTextPlacementCommand = BaseEditorCommand<
  "text.cancelPlacement",
  object
>;

export type BeginTraceRepositionCommand = BaseEditorCommand<
  "trace.beginReposition",
  object
>;

export type PreviewTraceRepositionCommand = BaseEditorCommand<
  "trace.previewReposition",
  { offsetX: number; offsetY: number; scale: number }
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
  { assetUrl: string }
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

export type SetPreviewModeCommand = BaseEditorCommand<
  "ui.setPreviewMode",
  { visible: boolean }
>;

export type UndoCommand = BaseEditorCommand<"history.undo", object>;
export type RedoCommand = BaseEditorCommand<"history.redo", object>;

export type EditorCommand =
  | SetProjectTitleCommand
  | PaintCellsCommand
  | EraseCellsCommand
  | ClearCanvasCommand
  | SwapPaletteColorCommand
  | StartSelectionCommand
  | UpdateSelectionCommand
  | CommitSelectionCommand
  | ClearSelectionCommand
  | SetSelectionShapeCommand
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
  | SetPreviewModeCommand
  | OpenPanelCommand
  | UndoCommand
  | RedoCommand;

export interface EditorCommandContext {
  now(): number;
  generateId(): string;
}
