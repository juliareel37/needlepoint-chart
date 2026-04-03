# Design Audit Summary

This folder contains the internal UI inventory route at `/design-audit`.
The page now includes a "Component Type Coverage" section with auto-detected matches, source file counts, and line samples for every requested component type.
It also includes an "Inventory Completeness Matrix" that cross-checks curated live examples against detected source matches for each category, so non-button categories are explicitly covered.

## Categories Found
- Buttons
- Icon buttons
- Inputs
- Textareas
- Selects / dropdowns
- Checkboxes / toggles
- Modals / dialogs / popovers
- Cards / panels / containers
- Badges / tags / chips
- Nav items / tabs
- Toolbar controls
- Typography patterns
- Repeated style tokens (colors, radius, spacing, shadows, type scale, button-like classes)

## Scope Notes
- Analyzer scans UI source files in `app/**` and `components/**`.
- Excludes `app/api/**` and `app/design-audit/**` so route handlers and the audit page itself do not skew results.

## Biggest Inconsistencies Observed
- Heavy mixing of shared classes (`menu-tab-button`, `toolbar-button`, `menu-item`) with many ad hoc inline button implementations.
- Similar control shapes (8px/10px radius, 6px/8px paddings) are repeated in many files with small variations.
- Multiple near-identical popover/dialog containers redefined inline instead of sharing one wrapper pattern.
- Toggle patterns exist in at least two forms (the `Toggle` component and inline `role="switch"` button toggles).
- Chip/badge patterns (DMC pills, count badges) repeat with slight differences in sizing and spacing.
- Color usage is mostly token-based (`var(--...)`) but still mixed with direct literals (`#ffffff`, `rgba(...)`, gradients) in interactive controls.

## Best Candidate Patterns To Standardize First
1. Base button variants: neutral, accent primary, icon-only, and segmented tab button.
2. Popover/dialog container shell: border, radius, padding, shadow, and internal spacing.
3. Form control primitives: text input, compact numeric input, textarea, select, slider wrapper.
4. Toggle primitives: unify `Toggle` and inline switch into one API/visual base.
5. Chips/badges: DMC code pill and count badge (size, typography, background, border).
6. Shared spacing/radius scale: formalize common values already dominant (notably 8, 10, 12, 14, 999).
