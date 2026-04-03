/* eslint-disable @next/next/no-img-element */
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { assetPath } from "../../lib/assetPath";
import { StyledDropdownDemo, StyledUpwardDropdownDemo } from "./StyledDropdownMenusDemo";
import type { DesignTypeToken } from "./typography";
import { typographySpecs } from "./typography";

type SectionRowProps = {
  title: string;
  children: ReactNode;
  first?: boolean;
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
  padding: "10px 12px 18px",
  background: "var(--surface-neutral-subtle)",
  color: "var(--foreground)",
};

const controlBase: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  padding: "6px 8px",
  borderRadius: 7,
  border: "1px solid var(--ui-border-subtle)",
  background: "var(--surface-card)",
  color: "var(--foreground)",
  fontSize: typographySpecs.textSm.size,
  lineHeight: `${typographySpecs.textSm.lineHeight}px`,
  fontWeight: typographySpecs.textSm.weight,
};

const buttonVariants = [
  { label: "Primary", className: "ds-btn-primary" },
  { label: "Secondary", className: "ds-btn-secondary" },
  { label: "Tertiary", className: "ds-btn-tertiary" },
  { label: "Destructive", className: "ds-btn-destructive" },
];

const typographyPreviewOrder: DesignTypeToken[] = [
  "textXl",
  "textLg",
  "textMd",
  "textSm",
  "textXs",
  "text2xs",
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

const paletteGroups: PaletteGroup[] = [
  {
    title: "Neutrals",
    sections: [
      {
        title: "Neutral scale",
        tokens: [
          { name: "0", cssVar: "--neutral-0" },
          { name: "100", cssVar: "--neutral-100" },
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

const previewThemeVars = {
  light: {
    "--neutral-0": "#ffffff",
    "--neutral-100": "#f5f5f4",
    "--neutral-300": "#d6d3d1",
    "--neutral-500": "#78716c",
    "--neutral-700": "#44403c",
    "--neutral-900": "#1c1917",
    "--neutral-50": "var(--neutral-100)",
    "--neutral-200": "var(--neutral-300)",
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
    "--ui-shadow-sm": "0 1px 4px rgba(15, 23, 42, 0.12)",
    "--ui-shadow-md": "0 2px 6px rgba(15, 23, 42, 0.12)",
    "--ui-shadow-lg": "0 12px 28px rgba(15, 23, 42, 0.12)",
    "--toggle-track-border": "rgba(15, 23, 42, 0.2)",
    "--toggle-track-off": "#f8fafc",
    "--toggle-track-on": "#e2e8f0",
    "--toggle-knob": "#ffffff",
    "--slider-track-bg": "#d6dee8",
    "--slider-thumb-bg": "var(--surface-card)",
    "--slider-thumb-border": "var(--brand-primary)",
  },
  dark: {
    "--neutral-0": "#ffffff",
    "--neutral-100": "#f5f5f4",
    "--neutral-300": "#d6d3d1",
    "--neutral-500": "#78716c",
    "--neutral-700": "#44403c",
    "--neutral-900": "#1c1917",
    "--neutral-50": "var(--neutral-100)",
    "--neutral-200": "var(--neutral-300)",
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
    "--ui-shadow-sm": "none",
    "--ui-shadow-md": "none",
    "--ui-shadow-lg": "none",
    "--toggle-track-border": "rgba(245, 247, 251, 0.3)",
    "--toggle-track-off": "#1f252d",
    "--toggle-track-on": "#394251",
    "--toggle-knob": "#f5f7fb",
    "--slider-track-bg": "#4b5565",
    "--slider-thumb-bg": "#d4dbe5",
    "--slider-thumb-border": "var(--brand-primary)",
  },
} as const;

function SectionRow({ title, children, first = false }: SectionRowProps) {
  return (
    <section
      className="ds-section-row"
      style={{
        borderTop: first ? "none" : "1px solid var(--ui-border-subtle)",
      }}
    >
      <div className="ds-section-title ds-text-sm">{title}</div>
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
        .ds-text-xl {
          font-size: ${typographySpecs.textXl.size}px;
          line-height: ${typographySpecs.textXl.lineHeight}px;
          font-weight: ${typographySpecs.textXl.weight};
        }
        .ds-text-lg {
          font-size: ${typographySpecs.textLg.size}px;
          line-height: ${typographySpecs.textLg.lineHeight}px;
          font-weight: ${typographySpecs.textLg.weight};
        }
        .ds-text-md {
          font-size: ${typographySpecs.textMd.size}px;
          line-height: ${typographySpecs.textMd.lineHeight}px;
          font-weight: ${typographySpecs.textMd.weight};
        }
        .ds-text-sm {
          font-size: ${typographySpecs.textSm.size}px;
          line-height: ${typographySpecs.textSm.lineHeight}px;
          font-weight: ${typographySpecs.textSm.weight};
        }
        .ds-text-xs {
          font-size: ${typographySpecs.textXs.size}px;
          line-height: ${typographySpecs.textXs.lineHeight}px;
          font-weight: ${typographySpecs.textXs.weight};
        }
        .ds-text-2xs {
          font-size: ${typographySpecs.text2xs.size}px;
          line-height: ${typographySpecs.text2xs.lineHeight}px;
          font-weight: ${typographySpecs.text2xs.weight};
        }
        .ds-text-base {
          font-size: ${typographySpecs.textMd.size}px;
          line-height: ${typographySpecs.textMd.lineHeight}px;
          font-weight: ${typographySpecs.textMd.weight};
        }
        .ds-text-2xl {
          font-size: ${typographySpecs.textXl.size}px;
          line-height: ${typographySpecs.textXl.lineHeight}px;
          font-weight: ${typographySpecs.textXl.weight};
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
          border-radius: 7px;
          font-size: ${typographySpecs.textSm.size}px;
          line-height: ${typographySpecs.textSm.lineHeight}px;
          font-weight: ${typographySpecs.textSm.weight};
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
          padding: 3px 7px;
        }
        .ds-btn-md {
          min-height: 30px;
          padding: 5px 10px;
        }
        .ds-btn-lg {
          min-height: 36px;
          padding: 7px 12px;
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
          border: 1px solid var(--neutral-300);
          background: transparent;
          color: var(--neutral-700);
        }
        .ds-btn-tertiary:hover {
          background: var(--neutral-100);
          border-color: var(--neutral-300);
        }
        .ds-btn-tertiary[data-hover="true"] {
          background: var(--neutral-100);
          border-color: var(--neutral-300);
        }
        .ds-btn-tertiary[data-active="true"] {
          border-color: transparent;
          background: var(--neutral-300);
        }
        .ds-btn-ghost {
          border: none;
          background: transparent;
          color: var(--neutral-700);
        }
        .ds-btn-ghost:hover {
          background: var(--neutral-100);
        }
        .ds-btn-ghost[data-hover="true"] {
          background: var(--neutral-100);
        }
        .ds-btn-ghost[data-active="true"] {
          background: var(--neutral-300);
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
          font-size: ${typographySpecs.textLg.size}px;
          line-height: ${typographySpecs.textLg.lineHeight}px;
          font-weight: ${typographySpecs.textLg.weight};
          color: var(--foreground);
          letter-spacing: 0.01em;
          margin-bottom: 10px;
        }

        .ds-system-table {
          border: 1px solid var(--ui-border-subtle);
          border-radius: 10px;
          background: var(--surface-card);
          overflow: hidden;
        }

        .ds-section-row {
          display: grid;
          grid-template-columns: 15% minmax(0, 85%);
          column-gap: 14px;
          padding: 14px 12px;
          align-items: start;
        }

        .ds-section-title {
          color: var(--text-secondary);
          padding-top: 1px;
        }

        .ds-section-content {
          display: flex;
          flex-wrap: wrap;
          gap: 24px 24px;
          align-items: flex-start;
          min-width: 0;
        }

        .ds-section-block {
          display: grid;
          gap: 10px;
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
          gap: 10px;
          min-width: 0;
        }

        .ds-lane {
          display: grid;
          gap: 8px;
          width: min(100%, 560px);
        }

        .ds-control-stack {
          display: grid;
          gap: 4px;
          min-width: 0;
        }

        .ds-control-label {
          font-size: ${typographySpecs.textMd.size}px;
          line-height: ${typographySpecs.textMd.lineHeight}px;
          font-weight: ${typographySpecs.textMd.weight};
          color: var(--text-secondary);
        }

        .ds-lane-wide {
          display: grid;
          gap: 10px;
          width: min(100%, 900px);
        }

        .ds-button-variant-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
          gap: 12px 14px;
          width: min(100%, 900px);
          align-items: start;
        }

        .ds-button-variant {
          display: grid;
          gap: 6px;
          align-content: start;
        }
        .ds-inline-cluster {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          width: min(100%, 560px);
        }
        .ds-icon-btn {
          padding: 0;
          border-radius: 7px;
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

        .ds-toggle-stack {
          display: grid;
          gap: 8px;
          width: fit-content;
        }

        .ds-toggle-row {
          display: inline-flex;
          align-items: center;
          justify-content: flex-start;
          gap: 10px;
          width: fit-content;
        }

        .ds-dropdown-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 10px;
          width: min(100%, 560px);
          align-items: start;
        }

        .ds-choice-stack {
          display: grid;
          gap: 6px;
          width: min(100%, 240px);
        }

        .ds-nav-wrap {
          width: min(100%, 360px);
        }

        .ds-banner-stack {
          display: grid;
          gap: 8px;
          width: min(100%, 640px);
        }

        .ds-typography-scale {
          display: grid;
          gap: 8px;
          width: min(100%, 760px);
        }

        .ds-typography-row {
          display: grid;
          grid-template-columns: minmax(120px, 180px) minmax(0, 1fr);
          gap: 10px;
          align-items: baseline;
        }

        .ds-typography-meta {
          display: inline-flex;
          gap: 6px;
          flex-wrap: wrap;
          align-items: center;
        }

        .ds-token-chip {
          display: inline-flex;
          align-items: center;
          padding: 0 6px;
          min-height: 18px;
          border-radius: 999px;
          border: 1px solid var(--ui-border-subtle);
          background: var(--ui-surface-soft);
          font-size: ${typographySpecs.textXs.size}px;
          line-height: ${typographySpecs.textXs.lineHeight}px;
          font-weight: ${typographySpecs.textXs.weight};
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
          width: 88px;
          min-width: 88px;
        }

        .ds-swatch {
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 7px;
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
          width: 14px;
          height: 14px;
          margin: 0;
          accent-color: var(--brand-primary-strong);
          cursor: pointer;
        }

        .ds-expander {
          border: 1px solid var(--ui-border-subtle);
          border-radius: 7px;
          background: var(--surface-card);
        }

        .ds-expander summary {
          list-style: none;
          cursor: pointer;
          font-size: ${typographySpecs.textSm.size}px;
          line-height: ${typographySpecs.textSm.lineHeight}px;
          font-weight: ${typographySpecs.textSm.weight};
          padding: 6px 8px;
        }

        .ds-expander summary::-webkit-details-marker {
          display: none;
        }

        .ds-preview-controls {
          display: inline-flex;
          align-items: center;
          gap: 6px;
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
        }
      `}</style>

      <div style={{ display: "grid", gap: 10, maxWidth: 1800, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <h1 className="ds-text-2xl">Design System Components</h1>
          <div className="ds-preview-controls">
            <span className="ds-text-xs ds-text-muted">Preview</span>
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
                {typographyPreviewOrder.map((token) => {
                  const spec = typographySpecs[token];
                  return (
                    <div key={token} className="ds-typography-row">
                      <div className="ds-typography-meta">
                        <span className="ds-token-chip">{spec.label}</span>
                        <span className="ds-text-xs ds-text-muted">{spec.size}/{spec.lineHeight}</span>
                        <span className="ds-text-2xs ds-text-muted">{spec.usage}</span>
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
            </SectionBlock>
          </SectionRow>

          <SectionRow title="Palette">
            {paletteGroups.map((group) => {
              const wideGroup = group.sections.some((subgroup) => subgroup.tokens.length > 3);
              const forceNonCompact = group.title === "Success" || group.title === "Warning" || group.title === "Destructive";
              const breakBefore = group.title === "Destructive";
              return (
              <div key={group.title} style={{ display: "contents" }}>
              {breakBefore ? <div style={{ flexBasis: "100%", height: 0 }} /> : null}
              <SectionBlock title={group.title} compact={!wideGroup && !forceNonCompact} wide={wideGroup}>
                <div className="ds-palette-group">
                  {(() => {
                    const showSubtitles = group.sections.length > 1;
                    return group.sections.map((subgroup) => (
                      <div key={`${group.title}-${subgroup.title}`} className="ds-palette-subgroup">
                        {showSubtitles ? <div className="ds-palette-subtitle ds-text-xs">{subgroup.title}</div> : null}
                        <div className="ds-palette-grid">
                          {subgroup.tokens.map((token) => (
                            <div key={token.cssVar} className="ds-color-token">
                              <div className="ds-swatch">
                                <div className="ds-swatch-fill" style={{ background: `var(${token.cssVar})` }} />
                              </div>
                              <div className="ds-control-label" style={{ color: "var(--foreground)" }}>{token.cssVar}</div>
                              <div className="ds-text-2xs ds-text-muted">{token.name}</div>
                              {token.aliasOf ? <div className="ds-text-2xs ds-token-alias">alias of {token.aliasOf}</div> : null}
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

          <SectionRow title="Buttons">
            <SectionBlock title="Variants and states" wide>
              <div className="ds-button-variant-grid">
                {buttonVariants.map((variant) => (
                  <div key={variant.label} className="ds-button-variant">
                    <div className="ds-text-base">{variant.label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span className="ds-text-xs ds-text-muted" style={{ minWidth: 50 }}>Default</span>
                      <button type="button" className={`ds-btn ${variant.className} ds-btn-sm`}>Small</button>
                      <button type="button" className={`ds-btn ${variant.className} ds-btn-md`}>Medium</button>
                      <button type="button" className={`ds-btn ${variant.className} ds-btn-lg`}>Large</button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span className="ds-text-xs ds-text-muted" style={{ minWidth: 50 }}>Hover</span>
                      <button type="button" className={`ds-btn ${variant.className} ds-btn-sm ds-demo-hover`} data-hover="true">Small</button>
                      <button type="button" className={`ds-btn ${variant.className} ds-btn-md ds-demo-hover`} data-hover="true">Medium</button>
                      <button type="button" className={`ds-btn ${variant.className} ds-btn-lg ds-demo-hover`} data-hover="true">Large</button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span className="ds-text-xs ds-text-muted" style={{ minWidth: 50 }}>Active</span>
                      <button type="button" className={`ds-btn ${variant.className} ds-btn-sm`} data-active="true">Small</button>
                      <button type="button" className={`ds-btn ${variant.className} ds-btn-md`} data-active="true">Medium</button>
                      <button type="button" className={`ds-btn ${variant.className} ds-btn-lg`} data-active="true">Large</button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionBlock>

            <SectionBlock title="Icon actions" wide>
              <div className="ds-button-variant-grid">
                {[
                  { label: "Contained", className: "ds-btn-primary", icon: "/icons/brush.svg", iconLabel: "Brush" },
                  { label: "Outlined", className: "ds-btn-secondary", icon: "/icons/tools.svg", iconLabel: "Tools" },
                  { label: "Ghost", className: "ds-btn-ghost", icon: "/icons/trash.svg", iconLabel: "Trash" },
                ].map((variant) => (
                  <div key={`icon-${variant.label}`} className="ds-button-variant">
                    <div className="ds-text-base">{variant.label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span className="ds-text-xs ds-text-muted" style={{ minWidth: 50 }}>Default</span>
                      <button type="button" aria-label={`${variant.iconLabel} default small`} className={`ds-btn ${variant.className} ds-btn-sm ds-icon-btn`}>
                        <img className="ds-icon-glyph" src={assetPath(variant.icon)} alt="" aria-hidden="true" width={14} height={14} />
                      </button>
                      <button type="button" aria-label={`${variant.iconLabel} default medium`} className={`ds-btn ${variant.className} ds-btn-md ds-icon-btn`}>
                        <img className="ds-icon-glyph" src={assetPath(variant.icon)} alt="" aria-hidden="true" width={14} height={14} />
                      </button>
                      <button type="button" aria-label={`${variant.iconLabel} default large`} className={`ds-btn ${variant.className} ds-btn-lg ds-icon-btn`}>
                        <img className="ds-icon-glyph" src={assetPath(variant.icon)} alt="" aria-hidden="true" width={14} height={14} />
                      </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span className="ds-text-xs ds-text-muted" style={{ minWidth: 50 }}>Hover</span>
                      <button type="button" aria-label={`${variant.iconLabel} hover small`} className={`ds-btn ${variant.className} ds-btn-sm ds-icon-btn ds-demo-hover`} data-hover="true">
                        <img className="ds-icon-glyph" src={assetPath(variant.icon)} alt="" aria-hidden="true" width={14} height={14} />
                      </button>
                      <button type="button" aria-label={`${variant.iconLabel} hover medium`} className={`ds-btn ${variant.className} ds-btn-md ds-icon-btn ds-demo-hover`} data-hover="true">
                        <img className="ds-icon-glyph" src={assetPath(variant.icon)} alt="" aria-hidden="true" width={14} height={14} />
                      </button>
                      <button type="button" aria-label={`${variant.iconLabel} hover large`} className={`ds-btn ${variant.className} ds-btn-lg ds-icon-btn ds-demo-hover`} data-hover="true">
                        <img className="ds-icon-glyph" src={assetPath(variant.icon)} alt="" aria-hidden="true" width={14} height={14} />
                      </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span className="ds-text-xs ds-text-muted" style={{ minWidth: 50 }}>Active</span>
                      <button type="button" aria-label={`${variant.iconLabel} active small`} className={`ds-btn ${variant.className} ds-btn-sm ds-icon-btn`} data-active="true">
                        <img className="ds-icon-glyph" src={assetPath(variant.icon)} alt="" aria-hidden="true" width={14} height={14} />
                      </button>
                      <button type="button" aria-label={`${variant.iconLabel} active medium`} className={`ds-btn ${variant.className} ds-btn-md ds-icon-btn`} data-active="true">
                        <img className="ds-icon-glyph" src={assetPath(variant.icon)} alt="" aria-hidden="true" width={14} height={14} />
                      </button>
                      <button type="button" aria-label={`${variant.iconLabel} active large`} className={`ds-btn ${variant.className} ds-btn-lg ds-icon-btn`} data-active="true">
                        <img className="ds-icon-glyph" src={assetPath(variant.icon)} alt="" aria-hidden="true" width={14} height={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionBlock>
          </SectionRow>

          <SectionRow title="Text Fields">
            <SectionBlock title="Single-line inputs">
              <div className="ds-lane">
                <div className="ds-control-stack">
                  <label htmlFor="ds-input-pattern-name" className="ds-control-label">Pattern name</label>
                  <input id="ds-input-pattern-name" value="Needlepoint pattern" readOnly style={controlBase} />
                </div>
                <div className="ds-control-stack">
                  <label htmlFor="ds-input-email" className="ds-control-label">Contact email</label>
                  <input id="ds-input-email" value="example@needlepoint.app" readOnly style={controlBase} />
                </div>
              </div>
            </SectionBlock>

            <SectionBlock title="Multiline and compact fields">
              <div className="ds-lane">
                <div className="ds-control-stack">
                  <label htmlFor="ds-input-notes" className="ds-control-label">Notes</label>
                  <textarea id="ds-input-notes" value="Standardized textarea content." readOnly rows={2} style={{ ...controlBase, resize: "vertical", minHeight: 56 }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 72px", gap: 8 }}>
                  <div className="ds-control-stack">
                    <label htmlFor="ds-input-setting" className="ds-control-label">Setting</label>
                    <input id="ds-input-setting" value="Row spacing" readOnly style={controlBase} />
                  </div>
                  <div className="ds-control-stack">
                    <label htmlFor="ds-input-value" className="ds-control-label">Value</label>
                    <input id="ds-input-value" value="12" readOnly style={{ ...controlBase, textAlign: "left" }} />
                  </div>
                </div>
              </div>
            </SectionBlock>
          </SectionRow>

          <SectionRow title="Selectors">
            <SectionBlock title="Checkboxes" compact>
              <div className="ds-choice-stack">
                <div id="ds-checkboxes-label" className="ds-control-label">Display options</div>
                <div role="group" aria-labelledby="ds-checkboxes-label" style={{ display: "grid", gap: 6 }}>
                <label htmlFor="ds-checkbox-autosave" className="ds-text-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input id="ds-checkbox-autosave" type="checkbox" className="ds-input-check" defaultChecked />
                  Auto-save edits
                </label>
                <label htmlFor="ds-checkbox-symbols" className="ds-text-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input id="ds-checkbox-symbols" type="checkbox" className="ds-input-check" />
                  Include symbols
                </label>
                </div>
              </div>
            </SectionBlock>

            <SectionBlock title="Radio buttons" compact>
              <div className="ds-choice-stack">
                <div id="ds-measurement-mode-label" className="ds-control-label">Measurement mode</div>
                <div role="radiogroup" aria-labelledby="ds-measurement-mode-label" style={{ display: "grid", gap: 6 }}>
                  <label className="ds-text-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="radio" name="mode-preview" className="ds-input-radio" defaultChecked />
                    Stitches
                  </label>
                  <label className="ds-text-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="radio" name="mode-preview" className="ds-input-radio" />
                    Inches
                  </label>
                </div>
              </div>
            </SectionBlock>

            <SectionBlock title="Toggles" compact>
              <div id="ds-toggles-label" className="ds-control-label">Live controls</div>
              <div className="ds-toggle-stack" role="group" aria-labelledby="ds-toggles-label">
                <div className="ds-toggle-row">
                  <span id="ds-toggle-enabled" className="ds-text-sm">Enabled</span>
                  <button type="button" role="switch" aria-checked="true" aria-labelledby="ds-toggle-enabled" style={{ width: 30, height: 16, borderRadius: 999, border: "1px solid var(--toggle-track-border)", background: "var(--toggle-track-on)", padding: 2, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                    <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 999, background: "var(--toggle-knob)", boxShadow: "0 1px 2px var(--ui-border-strong)" }} />
                  </button>
                </div>
                <div className="ds-toggle-row">
                  <span id="ds-toggle-disabled" className="ds-text-sm">Disabled</span>
                  <button type="button" role="switch" aria-checked="false" aria-labelledby="ds-toggle-disabled" style={{ width: 30, height: 16, borderRadius: 999, border: "1px solid var(--toggle-track-border)", background: "var(--toggle-track-off)", padding: 2, display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
                    <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 999, background: "var(--toggle-knob)", boxShadow: "0 1px 2px var(--ui-border-strong)" }} />
                  </button>
                </div>
              </div>
            </SectionBlock>

            <SectionBlock title="Dropdown and upward menu" wide>
              <div className="ds-dropdown-grid">
                <div style={{ display: "grid", gap: 6, alignContent: "start", justifyItems: "start" }}>
                  <div id="ds-label-dropdown" className="ds-control-label">Dropdown</div>
                  <StyledDropdownDemo labelledBy="ds-label-dropdown" />
                </div>
                <div style={{ display: "grid", gap: 6, alignContent: "start", justifyItems: "start" }}>
                  <div id="ds-label-upward-menu" className="ds-control-label">Upward menu</div>
                  <StyledUpwardDropdownDemo labelledBy="ds-label-upward-menu" />
                </div>
              </div>
            </SectionBlock>
          </SectionRow>

          <SectionRow title="Nav">
            <SectionBlock title="Segmented tabs">
              <div id="ds-label-tab-group" className="ds-control-label" style={{ marginBottom: 6 }}>View mode</div>
              <div
                role="tablist"
                aria-labelledby="ds-label-tab-group"
                className="ds-nav-wrap"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  alignItems: "center",
                  gap: 3,
                  padding: 2,
                  borderRadius: 8,
                  border: "1px solid var(--ui-border-subtle)",
                  background: "var(--ui-surface-soft)",
                }}
              >
                {["All", "Used", "Custom"].map((label, index) => (
                  <button
                    key={`tab-${label}`}
                    type="button"
                    className="menu-tab-button ds-text-sm"
                    role="tab"
                    data-active={index === 0 ? "true" : undefined}
                    style={{ padding: "4px 6px", borderRadius: 7, border: "none" }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </SectionBlock>

            <SectionBlock title="Toolbar control">
              <div className="ds-control-label" style={{ marginBottom: 6 }}>Active tool</div>
              <div className="canvas-toolbar" style={{ display: "inline-flex", padding: 4, borderRadius: 10, background: "var(--canvas-toolbar-bg)" }}>
                <button type="button" className="toolbar-button" style={{ minWidth: 36, padding: "3px 5px", borderRadius: 8, display: "flex", flexDirection: "column", gap: 2, alignItems: "center", cursor: "pointer" }}>
                  <span className="toolbar-icon" aria-hidden="true">
                    <img src={assetPath("/icons/brush.svg")} alt="" aria-hidden="true" width={14} height={14} style={{ display: "block" }} />
                  </span>
                  <span className="toolbar-label ds-text-xs">Brush</span>
                </button>
              </div>
            </SectionBlock>
          </SectionRow>

          <SectionRow title="Feedback & Overlays">
            <SectionBlock title="Informational banner and status pill" wide>
              <div className="ds-banner-stack">
                <div className="ds-text-sm" style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", minHeight: 30, borderRadius: 8, border: "1px solid var(--ui-border-subtle)", background: "var(--surface-brand-subtle)" }}>
                  <span style={{ flex: "1 1 auto", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    Sign in to save edits and access WIPs later.
                  </span>
                  <button type="button" className="ds-btn ds-btn-secondary ds-btn-sm">
                    Sign in
                  </button>
                </div>
                <div role="status" aria-live="polite" className="ds-text-sm" style={{ display: "inline-flex", alignSelf: "start", maxWidth: 440, padding: "5px 10px", borderRadius: 999, border: "1px solid var(--ui-border-subtle)", background: "var(--surface-card)", boxShadow: "var(--ui-shadow-lg)" }}>
                  Saved as &quot;Spring Garden&quot;.
                </div>
              </div>
            </SectionBlock>

            <SectionBlock title="Tags and counters">
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span className="ds-text-xs ds-text-mono" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "1px 4px", borderRadius: 999, background: "var(--surface-neutral-subtle)" }}>
                  DMC-310
                </span>
                <span className="ds-text-xs" style={{ minWidth: 12, height: 12, padding: "0 3px", borderRadius: 999, background: "var(--surface-pill-bg)", border: "1px solid var(--ui-border-subtle)", display: "inline-grid", placeItems: "center" }}>
                  24
                </span>
              </div>
            </SectionBlock>

            <SectionBlock title="Confirmation dialog shell" wide>
              <div className="ds-dialog-wrap" style={{ minHeight: 130, borderRadius: 8, border: "1px solid var(--ui-border-subtle)", background: "var(--surface-overlay-scrim)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "min(260px, 92%)", borderRadius: 10, padding: 10, background: "var(--surface-card)", boxShadow: "0 10px 24px var(--ui-border-strong)", display: "grid", gap: 8 }}>
                  <div className="ds-text-lg">Clear drawing?</div>
                  <div className="ds-text-sm ds-text-faint">This will clear all painted cells.</div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                    <button type="button" className="ds-btn ds-btn-tertiary ds-btn-sm">Cancel</button>
                    <button type="button" className="ds-btn ds-btn-destructive ds-btn-sm">Continue</button>
                  </div>
                </div>
              </div>
            </SectionBlock>
          </SectionRow>
        </div>
      </div>
    </main>
  );
}
