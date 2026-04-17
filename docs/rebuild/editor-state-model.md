# Editor State Model For Rebuild

## Purpose

This document proposes a cleaner editor state model for a rebuild of the current application rooted at [`app/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/page.tsx) and [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx).

It is grounded in the current repository, especially:

- [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- [`components/pattern-editor/hooks/useCanvasEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useCanvasEdits.ts)
- [`components/pattern-editor/hooks/useColorEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useColorEdits.ts)
- [`components/pattern-editor/hooks/useSelectionTools.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useSelectionTools.ts)
- [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)
- [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)
- [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx)
- [`app/api/wip/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/route.ts)
- [`app/api/wip/[id]/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/route.ts)
- [`prisma/schema.prisma`](/Users/juliareel/Code/needlepoint-chart/prisma/schema.prisma)

This is a design document only. It does not implement changes.

## Current Problem Summary

The current editor does not have a single explicit state model. Instead, it is represented by a large number of top-level React states in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx), then further split across hook-local states in:

- [`components/pattern-editor/hooks/useCanvasEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useCanvasEdits.ts)
- [`components/pattern-editor/hooks/useColorEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useColorEdits.ts)
- [`components/pattern-editor/hooks/useSelectionTools.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useSelectionTools.ts)
- [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)
- [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)
- [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx)

This causes four recurring problems:

- persistent document state is mixed with transient workflow state
- transient workflow state is mixed with UI-open/closed state
- derived values are stored alongside canonical values
- the same concept exists in multiple representations at the same time

The rebuild should make each state category explicit and assign it a clear owner.

## 1. Persistent Project / Document State

### What belongs here

Persistent project/document state is the state that defines the saved pattern itself. It should be serializable and stable across sessions.

For this app, that includes:

- project identity and metadata
  - `title`
  - current draft id once associated with persisted storage
- canvas/grid document data
  - grid width
  - grid height
  - grid cell contents
  - grid sizing mode if it is a true document property
  - mesh count if it is a true document property
- palette/document color data
  - full available palette if custom additions are part of the document
  - extracted palette ids if they are meant to persist with the document
  - custom palette definitions if they are document-owned
- text entities placed onto the pattern
  - currently text is rasterized directly into grid cells in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx), so the repo does not yet prove there are persistent text objects
  - for a rebuild, decide deliberately whether text remains a destructive grid operation or becomes a first-class entity before bake-in
- trace/background image document state
  - image URL / blob URL reference
  - opacity
  - scale
  - offsets
  - lock state
  - transform basis if needed for migration compatibility

Current persisted draft shape is visible in:

- [`app/api/wip/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/route.ts)
- [`app/api/wip/[id]/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/route.ts)
- [`components/pattern-editor/hooks/useWipDrafts.ts:1073`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts#L1073)

### Where this state is currently mixed or duplicated

- In [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx), document state is stored directly next to UI state such as `sidebarCollapsed`, `fileMenuOpen`, `activeMenuId`, and `mobileToolbarCollapsed`.
- Grid document state is duplicated into draft form fields:
  - `gridW`, `gridH`, `gridMode`, `meshCount`, `widthIn`, `heightIn`
  - `draftGridW`, `draftGridH`, `draftGridMode`, `draftMeshCount`, `draftWidthIn`, `draftHeightIn`
  - all in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- Trace state exists in several parallel forms:
  - live state in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
  - history snapshots in [`components/pattern-editor/utils/historyTypes.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/historyTypes.ts)
  - persisted JSON in [`app/api/wip/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/route.ts)
  - browser recovery/session data in [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)
- Palette-related state is split between:
  - `palette`
  - `extractedPaletteIds`
  - custom palette state inside [`components/pattern-editor/sections/CustomPalettesSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/CustomPalettesSection.tsx)

### Recommended correct new owner

Create a single `EditorDocumentStore` or equivalent document state owner responsible only for canonical project data.

That owner should be the only place allowed to hold:

- saved document metadata
- canonical grid content
- canonical palette/custom palette content
- canonical trace document properties
- canonical placed entities if the rebuild introduces non-grid entities

It should not own:

- popovers
- open panels
- drag state
- dirty flags
- autosave scheduling
- viewport
- current tool mode

### Boundary

Persistent document state answers:

- What would be written to storage?
- What would be reconstructed when a project is loaded?
- What is part of the saved pattern itself?

If a value should survive save/load, it belongs here. If it only exists while interacting with the editor, it does not.

## 2. Transient Editor / Session State

### What belongs here

Transient editor/session state is state required to perform editing, navigation, and recovery, but not state that defines the document itself.

For this app, that includes:

- current active tool
  - `tool`
  - `brushSize`
  - `panMode`
- in-progress selection and manipulation state
  - lasso points / lasso closed
  - active selection rectangle
  - selection-in-progress flags
  - mirror selection rectangle and direction workflow
- undo/redo history stacks
  - currently in [`components/pattern-editor/hooks/useHistoryStack.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useHistoryStack.ts)
- stroke batching / in-progress paint preview state
  - currently in [`components/pattern-editor/hooks/useCanvasEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useCanvasEdits.ts)
- viewport/session navigation state
  - zoom
  - pan offset
  - fit token / restore token / reset token
- transient trace manipulation state
  - upload in progress
  - post-upload placement mode
  - edit mode
  - pending unlock
- transient text placement state
  - text draft inputs while editing
  - pending text placement before commit
- dirty state / recovery state / version preview state
  - current draft id association
  - dirty flag
  - version preview open state
  - local backup recovery decisions
  - autosave timers and save-in-flight coordination

### Where this state is currently mixed or duplicated

- Tool, selection, history, and viewport state are split across:
  - [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
  - [`components/pattern-editor/hooks/useCanvasEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useCanvasEdits.ts)
  - [`components/pattern-editor/hooks/useSelectionTools.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useSelectionTools.ts)
  - [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx)
- Viewport state is split between:
  - `zoom` in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
  - `canvasPanOffsetRef` in the same file
  - `panOffset` local state in [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx)
  - restore/reset tokens in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- Selection state is split between:
  - [`components/pattern-editor/hooks/useSelectionTools.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useSelectionTools.ts)
  - local preview state in [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx)
  - filter-edit state in [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)
- Persistence session logic is mixed into React lifecycle state in [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts), even though much of it is really session orchestration rather than UI state.

### Recommended correct new owner

Split transient editor/session state into dedicated owners:

- `ToolState`
- `SelectionState`
- `ViewportState`
- `HistoryState`
- `SessionPersistenceState`
- `TextPlacementState`
- `TracePlacementState`

The important point is not whether these are separate stores or reducers. The important point is that they should not all collapse back into one top-level component.

### Boundary

Transient editor/session state answers:

- What am I doing right now?
- What am I previewing right now?
- What can I undo right now?
- What part of the saved document is currently being manipulated?

If losing the value on refresh would be acceptable unless explicitly session-persisted, it belongs here.

## 3. UI-Only State

### What belongs here

UI-only state should include visual chrome and layout state that does not affect the document or editing rules.

For this app, that includes:

- panel open/closed state
  - `gridOpen`
  - `wipOpen`
  - `traceOpen`
  - `usedColorsOpen`
  - `imageToPatternOpen`
  - `textOpen`
- sidebar and responsive layout state
  - `sidebarCollapsed`
  - `sidebarContentVisible`
  - `sidebarScrollable`
  - `isNarrow`
  - `isCompact`
  - `isVerySmall`
  - `mobileToolbarVisible`
  - `mobileToolbarCollapsed`
- menu and dialog visibility
  - `fileMenuOpen`
  - `mobileSettingsOpen`
  - `confirmDialog`
  - popover open/closed and position state
- toolbar/panel micro-state in [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)
- file-menu rename micro-state
  - `isRenaming`
  - `draftTitle`
- theme and appearance preferences
  - `darkMode`
  - `showGridlines`
  - `showRuler`
  - `showMajorGridlines`
  - `gridMajorInterval`
  - `showSymbols`
  - `threadView`
  - `darkCanvas` if it remains display-only

### Where this state is currently mixed or duplicated

- UI-only state is heavily mixed into [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx) alongside document state.
- [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx) contains large volumes of popover and toolbar state that should not be coupled to document updates.
- UI-only palette menu state also exists in:
  - [`components/pattern-editor/cards/TextToolCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/TextToolCard.tsx)
  - [`components/pattern-editor/sections/UsedColorsSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/UsedColorsSection.tsx)
  - [`components/pattern-editor/sections/CustomPalettesSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/CustomPalettesSection.tsx)

### Recommended correct new owner

UI-only state should be owned by local view components whenever possible.

Examples:

- sidebar view state belongs to the sidebar shell
- file menu state belongs to the file menu component
- toolbar popover state belongs to the toolbar component
- section collapse state belongs to the section/card component

Only UI state that needs to be shared across multiple sibling surfaces should move to a shared UI controller.

### Boundary

UI-only state answers:

- What is expanded?
- What popover is open?
- What layout mode is active?
- What visual preference is currently enabled?

It should never be required to deserialize a project correctly.

## 4. Derived / Computed State

### What belongs here

Derived/computed state should be produced from canonical state, not stored as separate mutable truth unless there is a measured performance reason.

For this app, that includes:

- `paletteById`
- used colors and counts
- used color ids
- symbol map if it can be deterministically derived
- fit cell size
- display cell size
- rendered trace scale and rendered trace offsets
- filtered palette lists and grouped palette rows
- effective grid background and effective trace opacity
- export legend inputs

Concrete current examples:

- [`components/pattern-editor/PatternEditor.tsx:160`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx#L160)
- [`components/pattern-editor/PatternEditor.tsx:546`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx#L546)
- [`components/pattern-editor/hooks/useColorEdits.ts:373`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useColorEdits.ts#L373)
- [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)

### Where this state is currently mixed or duplicated

- Some values are derived repeatedly in different files, especially around palette grouping and used-color calculations.
- Some values that could be derived are also tracked as mutable state, for example:
  - portions of viewport restoration tokens
  - color menu presentation subsets
  - preview-state copies of grid for remap/merge/delete in [`components/pattern-editor/hooks/useColorEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useColorEdits.ts)
- `symbolMap` is currently managed as mutable state in [`components/pattern-editor/hooks/useColorEdits.ts:410`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useColorEdits.ts#L410), even though part of its meaning is derived from currently used colors plus available symbols.

### Recommended correct new owner

Derived state should be owned by selectors and pure helper functions, not by top-level mutable state, unless:

- deriving it is too expensive to compute on demand, and
- it cannot be memoized predictably from canonical inputs

For rebuild purposes:

- keep derivations close to their domain owner
- expose read-only selectors to UI
- avoid committing derived lists into long-lived mutable state unless necessary

### Boundary

Derived state answers:

- Given the current canonical and transient state, what should the UI show?

It should be reproducible from upstream state and should not need independent persistence.

## Current Competing Sources Of Truth

These are the most important current conflicts to eliminate in a rebuild.

### Grid Size and Measurement

Current competing state:

- `gridW`, `gridH`
- `gridMode`, `meshCount`, `widthIn`, `heightIn`
- `draftGridW`, `draftGridH`, `draftGridMode`, `draftMeshCount`, `draftWidthIn`, `draftHeightIn`

All of these live in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx).

Rebuild direction:

- keep one canonical document size model
- keep one draft form model only where a resize form is open
- do not let temporary form state live permanently beside canonical state

### Trace State

Current competing state:

- live trace values in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- history trace snapshots in [`components/pattern-editor/utils/historyTypes.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/historyTypes.ts)
- persisted JSON in API payloads
- local backup/session recovery copies in [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)

Rebuild direction:

- define one canonical trace document model
- define one transient trace manipulation model
- keep runtime-only image object references outside the persisted domain model

### Viewport State

Current competing state:

- `zoom` and `zoomRef` in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- `canvasPanOffsetRef` in the same file
- `panOffset` in [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx)
- restore/reset token state in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- session persistence hooks in [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)

Rebuild direction:

- one viewport owner
- explicit commands for fit, restore, reset, focus cell
- persistence layer may serialize viewport snapshots, but should not own viewport logic

### Palette and Color Workflows

Current competing state:

- canonical palette in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- used color derivations in [`components/pattern-editor/hooks/useColorEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useColorEdits.ts)
- custom palette workflow state inside [`components/pattern-editor/sections/CustomPalettesSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/CustomPalettesSection.tsx)
- duplicated palette filtering/menu state in [`components/pattern-editor/cards/TextToolCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/TextToolCard.tsx) and [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)

Rebuild direction:

- one canonical color/palette domain owner
- separate ephemeral workflow state for replace/merge/delete/custom-palette editing
- shared selectors for palette display and filtering

### Dirty / Save / Recovery State

Current competing state:

- `isDirty`
- dirty suppression refs
- local backup
- session resume payloads
- current draft id
- autosave intervals
- version preview state

Mostly in [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts).

Rebuild direction:

- one session/persistence controller owning save state and recovery logic
- document store should not know about autosave timers

## Proposed Normalized Editor Data Model

This is a proposed normalized model for the rebuild. It is intentionally shaped around the current repo’s real features.

```ts
type EditorDocument = {
  id: string | null;
  version: 1;
  meta: {
    title: string;
  };
  grid: {
    width: number;
    height: number;
    cells: Uint16Array | number[];
    sizing: {
      mode: "stitches" | "inches";
      meshCount: number;
      widthIn: number;
      heightIn: number;
    };
  };
  palette: {
    colors: Array<{
      id: number;
      name: string;
      hex: string;
      code?: string;
      family?: string;
      source: "builtin" | "custom";
    }>;
    extractedColorIds: number[];
    customPalettes: Array<{
      id: string;
      name: string;
      colorIds: number[];
    }>;
  };
  trace: {
    imageUrl: string | null;
    fileName: string | null;
    fileSize: number | null;
    opacity: number;
    scale: number;
    offsetX: number;
    offsetY: number;
    cellSizeBasis?: number;
    locked: boolean;
    visible: boolean;
  };
  text: {
    // Either empty if text remains a destructive operation,
    // or first-class entities if rebuild promotes text to document-owned objects.
    entities: Array<{
      id: string;
      text: string;
      font: string;
      fontSize: number;
      bold: boolean;
      italic: boolean;
      underline: boolean;
      colorId: number;
      x: number;
      y: number;
      committedToGrid: boolean;
    }>;
  };
};
```

Notes:

- If the rebuild keeps text as a one-shot grid mutation, the `text.entities` collection can be removed and text formatting can stay transient until committed.
- `visible` is currently UI-like for trace image, but because the current app already exposes it as a user-facing working mode, it should be decided explicitly whether it is a document property or just a session preference.
- `cells` should probably remain a typed array in memory and serialize to arrays only at persistence boundaries.

## Proposed Ownership Boundaries

### Canvas

#### Current mix

- [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx)
- [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)
- [`components/pattern-editor/canvas/useGridRenderer.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/useGridRenderer.ts)

#### Proposed owner

`CanvasRuntime`

Responsibilities:

- render from document + transient state
- translate pointer input into semantic commands
- never own canonical document state
- never own persistence state

Boundary:

- receives document selectors and transient interaction state
- emits commands such as `paintCells`, `beginTraceTransform`, `updateSelectionRect`, `setViewport`

### Viewport

#### Current mix

- [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx)
- [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)

#### Proposed owner

`ViewportState`

Responsibilities:

- zoom
- pan
- fit-to-canvas
- focus-cell
- restore/reset actions

Boundary:

- session persistence may snapshot viewport
- canvas consumes viewport
- document store does not own viewport

### Tools

#### Current mix

- `tool`, `brushSize`, `panMode` in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- tool-specific behavior in [`components/pattern-editor/hooks/useCanvasEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useCanvasEdits.ts)
- mode behavior in [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx)

#### Proposed owner

`ToolState`

Responsibilities:

- current tool id
- tool settings such as brush size
- tool compatibility rules

Boundary:

- does not own selection geometry
- does not own viewport
- does not own document

### Selection

#### Current mix

- [`components/pattern-editor/hooks/useSelectionTools.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useSelectionTools.ts)
- local preview state in [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx)
- filter edit state in [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)

#### Proposed owner

`SelectionState`

Responsibilities:

- active selection rect
- lasso geometry
- mirror source rect
- in-progress drag/resize state

Boundary:

- selection is transient editor state
- color workflows may read selection scope
- document store does not persist selection unless there is a deliberate requirement

### Palette / Colors

#### Current mix

- canonical palette in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- color transforms in [`components/pattern-editor/hooks/useColorEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useColorEdits.ts)
- custom palette records in [`components/pattern-editor/sections/CustomPalettesSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/CustomPalettesSection.tsx)

#### Proposed owner

Split into:

- `PaletteDocumentState`
  - canonical available colors
  - extracted ids
  - custom palettes if they persist
- `ColorWorkflowState`
  - replace/remap workflow
  - merge workflow
  - delete workflow
  - identify mode

Boundary:

- document palette is persistent
- workflow state is transient
- UI filtering/search/sort is derived

### Text

#### Current mix

- text draft inputs in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- text tool UI in [`components/pattern-editor/cards/TextToolCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/TextToolCard.tsx)
- pending placement state in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)

#### Proposed owner

Split into:

- `TextToolState`
  - current draft text input
  - current font/style/color selections
- `PendingPlacementState`
  - temporary placement preview
- optional `TextDocumentState`
  - only if rebuild promotes text to first-class objects

Boundary:

- if text remains destructive-to-grid, canonical document state only changes at commit time
- if text becomes first-class, committed text entities belong in the document store

### Trace Image

#### Current mix

- current trace values in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- manipulation states in the same file
- canvas interaction states in [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx)
- save/load/recovery logic in [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)

#### Proposed owner

Split into:

- `TraceDocumentState`
  - canonical trace URL and transform values intended to persist
- `TraceWorkflowState`
  - upload in flight
  - post-upload placement mode
  - temporary edit mode
  - pending unlock
- runtime-only `TraceRuntimeRefs`
  - loaded `HTMLImageElement`
  - sampling canvas references

Boundary:

- runtime image objects are not part of canonical document state
- persistence stores serializable trace data only

### Persistence / Versioning

#### Current mix

- save/load/version UI and state all inside [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)
- UI surfaces in [`components/pattern-editor/cards/WipCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/WipCard.tsx), [`components/pattern-editor/dialogs/DraftPickerDialog.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/dialogs/DraftPickerDialog.tsx), and [`components/pattern-editor/dialogs/VersionHistoryDialog.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/dialogs/VersionHistoryDialog.tsx)

#### Proposed owner

`PersistenceController`

Responsibilities:

- save status
- dirty status
- autosave policy
- local recovery policy
- version preview / restore policy
- draft identity

Boundary:

- consumes canonical document snapshots
- may persist session viewport snapshots separately
- does not own UI presentation components
- does not own canvas behavior

### Export

#### Current mix

- export UI in [`components/pattern-editor/cards/ExportPdfButton.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/ExportPdfButton.tsx)
- export implementation in [`lib/pdf.ts`](/Users/juliareel/Code/needlepoint-chart/lib/pdf.ts)

#### Proposed owner

`ExportService`

Responsibilities:

- consume a read-only document snapshot plus derived legend data
- produce export output

Boundary:

- export should not reach into live editor UI state directly
- any export-specific formatting should be derived from document selectors at call time

## Recommended Rebuild Boundary Summary

The rebuild should define these top-level ownership areas:

- `DocumentStore`
  - canonical saved project state
- `EditorSessionStore`
  - tools, selection, viewport, pending operations, history
- `PersistenceController`
  - save/load/autosave/version/recovery
- `UIChromeState`
  - menus, popovers, panel open state, responsive chrome
- `SelectorLayer`
  - all major derived/computed projections

This is cleaner than the current structure because it maps directly to the real product problem:

- document truth should be serializable and stable
- editing state should be transient and mode-aware
- UI state should be disposable
- persistence should orchestrate saves, not define editor behavior

## Final Guidance

For the rebuild, do not begin by porting the current top-level `useState` fields from [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx) into a new store one-for-one.

That would preserve the current problem.

Instead:

1. Define the canonical document shape first.
2. Define transient editing domains second.
3. Define UI-only state separately.
4. Move every currently duplicated value into either:
   - canonical state
   - derived selectors
   - short-lived workflow state

Uncertainty:

- The repo does not fully prove whether custom palettes are meant to persist with each draft or just within the local session. The rebuild should decide this explicitly.
- The repo does not prove whether text should remain a destructive grid mutation or become first-class editable entities. That decision will affect the final document model.
- The repo does not prove whether trace-image visibility is a project property or a session preference. That should be clarified before implementation.
