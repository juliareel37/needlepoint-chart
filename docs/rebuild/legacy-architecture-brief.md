# Legacy Architecture Brief

## 1. Executive Summary

The current editor is hard to evolve because the product behaves like a single large application, but its responsibilities are concentrated in a few oversized React files rather than being expressed as a small set of explicit runtime boundaries.

The main bottleneck is [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx), which currently acts as:

- the top-level application shell
- the primary editor state container
- the coordinator for canvas edits and color edits
- the persistence orchestrator for WIP drafts and versions
- the responsive layout manager
- the entry point for trace-image, text, export, and file-menu workflows

That concentration is visible immediately in the local state surface near [`components/pattern-editor/PatternEditor.tsx:74`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx#L74) and in the large hook and prop handoffs around [`components/pattern-editor/PatternEditor.tsx:732`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx#L732), [`components/pattern-editor/PatternEditor.tsx:815`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx#L815), [`components/pattern-editor/PatternEditor.tsx:868`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx#L868), and [`components/pattern-editor/PatternEditor.tsx:3136`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx#L3136).

The editor also depends on a fragile web of local UI state, mutable refs, browser storage recovery paths, and best-effort save/restore flows in [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts). That hook is doing valuable work, but it is effectively a persistence state machine embedded in a React hook without a strongly typed domain model.

The result is not that the application is feature-poor. It is feature-rich. The problem is that feature richness is expressed through structural coupling:

- adding a feature usually means touching the editor shell, at least one giant child component, and one or more custom hooks
- state ownership is unclear because the same conceptual data exists in live editor state, draft state, history snapshots, and browser persistence layers
- UI patterns are repeated with small differences instead of being enforced through a stable component system

For a controlled rebuild, this is a good candidate: the product surface appears concentrated enough to scope, the backend contract is relatively small, and several low-level modules are worth preserving even though the current top-level structure is not.

Uncertainty:

- This brief is grounded in the current repository structure and code paths. It does not prove which features are most used in production.
- Internal routes under [`app/design-system/`](/Users/juliareel/Code/needlepoint-chart/app/design-system) and [`app/design-audit/`](/Users/juliareel/Code/needlepoint-chart/app/design-audit) may be important to the team, but they do not appear to be runtime dependencies of the editor itself.

## 2. Main Runtime Entry Points

### Primary Product Entry

- [`app/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/page.tsx)
  - The main app route simply renders [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx).

### Editor Shell

- [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
  - Main runtime entry into the editor experience.
  - Owns most editor state and composes canvas, sidebars, dialogs, cards, and persistence hooks.

### Canvas Runtime

- [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)
  - Wraps the interactive canvas area plus toolbar-like controls and several popover flows.
- [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx)
  - Handles low-level canvas interaction: paint, pan, zoom, fill, lasso, mirror, trace transform, selection editing.
- [`components/pattern-editor/canvas/useGridRenderer.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/useGridRenderer.ts)
  - Draws the visual canvas state onto canvas layers.

### Persistence / Backend Entry Points

- [`app/api/wip/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/route.ts)
  - Lists drafts and creates drafts.
- [`app/api/wip/[id]/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/route.ts)
  - Loads, updates, and deletes drafts.
- [`app/api/wip/[id]/versions/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/versions/route.ts)
  - Lists versions and restores versions.
- [`app/api/wip/[id]/versions/[versionId]/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/versions/[versionId]/route.ts)
  - Loads an individual historical version preview.
- [`app/api/upload-trace/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/upload-trace/route.ts)
  - Supports trace image upload flow.
- [`app/api/image-proxy/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/image-proxy/route.ts)
  - Proxies remote trace images.

### Internal Non-Product Entry Points

- [`app/design-system/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/design-system/page.tsx)
  - Internal design-system/demo route.
- [`app/design-audit/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/design-audit/page.tsx)
  - Internal UI inventory and audit route.

These routes materially increase repository surface area, but they do not appear to be required for the runtime editor at [`app/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/page.tsx).

## 3. Core Product Workflows Currently Supported

Based on the repo, the current editor supports at least the following workflows.

### Pattern Creation and Grid Editing

- Paint, erase, fill, lasso fill, and mirror operations are coordinated through:
  - [`components/pattern-editor/hooks/useCanvasEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useCanvasEdits.ts)
  - [`components/pattern-editor/hooks/useSelectionTools.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useSelectionTools.ts)
  - [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx)

### Grid Sizing and Canvas Resizing

- Stitch-based and inches-based sizing appear in:
  - [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
  - [`components/pattern-editor/hooks/useCanvasEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useCanvasEdits.ts)
  - [`components/pattern-editor/cards/GridSizeCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/GridSizeCard.tsx)

### Color Management

- Used-colors inspection, identify mode, remap/replace, merge, and delete actions:
  - [`components/pattern-editor/hooks/useColorEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useColorEdits.ts)
  - [`components/pattern-editor/sections/UsedColorsSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/UsedColorsSection.tsx)

### Custom Palette Management

- Create, rename, remove, and populate custom palettes:
  - [`components/pattern-editor/sections/CustomPalettesSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/CustomPalettesSection.tsx)

### Trace / Background Image Workflow

- Upload image, preview trace, move/scale trace, lock/unlock, opacity adjust, set/cancel:
  - [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
  - [`components/pattern-editor/cards/TraceImageCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/TraceImageCard.tsx)
  - [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)
  - [`app/api/upload-trace/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/upload-trace/route.ts)

### Image-to-Pattern Conversion

- Convert trace image into stitched pattern using palette reduction:
  - [`components/pattern-editor/utils/imageToPattern.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/imageToPattern.ts)
  - [`components/pattern-editor/cards/ImageToPatternCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/ImageToPatternCard.tsx)
  - Orchestration in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)

### Text Placement

- Create text, choose font/style/size/color, place onto the pattern grid:
  - [`components/pattern-editor/cards/TextToolCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/TextToolCard.tsx)
  - Placement logic in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)

### Undo / Redo and Snapshot History

- [`components/pattern-editor/hooks/useHistoryStack.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useHistoryStack.ts)
- [`components/pattern-editor/utils/historyTypes.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/historyTypes.ts)
- Undo/redo application in [`components/pattern-editor/hooks/useCanvasEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useCanvasEdits.ts)

### WIP Save / Load / Autosave / Version History

- WIP and version workflows are implemented across:
  - [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)
  - [`components/pattern-editor/cards/WipCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/WipCard.tsx)
  - [`components/pattern-editor/dialogs/DraftPickerDialog.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/dialogs/DraftPickerDialog.tsx)
  - [`components/pattern-editor/dialogs/VersionHistoryDialog.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/dialogs/VersionHistoryDialog.tsx)
  - [`components/pattern-editor/dialogs/VersionPreviewToast.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/dialogs/VersionPreviewToast.tsx)
  - API routes under [`app/api/wip/`](/Users/juliareel/Code/needlepoint-chart/app/api/wip)

### PDF Export

- [`components/pattern-editor/cards/ExportPdfButton.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/ExportPdfButton.tsx)
- [`lib/pdf.ts`](/Users/juliareel/Code/needlepoint-chart/lib/pdf.ts)

Uncertainty:

- The repository clearly supports these workflows in code, but usage and business priority are not visible from the repo alone.

## 4. Major Architectural Hotspots

### [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)

This is the primary structural hotspot.

Why it is a hotspot:

- It owns a very large amount of editor state directly.
- It coordinates multiple custom hooks that each require long dependency lists.
- It passes very wide prop surfaces into large children like:
  - [`components/pattern-editor/sections/UsedColorsSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/UsedColorsSection.tsx)
  - [`components/pattern-editor/sections/CustomPalettesSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/CustomPalettesSection.tsx)
  - [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)
- It mixes domain state, UI state, responsive layout state, file-menu state, and workflow orchestration in one place.

Why this matters for rebuild planning:

- It suggests the editor needs a new top-level state model and application boundary rather than another round of local extraction.

### [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)

Why it is a hotspot:

- The component is declared as `props: any` at [`components/pattern-editor/canvas/CanvasWithExportRef.tsx:12`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx#L12).
- It combines canvas wrapper responsibilities with toolbar state, popover state, zoom controls, settings panels, and color picking UI.
- It appears to be both a presentation component and a workflow coordinator.

Why this matters:

- The rebuild should separate canvas rendering/input handling from surrounding controls.

### [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)

Why it is a hotspot:

- It coordinates:
  - dirty tracking
  - local backup
  - session resume
  - autosave interval
  - load/save/delete requests
  - version preview and restore
  - auth transitions
  - canvas view persistence
- It relies heavily on refs and mutable coordination flags such as:
  - `saveInFlightRef`
  - `autosaveInFlightRef`
  - `pendingManualSaveRef`
  - `ignoreDirtyRef`
  - `suppressDirtyBatchesRef`
  - `refreshResumeHandledRef`

Why this matters:

- The rebuild should preserve the persistence rules that matter, but the orchestration should move into an explicit state machine or service boundary.

### [`components/pattern-editor/sections/UsedColorsSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/UsedColorsSection.tsx)

Why it is a hotspot:

- Very large prop surface.
- Large amount of inline styling and local UI state.
- Multiple workflows mixed together:
  - color list browsing
  - selection scope switching
  - remap flow
  - merge flow
  - delete flow
  - action-target pickers
  - embedded/portal behavior

Why this matters:

- It is a strong sign that color-management workflows need decomposition during rebuild.

### [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx)

Why it is a hotspot:

- Handles many different interaction modes directly.
- Low-level pointer and gesture logic is mixed with behavior branching for tools and overlays.

Why this matters:

- This area is worth salvaging conceptually, but likely needs a clearer runtime contract.

### Supporting Hotspots

- [`components/pattern-editor/sections/CustomPalettesSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/CustomPalettesSection.tsx)
- [`components/pattern-editor/cards/TextToolCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/TextToolCard.tsx)
- [`app/design-system/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/design-system/page.tsx)
- [`app/design-audit/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/design-audit/page.tsx)

The last two are not product-runtime hotspots, but they are large supporting surfaces that can distract a rebuild unless treated as separate internal tools.

## 5. State Ownership Problems

### No Single Explicit Editor Model

The editor does not appear to have one authoritative domain model object in memory. Instead, it is represented by many top-level React states in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx).

That makes ownership hard to reason about because the editor state is spread across:

- top-level React state in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- hook-local state in:
  - [`components/pattern-editor/hooks/useCanvasEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useCanvasEdits.ts)
  - [`components/pattern-editor/hooks/useColorEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useColorEdits.ts)
  - [`components/pattern-editor/hooks/useSelectionTools.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useSelectionTools.ts)
  - [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)

### Competing Sources of Truth for Grid Size

The current editor stores multiple related size models at once:

- live stitch dimensions in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- inches-based dimensions in the same file
- draft copies of those values in the same file

This is visible around:

- [`components/pattern-editor/PatternEditor.tsx:89`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx#L89)
- [`components/pattern-editor/PatternEditor.tsx:102`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx#L102)
- [`components/pattern-editor/PatternEditor.tsx:106`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx#L106)

This is workable, but it obscures which values are canonical and which are draft-form inputs.

### Trace Image State Exists in Several Forms

Trace state exists as:

- live React state in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- history snapshot state in [`components/pattern-editor/utils/historyTypes.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/historyTypes.ts)
- persisted JSON payload in [`app/api/wip/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/route.ts)
- browser recovery/session state in [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)

That is especially notable because [`components/pattern-editor/utils/historyTypes.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/historyTypes.ts) stores `HTMLImageElement` in `TraceSnapshot`, which tightly couples history to runtime browser objects.

### Dirty-State Ownership Is Implicit

Dirty state in [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts) is managed through effect-driven mutation suppression rather than a clear transaction boundary.

Examples:

- `ignoreDirtyRef`
- `suppressDirtyBatchesRef`
- `editVersionRef`
- `isDirtyRef`

This pattern is pragmatic, but it makes correctness hard to trust during future changes.

### Persistence Logic Owns Canvas View Concerns

[`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts) receives:

- `getSessionCanvasView`
- `restoreSessionCanvasView`
- `resetCanvasViewport`

That means persistence and editor viewport ownership are coupled across boundaries. In a rebuild, the editor shell should probably own viewport state while persistence serializes only what is intentionally part of a persisted draft or session.

## 6. UI Consistency Problems

The repository already contains explicit internal evidence of inconsistency in [`app/design-audit/README.md`](/Users/juliareel/Code/needlepoint-chart/app/design-audit/README.md), including:

- repeated ad hoc button implementations
- repeated popover/dialog containers
- multiple toggle styles
- repeated chip/badge variants
- mixed token usage and literal color usage

Concrete repo evidence:

- [`app/design-audit/README.md:26`](/Users/juliareel/Code/needlepoint-chart/app/design-audit/README.md#L26)
- [`lib/designAudit.ts`](/Users/juliareel/Code/needlepoint-chart/lib/designAudit.ts)
- [`app/design-audit/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/design-audit/page.tsx)

Additional concrete signs:

- Large volumes of inline style objects in:
  - [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
  - [`components/pattern-editor/sections/UsedColorsSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/UsedColorsSection.tsx)
  - [`components/pattern-editor/sections/CustomPalettesSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/CustomPalettesSection.tsx)
  - [`components/pattern-editor/cards/TextToolCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/TextToolCard.tsx)
- Near-identical popover patterns reimplemented in multiple files via `createPortal(...)`, including:
  - [`components/pattern-editor/sections/UsedColorsSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/UsedColorsSection.tsx)
  - [`components/pattern-editor/sections/CustomPalettesSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/CustomPalettesSection.tsx)
  - [`components/pattern-editor/cards/TextToolCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/TextToolCard.tsx)
  - [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)
- Global styling is large and mixed in [`app/globals.css`](/Users/juliareel/Code/needlepoint-chart/app/globals.css), combining generated Tailwind layers, tokens, and app-level CSS.

This does not mean the UI is unusable. It means the editor lacks a strong visual primitive layer, so UI behavior and UI styling are frequently built together at the point of use.

## 7. Salvageable Modules and Why

These modules look worth carrying forward logically, even if they should be rewrapped behind cleaner interfaces.

### Canvas / Geometry / Rendering Logic

- [`components/pattern-editor/canvas/fillUtils.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/fillUtils.ts)
  - Focused fill algorithms.
- [`components/pattern-editor/utils/geometry.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/geometry.ts)
  - Useful selection and mirror geometry helpers.
- [`components/pattern-editor/canvas/stitchUtils.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/stitchUtils.ts)
  - Focused stitch rendering helpers.
- [`components/pattern-editor/canvas/useGridRenderer.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/useGridRenderer.ts)
  - Valuable rendering logic, though the API may need redesign.

### Image Conversion and Color Utilities

- [`components/pattern-editor/utils/imageToPattern.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/imageToPattern.ts)
  - Domain-specific conversion logic worth preserving.
- [`components/pattern-editor/utils/colorUtils.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/colorUtils.ts)
  - Useful color math and palette extraction helpers.
- [`components/pattern-editor/utils/paletteSort.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/paletteSort.ts)
  - Reusable sorting/grouping logic.

### Core Data Sets

- [`lib/dmcColors.ts`](/Users/juliareel/Code/needlepoint-chart/lib/dmcColors.ts)
- [`lib/dmcPaletteBands.ts`](/Users/juliareel/Code/needlepoint-chart/lib/dmcPaletteBands.ts)
- [`lib/symbols.ts`](/Users/juliareel/Code/needlepoint-chart/lib/symbols.ts)

These appear to be foundational product data, not accidental UI structure.

### Persistence API and Schema

- [`app/api/wip/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/route.ts)
- [`app/api/wip/[id]/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/route.ts)
- [`app/api/wip/[id]/versions/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/versions/route.ts)
- [`app/api/wip/[id]/versions/[versionId]/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/versions/[versionId]/route.ts)
- [`prisma/schema.prisma`](/Users/juliareel/Code/needlepoint-chart/prisma/schema.prisma)

The current JSON-draft persistence model is simple enough that it can support a rebuild without needing immediate backend redesign.

### Export and Blob Utilities

- [`lib/pdf.ts`](/Users/juliareel/Code/needlepoint-chart/lib/pdf.ts)
- [`lib/blob.ts`](/Users/juliareel/Code/needlepoint-chart/lib/blob.ts)
- [`lib/wipVersioning.ts`](/Users/juliareel/Code/needlepoint-chart/lib/wipVersioning.ts)

These are small and bounded.

## 8. Modules / Components That Should Not Be Carried Forward Structurally

This section is about structure, not whether the feature itself should disappear.

### Do Not Carry Forward the Current Editor Shell Structure

- [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)

The rebuild should not reproduce a single giant component that owns nearly all editor concerns.

### Do Not Carry Forward the Current Canvas Wrapper Structure

- [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)

The rebuild should split canvas interaction from surrounding UI controls and remove the `props: any` boundary.

### Do Not Carry Forward the Current Persistence Hook Structure

- [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)

The rebuild should preserve important recovery/versioning behavior, but not as one giant React hook with implicit ref-driven orchestration.

### Do Not Carry Forward the Current Color-Workflow UI Structure

- [`components/pattern-editor/sections/UsedColorsSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/UsedColorsSection.tsx)
- [`components/pattern-editor/sections/CustomPalettesSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/CustomPalettesSection.tsx)

These should be decomposed into smaller workflow-specific parts.

### Likely Dead or Obsolete Structural Surface

These do not appear to be meaningfully wired into the current runtime editor and should not be copied forward without a deliberate reason:

- [`components/pattern-editor/cards/CanvasSettingsCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/CanvasSettingsCard.tsx)
  - Present in the repo but not referenced from [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx).
- [`components/pattern-editor/ui/Palette.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/ui/Palette.tsx)
  - Appears to be an older/alternate palette UI not wired into the main editor flow.

### State and Flags That Should Be Revalidated Instead of Ported

- [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx) state such as:
  - `colorsSidebarTab`
  - `favoriteColorIds`
- [`components/pattern-editor/hooks/useWipDrafts.ts:96`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts#L96)
  - `AUTO_LOAD_LAST_ACTIVE_DRAFT_ON_STARTUP = false`

These may reflect abandoned or partial directions rather than active product requirements.

Uncertainty:

- Some apparently unused files may still be referenced manually by the team or intended for future use. They should be validated before deletion, but they should not shape the rebuild architecture by default.

## 9. Recommended Rebuild Scope

The recommended rebuild scope is the editor frontend shell and runtime state model, not the entire repository.

### Rebuild In Scope

- A new editor shell replacing the current structure in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- A new explicit state model for:
  - document state
  - transient interaction state
  - viewport state
  - persistence/session state
- A cleaner separation between:
  - canvas rendering/input
  - editor workflows
  - persistence services
  - reusable UI primitives
- Rebuilt workflow surfaces for:
  - color management
  - custom palettes
  - trace/background image editing
  - text placement
  - save/load/version UI

### Keep Stable During Rebuild If Possible

- Existing API routes under [`app/api/wip/`](/Users/juliareel/Code/needlepoint-chart/app/api/wip)
- Existing Prisma persistence shape in [`prisma/schema.prisma`](/Users/juliareel/Code/needlepoint-chart/prisma/schema.prisma)
- Low-level domain helpers and data modules listed in section 7

### Probably Out of Scope for the First Controlled Rebuild

- Internal design-system route in [`app/design-system/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/design-system/page.tsx)
- Internal audit route in [`app/design-audit/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/design-audit/page.tsx)
- Non-editor auth shell details unless they block the editor migration

### Suggested Scope Boundary

The safest boundary appears to be:

1. Keep backend draft/version contracts stable.
2. Rebuild the editor frontend behind the same route at [`app/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/page.tsx).
3. Reuse focused algorithm/data modules where they remain valid.
4. Recreate the UI structure and state ownership model rather than porting large components.

This keeps the rebuild controlled:

- small number of user-facing runtime entry points
- stable persistence shape
- limited need to redesign server-side behavior first
- high likelihood of reducing structural complexity meaningfully

## Bottom Line

This repository looks like a strong candidate for a controlled rebuild of the editor frontend, not a full-system rewrite and not a pure in-place refactor.

The rebuild should target:

- frontend runtime architecture
- state ownership
- workflow decomposition
- UI primitives and consistency

The rebuild should avoid unnecessary churn in:

- persistence schema
- API contracts
- focused domain algorithms
- static product data
