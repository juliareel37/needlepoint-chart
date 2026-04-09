import type {
  EditorCommand,
  EditorCommandSource,
  HistoryPolicy,
} from "@/lib/editor-v2/editor/commands";
import type {
  ActiveTool,
  EditorSidebarSection,
  GridPoint,
  SelectionPoint,
  TraceDocument,
} from "@/lib/editor-v2/editor/store";

export function createUndoCommand(): EditorCommand {
  return createCommand("history.undo", {}, "toolbar", { mode: "skip" });
}

export function createRedoCommand(): EditorCommand {
  return createCommand("history.redo", {}, "toolbar", { mode: "skip" });
}

export function createSetToolCommand(tool: ActiveTool): EditorCommand {
  return createCommand("tool.setActive", { tool }, "toolbar", { mode: "skip" });
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
): EditorCommand {
  return createCommand(
    "grid.paint",
    { colorId, cells },
    "toolbar",
    { mode: "push", label: "Paint Selection" },
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

export function createEraseCellsCommand(cells: GridPoint[]): EditorCommand {
  return createCommand(
    "grid.erase",
    { cells },
    "toolbar",
    { mode: "push", label: "Erase Selection" },
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
  changes: Partial<
    Pick<
      TraceDocument,
      "visible" | "blendMode" | "opacity" | "offsetX" | "offsetY" | "scale"
    >
  >,
): EditorCommand {
  return createCommand(
    "trace.update",
    { changes },
    "toolbar",
    { mode: "push", label: "Update Trace" },
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
