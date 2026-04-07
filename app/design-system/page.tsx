/* eslint-disable @next/next/no-img-element */
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { assetPath } from "../../lib/assetPath";
import { NumberInputDemo } from "./NumberInputDemo";
import { ModalDemo } from "./ModalDemo";
import { SegmentedControlsDemo } from "./SegmentedControlsDemo";
import { SliderDemo } from "./SliderDemo";
import { space } from "./spacing";
import { FinalComposedMenuDemo, GhostSelectionMenuDemo, MenuPanelVariantsDemo, SelectionDropdownDemo, StyledDropdownDemo, StyledUpwardDropdownDemo } from "./StyledDropdownMenusDemo";
import { TabGroupDemo } from "./TabGroupDemo";
import { ImagePositionToolbarDemo, ToolbarDemo } from "./ToolbarDemo";
import { VerticalTabGroupDemo } from "./VerticalTabGroupDemo";
import type { DesignTypeToken } from "./typography";
import { typographySpecs } from "./typography";

type SectionRowProps = {
  title: string;
  children: ReactNode;
  first?: boolean;
  className?: string;
};

type SectionBlockProps = {
  title: string;
  children: ReactNode;
  wide?: boolean;
  compact?: boolean;
};

type DesignSystemPageProps = {
  searchParams?:
    | {
        preview?: string | string[];
      }
    | Promise<{
        preview?: string | string[];
      }>;
};

const pageStyle: CSSProperties = {
  height: "calc(100vh - var(--app-header-height, 52px))",
  minHeight: "calc(100vh - var(--app-header-height, 52px))",
  overflowY: "auto",
  overflowX: "hidden",
  WebkitOverflowScrolling: "touch",
  boxSizing: "border-box",
  padding: `${space[12]} ${space[12]} ${space[20]}`,
  background: "var(--surface-neutral-subtle)",
  color: "var(--foreground)",
};

const controlBase: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  padding: `${space[8]} ${space[8]}`,
};

const buttonVariants = [
  { label: "Primary", className: "ds-btn-primary" },
  { label: "Secondary", className: "ds-btn-secondary" },
  { label: "Tertiary", className: "ds-btn-tertiary" },
  { label: "Destructive", className: "ds-btn-destructive" },
  { label: "Ghost", className: "ds-btn-ghost", breakBefore: true },
];

const iconCatalog = [
  { label: "alert.svg", icon: "/icons/alert.svg" },
  { label: "backup.svg", icon: "/icons/backup.svg" },
  { label: "brush.svg", icon: "/icons/brush.svg" },
  { label: "crop.svg", icon: "/icons/crop.svg" },
  { label: "deselect.svg", icon: "/icons/deselect.svg" },
  { label: "download.svg", icon: "/icons/download.svg" },
  { label: "draft_add.svg", icon: "/icons/draft_add.svg" },
  { label: "dropper.svg", icon: "/icons/dropper.svg" },
  { label: "dropper_cursor.svg", icon: "/icons/dropper_cursor.svg" },
  { label: "eye.svg", icon: "/icons/eye.svg" },
  { label: "eye_off.svg", icon: "/icons/eye_off.svg" },
  { label: "eraser.svg", icon: "/icons/eraser.svg" },
  { label: "file.svg", icon: "/icons/file.svg" },
  { label: "flip.svg", icon: "/icons/flip.svg" },
  { label: "gradient.svg", icon: "/icons/gradient.svg" },
  { label: "grid.svg", icon: "/icons/grid.svg" },
  { label: "grid3.svg", icon: "/icons/grid3.svg" },
  { label: "grid_view.svg", icon: "/icons/grid_view.svg" },
  { label: "glyphs.svg", icon: "/icons/glyphs.svg" },
  { label: "heart_empty.svg", icon: "/icons/heart_empty.svg" },
  { label: "heart_fill.svg", icon: "/icons/heart_fill.svg" },
  { label: "lasso.svg", icon: "/icons/lasso.svg" },
  { label: "list.svg", icon: "/icons/list.svg" },
  { label: "merge.svg", icon: "/icons/merge.svg" },
  { label: "moon.svg", icon: "/icons/moon.svg" },
  { label: "paint_big.svg", icon: "/icons/paint_big.svg" },
  { label: "paint_bucket.svg", icon: "/icons/paint_bucket.svg" },
  { label: "palette.svg", icon: "/icons/palette.svg" },
  { label: "pan.svg", icon: "/icons/pan.svg" },
  { label: "photo.svg", icon: "/icons/photo.svg" },
  { label: "redo.svg", icon: "/icons/redo.svg" },
  { label: "ruler.svg", icon: "/icons/ruler.svg" },
  { label: "save.svg", icon: "/icons/save.svg" },
  { label: "settings.svg", icon: "/icons/settings.svg" },
  { label: "sqfoot.svg", icon: "/icons/sqfoot.svg" },
  { label: "swap.svg", icon: "/icons/swap.svg" },
  { label: "text_icon.svg", icon: "/icons/text_icon.svg" },
  { label: "thread.svg", icon: "/icons/thread.svg" },
  { label: "tools.svg", icon: "/icons/tools.svg" },
  { label: "transform.svg", icon: "/icons/transform.svg" },
  { label: "trash.svg", icon: "/icons/trash.svg" },
  { label: "unarchive.svg", icon: "/icons/unarchive.svg" },
  { label: "undo.svg", icon: "/icons/undo.svg" },
  { label: "upload.svg", icon: "/icons/upload.svg" },
] as const;

const typographyPreviewGroups: { title: string; tokens: DesignTypeToken[] }[] = [
  { title: "Headers", tokens: ["h1", "h2", "h3", "h4"] },
  { title: "Body", tokens: ["h5", "p1", "p2", "s"] },
];

type PaletteToken = {
  name: string;
  cssVar: string;
  aliasOf?: string;
};

type PaletteSubgroup = {
  title: string;
  tokens: PaletteToken[];
};

type PaletteGroup = {
  title: string;
  sections: PaletteSubgroup[];
};

type NotificationTone = "info" | "success" | "warning" | "destructive";

const paletteGroups: PaletteGroup[] = [
  {
    title: "Neutrals",
    sections: [
      {
        title: "Neutral scale",
        tokens: [
          { name: "0", cssVar: "--neutral-0" },
          { name: "100", cssVar: "--neutral-100" },
          { name: "200", cssVar: "--neutral-200" },
          { name: "300", cssVar: "--neutral-300" },
          { name: "500", cssVar: "--neutral-500" },
          { name: "700", cssVar: "--neutral-700" },
          { name: "900", cssVar: "--neutral-900" },
        ],
      },
    ],
  },
  {
    title: "Primary",
    sections: [
      {
        title: "Brand primary",
        tokens: [
          { name: "App surface tint", cssVar: "--surface-app" },
          { name: "Primary surface", cssVar: "--surface-brand-subtle" },
          { name: "Primary soft", cssVar: "--brand-primary-soft" },
          { name: "Primary", cssVar: "--brand-primary" },
          { name: "Primary strong", cssVar: "--brand-primary-strong" },
          { name: "Primary deep", cssVar: "--brand-primary-deep" },
        ],
      },
    ],
  },
  {
    title: "Success",
    sections: [
      {
        title: "Status success",
        tokens: [
          { name: "Success soft", cssVar: "--status-success-soft" },
          { name: "Success", cssVar: "--status-success-base" },
          { name: "Success strong", cssVar: "--status-success-strong" },
        ],
      },
    ],
  },
  {
    title: "Warning",
    sections: [
      {
        title: "Status warning",
        tokens: [
          { name: "Warning soft", cssVar: "--status-warning-soft" },
          { name: "Warning", cssVar: "--status-warning-base" },
          { name: "Warning strong", cssVar: "--status-warning-strong" },
        ],
      },
    ],
  },
  {
    title: "Destructive",
    sections: [
      {
        title: "Status destructive",
        tokens: [
          { name: "Destructive soft", cssVar: "--status-destructive-soft" },
          { name: "Destructive", cssVar: "--status-destructive-base" },
          { name: "Destructive strong", cssVar: "--status-destructive-strong" },
          { name: "Destructive deep", cssVar: "--status-destructive-deep" },
        ],
      },
    ],
  },
];

const notificationToneStyles: Record<
  NotificationTone,
  { bg: string; border: string; icon: string; title: string; badge: string; badgeFg: string }
> = {
  info: {
    bg: "var(--surface-app)",
    border: "var(--brand-primary-soft)",
    icon: "var(--brand-primary-deep)",
    title: "var(--brand-primary-deep)",
    badge: "var(--brand-primary-soft)",
    badgeFg: "var(--brand-primary-deep)",
  },
  success: {
    bg: "var(--status-success-soft)",
    border: "var(--status-success-base)",
    icon: "var(--status-success-strong)",
    title: "var(--status-success-strong)",
    badge: "var(--status-success-base)",
    badgeFg: "var(--neutral-0)",
  },
  warning: {
    bg: "var(--status-warning-soft)",
    border: "var(--status-warning-base)",
    icon: "var(--status-warning-strong)",
    title: "var(--status-warning-strong)",
    badge: "var(--status-warning-base)",
    badgeFg: "var(--neutral-900)",
  },
  destructive: {
    bg: "var(--status-destructive-soft)",
    border: "var(--status-destructive-base)",
    icon: "var(--status-destructive-strong)",
    title: "var(--status-destructive-strong)",
    badge: "var(--status-destructive-base)",
    badgeFg: "var(--neutral-0)",
  },
};

const previewThemeVars = {
  light: {
    "--neutral-0": "#ffffff",
    "--neutral-100": "#f5f5f4",
    "--neutral-200": "#e7e5e4",
    "--neutral-300": "#d6d3d1",
    "--neutral-500": "#78716c",
    "--neutral-700": "#44403c",
    "--neutral-900": "#1c1917",
    "--neutral-50": "var(--neutral-100)",
    "--neutral-400": "var(--neutral-500)",
    "--neutral-600": "var(--neutral-700)",
    "--neutral-800": "var(--neutral-900)",
    "--surface-app": "#f8f3fb",
    "--surface-card": "var(--neutral-0)",
    "--surface-brand-subtle": "#e9d5f2",
    "--surface-neutral-subtle": "var(--neutral-100)",
    "--surface-neutral-raised": "var(--neutral-50)",
    "--text-primary": "var(--neutral-900)",
    "--text-secondary": "var(--neutral-700)",
    "--brand-primary": "#c97edf",
    "--brand-primary-soft": "#e1b6ed",
    "--brand-primary-strong": "#a748c5",
    "--brand-primary-deep": "#8b35ab",
    "--control-secondary-bg": "#f1f3f6",
    "--status-success-soft": "#e5f6ea",
    "--status-success-base": "#4ea56b",
    "--status-success-strong": "#2f7a49",
    "--status-warning-soft": "#fff9d8",
    "--status-warning-base": "#f4cd4d",
    "--status-warning-strong": "#d6a61f",
    "--status-destructive-soft": "#fbe2e0",
    "--status-destructive-base": "#db6f67",
    "--status-destructive-strong": "#bf4f48",
    "--status-destructive-deep": "#9f3f39",
    "--background": "var(--surface-app)",
    "--foreground": "var(--text-primary)",
    "--font-primary": "ui-sans-serif, system-ui, sans-serif",
    "--font-secondary": 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    "--text-muted": "var(--text-secondary)",
    "--card-bg": "var(--surface-card)",
    "--muted-bg": "var(--ui-surface-soft)",
    "--accent": "var(--brand-primary)",
    "--accent-soft": "var(--brand-primary-soft)",
    "--accent-strong": "var(--brand-primary-strong)",
    "--accent-deep": "var(--brand-primary-deep)",
    "--accent-wash": "var(--surface-brand-subtle)",
    "--surface-overlay-scrim": "var(--neutral-900)",
    "--surface-pill-bg": "var(--surface-card)",
    "--surface-floating": "var(--surface-neutral-raised)",
    "--surface-elevated": "var(--surface-neutral-raised)",
    "--canvas-surround-bg": "#e2e2e2",
    "--sidebar-bg": "var(--surface-card)",
    "--canvas-toolbar-bg": "var(--surface-floating)",
    "--panel-border": "#d08de3",
    "--ui-border-subtle": "var(--neutral-200)",
    "--ui-border": "var(--neutral-300)",
    "--ui-border-strong": "var(--neutral-400)",
    "--ui-divider": "var(--ui-border-subtle)",
    "--ui-surface-faint": "var(--surface-neutral-subtle)",
    "--ui-surface-soft": "var(--surface-neutral-subtle)",
    "--ui-hover-grey-subtle": "var(--neutral-100)",
    "--ui-hover-soft": "var(--neutral-200)",
    "--ui-tooltip-shadow": "0 6px 16px rgba(15, 23, 42, 0.22)",
    "--tooltip-neutral-bg": "var(--neutral-900)",
    "--tooltip-neutral-text": "var(--neutral-0)",
    "--ui-shadow-sm": "0 1px 2px rgba(0,0,0,0.05)",
    "--ui-shadow-md": "0 4px 8px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)",
    "--ui-shadow-lg": "0 10px 20px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.06)",
    "--toggle-track-border": "rgba(15, 23, 42, 0.2)",
    "--toggle-track-off": "var(--neutral-300)",
    "--toggle-track-on": "var(--brand-primary)",
    "--toggle-knob": "#ffffff",
    "--slider-track-bg": "#d6dee8",
    "--slider-thumb-bg": "var(--surface-card)",
    "--slider-thumb-border": "var(--brand-primary)",
  },
  dark: {
    "--neutral-0": "#ffffff",
    "--neutral-100": "#f5f5f4",
    "--neutral-200": "#e7e5e4",
    "--neutral-300": "#d6d3d1",
    "--neutral-500": "#78716c",
    "--neutral-700": "#44403c",
    "--neutral-900": "#1c1917",
    "--neutral-50": "var(--neutral-100)",
    "--neutral-400": "var(--neutral-500)",
    "--neutral-600": "var(--neutral-700)",
    "--neutral-800": "var(--neutral-900)",
    "--surface-app": "#141117",
    "--surface-card": "var(--neutral-800)",
    "--surface-brand-subtle": "#4d3762",
    "--surface-neutral-subtle": "var(--neutral-600)",
    "--surface-neutral-raised": "var(--neutral-600)",
    "--text-primary": "var(--neutral-0)",
    "--text-secondary": "var(--neutral-200)",
    "--brand-primary": "#9d6fd2",
    "--brand-primary-soft": "#3f3354",
    "--brand-primary-strong": "#b988e8",
    "--brand-primary-deep": "#7b4ab3",
    "--control-secondary-bg": "#f1f3f6",
    "--status-success-soft": "#2b4735",
    "--status-success-base": "#63ba84",
    "--status-success-strong": "#8dd6aa",
    "--status-warning-soft": "#5a4b12",
    "--status-warning-base": "#f0c861",
    "--status-warning-strong": "#ffd98f",
    "--status-destructive-soft": "#5b302c",
    "--status-destructive-base": "#d37b72",
    "--status-destructive-strong": "#e8a199",
    "--status-destructive-deep": "#b9655d",
    "--background": "var(--surface-app)",
    "--foreground": "var(--text-primary)",
    "--font-primary": "ui-sans-serif, system-ui, sans-serif",
    "--font-secondary": 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    "--text-muted": "var(--text-secondary)",
    "--card-bg": "var(--surface-card)",
    "--muted-bg": "var(--ui-surface-soft)",
    "--accent": "var(--brand-primary)",
    "--accent-soft": "var(--brand-primary-soft)",
    "--accent-strong": "var(--brand-primary-strong)",
    "--accent-deep": "var(--brand-primary-deep)",
    "--accent-wash": "var(--surface-brand-subtle)",
    "--surface-overlay-scrim": "var(--neutral-900)",
    "--surface-pill-bg": "var(--surface-card)",
    "--surface-floating": "var(--surface-neutral-raised)",
    "--surface-elevated": "var(--surface-neutral-raised)",
    "--canvas-surround-bg": "#181818",
    "--sidebar-bg": "#252b34",
    "--canvas-toolbar-bg": "#252b34",
    "--panel-border": "#414a58",
    "--ui-border-subtle": "var(--neutral-500)",
    "--ui-border": "var(--neutral-400)",
    "--ui-border-strong": "var(--neutral-300)",
    "--ui-divider": "var(--ui-border-subtle)",
    "--ui-surface-faint": "var(--surface-neutral-subtle)",
    "--ui-surface-soft": "var(--surface-neutral-subtle)",
    "--ui-hover-grey-subtle": "var(--neutral-600)",
    "--ui-hover-soft": "var(--neutral-500)",
    "--ui-tooltip-shadow": "none",
    "--tooltip-neutral-bg": "var(--neutral-0)",
    "--tooltip-neutral-text": "var(--neutral-900)",
    "--ui-shadow-sm": "none",
    "--ui-shadow-md": "none",
    "--ui-shadow-lg": "none",
    "--toggle-track-border": "rgba(245, 247, 251, 0.3)",
    "--toggle-track-off": "#1f252d",
    "--toggle-track-on": "var(--brand-primary)",
    "--toggle-knob": "#f5f7fb",
    "--slider-track-bg": "#4b5565",
    "--slider-thumb-bg": "#d4dbe5",
    "--slider-thumb-border": "var(--brand-primary)",
  },
} as const;

function SectionRow({ title, children, first = false, className = "" }: SectionRowProps) {
  return (
    <section
      className={`ds-section-row ${className}`.trim()}
      style={{
        borderTop: first ? "none" : "1px solid var(--ui-border-subtle)",
      }}
    >
      <div className="ds-section-title ds-p2">{title}</div>
      <div className="ds-section-content">{children}</div>
    </section>
  );
}

function SectionBlock({ title, children, wide = false, compact = false }: SectionBlockProps) {
  return (
    <div className={`ds-section-block${wide ? " ds-section-block-wide" : ""}${compact ? " ds-section-block-compact" : ""}`}>
      <div className="ds-subheader">{title}</div>
      <div className="ds-section-block-body">{children}</div>
    </div>
  );
}

export default async function DesignSystemPage({ searchParams }: DesignSystemPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const previewRaw = resolvedSearchParams?.preview;
  const previewValue = Array.isArray(previewRaw) ? previewRaw[0] : previewRaw;
  const previewTheme = previewValue === "dark" ? "dark" : "light";
  const previewVars = previewThemeVars[previewTheme] as Record<string, string>;

  return (
    <main
      style={{ ...pageStyle, ...(previewVars as CSSProperties) }}
      className="ds-preview-scope"
      data-preview-theme={previewTheme}
    >
      <style>{`
        .ds-h2 {
          font-size: ${typographySpecs.h2.size}px;
          line-height: ${typographySpecs.h2.lineHeight}px;
          font-weight: ${typographySpecs.h2.weight};
        }
        .ds-h3 {
          font-size: ${typographySpecs.h3.size}px;
          line-height: ${typographySpecs.h3.lineHeight}px;
          font-weight: ${typographySpecs.h3.weight};
        }
        .ds-h4 {
          font-size: ${typographySpecs.h4.size}px;
          line-height: ${typographySpecs.h4.lineHeight}px;
          font-weight: ${typographySpecs.h4.weight};
        }
        .ds-h5 {
          font-size: ${typographySpecs.h5.size}px;
          line-height: ${typographySpecs.h5.lineHeight}px;
          font-weight: ${typographySpecs.h5.weight};
        }
        .ds-p1 {
          font-size: ${typographySpecs.p1.size}px;
          line-height: ${typographySpecs.p1.lineHeight}px;
          font-weight: ${typographySpecs.p1.weight};
        }
        .ds-p2 {
          font-size: ${typographySpecs.p2.size}px;
          line-height: ${typographySpecs.p2.lineHeight}px;
          font-weight: ${typographySpecs.p2.weight};
        }
        .ds-s {
          font-size: ${typographySpecs.s.size}px;
          line-height: ${typographySpecs.s.lineHeight}px;
          font-weight: ${typographySpecs.s.weight};
        }
        .ds-h1 {
          font-size: ${typographySpecs.h1.size}px;
          line-height: ${typographySpecs.h1.lineHeight}px;
          font-weight: ${typographySpecs.h1.weight};
        }
        .ds-text-muted {
          opacity: 0.72;
        }
        .ds-text-faint {
          opacity: 0.82;
        }
        .ds-text-mono {
          font-family: var(--font-secondary);
        }

        .ds-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          border-radius: 8px;
          font-weight: ${typographySpecs.p2.weight};
          cursor: pointer;
          transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease;
          filter: none;
          transform: none;
        }
        .ds-preview-scope .ds-btn:hover:not(:disabled):not([data-active="true"]) {
          filter: none !important;
          transform: none;
        }
        .ds-preview-scope .ds-btn[data-hover="true"] {
          filter: none !important;
          transform: none;
        }
        .ds-btn-sm {
          min-height: 24px;
          padding: ${space[8]} ${space[12]};
          font-size: ${typographySpecs.s.size}px;
          line-height: ${typographySpecs.s.lineHeight}px;
        }
        .ds-btn-md {
          min-height: 32px;
          padding: ${space[8]} ${space[16]};
          font-size: ${typographySpecs.p2.size}px;
          line-height: ${typographySpecs.p2.lineHeight}px;
        }
        .ds-btn-lg {
          min-height: 40px;
          padding: ${space[12]} ${space[20]};
          font-size: ${typographySpecs.p1.size}px;
          line-height: ${typographySpecs.p1.lineHeight}px;
        }
        .ds-btn:focus-visible {
          outline: 2px solid var(--brand-primary-strong);
          outline-offset: 1px;
        }
        .ds-btn-primary {
          border: none;
          background: var(--brand-primary);
          color: var(--neutral-0);
        }
        .ds-btn-primary:hover {
          background: var(--brand-primary-strong);
        }
        .ds-btn-primary[data-hover="true"] {
          background: var(--brand-primary-strong);
        }
        .ds-btn-primary[data-active="true"] {
          background: var(--brand-primary-deep);
        }
        .ds-btn-secondary {
          border: 1px solid var(--brand-primary-strong);
          background: transparent;
          color: var(--brand-primary-strong);
        }
        .ds-btn-secondary:hover {
          background: var(--surface-app);
        }
        .ds-btn-secondary[data-hover="true"] {
          background: var(--surface-app);
        }
        .ds-btn-secondary[data-active="true"] {
          background: var(--brand-primary-deep);
          color: var(--neutral-0);
          border-color: var(--brand-primary-deep);
        }
        .ds-btn-tertiary {
          border: 1px solid var(--neutral-500);
          background: transparent;
          color: var(--neutral-700);
        }
        .ds-btn-tertiary:hover {
          background: var(--neutral-100);
          border-color: var(--neutral-700);
        }
        .ds-btn-tertiary[data-hover="true"] {
          background: var(--neutral-100);
          border-color: var(--neutral-700);
        }
        .ds-btn-tertiary[data-active="true"] {
          border-color: transparent;
          background: var(--neutral-200);
        }
        .ds-btn-ghost {
          border: none;
          background: transparent;
          color: var(--neutral-900);
        }
        .ds-btn-ghost:hover {
          background: var(--neutral-100);
        }
        .ds-btn-ghost[data-hover="true"] {
          background: var(--neutral-100);
        }
        .ds-btn-ghost[data-active="true"] {
          background: var(--neutral-200);
        }
        .ds-btn-destructive {
          border: none;
          background: var(--status-destructive-base);
          color: var(--neutral-0);
        }
        .ds-btn-destructive:hover {
          background: var(--status-destructive-strong);
        }
        .ds-btn-destructive[data-hover="true"] {
          background: var(--status-destructive-strong);
        }
        .ds-btn-destructive[data-active="true"] {
          background: var(--status-destructive-deep);
        }
        .ds-demo-hover {
          pointer-events: none;
        }

        .ds-subheader {
          font-size: ${typographySpecs.h3.size}px;
          line-height: ${typographySpecs.h3.lineHeight}px;
          font-weight: ${typographySpecs.h3.weight};
          color: var(--foreground);
          letter-spacing: 0.01em;
          margin-bottom: ${space[12]};
        }

        .ds-system-table {
          border: 1px solid var(--ui-border-subtle);
          border-radius: 12px;
          background: var(--surface-card);
          overflow: hidden;
        }

        .ds-section-row {
          display: grid;
          grid-template-columns: 15% minmax(0, 85%);
          column-gap: ${space[16]};
          padding: ${space[16]} ${space[12]};
          align-items: start;
        }

        .ds-section-title {
          color: var(--text-secondary);
          padding-top: 1px;
        }

        .ds-section-content {
          display: flex;
          flex-wrap: wrap;
          gap: ${space[24]} ${space[24]};
          align-items: flex-start;
          min-width: 0;
        }

        .ds-section-row-inputs .ds-section-content {
          gap: ${space[32]} ${space[32]};
        }

        .ds-section-block {
          display: grid;
          gap: ${space[12]};
          align-content: start;
          flex: 0 1 320px;
          min-width: min(100%, 280px);
          max-width: 560px;
          padding: 4px 0 8px;
        }

        .ds-section-block-wide {
          flex-basis: 100%;
          max-width: 900px;
        }

        .ds-section-block-compact {
          flex: 0 1 260px;
          max-width: 280px;
          min-width: 220px;
        }

        .ds-section-block-body {
          display: grid;
          gap: ${space[12]};
          min-width: 0;
        }

        .ds-lane {
          display: grid;
          gap: 8px;
          width: min(100%, 560px);
        }

        .ds-control-stack {
          display: grid;
          gap: ${space[8]};
          min-width: 0;
        }

        .ds-control-label {
          font-size: ${typographySpecs.p1.size}px;
          line-height: ${typographySpecs.p1.lineHeight}px;
          font-weight: ${typographySpecs.p1.weight};
          color: var(--text-secondary);
        }

        .ds-input-field {
          border-radius: 8px;
          border: 1px solid var(--ui-border-subtle);
          background: var(--surface-card);
          box-shadow: var(--ui-shadow-sm);
          color: var(--foreground);
          font-size: ${typographySpecs.p2.size}px;
          line-height: ${typographySpecs.p2.lineHeight}px;
          font-weight: ${typographySpecs.p2.weight};
          transition: border-color 140ms ease, box-shadow 140ms ease, background-color 140ms ease;
        }

        .ds-input-field::placeholder {
          color: var(--text-secondary);
          opacity: 0.72;
        }

        .ds-search-field-wrap {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: ${space[8]};
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          padding: ${space[8]} ${space[8]};
          border-radius: 8px;
          border: 1px solid var(--ui-border-subtle);
          background: var(--surface-card);
          box-shadow: var(--ui-shadow-sm);
          transition: border-color 140ms ease, box-shadow 140ms ease;
        }

        .ds-number-field-wrap {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: stretch;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          border-radius: 8px;
          border: 1px solid var(--ui-border-subtle);
          background: var(--surface-card);
          box-shadow: var(--ui-shadow-sm);
          transition: border-color 140ms ease, box-shadow 140ms ease;
          overflow: hidden;
        }

        .ds-number-inline-row {
          display: grid;
          grid-template-columns: auto minmax(0, 120px);
          align-items: center;
          gap: ${space[12]};
        }

        .ds-number-field-wrap:hover {
          border-color: var(--brand-primary);
        }

        .ds-number-field-wrap:focus-within {
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 2px var(--surface-brand-subtle);
        }

        .ds-number-input {
          width: 100%;
          min-width: 0;
          padding: ${space[8]} ${space[12]};
          border: none;
          outline: none;
          background: transparent;
          color: var(--foreground);
          font-size: ${typographySpecs.p2.size}px;
          line-height: ${typographySpecs.p2.lineHeight}px;
          font-weight: ${typographySpecs.p2.weight};
          appearance: textfield;
          -moz-appearance: textfield;
        }

        .ds-number-input::-webkit-outer-spin-button,
        .ds-number-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .ds-number-stepper {
          display: grid;
          grid-template-rows: 1fr 1fr;
          width: 28px;
          border-left: 1px solid var(--ui-border-subtle);
        }

        .ds-number-step {
          display: grid;
          place-items: center;
          padding: 0;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: background-color 140ms ease, color 140ms ease;
        }

        .ds-number-step:hover {
          background: var(--surface-app);
          color: var(--foreground);
        }

        .ds-number-step + .ds-number-step {
          border-top: 1px solid var(--ui-border-subtle);
        }

        .ds-search-field-wrap:hover {
          border-color: var(--brand-primary);
        }

        .ds-search-field-wrap:focus-within {
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 2px var(--surface-brand-subtle);
        }

        .ds-search-icon {
          width: 16px;
          height: 16px;
          color: var(--text-secondary);
          flex: 0 0 auto;
        }

        .ds-search-input {
          width: 100%;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          color: var(--foreground);
          font-size: ${typographySpecs.p2.size}px;
          line-height: ${typographySpecs.p2.lineHeight}px;
          font-weight: ${typographySpecs.p2.weight};
        }

        .ds-search-input::placeholder {
          color: var(--text-secondary);
          opacity: 0.72;
        }

        .ds-input-field:hover {
          border-color: var(--brand-primary);
        }

        .ds-input-field:focus {
          outline: none;
        }

        .ds-input-field:focus-visible {
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 2px var(--surface-brand-subtle);
        }

        .ds-lane-wide {
          display: grid;
          gap: ${space[12]};
          width: min(100%, 900px);
        }

        .ds-button-variant-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
          gap: ${space[12]} ${space[16]};
          width: min(100%, 900px);
          align-items: start;
        }

        .ds-button-variant-grid-icons {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .ds-button-variant {
          display: grid;
          gap: ${space[8]};
          align-content: start;
        }
        .ds-inline-cluster {
          display: flex;
          gap: ${space[8]};
          flex-wrap: wrap;
          width: min(100%, 560px);
        }
        .ds-icon-btn {
          padding: 0;
          border-radius: 8px;
          display: grid;
          place-items: center;
        }
        .ds-icon-btn.ds-btn-sm {
          width: 24px;
          height: 24px;
          min-height: 24px;
        }
        .ds-icon-btn.ds-btn-md {
          width: 30px;
          height: 30px;
          min-height: 30px;
        }
        .ds-icon-btn.ds-btn-lg {
          width: 36px;
          height: 36px;
          min-height: 36px;
        }
        .ds-icon-btn .ds-icon-glyph {
          display: block;
          background-color: currentColor;
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
          -webkit-mask-repeat: no-repeat;
          -webkit-mask-position: center;
          -webkit-mask-size: contain;
          mask-repeat: no-repeat;
          mask-position: center;
          mask-size: contain;
        }
        .ds-icon-btn.ds-btn-sm .ds-icon-glyph {
          width: 12px;
          height: 12px;
        }
        .ds-icon-btn.ds-btn-md .ds-icon-glyph {
          width: 14px;
          height: 14px;
        }
        .ds-icon-btn.ds-btn-lg .ds-icon-glyph {
          width: 16px;
          height: 16px;
        }
        .ds-icon-catalog {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
          gap: ${space[12]};
        }
        .ds-icon-catalog-item {
          display: grid;
          justify-items: center;
          align-content: start;
          gap: ${space[8]};
          min-height: 72px;
        }
        .ds-icon-catalog-preview {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: var(--surface-card);
          color: var(--neutral-700);
          box-shadow: var(--ui-shadow-sm);
        }
        .ds-icon-catalog-glyph {
          width: 18px;
          height: 18px;
          display: block;
          background-color: currentColor;
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
          -webkit-mask-repeat: no-repeat;
          -webkit-mask-position: center;
          -webkit-mask-size: contain;
          mask-repeat: no-repeat;
          mask-position: center;
          mask-size: contain;
        }
        .ds-icon-catalog-label {
          color: var(--text-secondary);
          font-size: ${typographySpecs.s.size}px;
          line-height: ${typographySpecs.s.lineHeight}px;
          font-weight: ${typographySpecs.s.weight};
          text-align: center;
          text-wrap: balance;
        }

        .ds-toggle-stack {
          display: grid;
          gap: 8px;
          width: fit-content;
        }

        .ds-toggle-row {
          display: inline-flex;
          align-items: center;
          justify-content: flex-start;
          gap: ${space[16]};
          width: fit-content;
        }

        .ds-slider-stack {
          display: grid;
          gap: 8px;
          width: min(100%, 260px);
        }

        .ds-slider-demo-grid {
          display: grid;
          grid-template-columns: repeat(3, max-content);
          gap: 50px;
          align-items: start;
        }

        .ds-slider-demo-section {
          display: grid;
          gap: ${space[8]};
          align-content: start;
        }

        .ds-slider-stack-section {
          width: 200px;
        }

        .ds-slider-row {
          display: grid;
          gap: ${space[8]};
          padding-bottom: ${space[8]};
        }

        .ds-slider-row:last-child {
          padding-bottom: 0;
        }

        .ds-slider-inline-row {
          display: grid;
          grid-template-columns: 44px minmax(0, 1fr);
          align-items: center;
          gap: ${space[12]};
          padding-bottom: ${space[8]};
        }

        .ds-slider-inline-row:last-child {
          padding-bottom: 0;
        }

        .ds-slider-linked-row {
          display: grid;
          grid-template-columns: 44px minmax(0, 1fr) auto;
          align-items: center;
          gap: ${space[12]};
        }

        .ds-slider-readout-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: ${space[12]};
        }

        .ds-slider-number-field {
          width: auto;
        }

        .ds-slider-number-field-compact {
          width: fit-content;
          min-width: 32px;
          border-color: transparent;
          box-shadow: none;
        }

        .ds-slider-number-field-compact:hover {
          border-color: var(--brand-primary);
        }

        .ds-slider-number-field-compact:focus-within {
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 2px var(--surface-brand-subtle);
        }

        .ds-slider-number-input {
          width: 100%;
          box-sizing: border-box;
          padding: ${space[4]} 3px;
          min-width: 0;
          text-align: center;
        }

        .ds-slider-value-readout {
          min-width: 32px;
          box-sizing: border-box;
          padding: ${space[4]} 3px;
          border-radius: 8px;
          color: var(--foreground);
          font-size: ${typographySpecs.p2.size}px;
          line-height: ${typographySpecs.p2.lineHeight}px;
          font-weight: ${typographySpecs.p2.weight};
          text-align: center;
        }

        .ds-slider-wrap {
          position: relative;
          width: 100%;
          max-width: 220px;
          height: 12px;
        }

        .ds-slider-thumb-tooltip {
          position: absolute;
          left: 0;
          bottom: calc(100% + ${space[8]});
          padding: ${space[4]} ${space[8]};
          border-radius: 8px;
          background: var(--brand-primary);
          box-shadow: var(--ui-tooltip-shadow);
          color: var(--neutral-0);
          font-size: ${typographySpecs.s.size}px;
          line-height: ${typographySpecs.s.lineHeight}px;
          font-weight: ${typographySpecs.s.weight};
          transform: translateX(-50%);
          opacity: 0;
          pointer-events: none;
          transition: opacity 120ms ease;
        }

        .ds-slider-thumb-tooltip::after {
          content: "";
          position: absolute;
          left: 50%;
          top: calc(100% - 5px);
          width: 8px;
          height: 8px;
          background: var(--brand-primary);
          transform: translateX(-50%) rotate(45deg);
          border-radius: 2px;
        }

        .ds-slider-thumb-tooltip-visible {
          opacity: 1;
        }

        .ds-slider {
          width: 100%;
          height: 12px;
          display: grid;
          align-items: center;
        }

        .ds-slider-track {
          position: relative;
          width: 100%;
          height: 3px;
          border-radius: 999px;
          background: var(--neutral-300);
        }

        .ds-slider-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          border-radius: 999px;
          background: var(--brand-primary);
        }

        .ds-slider-thumb {
          position: absolute;
          top: 50%;
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: var(--brand-primary);
          transform: translate(-50%, -50%);
        }

        .ds-slider-input {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          margin: 0;
          opacity: 0;
          cursor: pointer;
        }

        .ds-dropdown-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(220px, max-content));
          gap: ${space[12]};
          width: min(100%, 900px);
          align-items: start;
        }

        .ds-choice-stack {
          display: grid;
          gap: ${space[8]};
          width: min(100%, 240px);
        }

        .ds-nav-wrap {
          width: min(100%, 360px);
        }

        .ds-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: ${space[8]};
          width: max-content;
          max-width: 100%;
          padding: ${space[8]};
          border-radius: 16px;
          border: 1px solid var(--ui-border-subtle);
          background: var(--surface-neutral-subtle);
          box-shadow: var(--ui-shadow-md);
        }

        .ds-toolbar-image-state {
          padding-left: ${space[8]};
        }

        .ds-toolbar-image-state .ds-toolbar-group:first-child {
          padding-left: ${space[4]};
        }

        .ds-toolbar-group {
          display: flex;
          flex-wrap: nowrap;
          align-items: center;
          gap: ${space[4]};
        }

        .ds-toolbar-group-actions {
          gap: ${space[12]};
        }

        .ds-toolbar-anchor {
          position: relative;
        }

        .ds-toolbar-divider {
          width: 1px;
          height: 24px;
          background: var(--ui-border-subtle);
          flex: 0 0 auto;
        }

        .ds-toolbar-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: ${space[4]};
          min-width: 44px;
          min-height: 32px;
          padding: ${space[8]} ${space[8]};
          border: 1px solid transparent;
          border-radius: 12px;
          background: transparent;
          color: var(--neutral-700);
          font-size: ${typographySpecs.p2.size}px;
          line-height: ${typographySpecs.p2.lineHeight}px;
          font-weight: ${typographySpecs.p2.weight};
          text-align: center;
          cursor: pointer;
          filter: none;
          transition: background-color 140ms ease, color 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
        }

        .ds-toolbar-button:hover {
          background: var(--surface-card);
          color: var(--neutral-900);
          filter: none !important;
        }

        .ds-toolbar-button[data-active="true"] {
          background: var(--surface-card);
          border-color: transparent;
          color: var(--brand-primary-deep);
          box-shadow: var(--ui-shadow-sm);
          filter: none !important;
        }

        .ds-toolbar-button-primary {
          border-color: transparent;
          background: var(--brand-primary);
          color: var(--neutral-0);
        }

        .ds-toolbar-button-primary:hover {
          background: var(--brand-primary-strong);
          color: var(--neutral-0);
        }

        .ds-toolbar-button-wide {
          padding-inline: ${space[16]};
        }

        .ds-toolbar-button-swatch {
          min-width: 0;
          min-height: 0;
          padding: ${space[8]};
          border: none;
          border-radius: 8px;
          background: transparent !important;
          box-shadow: none !important;
        }

        .ds-toolbar-button-swatch:hover,
        .ds-toolbar-button-swatch[data-active="true"] {
          background: transparent !important;
          color: inherit;
          box-shadow: none !important;
        }

        .ds-toolbar-icon {
          display: grid;
          place-items: center;
          width: 16px;
          height: 16px;
          flex: 0 0 16px;
          border-radius: 4px;
          color: inherit;
        }

        .ds-toolbar-glyph {
          width: 16px;
          height: 16px;
          background: currentColor;
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
          -webkit-mask-position: center;
          mask-position: center;
          -webkit-mask-size: contain;
          mask-size: contain;
        }

        .ds-toolbar-swatch {
          width: 20px;
          height: 20px;
          display: block;
          border-radius: 4px;
          background: var(--brand-primary);
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.14);
        }

        .ds-toolbar-label {
          white-space: nowrap;
        }

        .ds-toolbar-popover {
          position: absolute;
          top: calc(100% + ${space[8]});
          left: 50%;
          z-index: 2;
          display: grid;
          align-items: center;
          gap: ${space[4]};
          padding: ${space[8]};
          border-radius: 16px;
          background: var(--card-bg);
          box-shadow: var(--ui-shadow-md);
          backdrop-filter: blur(10px);
          transform: translateX(-50%);
          white-space: nowrap;
        }

        .ds-toolbar-popover .ds-toolbar-button:hover {
          background: var(--surface-app);
          color: var(--neutral-900);
          box-shadow: none !important;
        }

        .ds-toolbar-popover .ds-toolbar-button {
          min-width: 0;
          min-height: 32px;
          padding: ${space[8]} ${space[8]};
          border-radius: 12px;
          font-size: ${typographySpecs.p2.size}px;
          line-height: ${typographySpecs.p2.lineHeight}px;
          font-weight: ${typographySpecs.p2.weight};
          gap: ${space[4]};
          justify-content: flex-start;
        }

        .ds-toolbar-popover .ds-toolbar-button[data-active="true"] {
          background: var(--surface-app);
          color: var(--brand-primary-deep);
          box-shadow: none !important;
        }

        .ds-toolbar-popover .ds-toolbar-button[data-active="true"] .ds-toolbar-icon,
        .ds-toolbar-popover .ds-toolbar-button[data-active="true"] .ds-toolbar-glyph {
          color: var(--brand-primary-deep);
        }

        .ds-toolbar-popover-title {
          color: var(--text-secondary);
          font-size: ${typographySpecs.p2.size}px;
          line-height: ${typographySpecs.p2.lineHeight}px;
          font-weight: ${typographySpecs.p2.weight};
        }

        .ds-toolbar-popover-paint {
          min-width: 280px;
        }

        .ds-toolbar-popover-size {
          top: calc(100% + ${space[8]});
          left: 50%;
          transform: translateX(-50%);
          grid-auto-flow: column;
        }

        .ds-toolbar-popover-opacity {
          top: calc(100% + ${space[8]});
          left: 50%;
          transform: translateX(-50%);
        }

        .ds-toolbar-subtool-group {
          display: inline-flex;
          align-items: center;
          gap: ${space[4]};
          flex-wrap: nowrap;
        }

        .ds-toolbar-size-row {
          display: inline-flex;
          align-items: center;
          gap: ${space[8]};
        }

        .ds-toolbar-divider-horizontal {
          width: 100%;
          height: 1px;
        }

        .ds-toolbar-popover-subtoolbar {
          display: inline-flex;
          align-items: center;
          gap: ${space[8]};
          min-width: 0;
        }

        .ds-toolbar-size-grid {
          display: inline-flex;
          align-items: center;
          gap: ${space[4]};
        }

        .ds-toolbar-size-option {
          display: grid;
          place-items: center;
          width: 24px;
          height: 24px;
          padding: 0;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--neutral-700);
          cursor: pointer;
          filter: none;
          transition: background-color 140ms ease, box-shadow 140ms ease, color 140ms ease;
        }

        .ds-toolbar-size-option:hover {
          background: var(--surface-app);
          filter: none !important;
        }

        .ds-toolbar-size-option[data-active="true"] {
          background: var(--surface-app);
          color: var(--brand-primary-deep);
          box-shadow: none;
          filter: none !important;
        }

        .ds-toolbar-size-dot {
          border-radius: 2px;
          background: currentColor;
        }

        .ds-toolbar-slider-row {
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          flex: 0 0 auto;
          min-width: 184px;
          padding-bottom: 0;
        }

        .ds-toolbar-slider-wrap {
          width: 108px;
          max-width: 108px;
        }

        .ds-toolbar-slider-label {
          display: inline-flex;
          align-items: center;
          gap: ${space[4]};
          color: var(--neutral-700);
          font-size: ${typographySpecs.p2.size}px;
          line-height: ${typographySpecs.p2.lineHeight}px;
          font-weight: ${typographySpecs.p2.weight};
        }

        .ds-modal-demo {
          display: grid;
          gap: ${space[12]};
          width: 100%;
        }

        .ds-modal-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: ${space[24]};
          width: min(100%, 760px);
        }

        .ds-modal-stage {
          position: relative;
          min-height: 420px;
          border-radius: 16px;
          overflow: hidden;
          background: var(--surface-card);
          box-shadow: inset 0 0 0 1px var(--ui-border-subtle);
        }

        .ds-modal-scrim {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          padding: ${space[16]};
          background: var(--surface-neutral-subtle);
        }

        .ds-modal-card {
          position: relative;
          box-sizing: border-box;
          display: grid;
          gap: ${space[16]};
          width: min(100%, 360px);
          padding: ${space[28]};
          border-radius: 16px;
          background: var(--surface-card);
          box-shadow: var(--ui-shadow-lg);
        }

        .ds-modal-alert-badge {
          display: inline-grid;
          place-items: center;
          width: 40px;
          height: 40px;
          border-radius: 999px;
          background: var(--status-destructive-soft);
        }

        .ds-modal-alert-icon {
          width: 20px;
          height: 20px;
          background: var(--status-destructive-strong);
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
          -webkit-mask-position: center;
          mask-position: center;
          -webkit-mask-size: contain;
          mask-size: contain;
        }

        .ds-modal-header {
          display: flex;
          align-items: start;
          justify-content: flex-start;
          gap: ${space[12]};
          padding-right: ${space[24]};
        }

        .ds-modal-title {
          color: var(--foreground);
        }

        .ds-modal-description {
          color: var(--text-secondary);
        }

        .ds-modal-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: center;
          gap: ${space[8]};
          width: 100%;
        }

        .ds-modal-actions .ds-btn {
          min-width: 0;
          white-space: normal;
          text-align: center;
          justify-content: center;
        }

        .ds-modal-close {
          position: absolute;
          top: ${space[16]};
          right: ${space[16]};
        }

        .ds-segmented-control {
          display: inline-grid;
          grid-auto-flow: column;
          grid-auto-columns: 1fr;
          align-items: center;
          gap: ${space[4]};
          width: min(100%, 320px);
          padding: ${space[4]};
          border-radius: 12px;
          border: 1px solid var(--ui-border-subtle);
          background: var(--surface-card);
          box-shadow: var(--ui-shadow-sm);
        }

        .ds-segmented-control-item {
          min-width: 0;
          min-height: 32px;
          padding: ${space[8]} ${space[12]};
          border: none;
          border-radius: 12px;
          background: transparent;
          color: var(--neutral-900);
          font-size: ${typographySpecs.p2.size}px;
          line-height: ${typographySpecs.p2.lineHeight}px;
          font-weight: ${typographySpecs.p2.weight};
          cursor: pointer;
          filter: none;
          transition: background-color 140ms ease, color 140ms ease, box-shadow 140ms ease, transform 140ms ease;
        }

        .ds-segmented-control-item:hover {
          background: var(--surface-app);
          color: var(--neutral-900);
          filter: none !important;
        }

        .ds-segmented-control-item[data-active="true"] {
          background: var(--brand-primary);
          color: var(--neutral-0);
          box-shadow: var(--ui-shadow-sm);
          filter: none !important;
        }

        .ds-segmented-control-outlined-active .ds-segmented-control-item[data-active="true"] {
          background: var(--surface-app);
          color: var(--neutral-900);
          box-shadow: inset 0 0 0 1px var(--brand-primary-strong);
        }

        .ds-tab-card {
          display: grid;
          width: min(100%, 760px);
          padding: ${space[16]} ${space[20]};
          border-radius: 16px;
          border: 1px solid var(--ui-border-subtle);
          background: var(--surface-card);
          box-shadow: var(--ui-shadow-sm);
        }

        .ds-tab-group {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          align-items: end;
          gap: ${space[12]};
          width: 100%;
          padding-bottom: ${space[8]};
          border-bottom: 1px solid var(--ui-border-subtle);
        }

        .ds-tab-group-item {
          position: relative;
          min-width: 0;
          padding: ${space[8]} ${space[4]};
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: ${typographySpecs.p1.size}px;
          line-height: ${typographySpecs.p1.lineHeight}px;
          font-weight: ${typographySpecs.p1.weight};
          text-align: center;
          cursor: pointer;
          filter: none;
          transition: color 140ms ease;
        }

        .ds-tab-group-item:hover {
          color: var(--brand-primary-strong);
          filter: none !important;
        }

        .ds-tab-group-item[data-active="true"] {
          color: var(--brand-primary);
          filter: none !important;
        }

        .ds-tab-group-item::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: calc(${space[8]} * -1 - 1px);
          width: 0;
          height: 2px;
          border-radius: 999px;
          background: var(--brand-primary);
          transform: translateX(-50%);
          transition: width 140ms ease;
        }

        .ds-tab-group-item[data-active="true"]::after {
          width: calc(100% - ${space[16]});
        }

        .ds-vertical-tab-card {
          display: grid;
          width: max-content;
          max-width: 100%;
          padding: ${space[4]};
          border-radius: 12px;
          border: 1px solid var(--ui-border-subtle);
          background: var(--surface-card);
          box-shadow: var(--ui-shadow-sm);
        }

        .ds-vertical-tab-group {
          display: grid;
          gap: ${space[4]};
          width: max-content;
          max-width: 100%;
        }

        .ds-vertical-tab-group-item {
          position: relative;
          display: grid;
          justify-items: center;
          align-content: center;
          gap: ${space[8]};
          width: 100%;
          min-width: 0;
          min-height: 68px;
          padding: ${space[12]} ${space[12]};
          border: none;
          border-radius: 12px;
          background: transparent;
          color: var(--neutral-500);
          font-size: ${typographySpecs.p2.size}px;
          line-height: ${typographySpecs.p2.lineHeight}px;
          font-weight: ${typographySpecs.p2.weight};
          text-align: center;
          cursor: pointer;
          filter: none;
          transition: background-color 140ms ease, color 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
        }

        .ds-vertical-tab-icon {
          width: 20px;
          height: 20px;
          flex: 0 0 20px;
          color: inherit;
          background: currentColor;
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
          -webkit-mask-position: center;
          mask-position: center;
          -webkit-mask-size: contain;
          mask-size: contain;
        }

        .ds-vertical-tab-label {
          min-width: 0;
          white-space: nowrap;
        }

        .ds-vertical-tab-group-item:hover {
          background: var(--neutral-0);
          color: var(--neutral-900);
          box-shadow: var(--ui-shadow-md);
          filter: none !important;
        }

        .ds-vertical-tab-group-item[data-active="true"] {
          background: var(--surface-app);
          color: var(--brand-primary-deep);
          box-shadow: var(--ui-shadow-md);
          filter: none !important;
        }

        .ds-nav-block-vertical {
          flex-basis: 100%;
        }

        .ds-nav-block-vertical .ds-section-block {
          flex: 0 0 auto;
          width: max-content;
          min-width: 0;
          max-width: none;
        }

        .ds-elevation-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: ${space[12]};
          width: min(100%, 760px);
        }

        .ds-elevation-card {
          display: grid;
          gap: ${space[8]};
          padding: ${space[16]};
          border-radius: 12px;
          background: var(--surface-card);
          align-content: start;
          min-height: 132px;
        }

        .ds-banner-stack {
          display: grid;
          gap: 8px;
          width: min(100%, 640px);
        }

        .ds-notification-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: ${space[24]};
          width: min(100%, 1040px);
        }

        .ds-notification-stack {
          display: grid;
          gap: ${space[12]};
          align-content: start;
          width: 100%;
        }

        .ds-notification-stack-fixed {
          width: 500px;
          max-width: 100%;
        }

        .ds-notification-stack-fixed-compact {
          width: 420px;
          max-width: 100%;
        }



        .ds-notification-card {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: ${space[12]};
          align-items: start;
          padding: ${space[16]};
          border-radius: 12px;
          border: none;
          background: var(--surface-card);
          box-shadow: var(--ui-shadow-md);
        }

        .ds-notification-card-compact {
          align-items: center;
        }

        .ds-notification-icon-badge {
          display: inline-grid;
          place-items: center;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          color: inherit;
        }

        .ds-notification-icon {
          width: 14px;
          height: 14px;
          background: currentColor;
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
          -webkit-mask-position: center;
          mask-position: center;
          -webkit-mask-size: contain;
          mask-size: contain;
        }

        .ds-notification-symbol {
          display: inline-grid;
          place-items: center;
          width: 14px;
          height: 14px;
          font-size: ${typographySpecs.p2.size}px;
          line-height: 1;
          font-weight: 700;
        }

        .ds-notification-content {
          display: grid;
          gap: ${space[4]};
          min-width: 0;
        }

        .ds-notification-title {
          color: var(--text-secondary);
        }

        .ds-notification-description {
          color: var(--text-secondary);
        }

        .ds-notification-action {
          margin-top: ${space[8]};
          justify-self: start;
        }


        .ds-notification-close {
          align-self: center;
          justify-self: end;
          margin-left: ${space[8]};
          width: 24px;
          min-width: 24px;
          min-height: 24px;
          padding: 0;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--text-secondary);
          box-shadow: none !important;
        }

        .ds-notification-close-ghost {
          border: none;
          background: transparent;
          color: var(--neutral-900);
        }

        .ds-notification-close-ghost:hover {
          background: var(--neutral-100);
        }

        .ds-notification-close-ghost[data-active="true"] {
          background: var(--neutral-200);
        }

        .ds-notification-controls {
          display: inline-flex;
          align-items: center;
          gap: ${space[8]};
          justify-self: end;
        }

        .ds-notification-controls .ds-notification-action {
          margin-top: 0;
        }

        .ds-typography-scale {
          display: grid;
          gap: 8px;
          width: min(100%, 760px);
        }

        .ds-typography-row {
          display: grid;
          grid-template-columns: minmax(120px, 180px) minmax(0, 1fr);
          gap: ${space[12]};
          align-items: baseline;
        }

        .ds-typography-meta {
          display: inline-flex;
          gap: ${space[8]};
          flex-wrap: wrap;
          align-items: center;
        }

        .ds-token-chip {
          display: inline-flex;
          align-items: center;
          padding: 0 ${space[8]};
          min-height: 20px;
          border-radius: 999px;
          border: 1px solid var(--ui-border-subtle);
          background: var(--ui-surface-soft);
          font-size: ${typographySpecs.s.size}px;
          line-height: ${typographySpecs.s.lineHeight}px;
          font-weight: ${typographySpecs.s.weight};
          color: var(--text-secondary);
        }

        .ds-dialog-wrap {
          width: min(100%, 640px);
        }

        .ds-palette-group {
          display: grid;
          gap: 12px;
          width: fit-content;
          max-width: 100%;
        }

        .ds-palette-subgroup {
          display: grid;
          gap: 8px;
          width: fit-content;
          max-width: 100%;
        }

        .ds-palette-subtitle {
          color: var(--text-secondary);
        }

        .ds-palette-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: flex-start;
          width: fit-content;
          max-width: 100%;
        }

        .ds-color-token {
          display: grid;
          gap: 4px;
          width: 56px;
          min-width: 56px;
        }

        .ds-swatch {
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 8px;
          border: 1px solid var(--ui-border-subtle);
          background-image: linear-gradient(45deg, var(--surface-card) 25%, transparent 25%),
            linear-gradient(-45deg, var(--surface-card) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, var(--surface-card) 75%),
            linear-gradient(-45deg, transparent 75%, var(--surface-card) 75%);
          background-size: 10px 10px;
          background-position: 0 0, 0 5px, 5px -5px, -5px 0;
          overflow: hidden;
        }

        .ds-swatch-fill {
          width: 100%;
          height: 100%;
        }

        .ds-token-alias {
          color: var(--text-secondary);
        }

        .ds-input-check,
        .ds-input-radio {
          margin: 0;
          cursor: pointer;
        }

        .ds-input-check {
          appearance: none;
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 1px solid var(--ui-border);
          background: var(--surface-card);
          display: inline-grid;
          place-items: center;
          flex: 0 0 auto;
          transition: background-color 140ms ease, border-color 140ms ease, transform 140ms ease;
        }

        .ds-input-check:hover {
          border-color: var(--brand-primary);
        }

        .ds-input-check:focus-visible {
          outline: 2px solid var(--brand-primary-strong);
          outline-offset: 2px;
        }

        .ds-input-check[data-hover="true"] {
          border-color: var(--brand-primary);
        }

        .ds-input-check:checked {
          border-color: var(--brand-primary);
          background: var(--brand-primary);
        }

        .ds-input-check::after {
          content: "";
          width: 9px;
          height: 6px;
          border-left: 2px solid transparent;
          border-bottom: 2px solid transparent;
          transform: rotate(-45deg) scale(0.9);
          transform-origin: center;
          transition: border-color 140ms ease, transform 140ms ease;
        }

        .ds-input-check:checked::after {
          border-color: var(--neutral-0);
          transform: rotate(-45deg) scale(1);
        }

        .ds-input-radio {
          appearance: none;
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          border: 1px solid var(--ui-border);
          background: var(--surface-card);
          display: inline-grid;
          place-items: center;
          flex: 0 0 auto;
          transition: background-color 140ms ease, border-color 140ms ease, transform 140ms ease;
        }

        .ds-input-radio:hover,
        .ds-input-radio[data-hover="true"] {
          border-color: var(--brand-primary);
        }

        .ds-input-radio:focus-visible {
          outline: 2px solid var(--brand-primary-strong);
          outline-offset: 2px;
        }

        .ds-input-radio:checked {
          border-color: var(--brand-primary);
        }

        .ds-input-radio::after {
          content: "";
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: transparent;
          transition: background-color 140ms ease, transform 140ms ease;
          transform: scale(0.9);
        }

        .ds-input-radio:checked::after {
          background: var(--brand-primary);
          transform: scale(1);
        }

        .ds-choice-demo-stack {
          display: grid;
          gap: ${space[8]};
        }

        .ds-choice-demo-row {
          display: flex;
          align-items: center;
          gap: ${space[12]};
        }

        .ds-expander {
          border: 1px solid var(--ui-border-subtle);
          border-radius: 8px;
          background: var(--surface-card);
        }

        .ds-tooltip-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, max-content));
          gap: ${space[16]};
          align-items: start;
        }

        .ds-tooltip-demo {
          display: grid;
          gap: ${space[8]};
          align-content: start;
        }

        .ds-tooltip-pair {
          display: grid;
          gap: ${space[12]};
          align-items: start;
        }

        .ds-tooltip-surface {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: ${space[8]};
          width: fit-content;
          max-width: 240px;
          padding: ${space[8]} ${space[12]};
          border-radius: 8px;
          background: var(--tooltip-neutral-bg);
          box-shadow: var(--ui-tooltip-shadow);
          color: var(--tooltip-neutral-text);
          font-size: ${typographySpecs.p2.size}px;
          line-height: ${typographySpecs.p2.lineHeight}px;
          font-weight: ${typographySpecs.p2.weight};
        }

        .ds-tooltip-surface-brand {
          background: var(--brand-primary);
        }

        .ds-tooltip-surface::after {
          content: "";
          position: absolute;
          left: ${space[16]};
          top: calc(100% - 6px);
          width: 10px;
          height: 10px;
          background: var(--tooltip-neutral-bg);
          transform: rotate(45deg);
          border-radius: 2px;
        }

        .ds-tooltip-surface-brand::after {
          background: var(--brand-primary);
        }

        .ds-tooltip-meta {
          color: rgba(255, 255, 255, 0.72);
          font-size: ${typographySpecs.s.size}px;
          line-height: ${typographySpecs.s.lineHeight}px;
          font-weight: ${typographySpecs.s.weight};
        }

        .ds-tooltip-surface-centered::after {
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
        }

        .ds-tooltip-surface-top::after {
          top: -4px;
          bottom: auto;
        }

        .ds-expander summary {
          list-style: none;
          cursor: pointer;
          font-size: ${typographySpecs.p2.size}px;
          line-height: ${typographySpecs.p2.lineHeight}px;
          font-weight: ${typographySpecs.p2.weight};
          padding: ${space[8]} ${space[8]};
        }

        .ds-expander summary::-webkit-details-marker {
          display: none;
        }

        .ds-preview-controls {
          display: inline-flex;
          align-items: center;
          gap: ${space[8]};
          flex-wrap: wrap;
        }

        .ds-preview-scope[data-preview-theme="dark"] * {
          box-shadow: none !important;
        }

        @media (max-width: 760px) {
          .ds-section-row {
            grid-template-columns: 1fr;
            row-gap: 8px;
          }

          .ds-button-variant-grid-icons {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={{ display: "grid", gap: space[12], maxWidth: 1800, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: space[12], flexWrap: "wrap" }}>
          <h1 className="ds-h1">Design System Components</h1>
          <div className="ds-preview-controls">
            <span className="ds-s ds-text-muted">Preview</span>
            <Link
              href="/design-system?preview=light"
              className="ds-btn ds-btn-tertiary ds-btn-sm"
              data-active={previewTheme === "light" ? "true" : undefined}
              style={{ textDecoration: "none" }}
            >
              Light
            </Link>
            <Link
              href="/design-system?preview=dark"
              className="ds-btn ds-btn-tertiary ds-btn-sm"
              data-active={previewTheme === "dark" ? "true" : undefined}
              style={{ textDecoration: "none" }}
            >
              Dark
            </Link>
            <Link
              href="/design-audit"
              className="ds-btn ds-btn-tertiary ds-btn-sm"
              style={{ textDecoration: "none" }}
            >
              /design-audit
            </Link>
          </div>
        </header>

        <div className="ds-system-table">
          <SectionRow title="Typography" first>
            <SectionBlock title="Type scale" wide>
              <div className="ds-typography-scale">
                {typographyPreviewGroups.map((group) => (
                  <div key={group.title} className="ds-control-stack">
                    <div className="ds-control-label">{group.title}</div>
                    {group.tokens.map((token) => {
                      const spec = typographySpecs[token];
                      return (
                        <div key={token} className="ds-typography-row">
                          <div className="ds-typography-meta">
                            <span className="ds-token-chip">{spec.label}</span>
                            <span className="ds-s ds-text-muted">{spec.size}/{spec.lineHeight}</span>
                            <span className="ds-s ds-text-muted">{spec.usage}</span>
                          </div>
                          <div
                            style={{
                              fontSize: spec.size,
                              lineHeight: `${spec.lineHeight}px`,
                              fontWeight: spec.weight,
                            }}
                          >
                            {spec.sample}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </SectionBlock>
          </SectionRow>

          <SectionRow title="Palette">
            {paletteGroups.map((group) => {
              const wideGroup = group.sections.some((subgroup) => subgroup.tokens.length > 4);
              const forceNonCompact = false;
              return (
              <div key={group.title} style={{ display: "contents" }}>
              <SectionBlock title={group.title} compact={!wideGroup && !forceNonCompact} wide={wideGroup}>
                <div className="ds-palette-group">
                  {(() => {
                    const showSubtitles = group.sections.length > 1;
                    return group.sections.map((subgroup) => (
                      <div key={`${group.title}-${subgroup.title}`} className="ds-palette-subgroup">
                        {showSubtitles ? <div className="ds-palette-subtitle ds-s">{subgroup.title}</div> : null}
                        <div className="ds-palette-grid">
                          {subgroup.tokens.map((token) => (
                            <div key={token.cssVar} className="ds-color-token">
                              <div className="ds-swatch">
                                <div className="ds-swatch-fill" style={{ background: `var(${token.cssVar})` }} />
                              </div>
                              <div className="ds-control-label" style={{ color: "var(--foreground)" }}>{token.cssVar}</div>
                              <div className="ds-s ds-text-muted">{token.name}</div>
                              {token.aliasOf ? <div className="ds-s ds-token-alias">alias of {token.aliasOf}</div> : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </SectionBlock>
              </div>
            );
            })}
          </SectionRow>

          <SectionRow title="Elevation">
            <SectionBlock title="Shadow tiers" wide>
              <div className="ds-elevation-grid">
                <div className="ds-elevation-card" style={{ boxShadow: "var(--ui-shadow-sm)" }}>
                  <div className="ds-p1">Small</div>
                  <div className="ds-p2 ds-text-muted">Used for slight separation like cards, panels, and inputs.</div>
                </div>
                <div className="ds-elevation-card" style={{ boxShadow: "var(--ui-shadow-md)" }}>
                  <div className="ds-p1">Medium</div>
                  <div className="ds-p2 ds-text-muted">Used for floating UI like dropdowns, popovers, and toolbars.</div>
                </div>
                <div className="ds-elevation-card" style={{ boxShadow: "var(--ui-shadow-lg)" }}>
                  <div className="ds-p1">Large</div>
                  <div className="ds-p2 ds-text-muted">Used for overlays like modals.</div>
                </div>
              </div>
            </SectionBlock>
          </SectionRow>

          <SectionRow title="Buttons">
            <SectionBlock title="Variants and states" wide>
              <div className="ds-button-variant-grid">
                {buttonVariants.map((variant) => (
                  <div key={variant.label} style={{ display: "contents" }}>
                    {variant.breakBefore ? <div style={{ gridColumn: "1 / -1", height: 0 }} /> : null}
                    <div className="ds-button-variant">
                      <div className="ds-p1">{variant.label}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: space[8], flexWrap: "wrap" }}>
                        <span className="ds-s ds-text-muted" style={{ minWidth: 50 }}>Default</span>
                        <button type="button" className={`ds-btn ${variant.className} ds-btn-sm`}>Small</button>
                        <button type="button" className={`ds-btn ${variant.className} ds-btn-md`}>Medium</button>
                        <button type="button" className={`ds-btn ${variant.className} ds-btn-lg`}>Large</button>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: space[8], flexWrap: "wrap" }}>
                        <span className="ds-s ds-text-muted" style={{ minWidth: 50 }}>Hover</span>
                        <button type="button" className={`ds-btn ${variant.className} ds-btn-sm ds-demo-hover`} data-hover="true">Small</button>
                        <button type="button" className={`ds-btn ${variant.className} ds-btn-md ds-demo-hover`} data-hover="true">Medium</button>
                        <button type="button" className={`ds-btn ${variant.className} ds-btn-lg ds-demo-hover`} data-hover="true">Large</button>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: space[8], flexWrap: "wrap" }}>
                        <span className="ds-s ds-text-muted" style={{ minWidth: 50 }}>Active</span>
                        <button type="button" className={`ds-btn ${variant.className} ds-btn-sm`} data-active="true">Small</button>
                        <button type="button" className={`ds-btn ${variant.className} ds-btn-md`} data-active="true">Medium</button>
                        <button type="button" className={`ds-btn ${variant.className} ds-btn-lg`} data-active="true">Large</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionBlock>

            <SectionBlock title="Icon actions" wide>
              <div className="ds-button-variant-grid ds-button-variant-grid-icons">
                {[
                  { label: "Contained", className: "ds-btn-primary", icon: "/icons/brush.svg", iconLabel: "Brush" },
                  { label: "Outlined", className: "ds-btn-secondary", icon: "/icons/tools.svg", iconLabel: "Tools" },
                  { label: "Ghost", className: "ds-btn-ghost", icon: "/icons/trash.svg", iconLabel: "Trash" },
                ].map((variant) => (
                  <div key={`icon-${variant.label}`} className="ds-button-variant">
                    <div className="ds-p1">{variant.label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: space[8], flexWrap: "wrap" }}>
                      <span className="ds-s ds-text-muted" style={{ minWidth: 50 }}>Default</span>
                      <button type="button" aria-label={`${variant.iconLabel} default small`} className={`ds-btn ${variant.className} ds-btn-sm ds-icon-btn`}>
                        <span
                          className="ds-icon-glyph"
                          aria-hidden="true"
                          style={{
                            WebkitMaskImage: `url(${assetPath(variant.icon)})`,
                            maskImage: `url(${assetPath(variant.icon)})`,
                          }}
                        />
                      </button>
                      <button type="button" aria-label={`${variant.iconLabel} default medium`} className={`ds-btn ${variant.className} ds-btn-md ds-icon-btn`}>
                        <span
                          className="ds-icon-glyph"
                          aria-hidden="true"
                          style={{
                            WebkitMaskImage: `url(${assetPath(variant.icon)})`,
                            maskImage: `url(${assetPath(variant.icon)})`,
                          }}
                        />
                      </button>
                      <button type="button" aria-label={`${variant.iconLabel} default large`} className={`ds-btn ${variant.className} ds-btn-lg ds-icon-btn`}>
                        <span
                          className="ds-icon-glyph"
                          aria-hidden="true"
                          style={{
                            WebkitMaskImage: `url(${assetPath(variant.icon)})`,
                            maskImage: `url(${assetPath(variant.icon)})`,
                          }}
                        />
                      </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: space[8], flexWrap: "wrap" }}>
                      <span className="ds-s ds-text-muted" style={{ minWidth: 50 }}>Hover</span>
                      <button type="button" aria-label={`${variant.iconLabel} hover small`} className={`ds-btn ${variant.className} ds-btn-sm ds-icon-btn ds-demo-hover`} data-hover="true">
                        <span
                          className="ds-icon-glyph"
                          aria-hidden="true"
                          style={{
                            WebkitMaskImage: `url(${assetPath(variant.icon)})`,
                            maskImage: `url(${assetPath(variant.icon)})`,
                          }}
                        />
                      </button>
                      <button type="button" aria-label={`${variant.iconLabel} hover medium`} className={`ds-btn ${variant.className} ds-btn-md ds-icon-btn ds-demo-hover`} data-hover="true">
                        <span
                          className="ds-icon-glyph"
                          aria-hidden="true"
                          style={{
                            WebkitMaskImage: `url(${assetPath(variant.icon)})`,
                            maskImage: `url(${assetPath(variant.icon)})`,
                          }}
                        />
                      </button>
                      <button type="button" aria-label={`${variant.iconLabel} hover large`} className={`ds-btn ${variant.className} ds-btn-lg ds-icon-btn ds-demo-hover`} data-hover="true">
                        <span
                          className="ds-icon-glyph"
                          aria-hidden="true"
                          style={{
                            WebkitMaskImage: `url(${assetPath(variant.icon)})`,
                            maskImage: `url(${assetPath(variant.icon)})`,
                          }}
                        />
                      </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: space[8], flexWrap: "wrap" }}>
                      <span className="ds-s ds-text-muted" style={{ minWidth: 50 }}>Active</span>
                      <button type="button" aria-label={`${variant.iconLabel} active small`} className={`ds-btn ${variant.className} ds-btn-sm ds-icon-btn`} data-active="true">
                        <span
                          className="ds-icon-glyph"
                          aria-hidden="true"
                          style={{
                            WebkitMaskImage: `url(${assetPath(variant.icon)})`,
                            maskImage: `url(${assetPath(variant.icon)})`,
                          }}
                        />
                      </button>
                      <button type="button" aria-label={`${variant.iconLabel} active medium`} className={`ds-btn ${variant.className} ds-btn-md ds-icon-btn`} data-active="true">
                        <span
                          className="ds-icon-glyph"
                          aria-hidden="true"
                          style={{
                            WebkitMaskImage: `url(${assetPath(variant.icon)})`,
                            maskImage: `url(${assetPath(variant.icon)})`,
                          }}
                        />
                      </button>
                      <button type="button" aria-label={`${variant.iconLabel} active large`} className={`ds-btn ${variant.className} ds-btn-lg ds-icon-btn`} data-active="true">
                        <span
                          className="ds-icon-glyph"
                          aria-hidden="true"
                          style={{
                            WebkitMaskImage: `url(${assetPath(variant.icon)})`,
                            maskImage: `url(${assetPath(variant.icon)})`,
                          }}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionBlock>

            <SectionBlock title="Icons in use" wide>
              <div className="ds-icon-catalog">
                {iconCatalog.map((item) => (
                  <div key={item.icon} className="ds-icon-catalog-item">
                    <div className="ds-icon-catalog-preview" aria-hidden="true">
                      <span
                        className="ds-icon-catalog-glyph"
                        style={{
                          WebkitMaskImage: `url(${assetPath(item.icon)})`,
                          maskImage: `url(${assetPath(item.icon)})`,
                        }}
                      />
                    </div>
                    <div className="ds-icon-catalog-label">{item.label}</div>
                  </div>
                ))}
              </div>
            </SectionBlock>

            <SectionBlock title="Tooltips" wide>
              <div className="ds-tooltip-grid">
                <div className="ds-tooltip-demo">
                  <div className="ds-p1">Default</div>
                  <div className="ds-tooltip-pair">
                    <div className="ds-tooltip-surface">Tooltip text</div>
                    <div className="ds-tooltip-surface ds-tooltip-surface-brand">Tooltip text</div>
                  </div>
                </div>
                <div className="ds-tooltip-demo">
                  <div className="ds-p1">Centered arrow</div>
                  <div className="ds-tooltip-pair">
                    <div className="ds-tooltip-surface ds-tooltip-surface-centered">Tooltip text</div>
                    <div className="ds-tooltip-surface ds-tooltip-surface-centered ds-tooltip-surface-brand">Tooltip text</div>
                  </div>
                </div>
                <div className="ds-tooltip-demo">
                  <div className="ds-p1">Top arrow</div>
                  <div className="ds-tooltip-pair">
                    <div className="ds-tooltip-surface ds-tooltip-surface-centered ds-tooltip-surface-top">Tooltip text</div>
                    <div className="ds-tooltip-surface ds-tooltip-surface-centered ds-tooltip-surface-top ds-tooltip-surface-brand">Tooltip text</div>
                  </div>
                </div>
              </div>
            </SectionBlock>
          </SectionRow>

          <SectionRow title="Controls">
            <SectionBlock title="Checkboxes" compact>
              <div className="ds-choice-stack">
                <div id="ds-checkboxes-label" className="ds-control-label">Display options</div>
                <div role="group" aria-labelledby="ds-checkboxes-label" className="ds-choice-demo-stack">
                  <label htmlFor="ds-checkbox-default" className="ds-choice-demo-row ds-p2">
                    <input id="ds-checkbox-default" type="checkbox" className="ds-input-check" />
                    Include symbols
                  </label>
                  <label htmlFor="ds-checkbox-active" className="ds-choice-demo-row ds-p2">
                    <input id="ds-checkbox-active" type="checkbox" className="ds-input-check" defaultChecked />
                    Auto-save edits
                  </label>
                  <label htmlFor="ds-checkbox-hover" className="ds-choice-demo-row ds-p2">
                    <input id="ds-checkbox-hover" type="checkbox" className="ds-input-check" />
                    Include symbols
                  </label>
                </div>
              </div>
            </SectionBlock>

            <SectionBlock title="Radio buttons" compact>
              <div className="ds-choice-stack">
                <div id="ds-measurement-mode-label" className="ds-control-label">Measurement mode</div>
                <div role="radiogroup" aria-labelledby="ds-measurement-mode-label" className="ds-choice-demo-stack">
                  <label className="ds-choice-demo-row ds-p2">
                    <input type="radio" name="mode-preview" className="ds-input-radio" defaultChecked />
                    Stitches
                  </label>
                  <label className="ds-choice-demo-row ds-p2">
                    <input type="radio" name="mode-preview" className="ds-input-radio" />
                    Inches
                  </label>
                </div>
              </div>
            </SectionBlock>

            <SectionBlock title="Toggles" compact>
              <div className="ds-choice-stack">
                <div id="ds-toggles-label" className="ds-control-label">Live controls</div>
                <div className="ds-toggle-stack" role="group" aria-labelledby="ds-toggles-label">
                  <div className="ds-toggle-row">
                    <span id="ds-toggle-enabled" className="ds-p2">Enabled</span>
                    <button type="button" role="switch" aria-checked="true" aria-labelledby="ds-toggle-enabled" style={{ width: 32, height: 18, borderRadius: 999, border: "none", background: "var(--toggle-track-on)", padding: 2, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                      <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 999, background: "var(--toggle-knob)" }} />
                    </button>
                  </div>
                  <div className="ds-toggle-row">
                    <span id="ds-toggle-disabled" className="ds-p2">Disabled</span>
                    <button type="button" role="switch" aria-checked="false" aria-labelledby="ds-toggle-disabled" style={{ width: 32, height: 18, borderRadius: 999, border: "none", background: "var(--toggle-track-off)", padding: 2, display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
                      <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 999, background: "var(--toggle-knob)" }} />
                    </button>
                  </div>
                </div>
              </div>
            </SectionBlock>

            <SectionBlock title="Sliders">
              <SliderDemo />
            </SectionBlock>
          </SectionRow>

          <SectionRow title="Inputs" className="ds-section-row-inputs">
            <SectionBlock title="Multiline and compact fields">
              <div className="ds-lane">
                <div className="ds-control-stack">
                  <label htmlFor="ds-input-notes" className="ds-control-label">Notes</label>
                  <textarea id="ds-input-notes" placeholder="Add notes for stitch count, colors, or finishing..." rows={2} className="ds-input-field" style={{ ...controlBase, resize: "vertical", minHeight: 56 }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 72px", gap: space[8] }}>
                  <div className="ds-control-stack">
                    <label htmlFor="ds-input-setting" className="ds-control-label">Setting</label>
                    <input id="ds-input-setting" placeholder="Row spacing" className="ds-input-field" style={controlBase} />
                  </div>
                  <div className="ds-control-stack">
                    <label htmlFor="ds-input-value" className="ds-control-label">Value</label>
                    <input id="ds-input-value" placeholder="12" className="ds-input-field" style={{ ...controlBase, textAlign: "left" }} />
                  </div>
                </div>
              </div>
            </SectionBlock>

            <SectionBlock title="Number input">
              <div className="ds-lane" style={{ width: "100%", maxWidth: 280 }}>
                <NumberInputDemo />
              </div>
            </SectionBlock>

            <SectionBlock title="Search bar">
              <div className="ds-lane">
                <div className="ds-control-stack">
                  <label htmlFor="ds-input-search" className="ds-control-label">Search</label>
                  <div className="ds-search-field-wrap">
                    <svg className="ds-search-icon" viewBox="0 0 16 16" aria-hidden="true">
                      <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M10.5 10.5L14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <input id="ds-input-search" placeholder="Search" className="ds-search-input" />
                  </div>
                </div>
              </div>
            </SectionBlock>

            <SectionBlock title="Menu panel surfaces">
              <div className="ds-lane">
                <div className="ds-control-stack">
                  <div className="ds-control-label">Panel variants</div>
                  <MenuPanelVariantsDemo />
                </div>
              </div>
            </SectionBlock>

            <SectionBlock title="Dropdown and upward menu" wide>
              <div className="ds-dropdown-grid">
                <div style={{ display: "grid", gap: space[8], alignContent: "start", justifyItems: "start", gridColumn: "1", gridRow: "1" }}>
                  <div id="ds-label-final-menu" className="ds-control-label">Example: Navigation dropdown with submenu</div>
                  <FinalComposedMenuDemo labelledBy="ds-label-final-menu" />
                </div>
                <div style={{ display: "grid", gap: space[8], alignContent: "start", justifyItems: "start", gridColumn: "2", gridRow: "1" }}>
                  <div id="ds-label-selection-menu" className="ds-control-label">Example: Selection dropdown</div>
                  <SelectionDropdownDemo labelledBy="ds-label-selection-menu" />
                </div>
                <div style={{ display: "grid", gap: space[8], alignContent: "start", justifyItems: "start", gridColumn: "3", gridRow: "1" }}>
                  <div id="ds-label-ghost-selection-menu" className="ds-control-label">Example: Ghost-trigger single select</div>
                  <GhostSelectionMenuDemo labelledBy="ds-label-ghost-selection-menu" />
                </div>
              </div>
            </SectionBlock>
          </SectionRow>

          <SectionRow title="Nav">
            <SectionBlock title="Tab group" wide>
              <div id="ds-label-tab-group-demo" className="ds-control-label" style={{ marginBottom: space[8] }}>Primary navigation</div>
              <TabGroupDemo />
            </SectionBlock>

            <SectionBlock title="Segmented controls">
              <div id="ds-label-segmented-controls" className="ds-control-label" style={{ marginBottom: space[8] }}>Display mode</div>
              <SegmentedControlsDemo />
            </SectionBlock>

            <SectionBlock title="Segmented controls, outlined active">
              <div id="ds-label-segmented-controls-outlined" className="ds-control-label" style={{ marginBottom: space[8] }}>Display mode</div>
              <SegmentedControlsDemo variant="outlined-active" labelledBy="ds-label-segmented-controls-outlined" />
            </SectionBlock>

            <div className="ds-nav-block-vertical">
              <SectionBlock title="Vertical tab group">
                <div id="ds-label-vertical-tab-group-demo" className="ds-control-label" style={{ marginBottom: space[8] }}>Sidebar navigation</div>
                <VerticalTabGroupDemo />
              </SectionBlock>
            </div>

            <SectionBlock title="Toolbar" wide>
              <div id="ds-label-toolbar-demo" className="ds-control-label" style={{ marginBottom: space[8] }}>Canvas tools</div>
              <ToolbarDemo />
            </SectionBlock>

            <SectionBlock title="Image reposition toolbar" wide>
              <div id="ds-label-toolbar-image-positioning-demo" className="ds-control-label" style={{ marginBottom: space[8] }}>Image unlocked / positioning mode</div>
              <ImagePositionToolbarDemo />
            </SectionBlock>

          </SectionRow>

          <SectionRow title="Feedback & Overlays">
            <SectionBlock title="Modal" wide>
              <div className="ds-modal-grid">
                <ModalDemo />
                <ModalDemo variant="destructive" />
              </div>
            </SectionBlock>

            <SectionBlock title="Notifications and toasts" wide>
              <div className="ds-notification-grid">
                <div className="ds-notification-stack">
                  <div className="ds-control-label">Passive alerts</div>
                  <div className="ds-notification-stack ds-notification-stack-fixed">
                    {[
                      {
                        tone: "info" as const,
                        title: "Chart autosaved",
                        description: "Your latest edits were saved to this pattern a moment ago.",
                        symbol: "i",
                      },
                      {
                        tone: "success" as const,
                        title: "Export complete",
                        description: "Your PDF pattern is ready and has been added to downloads.",
                        symbol: "✓",
                      },
                      {
                        tone: "warning" as const,
                        title: "Thread colors changed",
                        description: "One or more floss colors were substituted to match your palette.",
                        icon: "icons/alert.svg",
                      },
                      {
                        tone: "destructive" as const,
                        title: "Save failed",
                        description: "We couldn’t save your latest edits. Check your connection and try again.",
                        icon: "icons/alert.svg",
                      },
                    ].map((item) => {
                      const tone = notificationToneStyles[item.tone];
                      return (
                        <div
                          key={`passive-${item.tone}`}
                          className="ds-notification-card"
                          style={{ background: tone.bg, borderColor: tone.border }}
                        >
                          <div style={{ color: tone.icon }}>
                            <span className="ds-notification-icon-badge" aria-hidden="true" style={{ background: tone.badge, color: tone.badgeFg }}>
                              {"symbol" in item ? (
                                <span className="ds-notification-symbol">{item.symbol}</span>
                              ) : (
                                <span
                                  className="ds-notification-icon"
                                  style={{
                                    WebkitMaskImage: `url(${assetPath(item.icon)})`,
                                    maskImage: `url(${assetPath(item.icon)})`,
                                  }}
                                />
                              )}
                            </span>
                          </div>
                          <div className="ds-notification-content">
                            <div className="ds-h5 ds-notification-title">{item.title}</div>
                            <div className="ds-p2 ds-notification-description">{item.description}</div>
                          </div>
                          <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm ds-notification-close ds-notification-close-ghost" aria-label={`Dismiss ${item.title}`}>
                            <svg aria-hidden="true" viewBox="0 0 16 16" width="12" height="12">
                              <path
                                d="M4 4L12 12M12 4L4 12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="ds-notification-stack ds-notification-stack-fixed ds-notification-stack-fixed-compact">
                    {[
                      {
                        tone: "info" as const,
                        title: "Autosave on",
                        symbol: "i",
                      },
                      {
                        tone: "success" as const,
                        title: "Export ready",
                        symbol: "✓",
                      },
                      {
                        tone: "warning" as const,
                        title: "Palette changed",
                        icon: "icons/alert.svg",
                      },
                      {
                        tone: "destructive" as const,
                        title: "Save failed",
                        icon: "icons/alert.svg",
                      },
                    ].map((item) => {
                      const tone = notificationToneStyles[item.tone];
                      return (
                        <div
                          key={`passive-title-only-${item.tone}`}
                          className="ds-notification-card ds-notification-card-compact"
                          style={{ background: tone.bg, borderColor: tone.border }}
                        >
                          <div style={{ color: tone.icon }}>
                            <span className="ds-notification-icon-badge" aria-hidden="true" style={{ background: tone.badge, color: tone.badgeFg }}>
                              {"symbol" in item ? (
                                <span className="ds-notification-symbol">{item.symbol}</span>
                              ) : (
                                <span
                                  className="ds-notification-icon"
                                  style={{
                                    WebkitMaskImage: `url(${assetPath(item.icon)})`,
                                    maskImage: `url(${assetPath(item.icon)})`,
                                  }}
                                />
                              )}
                            </span>
                          </div>
                          <div className="ds-notification-content">
                            <div className="ds-h5 ds-notification-title">{item.title}</div>
                          </div>
                          <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm ds-notification-close" aria-label={`Dismiss ${item.title}`}>
                            <svg aria-hidden="true" viewBox="0 0 16 16" width="12" height="12">
                              <path
                                d="M4 4L12 12M12 4L4 12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="ds-notification-stack ds-notification-stack-fixed ds-notification-stack-fixed-compact">
                  <div className="ds-control-label">Single-action alerts</div>

                  {[
                    {
                      tone: "info" as const,
                      title: "Sign in to keep your chart",
                      action: "Sign in",
                      symbol: "i",
                    },
                    {
                      tone: "success" as const,
                      title: "Pattern shared",
                      action: "View access",
                      symbol: "✓",
                    },
                    {
                      tone: "warning" as const,
                      title: "Low contrast detected",
                      action: "Review colors",
                      icon: "icons/alert.svg",
                    },
                    {
                      tone: "destructive" as const,
                      title: "Unsaved work will be lost",
                      action: "Review changes",
                      icon: "icons/alert.svg",
                    },
                  ].map((item) => {
                    const tone = notificationToneStyles[item.tone];
                    return (
                      <div
                        key={`action-${item.tone}`}
                        className="ds-notification-card ds-notification-card-compact"
                        style={{ background: "var(--surface-card)" }}
                      >
                        <div style={{ color: tone.icon }}>
                          <span className="ds-notification-icon-badge" aria-hidden="true" style={{ background: tone.badge, color: tone.badgeFg }}>
                            {"symbol" in item ? (
                              <span className="ds-notification-symbol">{item.symbol}</span>
                            ) : (
                              <span
                                className="ds-notification-icon"
                                style={{
                                  WebkitMaskImage: `url(${assetPath(item.icon)})`,
                                  maskImage: `url(${assetPath(item.icon)})`,
                                }}
                              />
                            )}
                          </span>
                        </div>
                        <div className="ds-notification-content">
                          <div className="ds-h5 ds-notification-title">{item.title}</div>
                        </div>
                        <div className="ds-notification-controls">
                          <button type="button" className="ds-btn ds-btn-tertiary ds-btn-md ds-notification-action">
                            {item.action}
                          </button>
                          <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm ds-notification-close" aria-label={`Dismiss ${item.title}`}>
                            <svg aria-hidden="true" viewBox="0 0 16 16" width="12" height="12">
                              <path
                                d="M4 4L12 12M12 4L4 12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </SectionBlock>

            <SectionBlock title="Tags and counters">
              <div style={{ display: "flex", gap: space[8], alignItems: "center", flexWrap: "wrap" }}>
                <span className="ds-s ds-text-mono" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: `${space[4]} ${space[4]}`, borderRadius: 999, background: "var(--surface-neutral-subtle)" }}>
                  DMC-310
                </span>
                <span className="ds-s" style={{ minWidth: 12, height: 12, padding: "0 3px", borderRadius: 999, background: "var(--surface-pill-bg)", border: "1px solid var(--ui-border-subtle)", display: "inline-grid", placeItems: "center" }}>
                  24
                </span>
              </div>
            </SectionBlock>

          </SectionRow>
        </div>
      </div>
    </main>
  );
}
