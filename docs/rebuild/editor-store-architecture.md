# Editor Store Architecture

## Purpose

This document defines a TypeScript-first store architecture for the rebuilt editor described in:

- [`docs/rebuild/editor-state-model.md`](/Users/juliareel/Code/needlepoint-chart/docs/rebuild/editor-state-model.md)
- [`docs/rebuild/proposed-editor-architecture.md`](/Users/juliareel/Code/needlepoint-chart/docs/rebuild/proposed-editor-architecture.md)

It is grounded in the current repository, especially:

- [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- [`components/pattern-editor/hooks/useCanvasEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useCanvasEdits.ts)
- [`components/pattern-editor/hooks/useSelectionTools.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useSelectionTools.ts)
- [`components/pattern-editor/hooks/useColorEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useColorEdits.ts)
- [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)
- [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx)
- [`app/api/wip/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/route.ts)
- [`app/api/wip/[id]/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/route.ts)

This is an architecture document only.

It does **not**:

- implement the store
- introduce React bindings
- define UI components

## Design Constraints From The Current Repo

The current codebase shows why the new store must be explicit:

- [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx) currently mixes canonical document data, transient editing state, and UI-only state in one shell.
- [`components/pattern-editor/hooks/useCanvasEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useCanvasEdits.ts) and [`components/pattern-editor/hooks/useSelectionTools.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useSelectionTools.ts) both participate in mutation flow, but there is no single command boundary.
- [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts) contains session and persistence orchestration that should not live in UI wiring.
- [`components/pattern-editor/utils/historyTypes.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/historyTypes.ts) currently mixes snapshot ideas with runtime-only objects such as `HTMLImageElement`.

The rebuilt store should solve those specific problems by:

- enforcing one canonical `document` slice
- separating `session` from `ui`
- routing all mutations through commands
- integrating history at the command layer rather than ad hoc in features

## Top-Level Store Shape

The store should have exactly three top-level slices:

- `document`
- `session`
- `ui`

This is a **single** `EditorStore`.

These are slices within one store instance, not separate stores.

That means:

- one subscription boundary
- one command dispatch boundary
- one history boundary
- one canonical state tree

The rebuild should not introduce separate “document store,” “canvas store,” or “UI store” runtimes that can drift from each other.

```ts
export interface EditorStoreState {
  document: EditorDocumentState;
  session: EditorSessionState;
  ui: EditorUiState;
}
```

That is intentionally narrower than the current shape in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx), where many concerns sit side by side without strong boundaries.

## Slice 1: `document`

`document` is the canonical saved project state.

Everything here must be:

- serializable
- stable enough for save/load
- safe to snapshot for history

```ts
export interface EditorDocumentState {
  project: ProjectDocument;
  grid: GridDocument;
  palette: PaletteDocument;
  trace: TraceDocument | null;
  text: TextDocument;
  metadata: DocumentMetadata;
}
```

```ts
export interface ProjectDocument {
  id: string | null;
  title: string;
  createdAt: string | null;
  updatedAt: string | null;
  sourceVersion: number;
}
```

```ts
export interface GridDocument {
  width: number;
  height: number;
  meshCount: number | null;
  sizingMode: "stitches" | "inches";
  widthInches: number | null;
  heightInches: number | null;
  cells: GridCellValue[];
}

export type GridCellValue = string | null;
```

Grid representation rule:

- `cells` is a flat array with length `width * height`
- cell index is `y * width + x`

That rule should be treated as part of the contract, not as an implementation detail, because grid mutation commands, selectors, rendering, and persistence adapters all depend on the same indexing model.

```ts
export interface PaletteDocument {
  colorsById: Record<string, PaletteColor>;
  customPalettesById: Record<string, CustomPalette>;
  extractedPaletteIds: string[];
  symbolAssignments: Record<string, string>;
}

export interface PaletteColor {
  id: string;
  brand: "dmc" | "custom";
  code: string;
  name: string;
  hex: string;
}

export interface CustomPalette {
  id: string;
  name: string;
  colorIds: string[];
}
```

```ts
export interface TraceDocument {
  assetUrl: string;
  opacity: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;
  locked: boolean;
  visible: boolean;
}
```

```ts
export interface TextDocument {
  mode: "destructive-grid" | "entities";
  entities: TextEntity[];
}

export interface TextEntity {
  id: string;
  text: string;
  colorId: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: "normal" | "italic";
  fontWeight: number;
  x: number;
  y: number;
}
```

```ts
export interface DocumentMetadata {
  legacyDraftId: string | null;
  persistedVersionId: string | null;
  schemaVersion: number;
}
```

### Current repo grounding

This slice is meant to absorb canonical state currently spread across:

- grid, palette, trace, and title state in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- persisted WIP payloads flowing through [`app/api/wip/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/route.ts)
- restore logic in [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)

## Slice 2: `session`

`session` is transient editor runtime state.

It exists to support editing, navigation, history, previews, and persistence coordination, but it is not the saved document itself.

```ts
export interface EditorSessionState {
  activeTool: ActiveToolState;
  viewport: ViewportState;
  selection: SelectionState;
  history: HistoryState;
  persistence: PersistenceSessionState;
  traceInteraction: TraceInteractionState;
  textInteraction: TextInteractionState;
  inFlightCommand: InFlightCommandState | null;
}
```

```ts
export type ActiveTool =
  | "paint"
  | "erase"
  | "fill"
  | "pan"
  | "lasso"
  | "mirror"
  | "trace"
  | "text";

export interface ActiveToolState {
  tool: ActiveTool;
  brushSize: number;
  colorId: string | null;
}
```

```ts
export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
  fitted: boolean;
}
```

```ts
export interface SelectionState {
  mode: "none" | "rect" | "lasso" | "mirror";
  rect: GridRect | null;
  lassoPoints: GridPoint[];
  mirrorAxis: "horizontal" | "vertical" | null;
  preview: SelectionPreviewState | null;
}

export interface GridPoint {
  x: number;
  y: number;
}

export interface GridRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectionPreviewState {
  hoveredCell: GridPoint | null;
  liveRegion: GridRect | null;
}
```

```ts
export interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  lastAppliedCommandId: string | null;
  transaction: HistoryTransactionState | null;
}

export interface HistoryEntry {
  commandId: string;
  label: string;
  inversePatches: DocumentPatch[];
  timestamp: number;
}

export interface HistoryTransactionState {
  id: string;
  label: string;
  inversePatches: DocumentPatch[];
}
```

```ts
export interface PersistenceSessionState {
  currentDraftId: string | null;
  dirty: boolean;
  saving: boolean;
  loading: boolean;
  lastSavedAt: number | null;
  lastLoadedAt: number | null;
  restoreSource: "none" | "server" | "local-backup" | "version-preview";
  versionPreview: VersionPreviewState | null;
}

export interface VersionPreviewState {
  versionId: string;
  draftId: string;
}
```

```ts
export interface TraceInteractionState {
  uploadStatus: "idle" | "uploading" | "uploaded" | "error";
  placementMode: "idle" | "move" | "scale" | "rotate";
  runtimeImageRefId: string | null;
}
```

```ts
export interface TextInteractionState {
  draftText: string;
  draftColorId: string | null;
  draftFontFamily: string;
  draftFontSize: number;
  draftFontStyle: "normal" | "italic";
  draftFontWeight: number;
  previewPosition: GridPoint | null;
}
```

```ts
export interface InFlightCommandState {
  id: string;
  kind: EditorCommandKind;
  startedAt: number;
  source: EditorCommandMeta["source"];
}
```

`inFlightCommand` is intentionally narrow.

It should only be used for async command/effect coordination such as:

- save in progress
- load in progress
- trace upload in progress

It should **not** be used as a general-purpose “currently doing something” bucket for synchronous local editing state.

### Current repo grounding

This slice is meant to replace transient state currently split across:

- tool and viewport state in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- selection state in [`components/pattern-editor/hooks/useSelectionTools.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useSelectionTools.ts)
- paint batching and history flow in [`components/pattern-editor/hooks/useCanvasEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useCanvasEdits.ts)
- save/load coordination in [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)

## Slice 3: `ui`

`ui` is display-only chrome state.

This slice should never be required to reconstruct the project document.

```ts
export interface EditorUiState {
  shell: ShellUiState;
  panels: PanelUiState;
  dialogs: DialogUiState;
  menus: MenuUiState;
  preferences: UiPreferenceState;
}
```

```ts
export interface ShellUiState {
  sidebarCollapsed: boolean;
  mobileToolbarVisible: boolean;
  mobileToolbarCollapsed: boolean;
  isCompact: boolean;
  isNarrow: boolean;
}
```

```ts
export interface PanelUiState {
  gridOpen: boolean;
  wipOpen: boolean;
  traceOpen: boolean;
  usedColorsOpen: boolean;
  customPalettesOpen: boolean;
  imageToPatternOpen: boolean;
  textOpen: boolean;
}
```

```ts
export interface DialogUiState {
  confirmDialog: ConfirmDialogState | null;
  draftPickerOpen: boolean;
  versionHistoryOpen: boolean;
}

export interface ConfirmDialogState {
  kind: "delete-draft" | "discard-changes" | "resize-grid" | "delete-color";
  payload: Record<string, unknown>;
}
```

```ts
export interface MenuUiState {
  fileMenuOpen: boolean;
  mobileSettingsOpen: boolean;
  activePopoverId: string | null;
}
```

```ts
export interface UiPreferenceState {
  darkMode: boolean;
  showGridlines: boolean;
  showMajorGridlines: boolean;
  showRuler: boolean;
  showSymbols: boolean;
  threadView: boolean;
  darkCanvas: boolean;
  gridMajorInterval: number;
}
```

### Current repo grounding

This slice removes display concerns from canonical state currently mixed inside:

- [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)
- [`components/pattern-editor/cards/TextToolCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/TextToolCard.tsx)
- [`components/pattern-editor/sections/UsedColorsSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/UsedColorsSection.tsx)

## Store Interface

The store contract should be framework-agnostic.

```ts
export interface EditorStore {
  getState(): EditorStoreState;
  subscribe(listener: EditorStoreListener): EditorUnsubscribe;
  dispatch(command: EditorCommand): EditorCommandResult;
  run(effect: EditorEffect): Promise<void>;
}

export type EditorStoreListener = (
  nextState: EditorStoreState,
  prevState: EditorStoreState,
  event: EditorStoreEvent,
) => void;

export type EditorUnsubscribe = () => void;
```

```ts
export interface EditorCommandResult {
  commandId: string;
  ok: boolean;
  error?: EditorCommandError;
  emittedEffects: EditorEffect[];
}

export interface EditorCommandError {
  code: string;
  message: string;
  cause?: unknown;
}

export interface EditorStoreEvent {
  type: "command" | "history" | "session" | "ui";
  commandId?: string;
  label?: string;
}
```

## Mutation Model

All state mutations must go through the command system.

This is the core enforcement rule for the rebuilt editor.

Hard rules:

- commands are the **only** way to mutate `document`
- UI/features must never mutate store state directly
- reducers/handlers must not return arbitrary full-state replacements for routine edits
- command handlers return targeted patches plus bounded session/UI updates

That means no feature module, canvas module, effect runner, or persistence adapter may:

- mutate `state.document`
- patch arrays or objects in place outside command handling
- replace the full `EditorStoreState` as a shortcut for normal user actions

The only valid write path is:

1. feature or system dispatches a command
2. command handler validates input
3. handler computes document patches and any needed session/UI updates
4. store applies those patches
5. history/effects are derived from the command result

For document changes, commands should return patches describing the affected area, not full document replacements, unless the action is intentionally whole-document in nature such as:

- `persistence.loadDraft`
- `persistence.restoreVersion`
- full project reset

## Command Design Rules

Commands should represent meaningful user actions, not low-level implementation chatter.

Good command shape:

- `grid.paint`
- `palette.replaceColor`
- `trace.updateTransform`
- `persistence.saveDraft`

Bad command shape:

- `grid.setCellValueAtIndex`
- `ui.setBooleanFlag`
- `palette.writeColorRecordField`

Guardrails:

- prefer commands that map to user intent
- avoid creating excessive one-field or one-flag commands when the action is conceptually one operation
- prefer extending an existing command payload when the user action is still the same action
- create a new command only when the action has different validation, history, or effect semantics

This matters because AI-assisted implementation will otherwise tend to generate too many tiny mutation entry points and reintroduce architectural drift.

## Command System

All state mutation should happen through commands.

Features should not mutate store state directly.

That rule exists because the current repo has mutation spread across:

- top-level shell handlers in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- editing hooks like [`components/pattern-editor/hooks/useCanvasEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useCanvasEdits.ts)
- color hooks like [`components/pattern-editor/hooks/useColorEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useColorEdits.ts)

The rebuild needs one mutation path.

### Command shape

```ts
export type EditorCommand =
  | SetProjectTitleCommand
  | ResizeGridCommand
  | PaintCellsCommand
  | EraseCellsCommand
  | FillRegionCommand
  | ReplaceColorCommand
  | MergeColorsCommand
  | DeleteColorCommand
  | SetViewportCommand
  | FitViewportCommand
  | SetActiveToolCommand
  | StartSelectionCommand
  | UpdateSelectionCommand
  | CommitSelectionCommand
  | AttachTraceCommand
  | UpdateTraceTransformCommand
  | SetTextDraftCommand
  | CommitTextCommand
  | SaveDraftCommand
  | LoadDraftCommand
  | RestoreVersionCommand
  | UndoCommand
  | RedoCommand
  | OpenPanelCommand
  | ClosePanelCommand;
```

```ts
export type EditorCommandKind =
  | "project.setTitle"
  | "grid.resize"
  | "grid.paint"
  | "grid.erase"
  | "grid.fill"
  | "palette.replaceColor"
  | "palette.mergeColors"
  | "palette.deleteColor"
  | "viewport.set"
  | "viewport.fit"
  | "tool.setActive"
  | "selection.start"
  | "selection.update"
  | "selection.commit"
  | "trace.attach"
  | "trace.updateTransform"
  | "text.setDraft"
  | "text.commit"
  | "persistence.saveDraft"
  | "persistence.loadDraft"
  | "persistence.restoreVersion"
  | "history.undo"
  | "history.redo"
  | "ui.openPanel"
  | "ui.closePanel";

export interface BaseEditorCommand<TKind extends EditorCommandKind, TPayload> {
  id: string;
  kind: TKind;
  payload: TPayload;
  meta: EditorCommandMeta;
}

export interface EditorCommandMeta {
  source: "canvas" | "toolbar" | "dialog" | "autosave" | "hotkey" | "system";
  timestamp: number;
  history: HistoryPolicy;
}
```

### Example command interfaces

```ts
export type SetProjectTitleCommand = BaseEditorCommand<
  "project.setTitle",
  { title: string }
>;

export type ResizeGridCommand = BaseEditorCommand<
  "grid.resize",
  { width: number; height: number; preserveContent: boolean }
>;

export type PaintCellsCommand = BaseEditorCommand<
  "grid.paint",
  { colorId: string; cells: GridPoint[] }
>;

export type ReplaceColorCommand = BaseEditorCommand<
  "palette.replaceColor",
  { fromColorId: string; toColorId: string; scope: "document" | "selection" }
>;

export type AttachTraceCommand = BaseEditorCommand<
  "trace.attach",
  { assetUrl: string; opacity: number }
>;

export type SaveDraftCommand = BaseEditorCommand<
  "persistence.saveDraft",
  { reason: "manual" | "autosave" }
>;

export type UndoCommand = BaseEditorCommand<"history.undo", {}>;
export type RedoCommand = BaseEditorCommand<"history.redo", {}>;
```

## Command Handling Rules

Each command handler should:

1. validate the command payload against current state
2. compute document/session/ui mutations
3. emit document patches and session changes
4. register history when policy says the command is undoable
5. emit side effects for external work such as save/load/upload

```ts
export interface EditorCommandHandler<TCommand extends EditorCommand = EditorCommand> {
  canHandle(command: EditorCommand): command is TCommand;
  handle(
    state: EditorStoreState,
    command: TCommand,
    context: EditorCommandContext,
  ): EditorCommandExecution;
}

export interface EditorCommandContext {
  now(): number;
  generateId(): string;
}

export interface EditorCommandExecution {
  nextState: EditorStoreState;
  patches: DocumentPatch[];
  inversePatches: DocumentPatch[];
  effects: EditorEffect[];
  event: EditorStoreEvent;
}
```

Implementation rule:

- `patches` and `inversePatches` describe only `document` changes
- session and UI updates are carried in `nextState`
- handlers should touch the smallest affected document area possible

## Persistence Boundary

Persistence is outside the core store.

The core store owns state and command processing.
Persistence adapters observe command results or effects and interact with:

- [`app/api/wip/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/route.ts)
- [`app/api/wip/[id]/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/route.ts)

Persistence contract rules:

- persistence serializes `document`
- persistence does **not** serialize `ui`
- persistence does **not** serialize general `session` state
- any session field persisted for compatibility must be explicitly whitelisted

In practice, persistence should consume:

- `EditorDocumentState`
- a narrowly defined compatibility payload when required

It should not consume:

- open panels
- popovers
- menu visibility
- active tool
- transient selection previews
- viewport interaction flags

Persistence should be triggered through:

- effects
- store subscriptions
- orchestration services around the store

It should not live as hidden mutation logic inside feature code.

## Patch Model

Commands should not expose raw mutable object edits.

Instead, handlers should produce explicit patches so history and persistence can reason about document changes consistently.

```ts
export type DocumentPatch =
  | ReplaceGridCellsPatch
  | ResizeGridPatch
  | ReplaceColorPatch
  | UpsertTracePatch
  | RemoveTracePatch
  | UpdateProjectMetadataPatch
  | UpsertTextEntityPatch
  | RemoveTextEntityPatch;
```

```ts
export interface ReplaceGridCellsPatch {
  type: "grid.replaceCells";
  cells: Array<{ index: number; value: GridCellValue }>;
}

export interface ResizeGridPatch {
  type: "grid.resize";
  width: number;
  height: number;
  cells: GridCellValue[];
}

export interface ReplaceColorPatch {
  type: "palette.replaceColor";
  fromColorId: string;
  toColorId: string;
}

export interface UpsertTracePatch {
  type: "trace.upsert";
  trace: TraceDocument;
}

export interface RemoveTracePatch {
  type: "trace.remove";
}

export interface UpdateProjectMetadataPatch {
  type: "project.metadata.update";
  changes: Partial<ProjectDocument>;
}

export interface UpsertTextEntityPatch {
  type: "text.upsertEntity";
  entity: TextEntity;
}

export interface RemoveTextEntityPatch {
  type: "text.removeEntity";
  entityId: string;
}
```

## History + Transaction Model

History is command-driven and document-scoped.

Hard rules:

- only document-changing commands are recorded in history
- session-only changes are not undoable
- UI-only changes are not undoable
- history entries are produced by command execution, not by features

This is a direct correction to the current split responsibility between:

- [`components/pattern-editor/hooks/useHistoryStack.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useHistoryStack.ts)
- [`components/pattern-editor/hooks/useCanvasEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useCanvasEdits.ts)

### Transaction boundaries

Commands may be grouped into a transaction when multiple command emissions represent one user action.

Examples:

- one brush stroke producing many paint updates
- one drag interaction producing many trace transform updates
- one lasso drag producing many selection updates before commit

The primary transaction mechanism should be `HistoryPolicy.mode === "merge"` with a stable `transactionKey`.

That key defines the transaction boundary.

Practical rule:

- same `transactionKey` + merge policy = same history entry
- new `transactionKey` = new history entry

If implementation later needs explicit lifecycle helpers, they may be added as store-internal helpers such as:

- `beginTransaction`
- `endTransaction`

But feature code should still express history intent through command metadata, not by manipulating history state directly.

## History Integration

History should be integrated with the command pipeline, not bolted on in features.

That is a direct response to the current system, where undo/redo semantics are spread across:

- [`components/pattern-editor/hooks/useHistoryStack.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useHistoryStack.ts)
- [`components/pattern-editor/hooks/useCanvasEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useCanvasEdits.ts)

### Core rule

If a command changes `document`, it is eligible for history.

If a command changes only `session` or `ui`, it is not added to undo history unless there is a deliberate exception.

### History policy

```ts
export type HistoryPolicy =
  | { mode: "skip" }
  | { mode: "push"; label: string }
  | { mode: "merge"; label: string; transactionKey: string };
```

Examples:

- `grid.paint` usually uses `{ mode: "merge", label: "Paint", transactionKey: strokeId }`
- `grid.resize` uses `{ mode: "push", label: "Resize Grid" }`
- `viewport.set` uses `{ mode: "skip" }`
- `ui.openPanel` uses `{ mode: "skip" }`

### Undo/redo flow

1. A normal command executes.
2. The handler returns `inversePatches`.
3. If history policy is `push` or `merge`, the command writes an entry to `session.history.past`.
4. `UndoCommand` applies the stored inverse patches to `document`.
5. `RedoCommand` reapplies the forward patches or recomputed equivalent patches.

### History snapshot rule

History entries must never contain runtime-only objects.

That specifically means:

- no `HTMLImageElement`
- no DOM refs
- no callback functions
- no canvas instances

This rule is informed by the current snapshot mixing visible in [`components/pattern-editor/utils/historyTypes.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/historyTypes.ts).

### Recommended history interfaces

```ts
export interface HistoryEngine {
  record(
    state: HistoryState,
    command: EditorCommand,
    forwardPatches: DocumentPatch[],
    inversePatches: DocumentPatch[],
  ): HistoryState;
  undo(state: EditorStoreState): EditorCommandExecution | null;
  redo(state: EditorStoreState): EditorCommandExecution | null;
}
```

Implementation note:

- `UndoCommand` and `RedoCommand` are commands for consistency
- they are handled by the history engine/store core
- features never read or manipulate `session.history` directly

## Effects And External Work

Commands may need to trigger external work, but external work should not directly mutate state.

Examples from the current repo:

- saving a draft through [`app/api/wip/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/route.ts)
- loading/restoring drafts through [`app/api/wip/[id]/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/route.ts)
- trace upload through [`app/api/upload-trace/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/upload-trace/route.ts)

The handler should emit an effect, and the effect runner should later dispatch a follow-up command with the result.

```ts
export type EditorEffect =
  | SaveDraftEffect
  | LoadDraftEffect
  | RestoreVersionEffect
  | UploadTraceEffect;

export interface SaveDraftEffect {
  type: "effect.saveDraft";
  request: SaveDraftRequest;
}

export interface LoadDraftEffect {
  type: "effect.loadDraft";
  draftId: string;
}

export interface RestoreVersionEffect {
  type: "effect.restoreVersion";
  draftId: string;
  versionId: string;
}

export interface UploadTraceEffect {
  type: "effect.uploadTrace";
  fileRefId: string;
}
```

```ts
export interface SaveDraftRequest {
  draftId: string | null;
  document: EditorDocumentState;
  reason: "manual" | "autosave";
}
```

### Effect rule

Effects may call:

- API routes
- upload services
- local backup adapters

Effects may not:

- mutate the store directly
- bypass command dispatch

They must dispatch a result command such as:

- `persistence.saveDraftCompleted`
- `persistence.saveDraftFailed`
- `trace.uploadCompleted`
- `trace.uploadFailed`

## Canvas Contract

The canvas layer is a renderer and input translator only.

Hard rules:

- canvas does not own canonical state
- canvas does not mutate store state directly
- canvas reads state via selectors
- canvas emits commands only

The replacement for responsibilities currently concentrated in [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx) should be split conceptually into:

- render input: selector-derived data needed to draw
- local pointer state: ephemeral gesture state that does not belong in the store
- command output: mutations emitted back to the store

Canvas may locally own only truly ephemeral runtime values such as:

- pointer id
- drag start coordinates
- hover coordinates
- current stroke point buffer before dispatch

Canvas may not locally own:

- active tool as canonical state
- viewport as canonical state
- selection as canonical state
- trace transform as canonical state
- document cell data as canonical state

## Selector Structure

Selectors should be organized by concern:

- `selectors/document`
- `selectors/session`
- `selectors/derived`

Purpose of each:

- `selectors/document`: direct reads from canonical document state
- `selectors/session`: direct reads from transient editor/session state
- `selectors/derived`: computed values that combine document and session state

Example structure:

```ts
// lib/editor-v2/editor/selectors/document/gridSelectors.ts
export function getCell(
  state: EditorStoreState,
  x: number,
  y: number,
): GridCellValue | null;

// lib/editor-v2/editor/selectors/session/selectionSelectors.ts
export function getSelectionBounds(
  state: EditorStoreState,
): GridRect | null;

// lib/editor-v2/editor/selectors/derived/paletteSelectors.ts
export function getUsedColors(
  state: EditorStoreState,
): UsedColorSummary[];
```

Selector rules:

- features read through selectors where available
- selectors are pure
- derived selectors must not mutate or cache inside state
- expensive derived selectors may use memoization, but memoization must stay outside canonical state

## Performance Rules

The store architecture should optimize for localized updates.

Hard rules:

- do not clone full document state unnecessarily
- use patches to update only affected document areas
- avoid recomputing all derived state on every change
- prefer memoized selectors where derived computation is expensive

Practical implications:

- painting a handful of cells should not rebuild unrelated document structures
- color replacement should touch only the affected grid/palette structures
- viewport updates should not trigger whole-document recalculation
- used-color summaries should come from derived selectors, not duplicated stored aggregates unless profiling proves a need

If an implementation needs caching, cache should live in:

- selector memoization
- effect orchestration
- renderer-local ephemeral state

It should not be baked into canonical `document` as redundant derived fields unless that is a deliberate, documented exception.

## Feature Interaction Rules

These are the hard boundaries features should follow.

Features under the planned `editor-v2` structure in [`components/editor-v2/features/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features) must follow these rules mechanically.

## Rule 1: Features may read via selectors, not deep state spelunking

Feature code should not reach across the entire raw store tree when a selector exists.

Bad legacy precedent:

- giant components like [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx) and [`components/pattern-editor/sections/UsedColorsSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/UsedColorsSection.tsx) consume broad state surfaces directly.

Preferred pattern:

```ts
export interface EditorSelectors {
  getProjectTitle(state: EditorStoreState): string;
  getUsedColors(state: EditorStoreState): UsedColorSummary[];
  getViewport(state: EditorStoreState): ViewportState;
  getActiveSelection(state: EditorStoreState): SelectionState;
  getCanUndo(state: EditorStoreState): boolean;
}

export interface UsedColorSummary {
  colorId: string;
  count: number;
}
```

## Rule 2: Features may write only by dispatching commands

Feature modules under the planned new structure in [`components/editor-v2/features/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features) should never:

- mutate state objects
- call history directly
- update persistence state directly

They dispatch commands and let the store pipeline handle the rest.

## Rule 2A: Features cannot directly call other features

Feature modules communicate only through:

- selectors
- commands
- shared domain/editor services

They should not import another feature module in order to trigger behavior inside it.

That avoids recreating the current implicit coupling spread across large shells and sections such as:

- [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- [`components/pattern-editor/sections/UsedColorsSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/UsedColorsSection.tsx)

## Rule 3: Features may own local ephemeral view state, but not canonical editor state

Allowed feature-local state examples:

- whether a popover is visually open
- local input text before submit
- hovered menu item

Not allowed as feature-local state:

- canonical grid cells
- canonical palette assignments
- undo stack
- current persisted draft identity

That rule is meant to prevent the kind of duplication currently seen in:

- draft grid size state vs live grid size state in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- persistence state hidden in [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)

## Rule 4: Features may not cross slices arbitrarily

Examples:

- color workflows can mutate `document.palette` and `document.grid`, but should not directly toggle unrelated shell chrome under `ui.shell`
- viewport tools can mutate `session.viewport`, but should not directly rewrite trace persistence metadata
- persistence features can mutate `session.persistence` and replace `document`, but should not silently edit `ui.panels` unless commanded

## Rule 5: Session state is not a dumping ground

If a value is:

- saved with the document, it goes in `document`
- only visual chrome, it goes in `ui`
- truly editing/session runtime state, it goes in `session`

This rule exists because the legacy app currently blurs those categories heavily across:

- [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)

## Rule 6: Persistence adapters must consume document state, not arbitrary UI state

Adapters around:

- [`app/api/wip/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/route.ts)
- [`app/api/wip/[id]/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/route.ts)

should serialize from `document` plus only the small subset of `session` fields that are intentionally persisted for compatibility.

They should not need:

- open panel state
- popover state
- menu visibility

## Rule 7: Canvas code is a command producer, not a second store

The new canvas runtime replacing responsibilities currently concentrated in [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx) should:

- read document and session state through selectors
- produce editing commands
- keep only truly ephemeral pointer/gesture state locally

It should not become a second source of truth for:

- pan/zoom
- selection
- active tool
- trace transform

## Suggested Folder Mapping For This Architecture

These interfaces would fit naturally into the same-repo rebuild structure described in [`docs/rebuild/proposed-editor-architecture.md`](/Users/juliareel/Code/needlepoint-chart/docs/rebuild/proposed-editor-architecture.md):

- store contracts in [`lib/editor-v2/editor/store/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/store)
- command interfaces in [`lib/editor-v2/editor/commands/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/commands)
- history interfaces in [`lib/editor-v2/editor/history/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/history)
- selectors in [`lib/editor-v2/editor/selectors/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/selectors)
- document contracts in [`lib/editor-v2/domain/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/domain)
- persistence effect adapters in [`lib/editor-v2/integrations/wip/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/integrations/wip)

## Final Recommendation

The rebuilt editor should have:

- one top-level `EditorStoreState`
- three top-level slices: `document`, `session`, `ui`
- one command-based mutation path
- history integrated at the command layer through document patches
- selectors as the primary read boundary
- effects for save/load/upload work

That model is specific to the problems visible in the current repo and is designed to prevent the rebuild from reproducing the same state-sprawl patterns now concentrated in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx) and its surrounding hooks.
