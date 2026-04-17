# Proposed Editor Architecture

## Purpose

This document proposes a clean folder structure and ownership model for a rebuild of the editor frontend currently rooted at:

- [`app/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/page.tsx)
- [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)

This revision assumes the rebuild happens inside the existing repository.

It does **not** assume:

- a new repository
- a separate backend
- a second Prisma schema
- a different auth stack
- a new environment/bootstrap setup

Instead, the target is a same-repo parallel rebuild where:

- the legacy editor remains intact at [`app/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/page.tsx)
- the new implementation lives beside it behind a preview route such as [`app/editor-v2/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/editor-v2/page.tsx)
- the existing API routes under [`app/api/`](/Users/juliareel/Code/needlepoint-chart/app/api) stay in place
- the existing Prisma schema in [`prisma/schema.prisma`](/Users/juliareel/Code/needlepoint-chart/prisma/schema.prisma) remains the starting persistence contract
- the existing auth/config/build setup remains the active runtime foundation

This is a planning document only. It does not move or rewrite code yet.

## What Changed From Earlier Assumptions

Earlier rebuild planning documents were intentionally frontend-focused, but they left too much room for a “fresh structure” interpretation that could be read as repo-level separation. That assumption should now change.

Updated planning assumptions:

- the rebuild is **same-repo**, not new-repo
- the rebuild is **parallel**, not a flag day replacement
- [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx) remains available during migration
- [`app/api/wip/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/route.ts), [`app/api/wip/[id]/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/route.ts), and related routes are reused rather than replaced
- [`prisma/schema.prisma`](/Users/juliareel/Code/needlepoint-chart/prisma/schema.prisma) is a compatibility boundary to preserve unless a later migration explicitly changes it
- the new editor should be introduced through a route like [`app/editor-v2/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/editor-v2/page.tsx), not by immediately swapping [`app/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/page.tsx)

Uncertainty:

- The repo does not yet contain [`app/editor-v2/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/editor-v2/page.tsx). That path is a recommended migration target, not an existing file.
- It is still possible the team will eventually collapse `editor-v2` back into [`app/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/page.tsx), but that should happen after parity confidence exists.

## Design Goals

The current repository shows several legacy problems:

- one oversized editor shell in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- canvas runtime mixed with toolbar/popover UI in [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)
- persistence/session orchestration embedded in a React hook in [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)
- large workflow components mixing state, UI, and domain behavior in:
  - [`components/pattern-editor/sections/UsedColorsSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/UsedColorsSection.tsx)
  - [`components/pattern-editor/sections/CustomPalettesSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/CustomPalettesSection.tsx)
  - [`components/pattern-editor/cards/TextToolCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/TextToolCard.tsx)

The new architecture should optimize for:

- explicit ownership
- smaller modules
- reusable domain and engine layers
- low coupling between product UI and editor engine
- stable reuse of existing routes under [`app/api/wip/`](/Users/juliareel/Code/needlepoint-chart/app/api/wip)
- coexistence of legacy and new editor surfaces during migration

## Recommended Same-Repo Parallel Structure

This is a reasonable target structure for the rebuilt frontend inside the current repository:

```text
app/
  page.tsx
  editor-v2/
    page.tsx
  api/
    wip/
    upload-trace/
    image-proxy/
    gc-unattached-blobs/

components/
  pattern-editor/
    ...legacy editor remains intact...
  editor-v2/
    app/
    features/
    shared/

lib/
  ...existing shared runtime modules...
  editor-v2/
    domain/
    editor/
    integrations/
    export/

docs/
  rebuild/
```

This structure intentionally keeps the rebuild inside current repo conventions:

- route definitions stay in `app/`
- UI components stay in `components/`
- non-UI logic stays in `lib/`

That makes adoption easier than introducing a repo-wide `src/` convention in the middle of migration.

## Exact Recommended Folder Structure

```text
app/
  page.tsx
  editor-v2/
    page.tsx

components/
  pattern-editor/
    ...legacy-only runtime...
  editor-v2/
    app/
      EditorV2Page.tsx
      EditorV2Layout.tsx
      EditorV2Providers.tsx
    features/
      canvas/
      selection/
      colors/
      custom-palettes/
      trace-image/
      text/
      persistence/
      version-history/
      export/
    shared/
      primitives/
      layout/
      feedback/

lib/
  editor-v2/
    domain/
      project/
      palette/
      selection/
      trace/
      text/
      export/
    editor/
      store/
      commands/
      selectors/
      canvas/
      tools/
      history/
      viewport/
      session/
    integrations/
      wip/
      trace-upload/
      auth/
    export/
      adapters/
```

## Why This Structure Fits This Repo

This repo already has a stable split between:

- route and API code in [`app/`](/Users/juliareel/Code/needlepoint-chart/app)
- UI in [`components/`](/Users/juliareel/Code/needlepoint-chart/components)
- reusable logic in [`lib/`](/Users/juliareel/Code/needlepoint-chart/lib)

Using:

- [`app/editor-v2/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/editor-v2/page.tsx)
- [`components/editor-v2/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2)
- [`lib/editor-v2/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2)

lets the team introduce a new architecture without forcing a full repo convention migration at the same time.

That matters because the risky part is the editor rebuild itself, not whether the repo adopts `src/`.

## Shared vs Legacy-Only vs New-Only

## Shared Modules

These should be treated as shared or potentially shared across legacy and `editor-v2`.

### Stable backend and integration boundaries

- [`app/api/wip/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/route.ts)
- [`app/api/wip/[id]/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/route.ts)
- [`app/api/wip/[id]/versions/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/versions/route.ts)
- [`app/api/wip/[id]/versions/[versionId]/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/versions/[versionId]/route.ts)
- [`app/api/upload-trace/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/upload-trace/route.ts)
- [`app/api/image-proxy/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/image-proxy/route.ts)
- [`prisma/schema.prisma`](/Users/juliareel/Code/needlepoint-chart/prisma/schema.prisma)

Why shared:

- they are already the persistence/runtime contract
- changing them at the same time as the frontend architecture would widen migration risk

### Domain/data modules worth preserving

- [`lib/dmcColors.ts`](/Users/juliareel/Code/needlepoint-chart/lib/dmcColors.ts)
- [`lib/dmcPaletteBands.ts`](/Users/juliareel/Code/needlepoint-chart/lib/dmcPaletteBands.ts)
- [`lib/symbols.ts`](/Users/juliareel/Code/needlepoint-chart/lib/symbols.ts)
- [`lib/grid.ts`](/Users/juliareel/Code/needlepoint-chart/lib/grid.ts)
- [`lib/pdf.ts`](/Users/juliareel/Code/needlepoint-chart/lib/pdf.ts)
- [`lib/blob.ts`](/Users/juliareel/Code/needlepoint-chart/lib/blob.ts)
- [`components/pattern-editor/utils/geometry.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/geometry.ts)
- [`components/pattern-editor/utils/colorUtils.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/colorUtils.ts)
- [`components/pattern-editor/utils/paletteSort.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/paletteSort.ts)
- [`components/pattern-editor/utils/imageToPattern.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/imageToPattern.ts)
- [`components/pattern-editor/canvas/fillUtils.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/fillUtils.ts)
- [`components/pattern-editor/canvas/stitchUtils.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/stitchUtils.ts)

Why shared:

- these are candidates for extraction into [`lib/editor-v2/domain/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/domain) or [`lib/editor-v2/editor/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor)
- they are primarily logic, not shell composition

Uncertainty:

- Some of these modules may need small compatibility wrappers because several were written against legacy data shapes.

## Legacy-Only Modules

These should remain in place for the old editor and should not be copied forward structurally.

- [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)
- [`components/pattern-editor/sections/UsedColorsSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/UsedColorsSection.tsx)
- [`components/pattern-editor/sections/CustomPalettesSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/CustomPalettesSection.tsx)
- [`components/pattern-editor/cards/TextToolCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/TextToolCard.tsx)
- [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)
- [`components/pattern-editor/hooks/useCanvasEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useCanvasEdits.ts)
- [`components/pattern-editor/hooks/useSelectionTools.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useSelectionTools.ts)
- [`components/pattern-editor/cards/CanvasSettingsCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/CanvasSettingsCard.tsx)
- [`components/pattern-editor/ui/Palette.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/ui/Palette.tsx)

Why legacy-only:

- they encode current feature coverage, but also current coupling
- carrying these structures forward would recreate the same ownership problems the rebuild is trying to solve

## New `editor-v2` Only Modules

These should exist only in the new implementation.

- [`app/editor-v2/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/editor-v2/page.tsx)
- [`components/editor-v2/app/EditorV2Page.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/app/EditorV2Page.tsx)
- [`components/editor-v2/app/EditorV2Layout.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/app/EditorV2Layout.tsx)
- [`components/editor-v2/app/EditorV2Providers.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/app/EditorV2Providers.tsx)
- store, command, selector, and feature modules under:
  - [`lib/editor-v2/editor/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor)
  - [`components/editor-v2/features/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features)

Why new-only:

- these are where the new ownership model should be enforced
- keeping them separate avoids accidental backsliding into the legacy structure

## `components/editor-v2/app/`

### What belongs here

- top-level `editor-v2` page composition
- providers specific to the new editor
- shell layout components
- route-to-feature wiring

### What should explicitly NOT belong here

- domain transforms
- canvas rendering algorithms
- direct fetch logic to `app/api/*`
- giant workflow-specific local state collections

### Legacy files mapped to future homes

- [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx) -> split into:
  - [`components/editor-v2/app/EditorV2Page.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/app/EditorV2Page.tsx)
  - [`components/editor-v2/app/EditorV2Layout.tsx`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/app/EditorV2Layout.tsx)
  - feature modules under [`components/editor-v2/features/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features)

## `components/editor-v2/features/`

### What belongs here

Feature-facing React modules for:

- canvas workspace
- toolbars
- selection overlays
- color workflows
- custom palette workflows
- trace workflows
- text workflows
- persistence/version dialogs
- export panels

### What should explicitly NOT belong here

- generic primitives
- pure domain helpers
- central store implementation
- API route definitions

### Legacy files mapped to future homes

- [`components/pattern-editor/sections/UsedColorsSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/UsedColorsSection.tsx) -> [`components/editor-v2/features/colors/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/colors)
- [`components/pattern-editor/sections/CustomPalettesSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/CustomPalettesSection.tsx) -> [`components/editor-v2/features/custom-palettes/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/custom-palettes)
- [`components/pattern-editor/cards/TextToolCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/TextToolCard.tsx) -> [`components/editor-v2/features/text/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/text)
- [`components/pattern-editor/cards/TraceImageCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/TraceImageCard.tsx) -> [`components/editor-v2/features/trace-image/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/trace-image)
- [`components/pattern-editor/cards/WipCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/WipCard.tsx) -> [`components/editor-v2/features/persistence/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/persistence)
- [`components/pattern-editor/dialogs/DraftPickerDialog.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/dialogs/DraftPickerDialog.tsx) -> [`components/editor-v2/features/persistence/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/persistence)
- [`components/pattern-editor/dialogs/VersionHistoryDialog.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/dialogs/VersionHistoryDialog.tsx) -> [`components/editor-v2/features/version-history/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/version-history)

## `components/editor-v2/shared/`

### What belongs here

- reusable UI primitives
- small layout helpers
- feedback components
- standardized control surfaces

### What should explicitly NOT belong here

- editor-specific business logic
- color remap logic
- trace persistence logic
- anything that needs direct access to the full editor store

### Legacy files mapped to future homes

There is no strong current primitive layer in the editor. This is partly the problem documented in:

- [`app/design-audit/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/design-audit/page.tsx)
- [`app/design-audit/README.md`](/Users/juliareel/Code/needlepoint-chart/app/design-audit/README.md)

This layer should be created fresh and should absorb repeated button, popover, chip, panel, and toggle patterns currently duplicated across:

- [`components/pattern-editor/sections/UsedColorsSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/UsedColorsSection.tsx)
- [`components/pattern-editor/sections/CustomPalettesSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/CustomPalettesSection.tsx)
- [`components/pattern-editor/cards/TextToolCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/TextToolCard.tsx)

## `lib/editor-v2/domain/`

### What belongs here

Pure editor-domain concepts that do not depend on React or route structure.

Examples:

- project document types
- palette types and transforms
- selection geometry
- trace document types
- text projection types
- export projections

### What should explicitly NOT belong here

- React hooks
- fetch clients
- DOM refs
- canvas element access
- route concerns

### Legacy files mapped to future homes

- [`lib/dmcColors.ts`](/Users/juliareel/Code/needlepoint-chart/lib/dmcColors.ts) -> [`lib/editor-v2/domain/palette/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/domain/palette)
- [`lib/dmcPaletteBands.ts`](/Users/juliareel/Code/needlepoint-chart/lib/dmcPaletteBands.ts) -> [`lib/editor-v2/domain/palette/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/domain/palette)
- [`lib/symbols.ts`](/Users/juliareel/Code/needlepoint-chart/lib/symbols.ts) -> [`lib/editor-v2/domain/palette/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/domain/palette)
- [`components/pattern-editor/utils/paletteSort.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/paletteSort.ts) -> [`lib/editor-v2/domain/palette/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/domain/palette)
- [`components/pattern-editor/utils/geometry.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/geometry.ts) -> [`lib/editor-v2/domain/selection/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/domain/selection)
- [`components/pattern-editor/utils/imageToPattern.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/imageToPattern.ts) -> split between [`lib/editor-v2/domain/project/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/domain/project) and [`lib/editor-v2/domain/palette/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/domain/palette)

## `lib/editor-v2/editor/`

### What belongs here

The new editor engine/state layer:

- normalized editor store
- commands
- selectors
- viewport state
- tool state
- selection state
- history state
- canvas runtime contracts
- session orchestration state

### What should explicitly NOT belong here

- branded shell layout
- feature panel styling
- inline route fetch calls
- dialog composition

### Legacy files mapped to future homes

- [`components/pattern-editor/hooks/useHistoryStack.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useHistoryStack.ts) -> [`lib/editor-v2/editor/history/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/history)
- [`components/pattern-editor/hooks/useCanvasEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useCanvasEdits.ts) -> split between [`lib/editor-v2/editor/commands/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/commands), [`lib/editor-v2/editor/tools/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/tools), and [`lib/editor-v2/editor/history/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/history)
- [`components/pattern-editor/hooks/useSelectionTools.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useSelectionTools.ts) -> [`lib/editor-v2/editor/selection/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/selection)
- [`components/pattern-editor/hooks/useColorEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useColorEdits.ts) -> split between [`lib/editor-v2/editor/commands/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/commands) and [`lib/editor-v2/editor/selectors/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/selectors)
- [`components/pattern-editor/canvas/useGridRenderer.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/useGridRenderer.ts) -> [`lib/editor-v2/editor/canvas/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/canvas)
- [`components/pattern-editor/canvas/fillUtils.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/fillUtils.ts) -> [`lib/editor-v2/editor/canvas/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/canvas)
- [`components/pattern-editor/canvas/stitchUtils.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/stitchUtils.ts) -> [`lib/editor-v2/editor/canvas/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/canvas)

## `lib/editor-v2/integrations/`

### What belongs here

- clients/adapters for existing WIP routes
- trace upload/proxy adapters
- auth wrappers around the current auth/config approach
- browser storage compatibility adapters when needed

### What should explicitly NOT belong here

- route handlers themselves
- React shell state
- canvas event handling

### Legacy files mapped to future homes

- [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts) -> split between [`lib/editor-v2/integrations/wip/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/integrations/wip) and [`lib/editor-v2/editor/session/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor/session)

## `lib/editor-v2/export/`

### What belongs here

- adapters that project editor-v2 document state into the existing PDF/export contract
- export-specific serialization helpers

### What should explicitly NOT belong here

- export button UI
- unrelated save/version workflows

### Legacy files mapped to future homes

- [`lib/pdf.ts`](/Users/juliareel/Code/needlepoint-chart/lib/pdf.ts) -> remains shared initially, then optionally wrapped by [`lib/editor-v2/export/adapters/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/export/adapters)
- [`components/pattern-editor/cards/ExportPdfButton.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/ExportPdfButton.tsx) -> [`components/editor-v2/features/export/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features/export)

## Recommended Ownership Model

The new ownership model should be:

- route ownership in [`app/editor-v2/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/editor-v2/page.tsx)
- shell/layout ownership in [`components/editor-v2/app/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/app)
- workflow UI ownership in [`components/editor-v2/features/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features)
- reusable primitive ownership in [`components/editor-v2/shared/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/shared)
- pure domain ownership in [`lib/editor-v2/domain/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/domain)
- editor engine/state ownership in [`lib/editor-v2/editor/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor)
- existing backend contract ownership remaining under [`app/api/`](/Users/juliareel/Code/needlepoint-chart/app/api)

## Rules For File Size And Responsibility Boundaries

- A route file like [`app/editor-v2/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/editor-v2/page.tsx) should only compose providers and the top-level page component.
- A shell/layout file in [`components/editor-v2/app/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/app) should not own feature workflow logic.
- A feature component in [`components/editor-v2/features/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2/features) should own one workflow or one view, not an entire sidebar ecosystem.
- A file in [`lib/editor-v2/domain/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/domain) should be pure and UI-free.
- A file in [`lib/editor-v2/editor/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2/editor) should not import route components or app-level UI.
- New files should usually stay well under the size of:
  - [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
  - [`components/pattern-editor/sections/UsedColorsSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/UsedColorsSection.tsx)
  - [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)

Practical rule:

- if a file starts coordinating multiple workflows plus multiple kinds of state, it is already too high in the stack

## Anti-Patterns To Avoid Based On This Repo

- Do not create another giant shell like [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx).
- Do not recreate `props: any` canvas wrappers like [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx).
- Do not hide persistence orchestration inside one giant hook like [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts).
- Do not mix workflow UI, domain transforms, and inline styling in one panel the way [`components/pattern-editor/sections/UsedColorsSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/UsedColorsSection.tsx) currently does.
- Do not migrate by copying the legacy state shape field-for-field into a new store.
- Do not change [`app/api/wip/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/route.ts) and [`prisma/schema.prisma`](/Users/juliareel/Code/needlepoint-chart/prisma/schema.prisma) at the same time as the initial shell/state rebuild unless a slice explicitly proves that need.

## Final Recommendation

Build the new editor in parallel inside this repository with:

- a preview route at [`app/editor-v2/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/editor-v2/page.tsx)
- new UI under [`components/editor-v2/`](/Users/juliareel/Code/needlepoint-chart/components/editor-v2)
- new logic under [`lib/editor-v2/`](/Users/juliareel/Code/needlepoint-chart/lib/editor-v2)
- continued reuse of existing APIs under [`app/api/`](/Users/juliareel/Code/needlepoint-chart/app/api)
- the legacy editor preserved in [`components/pattern-editor/`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor) until the new path is validated

That gives the team a cleaner architecture without turning the migration into a repo/platform migration at the same time.
