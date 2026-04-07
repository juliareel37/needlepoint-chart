# Rebuild Slice Plan

## Purpose

This document proposes a phased, reviewable rebuild sequence for the editor frontend currently rooted at:

- [`app/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/page.tsx)
- [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)

This revision assumes:

- the rebuild happens inside the existing repository
- the legacy editor remains intact during migration
- the new implementation is introduced in parallel through a route such as [`app/editor-v2/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/editor-v2/page.tsx)
- the existing API routes under [`app/api/`](/Users/juliareel/Code/needlepoint-chart/app/api) are reused
- the existing Prisma schema in [`prisma/schema.prisma`](/Users/juliareel/Code/needlepoint-chart/prisma/schema.prisma) is reused initially
- auth/config/build setup stays the same while the frontend architecture changes

This is a planning document only. It does not implement any changes yet.

## What Changed From Earlier Planning

Earlier planning emphasized architecture cleanup, but it was not explicit enough that the rebuild must coexist with the current app inside this repo.

That means the migration strategy should now be read as:

- parallel route migration, not repo migration
- same API contract, not backend replacement
- same deploy/build environment, not environment reset
- feature-by-feature parity buildup behind [`app/editor-v2/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/editor-v2/page.tsx), not immediate replacement of [`app/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/page.tsx)

Planning assumptions that should now change:

- Any earlier implication of a standalone rebuilt app should be replaced with a same-repo `editor-v2` interpretation.
- Any earlier folder examples using a generic `src/` root are less preferred than:
  - [`components/editor-v2/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2)
  - [`lib/editor-v2/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2)
  - [`app/editor-v2/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/editor-v2/page.tsx)
- Existing routes like [`app/api/wip/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/route.ts) and [`app/api/upload-trace/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/upload-trace/route.ts) should be treated as shared infrastructure during migration, not as rebuild targets in the first wave.

Uncertainty:

- The repo does not yet contain [`app/editor-v2/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/editor-v2/page.tsx). It is the recommended migration entry point, not a current artifact.
- It is still possible that some domain logic will end up shared from legacy locations for a while before being moved into [`lib/editor-v2/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2).

## Shared, Legacy-Only, And `editor-v2`-Only Planning Boundaries

## Shared During Migration

- [`app/api/wip/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/route.ts)
- [`app/api/wip/[id]/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/route.ts)
- [`app/api/wip/[id]/versions/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/versions/route.ts)
- [`app/api/wip/[id]/versions/[versionId]/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/versions/[versionId]/route.ts)
- [`app/api/upload-trace/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/upload-trace/route.ts)
- [`app/api/image-proxy/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/image-proxy/route.ts)
- [`prisma/schema.prisma`](/Users/juliareel/Code/needlepoint-chart/prisma/schema.prisma)
- likely shared logic candidates:
  - [`lib/dmcColors.ts`](/Users/juliareel/Code/needlepoint-chart/lib/dmcColors.ts)
  - [`lib/dmcPaletteBands.ts`](/Users/juliareel/Code/needlepoint-chart/lib/dmcPaletteBands.ts)
  - [`lib/symbols.ts`](/Users/juliareel/Code/needlepoint-chart/lib/symbols.ts)
  - [`lib/grid.ts`](/Users/juliareel/Code/needlepoint-chart/lib/grid.ts)
  - [`lib/pdf.ts`](/Users/juliareel/Code/needlepoint-chart/lib/pdf.ts)
  - [`components/pattern-editor/utils/geometry.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/geometry.ts)
  - [`components/pattern-editor/utils/colorUtils.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/colorUtils.ts)
  - [`components/pattern-editor/utils/paletteSort.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/paletteSort.ts)
  - [`components/pattern-editor/utils/imageToPattern.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/imageToPattern.ts)
  - [`components/pattern-editor/canvas/fillUtils.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/fillUtils.ts)
  - [`components/pattern-editor/canvas/stitchUtils.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/stitchUtils.ts)

## Legacy-Only During Migration

- [`app/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/page.tsx)
- [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- legacy workflow shells and giant hooks under [`components/pattern-editor/`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor)

These stay untouched as the production reference path until `editor-v2` reaches parity.

## `editor-v2`-Only During Migration

- [`app/editor-v2/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/editor-v2/page.tsx)
- [`components/editor-v2/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2)
- [`lib/editor-v2/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2)

These hold the new shell, new store, and new feature compositions.

## General Slice Principles

Across all slices:

- build the new implementation beside legacy code rather than mutating [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx) in place
- use [`app/editor-v2/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/editor-v2/page.tsx) as the migration preview route
- keep server routes and Prisma schema stable until the frontend model is proven
- isolate one ownership boundary per slice
- keep every slice reviewable without requiring immediate cutover from [`app/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/page.tsx)
- prefer adapters around legacy logic over direct imports of giant legacy components

## Recommended New Implementation Roots

During migration, new code should be introduced under:

- [`app/editor-v2/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/editor-v2/page.tsx)
- [`components/editor-v2/app/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/app)
- [`components/editor-v2/features/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features)
- [`components/editor-v2/shared/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/shared)
- [`lib/editor-v2/domain/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/domain)
- [`lib/editor-v2/editor/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor)
- [`lib/editor-v2/integrations/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/integrations)
- [`lib/editor-v2/export/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/export)

## Slice 1: `editor-v2` Shell / Layout Foundation

### Goal

Create a same-repo parallel editor entry and shell composition without disturbing:

- [`app/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/page.tsx)
- [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)

### What gets created

- a new preview route at [`app/editor-v2/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/editor-v2/page.tsx)
- shell-level layout components under [`components/editor-v2/app/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/app)
- placeholder panels for sidebar, header, and workspace regions
- minimal providers for the new editor path only

### What legacy logic can be reused

- layout intent and responsive behavior from:
  - [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
  - [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)
- existing visual tokens from:
  - [`app/globals.css`](/Users/juliareel/Code/needlepoint-chart/app/globals.css)
  - [`app/design-system/typography.ts`](/Users/juliareel/Code/needlepoint-chart/app/design-system/typography.ts)

### What must be rewritten fresh

- route composition for `editor-v2`
- shell ownership
- shell-to-feature boundaries

### What should explicitly be deferred

- persistence wiring
- real editing logic
- trace workflows
- text workflows
- direct parity with the full legacy sidebar

### Risks and validation checks

Risks:

- recreating a second giant shell immediately
- leaking feature logic into route/layout code

Validation checks:

- [`app/editor-v2/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/editor-v2/page.tsx) remains a thin route entry
- legacy route [`app/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/page.tsx) remains untouched
- no imports from [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx) into the new shell

## Slice 2: State Model / Store Foundation

### Goal

Introduce the normalized editor state model described in [`docs/rebuild/editor-state-model.md`](/Users/juliareel/Code/needlepoint-chart/docs/rebuild/editor-state-model.md) behind `editor-v2`.

### What gets created

- document state definitions under [`lib/editor-v2/domain/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/domain)
- transient editor/session state under [`lib/editor-v2/editor/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor)
- selector interfaces
- command boundaries for document mutation

### What legacy logic can be reused

- conceptual state groupings from:
  - [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
  - [`components/pattern-editor/hooks/useCanvasEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useCanvasEdits.ts)
  - [`components/pattern-editor/hooks/useSelectionTools.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useSelectionTools.ts)
  - [`components/pattern-editor/hooks/useColorEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useColorEdits.ts)
  - [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)

### What must be rewritten fresh

- canonical store shape
- command APIs
- selector boundaries

### What should explicitly be deferred

- full autosave behavior
- full version preview behavior
- trace persistence edge cases

### Risks and validation checks

Risks:

- copying the legacy state shape too literally
- keeping duplicate sources of truth

Validation checks:

- one canonical owner for project/document state
- UI-only state does not leak into document state
- `editor-v2` store can exist without legacy hooks like [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)

## Slice 3: Canvas Viewport Foundation

### Goal

Establish clean viewport ownership in `editor-v2` for:

- zoom
- pan
- fit-to-bounds
- reset
- focus behavior

### What gets created

- viewport state owner under [`lib/editor-v2/editor/viewport/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/viewport)
- a basic canvas workspace under [`components/editor-v2/features/canvas/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/canvas)
- viewport commands and selectors

### What legacy logic can be reused

- fit/clamp intent from:
  - [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
  - [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx)

### What must be rewritten fresh

- viewport ownership model
- route/shell integration for viewport
- restore signaling

### What should explicitly be deferred

- paint interactions
- selection overlays
- trace transforms

### Risks and validation checks

Risks:

- subtle pan/zoom parity regressions
- coupling viewport state back to layout state

Validation checks:

- viewport is owned in one `editor-v2` place
- canvas reads viewport through one interface
- no persistence logic directly controls zoom/pan yet

## Slice 4: Basic Grid / Project Model

### Goal

Render and manage a minimal project document in `editor-v2`:

- title
- grid dimensions
- cell data
- sizing metadata

### What gets created

- canonical project model under [`lib/editor-v2/domain/project/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/domain/project)
- project initialization/reset behavior
- basic metadata editing
- basic grid rendering driven by canonical state

### What legacy logic can be reused

- grid creation helpers from [`lib/grid.ts`](/Users/juliareel/Code/needlepoint-chart/lib/grid.ts)
- draft payload expectations from:
  - [`app/api/wip/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/route.ts)
  - [`app/api/wip/[id]/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/route.ts)

### What must be rewritten fresh

- project document store
- grid sizing ownership
- form-state boundary for any size inputs

### What should explicitly be deferred

- autosave
- history
- resize confirmation UX
- advanced tool behavior

### Risks and validation checks

Risks:

- recreating the current duplication between live size and draft form size

Validation checks:

- one canonical grid size model exists
- the rendered grid comes only from canonical document state
- project model can round-trip to current WIP payload shape

## Slice 5: Basic Editing Loop

### Goal

Deliver the first meaningful `editor-v2` interaction loop:

- choose tool
- paint/erase cells
- commit document changes
- undo/redo

### What gets created

- basic tool state under [`lib/editor-v2/editor/tools/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/tools)
- history state under [`lib/editor-v2/editor/history/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/history)
- basic editing commands
- minimal toolbar UI under [`components/editor-v2/features/canvas/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/canvas)

### What legacy logic can be reused

- concepts from [`components/pattern-editor/hooks/useHistoryStack.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useHistoryStack.ts)
- stroke batching ideas from [`components/pattern-editor/hooks/useCanvasEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useCanvasEdits.ts)
- rendering helpers from [`components/pattern-editor/canvas/useGridRenderer.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/useGridRenderer.ts)

### What must be rewritten fresh

- command boundaries
- history ownership
- input-to-command flow

### What should explicitly be deferred

- fill
- lasso
- mirror
- trace
- text
- persistence

### Risks and validation checks

Risks:

- performance regressions
- history snapshots accidentally including runtime-only objects

Validation checks:

- paint/erase works inside `editor-v2` without legacy hook coupling
- undo/redo stores document-safe snapshots only
- legacy editor still works unchanged at [`app/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/page.tsx)

## Slice 6: Selection Model

### Goal

Add first-class transient selection state in `editor-v2` for:

- rectangle/filter regions
- lasso support
- mirror source regions

### What gets created

- dedicated selection state under [`lib/editor-v2/editor/selection/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/selection)
- geometry helpers under [`lib/editor-v2/domain/selection/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/domain/selection)
- selection overlays in [`components/editor-v2/features/selection/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/selection)

### What legacy logic can be reused

- geometry helpers from [`components/pattern-editor/utils/geometry.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/geometry.ts)
- conceptual workflows from [`components/pattern-editor/hooks/useSelectionTools.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useSelectionTools.ts)

### What must be rewritten fresh

- canonical selection ownership
- preview/render boundaries
- command integration with the new store

### What should explicitly be deferred

- every advanced legacy mode
- full mirror UX polish
- advanced filter-edit affordances in [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)

### Risks and validation checks

Risks:

- splitting selection between too many `editor-v2` layers
- replaying the legacy preview-state sprawl

Validation checks:

- one active selection model exists
- ephemeral hover/preview state stays out of canonical document state
- geometry helpers remain pure

## Slice 7: Color Workflows

### Goal

Port used-colors and custom-palette workflows into decomposed `editor-v2` feature modules.

### What gets created

- color selectors and commands under [`lib/editor-v2/editor/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor)
- feature panels under:
  - [`components/editor-v2/features/colors/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/colors)
  - [`components/editor-v2/features/custom-palettes/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/custom-palettes)
- shared color/palette domain modules under [`lib/editor-v2/domain/palette/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/domain/palette)

### What legacy logic can be reused

- transform logic from [`components/pattern-editor/hooks/useColorEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useColorEdits.ts)
- helpers from:
  - [`components/pattern-editor/utils/colorUtils.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/colorUtils.ts)
  - [`components/pattern-editor/utils/paletteSort.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/paletteSort.ts)
  - [`lib/dmcColors.ts`](/Users/juliareel/Code/needlepoint-chart/lib/dmcColors.ts)
  - [`lib/dmcPaletteBands.ts`](/Users/juliareel/Code/needlepoint-chart/lib/dmcPaletteBands.ts)
  - [`lib/symbols.ts`](/Users/juliareel/Code/needlepoint-chart/lib/symbols.ts)

### What must be rewritten fresh

- the panel structure currently concentrated in [`components/pattern-editor/sections/UsedColorsSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/UsedColorsSection.tsx)
- custom palette UI currently concentrated in [`components/pattern-editor/sections/CustomPalettesSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/CustomPalettesSection.tsx)
- ownership of transient action workflows such as replace/merge/delete

### What should explicitly be deferred

- every minor UI convenience from the current giant sections
- advanced identify/targeting niceties unless they are proven critical

### Risks and validation checks

Risks:

- color workflows can expand unexpectedly because the legacy section mixes many subflows

Validation checks:

- `Used Colors` and `Custom Palettes` are separate `editor-v2` modules
- palette data has one canonical owner
- color actions operate through commands instead of giant prop drilling

## Slice 8: Trace Image Workflows

### Goal

Port the trace/background image workflow into `editor-v2` while continuing to use existing routes and blob lifecycle.

### What gets created

- trace document types under [`lib/editor-v2/domain/trace/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/domain/trace)
- transient manipulation state under [`lib/editor-v2/editor/tools/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/tools)
- trace feature UI under [`components/editor-v2/features/trace-image/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/trace-image)
- integration adapters under [`lib/editor-v2/integrations/trace-upload/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/integrations/trace-upload)

### What legacy logic can be reused

- upload/proxy routes:
  - [`app/api/upload-trace/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/upload-trace/route.ts)
  - [`app/api/image-proxy/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/image-proxy/route.ts)
- blob lifecycle logic in [`lib/blob.ts`](/Users/juliareel/Code/needlepoint-chart/lib/blob.ts)
- trace payload expectations from:
  - [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
  - [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)

### What must be rewritten fresh

- trace state ownership
- separation between document trace data and runtime image refs
- trace manipulation UI and command boundaries

### What should explicitly be deferred

- image-to-pattern conversion
- advanced blob cleanup changes
- backend contract changes

### Risks and validation checks

Risks:

- trace crosses frontend state, upload, persistence, and blob cleanup
- persisted trace compatibility issues can break old drafts

Validation checks:

- `editor-v2` can load an existing trace-backed draft from current WIP APIs
- runtime-only image objects are not stored in canonical document snapshots
- legacy trace flows remain functional at [`app/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/page.tsx)

## Slice 9: Text Workflows

### Goal

Rebuild the text tool behind a clear `editor-v2` model and remove the current shell-split ownership.

### What gets created

- text domain state under [`lib/editor-v2/domain/text/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/domain/text)
- text tool state under [`lib/editor-v2/editor/tools/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/tools)
- UI under [`components/editor-v2/features/text/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/text)

### What legacy logic can be reused

- font/styling sources from:
  - [`components/pattern-editor/utils/textFontOptions.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/textFontOptions.ts)
  - [`app/text-tool-fonts.css`](/Users/juliareel/Code/needlepoint-chart/app/text-tool-fonts.css)
- behavioral reference from:
  - [`components/pattern-editor/cards/TextToolCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/TextToolCard.tsx)
  - placement logic in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)

### What must be rewritten fresh

- text ownership model
- staging/placement flow
- integration with the new command/store system

### What should explicitly be deferred

- expanded rich text ambitions
- any redesign of font asset loading unless required

### Risks and validation checks

Risks:

- the legacy code does not fully prove whether text should remain destructive-to-grid or become a first-class editable entity

Validation checks:

- the chosen text model is explicitly documented
- text no longer depends on top-level shell state in the new path
- text UI does not duplicate color workflow logic unnecessarily

## Slice 10: Persistence / Versioning Integration

### Goal

Connect `editor-v2` to existing WIP/version routes without replacing the persistence backend.

### What gets created

- WIP client/adapters under [`lib/editor-v2/integrations/wip/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/integrations/wip)
- session orchestration under [`lib/editor-v2/editor/session/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/session)
- save/load/version UI under:
  - [`components/editor-v2/features/persistence/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/persistence)
  - [`components/editor-v2/features/version-history/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/version-history)

### What legacy logic can be reused

- API contract and payload shapes from:
  - [`app/api/wip/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/route.ts)
  - [`app/api/wip/[id]/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/route.ts)
  - [`app/api/wip/[id]/versions/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/versions/route.ts)
  - [`app/api/wip/[id]/versions/[versionId]/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/versions/[versionId]/route.ts)
- useful persistence rules from [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)

### What must be rewritten fresh

- orchestration structure currently hidden in [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)
- session/dirtiness ownership
- save-trigger coordination

### What should explicitly be deferred

- API schema changes
- Prisma model changes
- aggressive autosave edge-case parity until core save/load is stable

### Risks and validation checks

Risks:

- persistence is where compatibility failures become expensive
- `useWipDrafts` currently includes many hidden coordination rules that are easy to miss

Validation checks:

- `editor-v2` can load, save, update, and restore against current routes
- drafts created by `editor-v2` remain readable by the legacy editor where possible
- any incompatible payload decisions are documented before rollout

## Slice 11: Export Integration

### Goal

Make `editor-v2` export through the existing export contract before considering export redesign.

### What gets created

- export adapters under [`lib/editor-v2/export/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/export)
- export feature UI under [`components/editor-v2/features/export/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/export)

### What legacy logic can be reused

- [`lib/pdf.ts`](/Users/juliareel/Code/needlepoint-chart/lib/pdf.ts)
- behavior reference from [`components/pattern-editor/cards/ExportPdfButton.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/ExportPdfButton.tsx)

### What must be rewritten fresh

- projection from the new normalized editor document to the existing export input shape
- new export panel/UI

### What should explicitly be deferred

- major PDF redesign
- new export formats

### Risks and validation checks

Risks:

- export often reveals hidden assumptions in document shape and symbol assignment

Validation checks:

- `editor-v2` export output matches core expectations from the legacy editor
- the adapter boundary is explicit and isolated

## Slice 12: Cleanup / Removal Of Legacy Pieces

### Goal

After `editor-v2` reaches acceptable parity, remove or quarantine legacy-only structures safely.

### What gets created

- a deprecation/removal checklist
- explicit routing cutover plan from [`app/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/page.tsx) to the new editor path when ready
- shared-module audit to decide what remains common and what can be deleted

### What legacy logic can be reused

- only the modules that proved reusable during migration

### What must be rewritten fresh

- nothing major by design; this slice is about deletion, cutover, and simplification

### What should explicitly be deferred

- deletion of legacy code before parity confidence exists
- backend/API cleanup unrelated to the editor cutover

### Risks and validation checks

Risks:

- deleting “unused” pieces that still support legacy workflows
- leaving duplicate shared logic in both legacy and `editor-v2`

Validation checks:

- legacy route can be retired only after `editor-v2` covers the needed workflow set
- legacy-only files are classified before removal
- shared modules have one clear surviving home

## Suggested Execution Order

1. Shell / Layout Foundation
2. State Model / Store Foundation
3. Canvas Viewport Foundation
4. Basic Grid / Project Model
5. Basic Editing Loop
6. Selection Model
7. Color Workflows
8. Trace Image Workflows
9. Text Workflows
10. Persistence / Versioning Integration
11. Export Integration
12. Cleanup / Removal Of Legacy Pieces

## Why This Order Fits This Repo

This repo’s main structural problem is that too much is concentrated in:

- [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)
- [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)

So the migration needs to:

- establish a new shell before feature parity work
- establish a new state model before porting interactions
- delay persistence integration until the new model is stable
- keep legacy runtime behavior intact while the new path matures

That is exactly what a same-repo `editor-v2` route enables.

## Final Guidance

Use the current repo as the migration container.

Build the new implementation in parallel under:

- [`app/editor-v2/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/editor-v2/page.tsx)
- [`components/editor-v2/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2)
- [`lib/editor-v2/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2)

Keep these stable during the early migration:

- [`app/api/wip/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/route.ts)
- [`app/api/wip/[id]/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/route.ts)
- [`app/api/upload-trace/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/upload-trace/route.ts)
- [`prisma/schema.prisma`](/Users/juliareel/Code/needlepoint-chart/prisma/schema.prisma)

And treat the legacy editor under [`components/pattern-editor/`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor) as the compatibility reference until `editor-v2` is ready to replace it.
