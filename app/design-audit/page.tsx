/* eslint-disable @next/next/no-img-element */
import type { CSSProperties, ReactNode } from "react";
import { assetPath } from "../../lib/assetPath";
import {
  type CompositePatternCoverageRow,
  type CoverageCategory,
  getDesignAuditStats,
  type ComponentTypeCoverageRow,
  type FrequencyRow,
  type SourceOccurrenceRow,
} from "../../lib/designAudit";

type PatternKind = "Reusable" | "Ad Hoc";

type AuditPattern = {
  id: string;
  category: CoverageCategory;
  name: string;
  kind: PatternKind;
  sourceFile: string;
  sourceComponent: string;
  sourceLine: number;
  traits: string[];
  preview: ReactNode;
};

type CompositeAuditPattern = {
  id: string;
  group: "Palette Popups / Pickers" | "Confirmation / Decision Surfaces" | "Status / Informative Banners";
  name: string;
  kind: PatternKind;
  sourceFile: string;
  sourceComponent: string;
  sourceLine: number;
  traits: string[];
  preview: ReactNode;
};

const panelStyle: CSSProperties = {
  border: "1px solid var(--ui-border-subtle)",
  borderRadius: 12,
  background: "var(--card-bg)",
  padding: 14,
};

const patterns: AuditPattern[] = [
  {
    id: "btn-menu-item",
    category: "Buttons",
    name: "File Menu Item Button",
    kind: "Reusable",
    sourceFile: "components/pattern-editor/PatternEditor.tsx",
    sourceComponent: "PatternEditor",
    sourceLine: 1927,
    traits: ["className: menu-item", "padding: 6px 10px", "radius: 8", "font-size: 12", "font-weight: 600"],
    preview: (
      <button
        type="button"
        className="menu-item"
        style={{
          padding: "6px 10px",
          borderRadius: 8,
          border: "none",
          background: "transparent",
          textAlign: "left",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        Menu Item
      </button>
    ),
  },
  {
    id: "btn-primary-accent",
    category: "Buttons",
    name: "Primary Accent Action",
    kind: "Ad Hoc",
    sourceFile: "components/pattern-editor/cards/GridSizeCard.tsx",
    sourceComponent: "GridSizeCard",
    sourceLine: 264,
    traits: ["background: var(--accent)", "text: #ffffff", "radius: 8", "height: 34"],
    preview: (
      <button
        type="button"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "8px 10px",
          height: 34,
          minHeight: 34,
          borderRadius: 8,
          border: "1px solid var(--ui-border-subtle)",
          background: "var(--accent)",
          color: "#ffffff",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          lineHeight: 1,
          width: 140,
        }}
      >
        Apply
      </button>
    ),
  },
  {
    id: "btn-export-accent",
    category: "Buttons",
    name: "Export Accent Button",
    kind: "Ad Hoc",
    sourceFile: "components/pattern-editor/cards/ExportPdfButton.tsx",
    sourceComponent: "ExportPdfButton",
    sourceLine: 42,
    traits: ["background: var(--accent)", "radius: 8", "inline icon + label", "font-weight: 600"],
    preview: (
      <button
        type="button"
        style={{
          padding: "6px 10px",
          borderRadius: 8,
          border: "1px solid var(--ui-border-subtle)",
          background: "var(--accent)",
          color: "#ffffff",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          justifyContent: "center",
        }}
      >
        <img
          src={assetPath("/icons/download.svg")}
          alt=""
          aria-hidden="true"
          width={16}
          height={16}
          style={{ display: "block", filter: "brightness(0) invert(1)" }}
        />
        Export
      </button>
    ),
  },
  {
    id: "btn-canvas-overlay-confirm",
    category: "Buttons",
    name: "Canvas Overlay Confirm Button",
    kind: "Ad Hoc",
    sourceFile: "components/pattern-editor/canvas/CanvasWithExportRef.tsx",
    sourceComponent: "CanvasWithExportRef",
    sourceLine: 1572,
    traits: ["background: var(--accent-strong)", "text: #ffffff", "radius: 8", "font-weight: 700"],
    preview: (
      <button
        type="button"
        style={{
          padding: "6px 12px",
          borderRadius: 8,
          border: "none",
          background: "var(--accent-strong)",
          color: "#ffffff",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Set Image
      </button>
    ),
  },
  {
    id: "btn-used-colors-confirm",
    category: "Buttons",
    name: "Color Actions Footer Confirm Button",
    kind: "Ad Hoc",
    sourceFile: "components/pattern-editor/sections/UsedColorsSection.tsx",
    sourceComponent: "UsedColorsSection",
    sourceLine: 1642,
    traits: ["background: var(--accent)", "text: #ffffff", "min-height: 34", "shared footer action style"],
    preview: (
      <button
        type="button"
        style={{
          padding: "6px 10px",
          borderRadius: 8,
          border: "none",
          background: "var(--accent)",
          color: "#ffffff",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          minHeight: 34,
        }}
      >
        Apply
      </button>
    ),
  },
  {
    id: "btn-trace-row-action",
    category: "Buttons",
    name: "Trace Row Action Button",
    kind: "Reusable",
    sourceFile: "components/pattern-editor/cards/TraceImageCard.tsx",
    sourceComponent: "TraceImageCard",
    sourceLine: 172,
    traits: ["className: trace-image-row-action-button", "min-height: 34", "radius: 8", "icon + label"],
    preview: (
      <button
        type="button"
        className="trace-image-row-action-button"
        style={{
          padding: "8px 10px",
          minHeight: 34,
          borderRadius: 8,
          border: "none",
          background: "rgba(15, 23, 42, 0.16)",
          color: "var(--foreground)",
          cursor: "pointer",
          fontSize: 12,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 8,
          textAlign: "left",
        }}
      >
        <span className="trace-image-row-action-button-icon" aria-hidden="true">
          <img
            src={assetPath("/icons/upload.svg")}
            alt=""
            width={16}
            height={16}
            style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
          />
        </span>
        <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.96 }}>Replace</span>
      </button>
    ),
  },
  {
    id: "icon-plain-icon-button",
    category: "Icon Buttons",
    name: "Plain Icon Button Style",
    kind: "Ad Hoc",
    sourceFile: "components/pattern-editor/sections/CustomPalettesSection.tsx",
    sourceComponent: "CustomPalettesSection",
    sourceLine: 62,
    traits: ["22x22 icon button", "radius: 6", "transparent background", "hover background set inline"],
    preview: (
      <button
        type="button"
        style={{
          width: 22,
          height: 22,
          padding: 0,
          border: "none",
          borderRadius: 6,
          background: "transparent",
          color: "var(--foreground)",
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
          lineHeight: 1,
          transition: "background 140ms ease",
        }}
      >
        ✎
      </button>
    ),
  },
  {
    id: "icon-pattern-menu-button",
    category: "Icon Buttons",
    name: "Pattern Side Menu Icon Button",
    kind: "Reusable",
    sourceFile: "components/pattern-editor/PatternEditor.tsx",
    sourceComponent: "PatternEditor",
    sourceLine: 2604,
    traits: ["className: pattern-menu-button", "52x54", "radius: 12", "icon + small label"],
    preview: (
      <button
        type="button"
        className="pattern-menu-button"
        style={{
          width: 52,
          height: 54,
          borderRadius: 12,
          border: "none",
          background: "var(--card-bg)",
          color: "var(--foreground)",
          fontSize: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          cursor: "pointer",
        }}
      >
        <img
          src={assetPath("/icons/palette.svg")}
          alt=""
          aria-hidden="true"
          width={18}
          height={18}
          style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
        />
        <span style={{ fontSize: 10, lineHeight: 1.1, whiteSpace: "nowrap" }}>Colors</span>
      </button>
    ),
  },
  {
    id: "input-popover",
    category: "Inputs",
    name: "Popover Search Input",
    kind: "Ad Hoc",
    sourceFile: "components/pattern-editor/sections/UsedColorsSection.tsx",
    sourceComponent: "UsedColorsSection",
    sourceLine: 166,
    traits: ["padding: 6px 8px", "radius: 8", "muted background", "font-size: 12"],
    preview: (
      <input
        value=""
        readOnly
        placeholder="Search name or #DMC"
        style={{
          width: "100%",
          minWidth: 0,
          boxSizing: "border-box",
          padding: "6px 8px",
          borderRadius: 8,
          border: "1px solid transparent",
          background: "var(--muted-bg)",
          color: "var(--foreground)",
          fontSize: 12,
        }}
      />
    ),
  },
  {
    id: "input-value-box",
    category: "Inputs",
    name: "Compact Numeric Value Input",
    kind: "Ad Hoc",
    sourceFile: "components/pattern-editor/cards/CanvasSettingsCard.tsx",
    sourceComponent: "CanvasSettingsCard",
    sourceLine: 6,
    traits: ["width: 46", "padding: 4px 6px", "radius: 8", "border subtle"],
    preview: (
      <input
        value="75"
        readOnly
        style={{
          width: 46,
          minWidth: 0,
          padding: "4px 6px",
          borderRadius: 8,
          border: "1px solid var(--ui-border-subtle)",
          background: "var(--card-bg)",
          color: "var(--foreground)",
          fontSize: 12,
          fontWeight: 400,
          textAlign: "left",
        }}
      />
    ),
  },
  {
    id: "input-range",
    category: "Inputs",
    name: "Global Slider Input",
    kind: "Reusable",
    sourceFile: "app/globals.css",
    sourceComponent: "Global Styles",
    sourceLine: 662,
    traits: ["input[type=range] global reset", "6px track", "14px thumb", "tokenized colors"],
    preview: <input type="range" min={0} max={100} value={40} readOnly style={{ width: "100%" }} />,
  },
  {
    id: "textarea-text-tool",
    category: "Textareas",
    name: "Text Tool Content Textarea",
    kind: "Ad Hoc",
    sourceFile: "components/pattern-editor/cards/TextToolCard.tsx",
    sourceComponent: "TextToolCard",
    sourceLine: 208,
    traits: ["min-height: 66", "padding: 8px 9px", "radius: 8", "resizable vertical"],
    preview: (
      <textarea
        value="Preview text"
        readOnly
        rows={3}
        style={{
          width: "100%",
          resize: "vertical",
          minHeight: 66,
          padding: "8px 9px",
          borderRadius: 8,
          border: "1px solid var(--ui-border-subtle)",
          background: "var(--card-bg)",
          color: "var(--foreground)",
          fontSize: 12,
          boxSizing: "border-box",
        }}
      />
    ),
  },
  {
    id: "select-gridline-interval",
    category: "Selects / Dropdowns",
    name: "Gridline Interval Select",
    kind: "Ad Hoc",
    sourceFile: "components/pattern-editor/canvas/CanvasWithExportRef.tsx",
    sourceComponent: "CanvasWithExportRef",
    sourceLine: 2581,
    traits: ["width: 68", "padding: 6px 24px 6px 8px", "radius: 10", "font-size: 11"],
    preview: (
      <select
        defaultValue="10"
        style={{
          width: 68,
          minWidth: 68,
          padding: "6px 24px 6px 8px",
          borderRadius: 10,
          border: "1px solid var(--ui-border-subtle)",
          background: "var(--card-bg)",
          color: "var(--foreground)",
          fontSize: 11,
          fontWeight: 600,
          lineHeight: 1.2,
          cursor: "pointer",
        }}
      >
        <option value="5">5</option>
        <option value="10">10</option>
        <option value="15">15</option>
      </select>
    ),
  },
  {
    id: "toggle-component",
    category: "Checkboxes / Toggles",
    name: "Toggle Component Pattern",
    kind: "Reusable",
    sourceFile: "components/pattern-editor/ui/Toggle.tsx",
    sourceComponent: "Toggle",
    sourceLine: 10,
    traits: ["checkbox hidden + visual track", "track 36x20", "knob 14x14", "radius: 999"],
    preview: (
      <label
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: 180,
          gap: 10,
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 12, opacity: 0.8 }}>Show gridlines</span>
        <span
          aria-hidden="true"
          style={{
            flexShrink: 0,
            width: 36,
            height: 20,
            borderRadius: 999,
            border: "1px solid var(--toggle-track-border)",
            background: "var(--toggle-track-on)",
            position: "relative",
            transition: "background 150ms ease",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 2,
              left: 18,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "var(--toggle-knob)",
              boxShadow: "0 1px 2px var(--ui-border-strong)",
              transition: "left 150ms ease, background 150ms ease",
            }}
          />
        </span>
      </label>
    ),
  },
  {
    id: "toggle-inline-switch",
    category: "Checkboxes / Toggles",
    name: "Inline Switch Button Pattern",
    kind: "Ad Hoc",
    sourceFile: "components/pattern-editor/sections/UsedColorsSection.tsx",
    sourceComponent: "UsedColorsSection",
    sourceLine: 2202,
    traits: ["button role=switch", "28x16", "knob 12x12", "accent when checked"],
    preview: (
      <button
        type="button"
        role="switch"
        aria-checked="true"
        style={{
          width: 28,
          height: 16,
          borderRadius: 999,
          border: "none",
          background: "var(--accent)",
          cursor: "pointer",
          padding: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 12,
            height: 12,
            borderRadius: 999,
            background: "#ffffff",
            boxShadow: "0 1px 2px rgba(15,23,42,0.2)",
          }}
        />
      </button>
    ),
  },
  {
    id: "dialog-confirm",
    category: "Modals / Dialogs / Popovers",
    name: "Centered Confirmation Dialog",
    kind: "Reusable",
    sourceFile: "components/pattern-editor/dialogs/ConfirmDialog.tsx",
    sourceComponent: "ConfirmDialog",
    sourceLine: 22,
    traits: ["fullscreen overlay", "modal card radius 14", "shadow: 0 16px 40px"],
    preview: (
      <div
        style={{
          position: "relative",
          minHeight: 150,
          borderRadius: 10,
          overflow: "hidden",
          background: "rgba(0,0,0,0.45)",
          border: "1px solid var(--ui-border-subtle)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "var(--card-bg)",
            color: "var(--foreground)",
            borderRadius: 14,
            padding: 16,
            width: "min(300px, 90%)",
            boxShadow: "0 16px 40px var(--ui-border-strong)",
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15 }}>Confirm action</div>
          <div style={{ fontSize: 12.5, opacity: 0.75 }}>Are you sure?</div>
        </div>
      </div>
    ),
  },
  {
    id: "dialog-file-menu-popover",
    category: "Modals / Dialogs / Popovers",
    name: "File Menu Popover",
    kind: "Ad Hoc",
    sourceFile: "components/pattern-editor/PatternEditor.tsx",
    sourceComponent: "PatternEditor",
    sourceLine: 1826,
    traits: ["absolute popover", "radius: 10", "boxShadow: var(--ui-shadow-lg)", "menu-item rows"],
    preview: (
      <div
        role="menu"
        style={{
          minWidth: 220,
          background: "var(--card-bg)",
          border: "1px solid var(--ui-border-subtle)",
          borderRadius: 10,
          boxShadow: "var(--ui-shadow-lg)",
          padding: 6,
          display: "grid",
          gap: 4,
        }}
      >
        <button
          type="button"
          className="menu-item"
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "none",
            background: "transparent",
            textAlign: "left",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Load past WIP
        </button>
      </div>
    ),
  },
  {
    id: "dialog-color-popover",
    category: "Modals / Dialogs / Popovers",
    name: "Floating Color Picker Popover",
    kind: "Ad Hoc",
    sourceFile: "components/pattern-editor/canvas/CanvasWithExportRef.tsx",
    sourceComponent: "CanvasWithExportRef",
    sourceLine: 1002,
    traits: ["fixed portal popover", "radius: 12", "surface-elevated background", "palette grid"],
    preview: (
      <div
        style={{
          background: "var(--surface-elevated)",
          borderRadius: 12,
          padding: 8,
          boxShadow: "0 8px 18px var(--ui-border)",
          border: "1px solid var(--ui-border-subtle)",
          display: "grid",
          gap: 6,
          width: 220,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
          {["#d62b5b", "#f27842", "#ffd24d", "#4caf50"].map((hex) => (
            <span key={hex} style={{ width: 26, height: 26, borderRadius: 6, background: hex, border: "1px solid rgba(0,0,0,0.18)" }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "card-app-card",
    category: "Cards / Panels / Containers",
    name: "Base Card Wrapper",
    kind: "Reusable",
    sourceFile: "app/globals.css",
    sourceComponent: "Global Styles (.app-card)",
    sourceLine: 347,
    traits: ["className: app-card", "hover z-index behavior", "shadow transition"],
    preview: (
      <div className="app-card" style={{ ...panelStyle, boxShadow: "var(--ui-shadow-md)", display: "grid", gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700 }}>Card Header</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Shared container used across sidebar cards.</div>
      </div>
    ),
  },
  {
    id: "panel-soft",
    category: "Cards / Panels / Containers",
    name: "Soft Utility Panel",
    kind: "Ad Hoc",
    sourceFile: "components/pattern-editor/sections/UsedColorsSection.tsx",
    sourceComponent: "UsedColorsSection",
    sourceLine: 81,
    traits: ["padding: 10px 12px", "radius: 10", "ui-surface-soft background", "subtle border"],
    preview: (
      <div
        style={{
          display: "grid",
          gap: 10,
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid var(--ui-border-subtle)",
          background: "var(--ui-surface-soft)",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700 }}>Panel Title</div>
        <div style={{ fontSize: 11, opacity: 0.7 }}>Panel helper content</div>
      </div>
    ),
  },
  {
    id: "badge-dmc-pill",
    category: "Badges / Tags / Chips",
    name: "DMC Code Pill",
    kind: "Ad Hoc",
    sourceFile: "components/pattern-editor/sections/UsedColorsSection.tsx",
    sourceComponent: "UsedColorsSection",
    sourceLine: 1464,
    traits: ["radius: 999", "monospace code chip", "muted background", "font-size: 9"],
    preview: (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1px 5px",
          borderRadius: 999,
          background: "var(--muted-bg)",
          color: "var(--foreground)",
          fontSize: 9,
          fontWeight: 600,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
          letterSpacing: 0.02,
          whiteSpace: "nowrap",
        }}
      >
        DMC-310
      </span>
    ),
  },
  {
    id: "badge-stitch-count",
    category: "Badges / Tags / Chips",
    name: "Stitch Count Dot Badge",
    kind: "Ad Hoc",
    sourceFile: "components/pattern-editor/ui/Palette.tsx",
    sourceComponent: "Palette",
    sourceLine: 435,
    traits: ["absolute badge", "radius: 999", "font-size: 7", "white background"],
    preview: (
      <div style={{ position: "relative", width: 30, height: 30, borderRadius: 8, background: "#d62b5b" }}>
        <span
          style={{
            position: "absolute",
            bottom: 1,
            left: 1,
            minWidth: 10,
            height: 10,
            padding: "0 2px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.94)",
            color: "rgba(15,23,42,0.9)",
            fontSize: 7,
            fontWeight: 700,
            display: "grid",
            placeItems: "center",
            lineHeight: 1,
          }}
        >
          9
        </span>
      </div>
    ),
  },
  {
    id: "nav-menu-tab",
    category: "Nav Items / Tabs",
    name: "Segmented Tab Button",
    kind: "Reusable",
    sourceFile: "components/pattern-editor/cards/GridSizeCard.tsx",
    sourceComponent: "GridSizeCard",
    sourceLine: 151,
    traits: ["className: menu-tab-button", "role=tab", "active via data-active", "11px semibold"],
    preview: (
      <div
        role="tablist"
        aria-label="Sample tabs"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          alignItems: "center",
          gap: 4,
          width: 220,
          padding: 2,
          borderRadius: 10,
          border: "1px solid var(--ui-border-subtle)",
          background: "var(--ui-surface-soft)",
        }}
      >
        <button
          type="button"
          role="tab"
          className="menu-tab-button"
          data-active="true"
          style={{
            padding: "6px 10px",
            width: "100%",
            borderRadius: 8,
            border: "none",
            color: "var(--foreground)",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          Stitches
        </button>
        <button
          type="button"
          role="tab"
          className="menu-tab-button"
          style={{
            padding: "6px 10px",
            width: "100%",
            borderRadius: 8,
            border: "none",
            color: "var(--foreground)",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          Inches
        </button>
      </div>
    ),
  },
  {
    id: "toolbar-button",
    category: "Toolbar Controls",
    name: "Canvas Toolbar Button",
    kind: "Reusable",
    sourceFile: "components/pattern-editor/canvas/CanvasWithExportRef.tsx",
    sourceComponent: "CanvasWithExportRef",
    sourceLine: 948,
    traits: ["className: toolbar-button", "icon + label stack", "min-width: 44", "radius: 10"],
    preview: (
      <div className="canvas-toolbar" style={{ display: "inline-flex", padding: 6, borderRadius: 12, background: "var(--canvas-toolbar-bg)" }}>
        <button
          type="button"
          className="toolbar-button"
          style={{
            padding: "4px 6px",
            borderRadius: 10,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            minWidth: 44,
          }}
        >
          <span className="toolbar-icon" aria-hidden="true">
            <img
              src={assetPath("/icons/brush.svg")}
              alt=""
              aria-hidden="true"
              width={18}
              height={18}
              style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
            />
          </span>
          <span className="toolbar-label" style={{ fontSize: 10, lineHeight: 1 }}>Brush</span>
        </button>
      </div>
    ),
  },
  {
    id: "toolbar-zoom-action",
    category: "Toolbar Controls",
    name: "Zoom Action Button",
    kind: "Reusable",
    sourceFile: "components/pattern-editor/canvas/CanvasWithExportRef.tsx",
    sourceComponent: "CanvasWithExportRef",
    sourceLine: 2175,
    traits: ["className: zoom-action-button", "30px height", "radius: 10", "transparent base"],
    preview: (
      <button
        type="button"
        className="zoom-action-button"
        style={{
          minWidth: 50,
          height: 30,
          padding: "0 8px",
          borderRadius: 10,
          border: "none",
          background: "transparent",
          color: "var(--foreground)",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        100%
      </button>
    ),
  },
  {
    id: "type-scale",
    category: "Typography",
    name: "Common Type Scale in UI",
    kind: "Reusable",
    sourceFile: "components/pattern-editor/*",
    sourceComponent: "Multiple components",
    sourceLine: 0,
    traits: ["micro labels: 9-10", "controls: 11-12", "body/meta: 12-13", "card headers: 15", "weights: 400/600/700"],
    preview: (
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>15 / 700 Card Section Header</div>
        <div style={{ fontSize: 12, fontWeight: 600 }}>12 / 600 Control Label</div>
        <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8 }}>11 / 600 Metadata</div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.04, textTransform: "uppercase", opacity: 0.55 }}>
          10 / 700 UPPERCASE UTILITY LABEL
        </div>
      </div>
    ),
  },
];

const compositePatterns: CompositeAuditPattern[] = [
  {
    id: "composite-canvas-palette-popover",
    group: "Palette Popups / Pickers",
    name: "Canvas Color Palette Popover",
    kind: "Ad Hoc",
    sourceFile: "components/pattern-editor/canvas/CanvasWithExportRef.tsx",
    sourceComponent: "CanvasWithExportRef",
    sourceLine: 993,
    traits: ["createPortal overlay", "fixed anchor position", "tab + search + swatch grid", "radius: 12"],
    preview: (
      <div
        style={{
          display: "grid",
          gap: 8,
          width: 260,
          padding: 8,
          borderRadius: 12,
          border: "1px solid var(--ui-border-subtle)",
          background: "var(--surface-elevated)",
          boxShadow: "0 8px 18px var(--ui-border)",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 4, padding: 2, borderRadius: 10, border: "1px solid var(--ui-border-subtle)", background: "var(--ui-surface-soft)" }}>
          {["All", "Used", "Custom"].map((label, idx) => (
            <button
              key={`palette-tab-${label}`}
              type="button"
              className="menu-tab-button"
              data-active={idx === 0 ? "true" : undefined}
              style={{ padding: "6px 8px", borderRadius: 8, border: "none", fontSize: 11, fontWeight: 600 }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
          {["#d62b5b", "#f27842", "#ffd24d", "#4caf50", "#2d7cf6", "#7a3fd4"].map((hex) => (
            <span key={`canvas-swatch-${hex}`} style={{ width: 24, height: 24, borderRadius: 6, background: hex, border: "1px solid rgba(0,0,0,0.18)" }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "composite-custom-palette-popover",
    group: "Palette Popups / Pickers",
    name: "Custom Palette Picker Popover",
    kind: "Ad Hoc",
    sourceFile: "components/pattern-editor/sections/CustomPalettesSection.tsx",
    sourceComponent: "CustomPalettesSection",
    sourceLine: 651,
    traits: ["createPortal popover", "search + source tabs", "eyedropper action", "palette assignment flow"],
    preview: (
      <div
        style={{
          display: "grid",
          gap: 8,
          width: 300,
          padding: 10,
          borderRadius: 12,
          border: "1px solid var(--ui-border-subtle)",
          background: "var(--card-bg)",
          boxShadow: "0 14px 32px rgba(15,23,42,0.16)",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8 }}>
          <input
            value="310"
            readOnly
            style={{
              borderRadius: 8,
              border: "1px solid transparent",
              background: "var(--muted-bg)",
              padding: "6px 8px",
              fontSize: 12,
              color: "var(--foreground)",
            }}
          />
          <button
            type="button"
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              border: "1px solid var(--panel-border)",
              background: "var(--card-bg)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <img src={assetPath("/icons/eyedropper.svg")} alt="" aria-hidden="true" width={14} height={14} style={{ display: "block", filter: "var(--icon-on-bg-filter)" }} />
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6 }}>
          {["#111111", "#3f3f3f", "#6b7280", "#ef4444", "#f59e0b", "#84cc16", "#06b6d4", "#8b5cf6"].map((hex) => (
            <span key={`custom-swatch-${hex}`} style={{ width: 24, height: 24, borderRadius: 6, background: hex, border: "1px solid rgba(0,0,0,0.18)" }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "composite-confirm-dialog",
    group: "Confirmation / Decision Surfaces",
    name: "Confirm Dialog Shell",
    kind: "Reusable",
    sourceFile: "components/pattern-editor/dialogs/ConfirmDialog.tsx",
    sourceComponent: "ConfirmDialog",
    sourceLine: 18,
    traits: ["centered dialog + dimmer", "cancel/confirm actions", "title + explanatory message"],
    preview: (
      <div style={{ minHeight: 160, borderRadius: 10, border: "1px solid var(--ui-border-subtle)", background: "rgba(0, 0, 0, 0.45)", position: "relative" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "min(320px, 90%)", padding: 16, borderRadius: 14, background: "var(--card-bg)", boxShadow: "0 16px 40px var(--ui-border-strong)", display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Clear Drawing?</div>
          <div style={{ fontSize: 12.5, opacity: 0.75 }}>This will clear all painted cells. This action can be undone.</div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" style={{ padding: "6px 10px", borderRadius: 10, border: "none", background: "var(--muted-bg)", fontSize: 12, fontWeight: 600 }}>Cancel</button>
            <button type="button" style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid var(--accent-strong)", background: "var(--accent-wash)", color: "var(--accent-strong)", fontSize: 12, fontWeight: 700 }}>Clear</button>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "composite-draft-picker-dialog",
    group: "Confirmation / Decision Surfaces",
    name: "Load Saved WIP Dialog",
    kind: "Reusable",
    sourceFile: "components/pattern-editor/dialogs/DraftPickerDialog.tsx",
    sourceComponent: "DraftPickerDialog",
    sourceLine: 32,
    traits: ["portal modal", "scrolling list of saved items", "thumbnail + metadata + delete action"],
    preview: (
      <div style={{ display: "grid", gap: 8, maxWidth: 340 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Load a saved WIP</div>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--panel-border)", background: "var(--muted-bg)" }}>
            <div style={{ width: 42, height: 42, borderRadius: 8, border: "1px solid var(--panel-border)", background: "var(--card-bg)" }} />
            <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
              <span style={{ fontWeight: 600, fontSize: 12 }}>Floral Sampler</span>
              <span style={{ fontSize: 11, opacity: 0.7 }}>Updated Apr 1, 2026</span>
            </div>
            <button type="button" style={{ marginLeft: "auto", width: 32, height: 32, borderRadius: 10, border: "1px solid var(--panel-border)", background: "var(--card-bg)", fontSize: 10, fontWeight: 700 }}>Del</button>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "composite-version-preview-toast",
    group: "Status / Informative Banners",
    name: "Version Preview Restore Toast",
    kind: "Reusable",
    sourceFile: "components/pattern-editor/dialogs/VersionPreviewToast.tsx",
    sourceComponent: "VersionPreviewToast",
    sourceLine: 23,
    traits: ["role=status", "floating bottom toast", "restore/cancel decision actions"],
    preview: (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 10, borderRadius: 14, padding: "10px 14px", border: "1px solid var(--panel-border)", background: "var(--card-bg)", boxShadow: "0 12px 32px var(--ui-border-strong)" }}>
        <span style={{ fontSize: 12.5, opacity: 0.8 }}>Viewing version from Mar 30, 2026</span>
        <button type="button" style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid var(--accent-strong)", background: "var(--accent-wash)", color: "var(--accent-strong)", fontSize: 12, fontWeight: 700 }}>Restore</button>
        <button type="button" style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid var(--panel-border)", background: "var(--card-bg)", fontSize: 12, fontWeight: 600 }}>Cancel</button>
      </div>
    ),
  },
  {
    id: "composite-wip-status-banner",
    group: "Status / Informative Banners",
    name: "Top-Center WIP Status Banner",
    kind: "Ad Hoc",
    sourceFile: "components/pattern-editor/PatternEditor.tsx",
    sourceComponent: "PatternEditor",
    sourceLine: 3379,
    traits: ["createPortal status message", "role=status aria-live=polite", "pill radius 999", "tone-based text color"],
    preview: (
      <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", maxWidth: 560, padding: "8px 14px", borderRadius: 999, border: "1px solid var(--ui-border-subtle)", background: "var(--card-bg)", boxShadow: "var(--ui-shadow-lg)", color: "var(--accent-strong)", fontSize: 12, fontWeight: 600, textAlign: "center" }}>
        Saved as &quot;Spring Garden&quot;.
      </div>
    ),
  },
  {
    id: "composite-signed-out-banner",
    group: "Status / Informative Banners",
    name: "Signed-Out Sticky Info Banner",
    kind: "Ad Hoc",
    sourceFile: "components/pattern-editor/PatternEditor.tsx",
    sourceComponent: "PatternEditor",
    sourceLine: 1686,
    traits: ["sticky top guidance banner", "single-line truncation", "inline CTA button"],
    preview: (
      <div style={{ display: "flex", alignItems: "center", gap: 8, height: 36, padding: "4px 10px", background: "var(--accent-wash)", border: "1px solid var(--ui-border-subtle)", borderRadius: 10, fontSize: 12, fontWeight: 600 }}>
        <span style={{ flex: "1 1 auto", minWidth: 0, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          You&apos;re signed out. Sign in to save edits and access WIPs later.
        </span>
        <button type="button" style={{ padding: "3px 8px", borderRadius: 8, border: "1px solid var(--panel-border)", background: "var(--card-bg)", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
          Sign in
        </button>
      </div>
    ),
  },
  {
    id: "composite-empty-state-palette",
    group: "Status / Informative Banners",
    name: "Custom Palette Empty State Panel",
    kind: "Ad Hoc",
    sourceFile: "components/pattern-editor/sections/CustomPalettesSection.tsx",
    sourceComponent: "CustomPalettesSection",
    sourceLine: 376,
    traits: ["illustrated empty-state block", "headline + helper text", "inline primary action"],
    preview: (
      <div style={{ display: "grid", placeItems: "center", gap: 6, padding: "16px 12px", borderRadius: 10, background: "var(--ui-surface-faint)", textAlign: "center" }}>
        <img src={assetPath("/icons/palette.svg")} alt="" aria-hidden="true" width={18} height={18} style={{ display: "block", filter: "var(--icon-on-bg-filter)", opacity: 0.8 }} />
        <div style={{ fontSize: 13, fontWeight: 700 }}>No palettes yet</div>
        <div style={{ fontSize: 12, opacity: 0.72 }}>Create your first palette to begin</div>
        <button type="button" style={{ marginTop: 4, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--ui-border-subtle)", background: "var(--accent)", color: "#ffffff", fontSize: 12, fontWeight: 600 }}>
          + New Palette
        </button>
      </div>
    ),
  },
];

const compositeGroupOrder: CompositeAuditPattern["group"][] = [
  "Palette Popups / Pickers",
  "Confirmation / Decision Surfaces",
  "Status / Informative Banners",
];

const categoryOrder: CoverageCategory[] = [
  "Buttons",
  "Icon Buttons",
  "Inputs",
  "Textareas",
  "Selects / Dropdowns",
  "Checkboxes / Toggles",
  "Modals / Dialogs / Popovers",
  "Cards / Panels / Containers",
  "Badges / Tags / Chips",
  "Nav Items / Tabs",
  "Toolbar Controls",
  "Typography",
] as const;

function FrequencyTable({
  title,
  rows,
  emptyMessage,
}: {
  title: string;
  rows: FrequencyRow[];
  emptyMessage: string;
}) {
  return (
    <div style={{ ...panelStyle, display: "grid", gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 12, opacity: 0.7 }}>{emptyMessage}</div>
      ) : (
        <div style={{ display: "grid", gap: 6 }}>
          {rows.map((row) => (
            <div
              key={`${title}-${row.value}`}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                gap: 10,
                alignItems: "start",
                border: "1px solid var(--ui-border-subtle)",
                borderRadius: 8,
                padding: "6px 8px",
                background: "var(--ui-surface-faint)",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-code), ui-monospace, monospace", fontSize: 11, overflowWrap: "anywhere" }}>
                  {row.value}
                </div>
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>
                  Sources: {row.sampleSources.join(", ")}
                </div>
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 999,
                  padding: "2px 8px",
                  background: "var(--muted-bg)",
                  whiteSpace: "nowrap",
                }}
              >
                {row.count}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ComponentTypeCoverageSection({ rows }: { rows: ComponentTypeCoverageRow[] }) {
  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>Component Type Coverage</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 10 }}>
        {rows.map((row) => (
          <div key={row.category} style={{ ...panelStyle, display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{row.category}</div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 999,
                  padding: "2px 8px",
                  background: row.totalMatches > 0 ? "var(--accent-soft)" : "var(--muted-bg)",
                  whiteSpace: "nowrap",
                }}
              >
                {row.totalMatches} matches
              </span>
            </div>
            <div style={{ fontSize: 11, opacity: 0.75 }}>
              {row.sourceCount} source file{row.sourceCount === 1 ? "" : "s"}
            </div>
            {row.sourceCount === 0 ? (
              <div style={{ fontSize: 11, opacity: 0.7 }}>No matches detected by current best-effort patterns.</div>
            ) : (
              <div style={{ display: "grid", gap: 6 }}>
                {row.sources.slice(0, 5).map((source) => (
                  <div
                    key={`${row.category}-${source.sourceFile}`}
                    style={{
                      border: "1px solid var(--ui-border-subtle)",
                      borderRadius: 8,
                      padding: "6px 8px",
                      background: "var(--ui-surface-faint)",
                      display: "grid",
                      gap: 2,
                    }}
                  >
                    <div style={{ fontSize: 11, fontFamily: "var(--font-code), ui-monospace, monospace", overflowWrap: "anywhere" }}>
                      {source.sourceFile}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.72 }}>
                      {source.count} match{source.count === 1 ? "" : "es"} at lines {source.lineSamples.join(", ")}
                    </div>
                  </div>
                ))}
                {row.sources.length > 5 ? (
                  <div style={{ fontSize: 10, opacity: 0.65 }}>
                    +{row.sources.length - 5} more file{row.sources.length - 5 === 1 ? "" : "s"}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryCompletenessSection({
  rows,
  curatedCounts,
}: {
  rows: ComponentTypeCoverageRow[];
  curatedCounts: Record<CoverageCategory, number>;
}) {
  const byCategory = new Map(rows.map((row) => [row.category, row] as const));
  return (
    <section style={{ ...panelStyle, display: "grid", gap: 10 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>Inventory Completeness Matrix</h2>
      <div style={{ fontSize: 12, opacity: 0.8 }}>
        Cross-check of curated visual examples vs auto-detected source matches for every component type.
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {categoryOrder.map((category) => {
          const row = byCategory.get(category);
          const matchCount = row?.totalMatches ?? 0;
          const sourceCount = row?.sourceCount ?? 0;
          const curatedCount = curatedCounts[category] ?? 0;
          return (
            <div
              key={`matrix-${category}`}
              style={{
                border: "1px solid var(--ui-border-subtle)",
                borderRadius: 10,
                padding: "8px 10px",
                background: "var(--ui-surface-faint)",
                display: "grid",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{category}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 999,
                      padding: "2px 8px",
                      background: "var(--muted-bg)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {curatedCount} curated
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 999,
                      padding: "2px 8px",
                      background: matchCount > 0 ? "var(--accent-soft)" : "var(--muted-bg)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {matchCount} detected
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 999,
                      padding: "2px 8px",
                      background: "var(--muted-bg)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sourceCount} files
                  </span>
                </div>
              </div>
              {row && row.sources.length > 0 ? (
                <div style={{ fontSize: 10, opacity: 0.76 }}>
                  Top sources:{" "}
                  {row.sources
                    .slice(0, 3)
                    .map((source) => `${source.sourceFile}:${source.lineSamples[0] ?? 1}`)
                    .join(" • ")}
                </div>
              ) : (
                <div style={{ fontSize: 10, opacity: 0.68 }}>No detected source matches yet for this category.</div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CompositeCoverageSection({ rows }: { rows: CompositePatternCoverageRow[] }) {
  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>Composite Pattern Coverage</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 10 }}>
        {rows.map((row) => (
          <div key={row.pattern} style={{ ...panelStyle, display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{row.pattern}</div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 999,
                  padding: "2px 8px",
                  background: row.totalMatches > 0 ? "var(--accent-soft)" : "var(--muted-bg)",
                  whiteSpace: "nowrap",
                }}
              >
                {row.totalMatches} matches
              </span>
            </div>
            <div style={{ fontSize: 11, opacity: 0.75 }}>
              {row.sourceCount} source file{row.sourceCount === 1 ? "" : "s"}
            </div>
            {row.sources.length ? (
              <div style={{ display: "grid", gap: 6 }}>
                {row.sources.slice(0, 5).map((source) => (
                  <div
                    key={`${row.pattern}-${source.sourceFile}`}
                    style={{
                      border: "1px solid var(--ui-border-subtle)",
                      borderRadius: 8,
                      padding: "6px 8px",
                      background: "var(--ui-surface-faint)",
                      display: "grid",
                      gap: 2,
                    }}
                  >
                    <div style={{ fontSize: 11, fontFamily: "var(--font-code), ui-monospace, monospace", overflowWrap: "anywhere" }}>
                      {source.sourceFile}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.72 }}>
                      {source.count} match{source.count === 1 ? "" : "es"} at lines {source.lineSamples.join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 11, opacity: 0.7 }}>No matches detected by current best-effort patterns.</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function AccentActionCoverageCard({
  total,
  sources,
}: {
  total: number;
  sources: SourceOccurrenceRow[];
}) {
  return (
    <div style={{ ...panelStyle, display: "grid", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Accent Primary Action Coverage</div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 999,
            padding: "2px 8px",
            background: "var(--accent-soft)",
          }}
        >
          {total} matches
        </span>
      </div>
      <div style={{ fontSize: 11, opacity: 0.8 }}>
        Detected `background: var(--accent)` and `background: var(--accent-strong)` in component code.
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {sources.slice(0, 10).map((row) => (
          <div
            key={row.sourceFile}
            style={{
              border: "1px solid var(--ui-border-subtle)",
              borderRadius: 8,
              padding: "6px 8px",
              background: "var(--ui-surface-faint)",
              display: "grid",
              gap: 2,
            }}
          >
            <div style={{ fontSize: 11, fontFamily: "var(--font-code), ui-monospace, monospace", overflowWrap: "anywhere" }}>
              {row.sourceFile}
            </div>
            <div style={{ fontSize: 10, opacity: 0.72 }}>
              {row.count} match{row.count === 1 ? "" : "es"} at lines {row.lineSamples.join(", ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompositePatternCard({ pattern }: { pattern: CompositeAuditPattern }) {
  return (
    <article style={{ ...panelStyle, display: "grid", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{pattern.name}</div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 999,
            padding: "2px 8px",
            background: pattern.kind === "Reusable" ? "var(--accent-soft)" : "var(--muted-bg)",
            color: "var(--foreground)",
          }}
        >
          {pattern.kind}
        </span>
      </div>
      <div style={{ border: "1px solid var(--ui-border-subtle)", borderRadius: 10, padding: 12, background: "var(--ui-surface-faint)" }}>
        {pattern.preview}
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ fontSize: 11 }}>
          <strong>Source:</strong> <code>{pattern.sourceFile}:{pattern.sourceLine}</code>
        </div>
        <div style={{ fontSize: 11 }}>
          <strong>Component:</strong> <code>{pattern.sourceComponent}</code>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {pattern.traits.map((trait) => (
          <span
            key={`${pattern.id}-${trait}`}
            style={{
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 999,
              border: "1px solid var(--ui-border-subtle)",
              background: "var(--card-bg)",
            }}
          >
            {trait}
          </span>
        ))}
      </div>
    </article>
  );
}

function PatternCard({ pattern }: { pattern: AuditPattern }) {
  return (
    <article style={{ ...panelStyle, display: "grid", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{pattern.name}</div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 999,
            padding: "2px 8px",
            background: pattern.kind === "Reusable" ? "var(--accent-soft)" : "var(--muted-bg)",
            color: "var(--foreground)",
          }}
        >
          {pattern.kind}
        </span>
      </div>

      <div style={{ border: "1px solid var(--ui-border-subtle)", borderRadius: 10, padding: 12, background: "var(--ui-surface-faint)" }}>
        {pattern.preview}
      </div>

      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ fontSize: 11 }}>
          <strong>Source:</strong> <code>{pattern.sourceFile}:{pattern.sourceLine}</code>
        </div>
        <div style={{ fontSize: 11 }}>
          <strong>Component:</strong> <code>{pattern.sourceComponent}</code>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {pattern.traits.map((trait) => (
          <span
            key={`${pattern.id}-${trait}`}
            style={{
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 999,
              border: "1px solid var(--ui-border-subtle)",
              background: "var(--card-bg)",
            }}
          >
            {trait}
          </span>
        ))}
      </div>
    </article>
  );
}

export default function DesignAuditPage() {
  const stats = getDesignAuditStats();
  const coverageByCategory = new Map(stats.componentTypeCoverage.map((row) => [row.category, row] as const));
  const curatedCounts = categoryOrder.reduce((acc, category) => {
    acc[category] = patterns.filter((pattern) => pattern.category === category).length;
    return acc;
  }, {} as Record<CoverageCategory, number>);

  return (
    <main
      style={{
        height: "calc(100vh - var(--app-header-height, 52px))",
        minHeight: "calc(100vh - var(--app-header-height, 52px))",
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        boxSizing: "border-box",
        padding: "16px 18px 28px",
        background: "var(--muted-bg)",
        color: "var(--foreground)",
      }}
    >
      <div style={{ display: "grid", gap: 14, maxWidth: 1360, margin: "0 auto" }}>
        <section style={{ ...panelStyle, display: "grid", gap: 8 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>UI Inventory Audit</h1>
          <p style={{ fontSize: 12, opacity: 0.82, maxWidth: 900 }}>
            Internal inventory page generated from the current codebase. This page catalogs existing patterns only and does not
            modify production UI behavior. Scope: {stats.analyzedFileCount} files in app/components UI code.
          </p>
          <div style={{ fontSize: 11, opacity: 0.72, fontFamily: "var(--font-code), ui-monospace, monospace" }}>
            Route: /design-audit
          </div>
        </section>

        <ComponentTypeCoverageSection rows={stats.componentTypeCoverage} />
        <CategoryCompletenessSection rows={stats.componentTypeCoverage} curatedCounts={curatedCounts} />
        <CompositeCoverageSection rows={stats.compositePatternCoverage} />

        <section style={{ display: "grid", gap: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Repeatable Composite Components Inventory</h2>
          {compositeGroupOrder.map((group) => {
            const groupPatterns = compositePatterns.filter((pattern) => pattern.group === group);
            return (
              <div key={group} style={{ display: "grid", gap: 8 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>{group}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 10 }}>
                  {groupPatterns.map((pattern) => (
                    <CompositePatternCard key={pattern.id} pattern={pattern} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <section style={{ display: "grid", gap: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Most Common Style Tokens</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
            <FrequencyTable
              title="Theme Color Tokens (var(--...))"
              rows={stats.themeColorTokens}
              emptyMessage="No theme tokens found in scanned files."
            />
            <FrequencyTable
              title="Literal Color Values"
              rows={stats.literalColorValues}
              emptyMessage="No literal colors found in scanned files."
            />
            <FrequencyTable
              title="Border Radius Values"
              rows={stats.borderRadiusValues}
              emptyMessage="No border radius values found in scanned files."
            />
            <FrequencyTable
              title="Spacing Values"
              rows={stats.spacingValues}
              emptyMessage="No spacing values found in scanned files."
            />
            <FrequencyTable
              title="Shadow Values"
              rows={stats.shadowValues}
              emptyMessage="No shadow values found in scanned files."
            />
            <FrequencyTable
              title="Font Sizes"
              rows={stats.fontSizeValues}
              emptyMessage="No font size values found in scanned files."
            />
            <FrequencyTable
              title="Font Weights"
              rows={stats.fontWeightValues}
              emptyMessage="No font weights found in scanned files."
            />
            <FrequencyTable
              title="Button-Like Class Patterns"
              rows={stats.buttonLikeClassPatterns}
              emptyMessage="No button-like class patterns found in scanned files."
            />
            <AccentActionCoverageCard
              total={stats.accentPrimaryButtonTotal}
              sources={stats.accentPrimaryButtonSources}
            />
            <FrequencyTable
              title="Tailwind Color Classes"
              rows={stats.tailwindColorClasses}
              emptyMessage="No recurring Tailwind color classes detected in className strings."
            />
          </div>
        </section>

        <section style={{ display: "grid", gap: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Pattern Inventory by Category</h2>
          {categoryOrder.map((category) => {
            const categoryPatterns = patterns.filter((pattern) => pattern.category === category);
            const coverage = coverageByCategory.get(category);
            return (
              <div key={category} style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700 }}>{category}</h3>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 999,
                        padding: "2px 8px",
                        background: "var(--muted-bg)",
                      }}
                    >
                      {categoryPatterns.length} curated examples
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 999,
                        padding: "2px 8px",
                        background: (coverage?.totalMatches ?? 0) > 0 ? "var(--accent-soft)" : "var(--muted-bg)",
                      }}
                    >
                      {coverage?.totalMatches ?? 0} detected matches
                    </span>
                  </div>
                </div>
                {categoryPatterns.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 10 }}>
                    {categoryPatterns.map((pattern) => (
                      <PatternCard key={pattern.id} pattern={pattern} />
                    ))}
                  </div>
                ) : (
                  <div style={{ ...panelStyle, fontSize: 12, opacity: 0.8 }}>
                    No curated live examples captured yet for this category. Review detected source files below.
                  </div>
                )}
                {coverage && coverage.sources.length > 0 ? (
                  <div style={{ ...panelStyle, display: "grid", gap: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>Additional Source Matches</div>
                    <div style={{ display: "grid", gap: 4 }}>
                      {coverage.sources.slice(0, 8).map((source) => (
                        <div
                          key={`${category}-source-${source.sourceFile}`}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(0, 1fr) auto",
                            alignItems: "center",
                            gap: 8,
                            border: "1px solid var(--ui-border-subtle)",
                            borderRadius: 8,
                            padding: "6px 8px",
                            background: "var(--ui-surface-faint)",
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontFamily: "var(--font-code), ui-monospace, monospace", overflowWrap: "anywhere" }}>
                              {source.sourceFile}
                            </div>
                            <div style={{ fontSize: 10, opacity: 0.7 }}>
                              lines {source.lineSamples.join(", ")}
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              borderRadius: 999,
                              padding: "2px 8px",
                              background: "var(--muted-bg)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {source.count}x
                          </div>
                        </div>
                      ))}
                      {coverage.sources.length > 8 ? (
                        <div style={{ fontSize: 10, opacity: 0.65 }}>
                          +{coverage.sources.length - 8} more file{coverage.sources.length - 8 === 1 ? "" : "s"}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </section>

        <section style={{ ...panelStyle, display: "grid", gap: 8 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Audit Scope Notes</h2>
          <div style={{ fontSize: 12, opacity: 0.82, lineHeight: 1.45 }}>
            Best-effort extraction was applied to prioritize visible UI primitives and frequently reused controls. Large files
            with extensive inline styling (for example, the color-management and canvas toolbars) are represented with source-backed
            examples rather than every individual instance.
          </div>
          <div style={{ fontSize: 11, opacity: 0.72 }}>
            For written summary and standardization-first candidates, see <code>app/design-audit/README.md</code>.
          </div>
        </section>
      </div>
    </main>
  );
}
