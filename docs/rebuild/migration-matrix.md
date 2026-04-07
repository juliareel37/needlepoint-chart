# Migration Matrix

This matrix classifies the current editor frontend modules and feature areas for a controlled rebuild.

Classification options:

- `Keep mostly as-is`
- `Keep logic but rewrite implementation`
- `Replace entirely`
- `Delete`

This is grounded in the current repository and is intentionally frontend-focused. It does not propose runtime code changes yet.

## Editor Shell

### Classification

`Replace entirely`

### File paths

- [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- [`app/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/page.tsx)

### Current responsibility

- top-level editor app shell
- primary editor state container
- responsive layout and sidebar behavior
- tool and viewport orchestration
- trace image orchestration
- text tool orchestration
- save/load/version UI wiring
- export wiring
- file menu and header portal wiring

### Why it falls into this category

[`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx) is the central structural bottleneck in the current app. It owns too many unrelated concerns and mixes:

- persistent document state
- transient editing state
- UI-only open/closed state
- responsive layout state
- persistence/session orchestration

The rebuild should not preserve this component structure. Replacing it entirely is safer than trying to incrementally hollow it out while keeping it as the main composition boundary.

### Migration risk

`High`

This file currently coordinates almost every editor workflow, so replacing it has broad blast radius.

### Notes on how to port it safely

- Keep [`app/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/page.tsx) stable as the route entry.
- Rebuild a new shell around the normalized state model described in [`docs/rebuild/editor-state-model.md`](/Users/juliareel/Code/needlepoint-chart/docs/rebuild/editor-state-model.md).
- Port feature areas behind new boundaries one at a time rather than porting `useState` fields one-for-one.
- Treat current `PatternEditor` behavior as the compatibility reference, not as the implementation template.

## Canvas Runtime

### Classification

`Keep logic but rewrite implementation`

### File paths

- [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)
- [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx)
- [`components/pattern-editor/canvas/useGridRenderer.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/useGridRenderer.ts)
- [`components/pattern-editor/canvas/stitchUtils.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/stitchUtils.ts)
- [`components/pattern-editor/canvas/fillUtils.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/fillUtils.ts)

### Current responsibility

- canvas rendering
- pan and zoom
- paint and erase interactions
- fill interactions
- lasso/mirror interaction support
- trace image display and transform support
- overlay drawing and ruler/grid behavior
- surrounding toolbar/popover controls

### Why it falls into this category

The low-level canvas and rendering logic is valuable, especially in:

- [`components/pattern-editor/canvas/useGridRenderer.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/useGridRenderer.ts)
- [`components/pattern-editor/canvas/fillUtils.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/fillUtils.ts)
- [`components/pattern-editor/canvas/stitchUtils.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/stitchUtils.ts)

But the current component boundaries are poor:

- [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx) uses `props: any` and mixes UI chrome with canvas runtime concerns.
- [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx) handles too many interaction modes directly.

The logic is worth preserving, but the shape should be rewritten.

### Migration risk

`High`

This area contains critical user interactions, and regressions would be very visible.

### Notes on how to port it safely

- Preserve low-level rendering and geometry helpers first.
- Split new canvas architecture into:
  - render layer
  - pointer/input layer
  - surrounding toolbar/chrome layer
- Port behavior with scenario-by-scenario parity tests if possible:
  - paint
  - fill
  - lasso
  - mirror
  - pan/zoom
  - trace transform

## Selection Tools

### Classification

`Keep logic but rewrite implementation`

### File paths

- [`components/pattern-editor/hooks/useSelectionTools.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useSelectionTools.ts)
- [`components/pattern-editor/utils/geometry.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/geometry.ts)
- [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx)
- [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)

### Current responsibility

- lasso state and fill support
- filter/selection rectangle state
- mirror region state and application
- geometry helpers for selection and mirror targets

### Why it falls into this category

The geometric logic and conceptual workflows are good rebuild candidates, especially in [`components/pattern-editor/utils/geometry.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/geometry.ts).

The current problem is ownership:

- state exists partly in [`components/pattern-editor/hooks/useSelectionTools.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useSelectionTools.ts)
- partly as preview state in [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx)
- partly as filter-edit UI state in [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)

So the logic should be kept, but ownership and implementation should be rebuilt.

### Migration risk

`Medium`

Selection behavior is important, but the state space is smaller than full canvas behavior.

### Notes on how to port it safely

- Move selection into a dedicated `SelectionState`.
- Keep geometry helpers pure and reusable.
- Ensure one canonical active selection model exists.
- Treat preview rectangles as ephemeral canvas state, not canonical editor state.

## Color Management

### Classification

`Keep logic but rewrite implementation`

### File paths

- [`components/pattern-editor/hooks/useColorEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useColorEdits.ts)
- [`components/pattern-editor/sections/UsedColorsSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/UsedColorsSection.tsx)
- [`components/pattern-editor/sections/CustomPalettesSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/CustomPalettesSection.tsx)
- [`components/pattern-editor/utils/colorUtils.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/colorUtils.ts)
- [`components/pattern-editor/utils/paletteSort.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/paletteSort.ts)
- [`lib/dmcColors.ts`](/Users/juliareel/Code/needlepoint-chart/lib/dmcColors.ts)
- [`lib/dmcPaletteBands.ts`](/Users/juliareel/Code/needlepoint-chart/lib/dmcPaletteBands.ts)
- [`lib/symbols.ts`](/Users/juliareel/Code/needlepoint-chart/lib/symbols.ts)

### Current responsibility

- remap/replace colors
- merge colors
- delete colors and choose replacements
- compute used-color counts and ids
- assign color symbols
- custom palette creation and editing
- palette grouping and sorting

### Why it falls into this category

The domain logic is useful:

- color transforms in [`components/pattern-editor/hooks/useColorEdits.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useColorEdits.ts)
- palette and color helpers in [`components/pattern-editor/utils/colorUtils.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/colorUtils.ts) and [`components/pattern-editor/utils/paletteSort.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/paletteSort.ts)
- DMC data in [`lib/dmcColors.ts`](/Users/juliareel/Code/needlepoint-chart/lib/dmcColors.ts)

But the UI implementation is too tangled:

- [`components/pattern-editor/sections/UsedColorsSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/UsedColorsSection.tsx) mixes too many workflows
- [`components/pattern-editor/sections/CustomPalettesSection.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/sections/CustomPalettesSection.tsx) owns state that may belong in document state

### Migration risk

`Medium`

Color workflows are important but can be ported in slices.

### Notes on how to port it safely

- Separate canonical palette data from transient color-action workflows.
- Preserve color transform algorithms before rebuilding UI.
- Decide explicitly whether custom palettes are document-owned or session-only.
- Rebuild `Used Colors`, `Custom Palettes`, and `Color Actions` as separate surfaces instead of one giant section.

## Text Tools

### Classification

`Keep logic but rewrite implementation`

### File paths

- [`components/pattern-editor/cards/TextToolCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/TextToolCard.tsx)
- [`components/pattern-editor/utils/textFontOptions.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/utils/textFontOptions.ts)
- [`app/text-tool-fonts.css`](/Users/juliareel/Code/needlepoint-chart/app/text-tool-fonts.css)
- text placement logic in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)

### Current responsibility

- text content entry
- font and style selection
- text color selection
- staging text placement onto the canvas
- converting text preview into grid mutations

### Why it falls into this category

The current text tool is functional, but it is split awkwardly:

- UI in [`components/pattern-editor/cards/TextToolCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/TextToolCard.tsx)
- placement and commit logic in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)

It also duplicates palette filtering and popover behavior found elsewhere.

The concept is worth keeping. The current structure is not.

### Migration risk

`Medium`

This feature is narrower than canvas or persistence, but the rebuild should clarify whether text remains destructive-to-grid or becomes a first-class entity.

### Notes on how to port it safely

- Decide the document model first:
  - destructive grid write
  - or editable text entity
- Keep font option and styling data sources stable.
- Extract text placement into its own tool state rather than leaving it in the shell.

## Trace Image

### Classification

`Keep logic but rewrite implementation`

### File paths

- [`components/pattern-editor/cards/TraceImageCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/TraceImageCard.tsx)
- trace runtime state in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- trace manipulation in [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx)
- trace shell controls in [`components/pattern-editor/canvas/CanvasWithExportRef.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/CanvasWithExportRef.tsx)
- save/load behavior in [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)
- upload route in [`app/api/upload-trace/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/upload-trace/route.ts)
- proxy route in [`app/api/image-proxy/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/image-proxy/route.ts)
- blob cleanup in [`lib/blob.ts`](/Users/juliareel/Code/needlepoint-chart/lib/blob.ts)

### Current responsibility

- upload and preview background image
- trace placement and transform
- lock/unlock and visibility
- opacity adjustment
- persist trace state with drafts and versions

### Why it falls into this category

The trace feature is valuable and integrated into save/load/versioning, so it should not be deleted.

But current ownership is fragmented:

- document-facing trace values in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
- manipulation mode flags in the same file
- runtime drag/resize behavior in [`components/pattern-editor/canvas/GridCanvas.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/canvas/GridCanvas.tsx)
- recovery and persistence logic in [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)

### Migration risk

`High`

This feature crosses frontend runtime, storage, and blob lifecycle.

### Notes on how to port it safely

- Split trace into:
  - canonical document trace state
  - transient placement/manipulation state
  - runtime-only image object refs
- Keep API contract stable initially.
- Maintain compatibility with existing persisted trace payloads during migration.

## Persistence / Versioning

### Classification

`Keep logic but rewrite implementation`

### File paths

- [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)
- [`components/pattern-editor/cards/WipCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/WipCard.tsx)
- [`components/pattern-editor/dialogs/DraftPickerDialog.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/dialogs/DraftPickerDialog.tsx)
- [`components/pattern-editor/dialogs/VersionHistoryDialog.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/dialogs/VersionHistoryDialog.tsx)
- [`components/pattern-editor/dialogs/VersionPreviewToast.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/dialogs/VersionPreviewToast.tsx)
- [`app/api/wip/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/route.ts)
- [`app/api/wip/[id]/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/route.ts)
- [`app/api/wip/[id]/versions/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/versions/route.ts)
- [`app/api/wip/[id]/versions/[versionId]/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/versions/[versionId]/route.ts)
- [`prisma/schema.prisma`](/Users/juliareel/Code/needlepoint-chart/prisma/schema.prisma)
- [`lib/wipVersioning.ts`](/Users/juliareel/Code/needlepoint-chart/lib/wipVersioning.ts)

### Current responsibility

- save/load drafts
- autosave
- local recovery
- session resume
- version creation and restore
- WIP picker and version history UI

### Why it falls into this category

The backend contract is relatively contained and should be retained initially.

The frontend orchestration in [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts) is too entangled to preserve structurally. It currently mixes:

- browser storage recovery
- dirty tracking
- network requests
- auth transitions
- version preview state
- viewport persistence

So the logic is worth preserving, but it should move into a clearer persistence/session controller.

### Migration risk

`High`

Save/load confidence is critical, and the current hook has many edge-case behaviors that users may rely on implicitly.

### Notes on how to port it safely

- Keep server contracts and database schema stable on the first pass.
- Enumerate current persistence behaviors before implementation:
  - autosave interval
  - local backup fallback
  - session resume
  - version preview and restore
  - signed-out recovery path
- Port these behaviors intentionally rather than assuming only server save/load matters.

## Export

### Classification

`Keep mostly as-is`

### File paths

- [`components/pattern-editor/cards/ExportPdfButton.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/ExportPdfButton.tsx)
- [`lib/pdf.ts`](/Users/juliareel/Code/needlepoint-chart/lib/pdf.ts)

### Current responsibility

- expose export action in the UI
- generate PDF chart pages and legend pages

### Why it falls into this category

Export is already fairly well isolated:

- UI trigger in [`components/pattern-editor/cards/ExportPdfButton.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/ExportPdfButton.tsx)
- implementation in [`lib/pdf.ts`](/Users/juliareel/Code/needlepoint-chart/lib/pdf.ts)

The main migration work is adapting the input shape from the new editor state model.

### Migration risk

`Low`

This area is comparatively bounded.

### Notes on how to port it safely

- Keep `lib/pdf.ts` stable initially.
- Add an adapter from the new document selectors to the existing export function input.
- Revisit export only after document model and symbol/color derivations are settled.

## Internal Design-System Surface

### Classification

`Keep mostly as-is`

### File paths

- [`app/design-system/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/design-system/page.tsx)
- supporting files under [`app/design-system/`](/Users/juliareel/Code/needlepoint-chart/app/design-system)

### Current responsibility

- internal demos
- token previews
- visual reference implementations

### Why it falls into this category

This surface appears to be internal tooling, not a runtime dependency of the editor route at [`app/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/page.tsx).

It does not need to be rebuilt alongside the editor frontend unless the team wants to use it as a staging ground for new primitives.

### Migration risk

`Low`

### Notes on how to port it safely

- Treat it as parallel internal tooling.
- If new primitives are introduced during rebuild, optionally add them here later.
- Do not let this route expand rebuild scope unnecessarily.

## Internal Audit Surface

### Classification

`Keep mostly as-is`

### File paths

- [`app/design-audit/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/design-audit/page.tsx)
- [`lib/designAudit.ts`](/Users/juliareel/Code/needlepoint-chart/lib/designAudit.ts)
- [`app/design-audit/README.md`](/Users/juliareel/Code/needlepoint-chart/app/design-audit/README.md)

### Current responsibility

- analyze current UI surface
- visualize style inconsistencies and component coverage

### Why it falls into this category

This is an internal analysis tool. It may remain useful during the rebuild, especially to compare the old and new UI surfaces.

It is not part of the product runtime editor and should not block the rebuild.

### Migration risk

`Low`

### Notes on how to port it safely

- Leave it untouched during core editor rebuild unless it becomes noisy or misleading.
- Optionally use it later to audit the rebuilt UI.

## Stale / Orphaned Artifacts

### Classification

`Delete`

### File paths

- [`components/pattern-editor/cards/CanvasSettingsCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/CanvasSettingsCard.tsx)
- [`components/pattern-editor/ui/Palette.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/ui/Palette.tsx)
- likely stale state/flags in:
  - [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
  - [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)

### Current responsibility

- [`components/pattern-editor/cards/CanvasSettingsCard.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/cards/CanvasSettingsCard.tsx) appears to be an unused card surface.
- [`components/pattern-editor/ui/Palette.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/ui/Palette.tsx) appears to be an alternate/older palette UI not wired into the current runtime.
- suspicious stale fields include:
  - `colorsSidebarTab` in [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)
  - `favoriteColorIds` in the same file
  - `AUTO_LOAD_LAST_ACTIVE_DRAFT_ON_STARTUP = false` in [`components/pattern-editor/hooks/useWipDrafts.ts`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/hooks/useWipDrafts.ts)

### Why it falls into this category

These artifacts should not shape the rebuild architecture.

The current code suggests they are either:

- unused
- partially abandoned
- superseded by newer flows

### Migration risk

`Low`

### Notes on how to port it safely

- Do not carry them into the new implementation by default.
- Validate with the team before deleting if there is uncertainty about hidden usage.
- For rebuild planning, treat them as out of scope unless explicitly revived.

## Summary Recommendations

### Replace entirely

- [`components/pattern-editor/PatternEditor.tsx`](/Users/juliareel/Code/needlepoint-chart/components/pattern-editor/PatternEditor.tsx)

### Keep logic but rewrite implementation

- canvas runtime
- selection tools
- color management
- text tools
- trace image
- persistence/versioning

### Keep mostly as-is

- export
- internal design-system route
- internal design-audit route
- backend draft/version API and schema as a first migration boundary

### Delete

- stale/orphaned editor artifacts that are not part of the live runtime path

## Safe Rebuild Sequence

If this migration is executed as a controlled rebuild, the safest order appears to be:

1. Keep [`app/api/wip/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/route.ts), [`app/api/wip/[id]/route.ts`](/Users/juliareel/Code/needlepoint-chart/app/api/wip/[id]/route.ts), and [`prisma/schema.prisma`](/Users/juliareel/Code/needlepoint-chart/prisma/schema.prisma) stable.
2. Introduce the new editor state model and shell behind the same route entry at [`app/page.tsx`](/Users/juliareel/Code/needlepoint-chart/app/page.tsx).
3. Port canvas and selection behavior next.
4. Port color workflows and trace workflow next.
5. Port persistence/session behavior with parity against current flows.
6. Reattach export through an adapter.
7. Clean up stale artifacts only after the new frontend path is in place.

This sequence limits scope while preserving the most salvageable logic from the current repository.
