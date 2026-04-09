# Editor V2 Current Architecture

## Purpose

This document captures the current `editor-v2` application structure as it exists in the repository today.

It is a snapshot of the implemented architecture, not a target-state redesign.

It focuses on:

- route and app bootstrapping
- store and command boundaries
- component organization
- current design-system bridge usage
- areas that are intentionally still provisional

## Top-Level Route Structure

The `editor-v2` route lives under:

- [`app/editor-v2/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/editor-v2/page.tsx)
- [`app/editor-v2/layout.tsx`](/Users/juliareel/Code/needlepoint-chart/app/editor-v2/layout.tsx)
- [`app/editor-v2/editor-v2.css`](/Users/juliareel/Code/needlepoint-chart/app/editor-v2/editor-v2.css)

`page.tsx` is intentionally thin and renders the app entry component:

- [`components/editor-v2/app/EditorV2Page.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/app/EditorV2Page.tsx)

The route layout and route-scoped CSS exist to isolate `editor-v2` from legacy global shell behavior, especially scroll/layout constraints from [`app/globals.css`](/Users/juliareel/Code/needlepoint-chart/app/globals.css).

## App Bootstrap Flow

The entry flow is:

1. [`EditorV2Page.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/app/EditorV2Page.tsx) decides whether the user is:
   - creating a new design
   - loading a saved local document
2. The setup UI is rendered by:
   - [`EditorV2SetupScreen.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/app/EditorV2SetupScreen.tsx)
3. Initial state is created from one of:
   - [`createNewDesignState.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/store/createNewDesignState.ts)
   - [`createEditorStateFromDocument.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/store/createEditorStateFromDocument.ts)
4. A fresh store instance is created by:
   - [`EditorV2Providers.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/app/EditorV2Providers.tsx)
5. The editor workspace is rendered by:
   - [`EditorV2Workspace.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/app/EditorV2Workspace.tsx)

Important current rule:

- loading a document is treated as store initialization/remount, not live in-place replacement of the open document

That matches the current rebuild direction and avoids introducing a second document mutation path outside commands.

## Store Architecture

The core store contracts live under:

- [`lib/editor-v2/editor/store/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/store)

The store shape is defined in:

- [`state.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/store/state.ts)

Current top-level shape:

```ts
interface EditorStoreState {
  document: EditorDocumentState;
  session: EditorSessionState;
  ui: EditorUiState;
}
```

This is a single store with slices, not three separate stores.

### `document`

Canonical editor data lives in `document`, including:

- project metadata
- grid data
- palette data
- trace image state
- text document state
- schema/persistence metadata

Important current examples:

- grid dimensions and cells are canonical document state
- trace image asset URL, visibility, opacity, and transform are document state

### `session`

Transient editor runtime state lives in `session`, including:

- active tool
- viewport camera state
- selection state
- history
- persistence session flags
- trace interaction runtime flags
- text interaction draft state
- in-flight command tracking

Important current examples:

- active color selection lives in `session.activeTool.colorId`
- viewport lives in `session.viewport`
- rectangular selection lives in `session.selection`

### `ui`

Display-only shell state lives in `ui`.

The current `editor-v2` slice does not yet use much of the `ui` slice in the visible shell, but the store keeps the separation in place.

## Mutation Model

All editor state mutation is command-driven.

Command contracts live under:

- [`lib/editor-v2/editor/commands/types.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/commands/types.ts)
- [`lib/editor-v2/editor/commands/registry.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/commands/registry.ts)
- [`lib/editor-v2/editor/commands/handlers/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/commands/handlers)

Current rule set:

- `document` changes happen through commands only
- document updates remain patch-based
- session-only and ui-only commands do not mutate document
- UI components do not mutate canonical editor state directly

Patch application lives in:

- [`patches.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/store/patches.ts)
- [`applyDocumentPatches.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/store/applyDocumentPatches.ts)

## History Model

History lives in:

- [`lib/editor-v2/editor/history/HistoryEngine.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/history/HistoryEngine.ts)

Current behavior:

- document-changing commands are undoable
- session-only commands are not pushed into document history
- drag paint and drag erase merge into a single undoable stroke through the transaction/merge model
- clear canvas is a one-shot destructive but undoable command

Undo/redo UI is currently exposed in the main floating toolbar, but history remains store-driven rather than component-managed.

## Selector Organization

Selectors live under:

- [`lib/editor-v2/editor/selectors/document/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/selectors/document)
- [`lib/editor-v2/editor/selectors/session/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/selectors/session)
- [`lib/editor-v2/editor/selectors/derived/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/selectors/derived)

Representative examples:

- document:
  - [`getCell.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/selectors/document/getCell.ts)
  - [`getPaletteColors.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/selectors/document/getPaletteColors.ts)
  - [`getTraceDocument.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/selectors/document/getTraceDocument.ts)
- session:
  - [`getActiveColorId.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/selectors/session/getActiveColorId.ts)
  - [`getSelectionBounds.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/selectors/session/getSelectionBounds.ts)
  - [`getCanUndo.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/selectors/session/getCanUndo.ts)
  - [`getViewport.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/selectors/session/getViewport.ts)
- derived:
  - [`getActiveColor.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/selectors/derived/getActiveColor.ts)
  - [`getUsedColors.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/selectors/derived/getUsedColors.ts)
  - [`isCellSelected.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/selectors/derived/isCellSelected.ts)

Current UI code reads store state through selectors where practical, while still allowing a few direct reads from the top-level snapshot in composition components.

## React Binding Layer

The React/store bridge lives in:

- [`editorStoreContext.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/app/editorStoreContext.tsx)

This layer currently provides:

- store context
- dispatch access
- selector-based subscription through `useSyncExternalStore`

This is intentionally minimal and avoids adding broader framework abstraction at this stage.

## Current Application UI Organization

Current visible editor composition centers on:

- [`shell/EditorV2Shell.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/workspace/shell/EditorV2Shell.tsx)

That component wires the current shell into three main areas:

1. Sidebar
   - [`shell/EditorSidebar.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/workspace/shell/EditorSidebar.tsx)
2. Main editing stage
   - [`stage/GridWorldSurface.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/workspace/stage/GridWorldSurface.tsx)
3. In-stage floating toolbars
   - [`shell/FloatingToolbar.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/workspace/shell/FloatingToolbar.tsx)
   - [`shell/ViewportToolbar.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/workspace/shell/ViewportToolbar.tsx)

Shell layout styling currently lives in:

- [`shell/EditorV2Shell.module.css`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/workspace/shell/EditorV2Shell.module.css)

### Sidebar responsibilities

The sidebar is now one actual bounded rail rather than a stack of independent cards.

It currently owns:

- document title display
- new/save/load actions
- active color display and palette selection
- used colors summary
- trace controls

Supporting components:

- [`shell/TraceControls.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/workspace/shell/TraceControls.tsx)
- [`shell/UsedColorsSummary.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/workspace/shell/UsedColorsSummary.tsx)

### Stage responsibilities

The stage is the visible viewport for the editor world.

It currently owns:

- fixed visible camera area
- centered world anchor
- world rendering
- in-stage toolbar overlays

The stage itself is a shell region. The actual grid world is rendered inside [`stage/GridWorldSurface.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/workspace/stage/GridWorldSurface.tsx).

## Current World Rendering Model

The current world rendering is still DOM-based, but the architecture no longer treats DOM as the conceptual source of truth.

Viewport and geometry helpers live in:

- [`lib/editor-v2/editor/viewport/gridGeometry.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/viewport/gridGeometry.ts)
- [`lib/editor-v2/editor/viewport/index.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/viewport/index.ts)

Current rendering model:

1. fixed stage viewport
2. centered world anchor inside the stage
3. viewport transform applied to the world layer
4. world-space rendering of:
   - white backing sheet
   - trace image
   - cell layer
   - grid overlay layer

Important current rule:

- DOM is an implementation convenience for rendering and hit targets
- viewport state, grid geometry, and world-space assumptions are modeled independently so a future non-DOM renderer does not require rewriting the editor architecture

## Current Interaction Organization

The interaction layer lives under:

- [`interactions/useGridInteractions.ts`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/workspace/interactions/useGridInteractions.ts)
- [`interactions/usePaintStroke.ts`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/workspace/interactions/usePaintStroke.ts)
- [`interactions/useSelectionDrag.ts`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/workspace/interactions/useSelectionDrag.ts)
- [`interactions/useClearSelectionOnEscape.ts`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/workspace/interactions/useClearSelectionOnEscape.ts)

Current split:

- `useGridInteractions` composes the interaction hooks
- `usePaintStroke` owns local stroke lifecycle for paint and erase
- `useSelectionDrag` owns local rectangular selection drag lifecycle
- `useClearSelectionOnEscape` owns the narrow Escape-to-clear behavior

This keeps raw pointer/stroke bookkeeping local while preserving the store as the only canonical state owner.

## Current Feature Coverage

The implemented `editor-v2` slice currently covers:

- new design creation with initial grid size
- local save/load through `localStorage`
- paint
- erase
- clear canvas
- rectangular selection
- clear selection
- active color selection
- undo/redo
- trace upload
- trace visibility and opacity
- trace offset and scale
- viewport zoom and pan

Local persistence currently lives in:

- [`editorV2LocalPersistence.ts`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/app/editorV2LocalPersistence.ts)

This is intentionally local-only for now and does not yet replace the legacy server-backed WIP system.

## Design-System Bridge

The current reusable bridge layer lives under:

- [`components/design-system/`](/Users/juliareel/Code/needlepoint-chart/components/design-system)

Current bridge primitives:

- [`Button.tsx`](/Users/juliareel/Code/needlepoint-chart/components/design-system/Button.tsx)
- [`Field.tsx`](/Users/juliareel/Code/needlepoint-chart/components/design-system/Field.tsx)
- [`Panel.tsx`](/Users/juliareel/Code/needlepoint-chart/components/design-system/Panel.tsx)
- [`Toolbar.tsx`](/Users/juliareel/Code/needlepoint-chart/components/design-system/Toolbar.tsx)

These are intentionally small and exist to unblock `editor-v2` shell composition without trying to redesign the entire app design system.

## Current Cleanup Status

Recent cleanup already completed:

- preview leftovers such as the old `PreviewControls` surface have been removed
- `EditorV2Page` has already been narrowed by extracting the setup screen
- interaction logic has already been split into focused hooks

## Known Provisional Areas

The current implementation is healthier than the legacy editor, but a few areas are still intentionally provisional:

- [`stage/GridWorldSurface.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/workspace/stage/GridWorldSurface.tsx) still concentrates several world-rendering concerns
- local save/load is still a temporary application-layer persistence solution
- the design-system bridge is intentionally small and does not yet provide a full shell/layout framework
- some UI styling remains editor-local rather than fully systematized

## Practical Reading Order

For someone onboarding into `editor-v2`, the fastest useful reading order is:

1. [`components/editor-v2/app/EditorV2Page.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/app/EditorV2Page.tsx)
2. [`components/editor-v2/features/workspace/shell/EditorV2Shell.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/workspace/shell/EditorV2Shell.tsx)
3. [`components/editor-v2/features/workspace/shell/EditorSidebar.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/workspace/shell/EditorSidebar.tsx)
4. [`components/editor-v2/features/workspace/stage/GridWorldSurface.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/workspace/stage/GridWorldSurface.tsx)
5. [`components/editor-v2/features/workspace/interactions/useGridInteractions.ts`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/workspace/interactions/useGridInteractions.ts)
6. [`lib/editor-v2/editor/store/state.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/store/state.ts)
7. [`lib/editor-v2/editor/commands/types.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/commands/types.ts)
8. [`lib/editor-v2/editor/commands/registry.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/commands/registry.ts)
9. [`lib/editor-v2/editor/history/HistoryEngine.ts`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/history/HistoryEngine.ts)

## Summary

The current `editor-v2` implementation is organized around:

- a single command-driven store
- explicit `document` / `session` / `ui` slice boundaries
- selector-based reads
- a DOM-rendered but world-modeled editing surface
- a real shell with sidebar, stage, and floating toolbars

The current direction is intentionally cleaner than the legacy editor, and the next work should continue preserving those boundaries rather than introducing convenience shortcuts.
