import type {
  ActiveTool,
  EditorSidebarSection,
  GridPoint,
  PanelUiState,
  SelectionPoint,
  TraceDocument,
  ViewportState,
} from "../store/state";

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
  | "selection.start"
  | "selection.update"
  | "selection.commit"
  | "selection.clear"
  | "trace.attach"
  | "trace.remove"
  | "trace.update"
  | "viewport.setZoom"
  | "viewport.pan"
  | "tool.setActive"
  | "ui.setSidebarCollapsed"
  | "ui.setActiveSidebarSection"
  | "ui.setGridlinesVisible"
  | "ui.setRulerVisible"
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

export type ClearCanvasCommand = BaseEditorCommand<"grid.clear", {}>;

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

export type ClearSelectionCommand = BaseEditorCommand<"selection.clear", {}>;

export type AttachTraceCommand = BaseEditorCommand<
  "trace.attach",
  { assetUrl: string }
>;

export type RemoveTraceCommand = BaseEditorCommand<"trace.remove", {}>;

export type UpdateTraceCommand = BaseEditorCommand<
  "trace.update",
  {
    changes: Partial<
      Pick<
        TraceDocument,
        "visible" | "blendMode" | "opacity" | "offsetX" | "offsetY" | "scale"
      >
    >;
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

export type UndoCommand = BaseEditorCommand<"history.undo", {}>;
export type RedoCommand = BaseEditorCommand<"history.redo", {}>;

export type EditorCommand =
  | SetProjectTitleCommand
  | PaintCellsCommand
  | EraseCellsCommand
  | ClearCanvasCommand
  | StartSelectionCommand
  | UpdateSelectionCommand
  | CommitSelectionCommand
  | ClearSelectionCommand
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
  | OpenPanelCommand
  | UndoCommand
  | RedoCommand;

export interface EditorCommandContext {
  now(): number;
  generateId(): string;
}
