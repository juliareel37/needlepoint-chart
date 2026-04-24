/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { assetPath } from "@/lib/assetPath";
import {
  typographyOrder,
  typographySpecs,
  typographyStyles,
  type DesignTypeToken,
} from "@/app/design-system/typography";
import {
  Button,
  Checkbox,
  Field,
  FieldInput,
  Modal,
  Notification,
  SingleSelectDropdown,
  Slider,
  Toggle,
  Toolbar,
  ToolbarAnchor,
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup,
  ToolbarIcon,
  ToolbarLabel,
  ToolbarMeta,
  ToolbarPopover,
  ToolbarSubtoolGroup,
  ToolbarSwatch,
  VerticalTabGroup,
} from "@/components/design-system";
import { useThemeMode } from "@/components/editor-v2/app/useThemeMode";
import styles from "./editor-v2-design-system.module.css";

const railItems = [
  { id: "document", label: "Document", icon: "/icons/file.svg" },
  { id: "color", label: "Color", icon: "/icons/grid_view.svg" },
  { id: "trace", label: "Trace", icon: "/icons/photo.svg" },
];

const savedDesigns = [
  { id: "sunset_12x18", label: "Sunset Study (12x18)" },
  { id: "flora_24x24", label: "Flora Tiles (24x24)" },
  { id: "portrait_32x40", label: "Portrait Draft (32x40)" },
  { id: "bird_18x18", label: "Bird Sampler (18x18)" },
  { id: "alpha_10x10", label: "Alphabet Block (10x10)" },
  { id: "garden_28x20", label: "Garden Border (28x20)" },
];

const paletteGroups = [
  {
    title: "Neutrals",
    tokens: [
      { name: "neutral-0", cssVar: "--neutral-0", sourceType: "literal" },
      { name: "neutral-100", cssVar: "--neutral-100", sourceType: "literal" },
      { name: "neutral-200", cssVar: "--neutral-200", sourceType: "literal" },
      { name: "neutral-300", cssVar: "--neutral-300", sourceType: "literal" },
      { name: "neutral-500", cssVar: "--neutral-500", sourceType: "literal" },
      { name: "neutral-700", cssVar: "--neutral-700", sourceType: "literal" },
      { name: "neutral-900", cssVar: "--neutral-900", sourceType: "literal" },
    ],
  },
  {
    title: "Brand",
    tokens: [
      { name: "brand-fill-50", cssVar: "--brand-lightest", sourceType: "literal" },
      { name: "brand-fill-100", cssVar: "--brand-100", sourceType: "literal" },
      { name: "brand-fill-300", cssVar: "--brand-200", sourceType: "literal" },
      { name: "brand-500", cssVar: "--brand-primary", sourceType: "literal" },
      { name: "brand-600", cssVar: "--brand-400", sourceType: "literal" },
      { name: "brand-700", cssVar: "--brand-500", sourceType: "literal" },
      { name: "brand-900", cssVar: "--brand-600", sourceType: "literal" },
    ],
  },
  {
    title: "UI",
    tokens: [
      { name: "ui-surface-app", cssVar: "--brand-lightest", sourceType: "alias", aliasOf: "--brand-lightest" },
      { name: "surface-card", cssVar: "--surface-card", sourceType: "alias", aliasOf: "--neutral-0 / --neutral-800" },
      { name: "ui-border-subtle", cssVar: "--ui-border-subtle", sourceType: "alias", aliasOf: "--neutral-200 / --neutral-500" },
      // { name: "ui-divider", ßcssVar: "--ui-border-subtle", sourceType: "alias", aliasOf: "--ui-border-subtle" },
      { name: "text-primary", cssVar: "--text-primary", sourceType: "alias", aliasOf: "--neutral-900 / --neutral-0" },
      { name: "text-secondary", cssVar: "--text-secondary", sourceType: "alias", aliasOf: "--neutral-700 / --neutral-200" },
    ],
  },
];

const buttonVariants: Array<{
  variant: "primary" | "secondary" | "secondary2" | "destructive" | "ghost" | "ghostV2";
  label: string;
}> = [
  { variant: "primary", label: "Primary" },
  { variant: "secondary", label: "Secondary" },
  // { variant: "secondary2", label: "Secondary2" },
  // { variant: "destructive", label: "Destructive" },
  // { variant: "ghost", label: "Ghost" },
  { variant: "ghostV2", label: "Ghost v2" },
];

const buttonHoverStyles: Record<
  "primary" | "secondary" | "secondary2" | "destructive" | "ghost" | "ghostV2",
  CSSProperties
> = {
  primary: {
    background: "var(--button-primary-hover)",
  },
  secondary: {
    background: "var(--button-secondary-hover)",
  },
  secondary2: {
    background: "var(--button-secondary2-hover)",
  },
  destructive: {
    background: "var(--status-destructive-strong)",
  },
  ghost: {
    background: "var(--button-ghost-hover)",
  },
  ghostV2: {
    background: "var(--button-ghost2-hover)",
  },
};

export function EditorV2DesignSystemPage() {
  const { themeMode, setThemeMode } = useThemeMode();

  const handleThemeChange = (nextChecked: boolean) => {
    setThemeMode(nextChecked ? "dark" : "light");
  };

  return (
    <main className={styles.page}>
      <div className={styles.stack}>
        <header className={styles.hero}>
          <div className={styles.heroTopRow}>
            <Link href="/editor-v2" className={styles.tempLink}>
              Back to editor
            </Link>
            <div className={styles.themeToggleWrap}>
              <span className={styles.themeToggleMeta} style={typographyStyles.s}>
                {themeMode === "dark" ? "Dark mode" : "Light mode"}
              </span>
              <Toggle
                checked={themeMode === "dark"}
                aria-label={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode`}
                label={themeMode === "dark" ? "Dark" : "Light"}
                onChange={handleThemeChange}
              />
            </div>
          </div>
          <h1 className={styles.heroTitle} style={typographyStyles.h2}>
            Editor V2 Design System
          </h1>
          <p className={styles.heroBody} style={typographyStyles.p2}>
            A focused reference for editor-specific chrome and interaction patterns.
            Use this page for shell, panel, rail, and toolbar decisions that would
            otherwise clutter the global design system page.
          </p>
        </header>

        <section className={styles.sectionCard}>
          <div>
            <h2 className={styles.sectionTitle} style={typographyStyles.h4}>
              Palette
            </h2>
            <p className={styles.sectionBody} style={typographyStyles.p2}>
              Editor-facing color tokens used for surfaces, states, and chrome.
            </p>
          </div>
          <PaletteDemo />
        </section>

        <section className={styles.sectionCard}>
          <div>
            <h2 className={styles.sectionTitle} style={typographyStyles.h4}>
              Typography
            </h2>
            <p className={styles.sectionBody} style={typographyStyles.p2}>
              The working type scale for editor surfaces and dense UI.
            </p>
          </div>
          <TypographyDemo />
        </section>

        <section className={styles.sectionCard}>
          <div>
            <h2 className={styles.sectionTitle} style={typographyStyles.h4}>
              Controls
            </h2>
            <p className={styles.sectionBody} style={typographyStyles.p2}>
              Buttons and controls as they should be used in editor chrome and side panels.
            </p>
          </div>
          <ControlsDemo />
        </section>

        <section className={styles.sectionCard}>
          <div>
            <h2 className={styles.sectionTitle} style={typographyStyles.h4}>
              Feedback & Overlays
            </h2>
            <p className={styles.sectionBody} style={typographyStyles.p2}>
              The legacy modal, passive alert, toast, and single-action alert patterns,
              now documented in the v2 surface library.
            </p>
          </div>
          <FeedbackAndOverlaysDemo />
        </section>

        <div className={styles.grid}>
          <section className={styles.sectionCard}>
            <div>
              <h2 className={styles.sectionTitle} style={typographyStyles.h4}>
                Rail Navigation
              </h2>
              <p className={styles.sectionBody} style={typographyStyles.p2}>
                Persistent editor rail using the shared vertical tab item treatment.
              </p>
            </div>
            <RailDemo />
          </section>

          <section className={styles.sectionCard}>
            <div>
              <h2 className={styles.sectionTitle} style={typographyStyles.h4}>
                Side Panel
              </h2>
              <p className={styles.sectionBody} style={typographyStyles.p2}>
                Panel header, primary actions, and saved-design single-select pattern.
              </p>
            </div>
            <SidePanelDemo />
          </section>
        </div>

        <section className={styles.sectionCard}>
          <div>
            <h2 className={styles.sectionTitle} style={typographyStyles.h4}>
              Toolbars
            </h2>
            <p className={styles.sectionBody} style={typographyStyles.p2}>
              Editor main toolbar and zoom toolbar as they should appear within the stage.
            </p>
          </div>
          <ToolbarDemoBlock />
        </section>
      </div>
    </main>
  );
}

function FeedbackAndOverlaysDemo() {
  return (
    <div className={styles.feedbackGrid}>
      <div className={styles.feedbackSection}>
        <div className={styles.feedbackSectionHeader}>
          <h3 className={styles.cardTitle} style={typographyStyles.h5}>
            Modal
          </h3>
          <p className={styles.muted} style={typographyStyles.p2}>
            Standard confirmation and destructive confirmation overlays.
          </p>
        </div>
        <div className={styles.modalGrid}>
          <ModalDemoCard />
          <ModalDemoCard variant="destructive" />
        </div>
      </div>

      <div className={styles.feedbackSection}>
        <div className={styles.feedbackSectionHeader}>
          <h3 className={styles.cardTitle} style={typographyStyles.h5}>
            Notifications and toasts
          </h3>
          <p className={styles.muted} style={typographyStyles.p2}>
            Passive alerts, compact status toasts, and single-action alert rows.
          </p>
        </div>
        <NotificationLibrary />
      </div>
    </div>
  );
}

function ModalDemoCard({ variant = "default" }: { variant?: "default" | "destructive" }) {
  const [open, setOpen] = useState(false);
  const destructive = variant === "destructive";

  const title = destructive ? "Delete chart?" : "Save changes?";
  const description = destructive
    ? "This will permanently remove the current chart and its stitch data. This action cannot be undone."
    : "Your chart edits are ready to save. You can keep working, save a draft, or close without saving.";
  const primaryLabel = destructive ? "Yes, delete" : "Save";
  const secondaryLabel = destructive ? "No, keep it" : "Cancel";

  return (
    <div className={styles.modalDemo}>
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        {destructive ? "Open destructive modal" : "Open modal"}
      </Button>
      <Modal
        isOpen={open}
        title={title}
        description={description}
        tone={destructive ? "fail" : "none"}
        dismissLabel={secondaryLabel}
        confirmLabel={primaryLabel}
        confirmVariant={destructive ? "destructive" : "primary"}
        onDismiss={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </div>
  );
}

function NotificationLibrary() {
  return (
    <div className={styles.notificationGrid}>
      <div className={styles.notificationStack}>
        <div className={styles.notificationLabel} style={typographyStyles.s}>
          Passive alerts
        </div>
        <div className={styles.notificationStackFixed}>
          {[
            {
              tone: "info" as const,
              title: "Chart autosaved",
              description: "Your latest edits were saved to this pattern a moment ago.",
            },
            {
              tone: "success" as const,
              title: "Export complete",
              description: "Your PDF pattern is ready.",
            },
            {
              tone: "warning" as const,
              title: "Thread colors changed",
              description: "One or more floss colors were substituted to match your palette.",
            },
            {
              tone: "destructive" as const,
              title: "Save failed",
              description: "We couldn’t save your latest edits. Check your connection and try again.",
            },
          ].map((item) => (
            <Notification
              key={`passive-${item.tone}`}
              tone={item.tone}
              title={item.title}
              description={item.description}
              onDismiss={() => undefined}
            />
          ))}
        </div>

        <div className={styles.notificationStackCompact}>
          {[
            { tone: "info" as const, title: "Autosave on" },
            { tone: "success" as const, title: "Export ready" },
            { tone: "warning" as const, title: "Palette changed" },
            { tone: "destructive" as const, title: "Save failed" },
          ].map((item) => (
            <Notification
              key={`compact-${item.tone}`}
              tone={item.tone}
              title={item.title}
              layout="compact"
              onDismiss={() => undefined}
            />
          ))}
        </div>
      </div>

      <div className={styles.notificationStack}>
        <div className={styles.notificationLabel} style={typographyStyles.s}>
          Single-action alerts
        </div>
        <div className={styles.notificationStackCompact}>
          {[
            { tone: "info" as const, title: "Sign in to keep your chart", action: "Sign in" },
            { tone: "success" as const, title: "Pattern shared", action: "View access" },
            { tone: "warning" as const, title: "Low contrast detected", action: "Review colors" },
            { tone: "destructive" as const, title: "Unsaved work will be lost", action: "Review changes" },
          ].map((item) => (
            <Notification
              key={`action-${item.tone}`}
              tone={item.tone}
              title={item.title}
              actionLabel={item.action}
              layout="compact"
              neutralSurface
              onAction={() => undefined}
              onDismiss={() => undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PaletteDemo() {
  return (
    <div className={styles.paletteGrid}>
      {paletteGroups.map((group) => (
        <div key={group.title} className={styles.tokenGroup}>
          <h3 className={styles.cardTitle} style={typographyStyles.h5}>
            {group.title}
          </h3>
          <div className={styles.tokenStack}>
            {group.tokens.map((token) => (
              <div key={token.cssVar} className={styles.tokenRow}>
                <span
                  className={styles.tokenSwatch}
                  style={{ background: `var(${token.cssVar})` }}
                />
                <div className={styles.tokenMeta}>
                  <div className={styles.tokenTitleRow}>
                    <span style={typographyStyles.p2}>{token.name}</span>
                    <span
                      className={[
                        styles.tokenSourceBadge,
                        token.sourceType === "alias"
                          ? styles.tokenSourceBadgeAlias
                          : styles.tokenSourceBadgeLiteral,
                      ].join(" ")}
                      style={typographyStyles.s}
                    >
                      {token.sourceType === "alias" ? "Alias" : "Literal"}
                    </span>
                  </div>
                  <span className={styles.muted} style={typographyStyles.s}>
                    {token.cssVar}
                  </span>
                  {"aliasOf" in token && token.aliasOf ? (
                    <span className={styles.muted} style={typographyStyles.s}>
                      resolves to {token.aliasOf}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TypographyDemo() {
  return (
    <div className={styles.typeStack}>
      {typographyOrder.map((token) => {
        const spec = typographySpecs[token];
        return (
          <div key={token} className={styles.typeRow}>
            <div className={styles.typeMeta}>
              <span style={typographyStyles.h5}>{token}</span>
              <span className={styles.muted} style={typographyStyles.s}>
                {spec.size}/{spec.lineHeight} {spec.weight}
              </span>
            </div>
            <div className={styles.typeSample}>
              <span style={typographyStyles[token as DesignTypeToken]}>
                {spec.sample}
              </span>
              <span className={styles.muted} style={typographyStyles.s}>
                {spec.usage}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ControlsDemo() {
  const [checked, setChecked] = useState(true);
  const [traceVisible, setTraceVisible] = useState(true);
  const [opacity, setOpacity] = useState(68);
  const [gridSpacing, setGridSpacing] = useState(32);
  const [zoom, setZoom] = useState(56);
  const [traceScale, setTraceScale] = useState(125);

  return (
    <div className={styles.controlsGrid}>
      <div className={styles.controlSection}>
        <h3 className={styles.cardTitle} style={typographyStyles.h5}>
          Buttons
        </h3>
        <ButtonStateMatrix />
      </div>

      <div className={styles.controlSection}>
        <h3 className={styles.cardTitle} style={typographyStyles.h5}>
          Checkboxes
        </h3>
        <div className={styles.controlStack}>
          <label className={styles.checkboxRow}>
            <Checkbox
              checked={checked}
              onChange={(event) => setChecked(event.target.checked)}
            />
            <span style={typographyStyles.p2}>Show grid lines</span>
          </label>
          <label className={styles.checkboxRow}>
            <Checkbox checked={false} onChange={() => undefined} />
            <span style={typographyStyles.p2}>Include symbols</span>
          </label>
        </div>
      </div>

      <div className={styles.controlSection}>
        <h3 className={styles.cardTitle} style={typographyStyles.h5}>
          Toggles
        </h3>
        <div className={styles.controlStack}>
          <Toggle
            aria-label="Show trace"
            checked={traceVisible}
            label="Show trace"
            onChange={setTraceVisible}
          />
        </div>
      </div>

      <div className={styles.controlSection}>
        <h3 className={styles.cardTitle} style={typographyStyles.h5}>
          Sliders
        </h3>
        <SliderLibraryDemo
          gridSpacing={gridSpacing}
          opacity={opacity}
          setGridSpacing={setGridSpacing}
          setOpacity={setOpacity}
          setTraceScale={setTraceScale}
          setZoom={setZoom}
          traceScale={traceScale}
          zoom={zoom}
        />
      </div>
    </div>
  );
}

function ButtonStateMatrix() {
  const [selectedVariants, setSelectedVariants] = useState<
    Partial<Record<(typeof buttonVariants)[number]["variant"], boolean>>
  >({});

  return (
    <div className={styles.buttonMatrix}>
      <div className={styles.buttonMatrixHeaderCell} />
      <div className={styles.buttonMatrixHeaderCell} style={typographyStyles.s}>
        Default
      </div>
      <div className={styles.buttonMatrixHeaderCell} style={typographyStyles.s}>
        Hover
      </div>
      <div className={styles.buttonMatrixHeaderCell} style={typographyStyles.s}>
        Active
      </div>

      {buttonVariants.map(({ label, variant }) => (
        <ButtonStateRow
          key={variant}
          active={selectedVariants[variant] === true}
          label={label}
          onToggle={() =>
            setSelectedVariants((current) => ({
              ...current,
              [variant]: !current[variant],
            }))
          }
          variant={variant}
        />
      ))}
    </div>
  );
}

function ButtonStateRow({
  active,
  label,
  onToggle,
  variant,
}: {
  active: boolean;
  label: string;
  onToggle: () => void;
  variant: "primary" | "secondary" | "secondary2" | "destructive" | "ghost" | "ghostV2";
}) {
  return (
    <>
      <div className={styles.buttonMatrixLabel} style={typographyStyles.p2}>
        {label}
      </div>
      <div className={styles.buttonStateCell}>
        <Button type="button" variant={variant} active={active} onClick={onToggle}>
          {label}
        </Button>
      </div>
      <div className={styles.buttonStateCell}>
        <Button
          type="button"
          variant={variant}
          className={[styles.buttonDemoHover, styles.buttonStaticState].join(" ")}
          style={buttonHoverStyles[variant]}
          tabIndex={-1}
          aria-hidden="true"
        >
          {label}
        </Button>
      </div>
      <div className={styles.buttonStateCell}>
        <Button
          type="button"
          variant={variant}
          active
          inertWhenActive
          className={styles.buttonStaticState}
          tabIndex={-1}
          aria-hidden="true"
        >
          {label}
        </Button>
      </div>
    </>
  );
}

function SliderLibraryDemo({
  gridSpacing,
  opacity,
  setGridSpacing,
  setOpacity,
  setTraceScale,
  setZoom,
  traceScale,
  zoom,
}: {
  gridSpacing: number;
  opacity: number;
  setGridSpacing: (value: number) => void;
  setOpacity: (value: number) => void;
  setTraceScale: (value: number) => void;
  setZoom: (value: number) => void;
  traceScale: number;
  zoom: number;
}) {
  return (
    <div className={styles.sliderLibrary}>
      <div className={styles.sliderExample}>
        <Field label="Detached label + persistent readout">
          <div className={styles.sliderControlRow}>
            <Slider
              className={styles.sliderFullWidth}
              min="0"
              max="100"
              step="1"
              value={opacity}
              onChange={(event) => setOpacity(Number(event.target.value))}
            />
            <span className={styles.sliderValueReadout} style={typographyStyles.p2}>
              {opacity}%
            </span>
          </div>
        </Field>
      </div>

      <div className={styles.sliderExample}>
        <div className={styles.sliderInlineRow}>
          <span className={styles.sliderInlineLabel} style={typographyStyles.p2}>
            Inline label
          </span>
          <Slider
            className={styles.sliderFullWidth}
            min="25"
            max="200"
            step="1"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
          <span className={styles.sliderValueReadout} style={typographyStyles.p2}>
            {zoom}%
          </span>
        </div>
      </div>

      <div className={styles.sliderExample}>
        <Field label="Drag tooltip">
          <SliderWithTooltip
            ariaLabel="Grid spacing"
            max={64}
            min={8}
            onChange={setGridSpacing}
            step={1}
            suffix="px"
            value={gridSpacing}
          />
        </Field>
      </div>

      <div className={styles.sliderExample}>
        <Field label="Linked editable input">
          <div className={styles.sliderInputRow}>
            <Slider
              className={styles.sliderFullWidth}
              min="50"
              max="200"
              step="5"
              value={traceScale}
              onChange={(event) => setTraceScale(Number(event.target.value))}
            />
            <FieldInput
              type="text"
              inputMode="numeric"
              aria-label="Trace scale value"
              className={styles.sliderValueInput}
              value={traceScale}
              onChange={(event) => {
                const digitsOnly = event.target.value.replace(/\D/g, "");
                if (digitsOnly === "") {
                  setTraceScale(50);
                  return;
                }

                const nextValue = Number(digitsOnly);
                if (Number.isFinite(nextValue)) {
                  setTraceScale(Math.max(50, Math.min(200, nextValue)));
                }
              }}
            />
          </div>
        </Field>
      </div>
    </div>
  );
}

function SliderWithTooltip({
  ariaLabel,
  max,
  min,
  onChange,
  step,
  suffix = "",
  value,
}: {
  ariaLabel: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  suffix?: string;
  value: number;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const percent = ((value - min) / (max - min)) * 100;
  const tooltipLabel = `${value}${suffix}`;

  useEffect(() => {
    if (!showTooltip) {
      return;
    }

    function handlePointerUp() {
      setShowTooltip(false);
    }

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [showTooltip]);

  return (
    <div className={styles.sliderTooltipWrap}>
      <div
        className={[
          styles.sliderTooltip,
          showTooltip ? styles.sliderTooltipVisible : null,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden="true"
        style={{ left: `${percent}%` }}
      >
        {tooltipLabel}
      </div>
      <Slider
        className={styles.sliderFullWidth}
        min={String(min)}
        max={String(max)}
        step={String(step)}
        value={value}
        aria-label={ariaLabel}
        onPointerDown={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

function RailDemo() {
  const [activeId, setActiveId] = useState("document");

  return (
    <div className={styles.railShell}>
      <VerticalTabGroup
        activeId={activeId}
        ariaLabel="Editor sidebar navigation"
        className={styles.railTabs}
        items={railItems}
        onChange={setActiveId}
      />
    </div>
  );
}

function SidePanelDemo() {
  const [selectedId, setSelectedId] = useState("");

  return (
    <div className={styles.panelShell}>
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle} style={typographyStyles.h4}>
          Document
        </h3>
        <Button
          type="button"
          variant="ghostV2"
          size="sm"
          aria-label="Hide panel"
          title="Hide panel"
        >
          <img src="/icons/lucide/x.svg" alt="" aria-hidden="true" width="16" height="16" />
        </Button>
      </div>

      <div className={styles.panelContent}>
        <div className={styles.panelSection}>
          <h4 className={styles.cardTitle} style={typographyStyles.h3}>
            New Design
          </h4>
        </div>

        <div className={styles.panelSection}>
          <div className={styles.actionRow}>
            <Button type="button" variant="secondary">
              New design
            </Button>
            <Button type="button" variant="primary">
              Save
            </Button>
          </div>
        </div>

        <div className={styles.panelSection}>
          <SingleSelectDropdown
            ariaLabel="Saved designs"
            getItemLabel={(item) => item.label}
            getItemValue={(item) => item.id}
            items={savedDesigns}
            onValueChange={setSelectedId}
            placeholder="Load saved design"
            value={selectedId}
            wrapperClassName={styles.demoAnchor}
          />

          <Button type="button" variant="primary">
            Load
          </Button>
        </div>
      </div>
    </div>
  );
}

function ToolbarDemoBlock() {
  const [drawOpen, setDrawOpen] = useState(true);
  const [imageOpen, setImageOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [drawTool, setDrawTool] = useState<"paint" | "erase" | "none">("paint");

  const drawActive = drawOpen || drawTool !== "none";

  return (
    <div className={styles.toolbarStage}>
      <div className={styles.toolbarTop}>
        <Toolbar>
          <ToolbarGroup>
            <ToolbarButton type="button" swatch aria-label="Active color">
              <ToolbarSwatch color="#c97edf" />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarDivider />

          <ToolbarGroup>
            <ToolbarButton type="button" aria-label="Undo">
              <ToolbarIcon icon="/icons/lucide/undo.svg" />
            </ToolbarButton>
            <ToolbarButton type="button" aria-label="Redo">
              <ToolbarIcon icon="/icons/lucide/redo.svg" />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarDivider />

          <ToolbarGroup>
            <ToolbarAnchor>
              <ToolbarButton
                type="button"
                active={drawActive}
                onClick={() => {
                  setDrawOpen((value) => !value);
                  setImageOpen(false);
                  setSelectOpen(false);
                }}
              >
                <ToolbarIcon icon="/icons/lucide/brush_thick.svg" />
                <ToolbarLabel>Draw</ToolbarLabel>
              </ToolbarButton>

              {drawOpen ? (
                <ToolbarPopover role="dialog" aria-label="Draw tools">
                  <ToolbarSubtoolGroup>
                    <ToolbarButton type="button" disabled>
                      <ToolbarIcon icon="/icons/lucide/ruler.svg" />
                      <ToolbarLabel>Size</ToolbarLabel>
                    </ToolbarButton>

                    <ToolbarDivider />

                    <ToolbarButton
                      type="button"
                      active={drawTool === "paint"}
                      aria-label="Brush"
                      title="Brush"
                      onClick={() => {
                        setDrawTool("paint");
                        setDrawOpen(false);
                      }}
                    >
                      <ToolbarIcon icon="/icons/lucide/brush_thin.svg" />
                    </ToolbarButton>

                    <ToolbarButton
                      type="button"
                      active={drawTool === "erase"}
                      aria-label="Erase"
                      title="Erase"
                      onClick={() => {
                        setDrawTool("erase");
                        setDrawOpen(false);
                      }}
                    >
                      <ToolbarIcon icon="/icons/lucide/eraser.svg" />
                    </ToolbarButton>
                  </ToolbarSubtoolGroup>
                </ToolbarPopover>
              ) : null}
            </ToolbarAnchor>
          </ToolbarGroup>

          <ToolbarDivider />

          <ToolbarGroup>
            <ToolbarAnchor>
              <ToolbarButton
                type="button"
                active={selectOpen}
                onClick={() => {
                  setSelectOpen((value) => !value);
                  setDrawOpen(false);
                  setImageOpen(false);
                }}
              >
                <ToolbarIcon icon="/icons/lucide/vector_square.svg" />
                <ToolbarLabel>Select</ToolbarLabel>
              </ToolbarButton>

              {selectOpen ? (
                <ToolbarPopover role="dialog" aria-label="Selection tools">
                  <ToolbarSubtoolGroup>
                    <ToolbarButton type="button">
                      <ToolbarLabel>Fill</ToolbarLabel>
                    </ToolbarButton>
                    <ToolbarButton type="button" primary>
                      <ToolbarLabel>Done</ToolbarLabel>
                    </ToolbarButton>
                  </ToolbarSubtoolGroup>
                </ToolbarPopover>
              ) : null}
            </ToolbarAnchor>
          </ToolbarGroup>

          <ToolbarDivider />

          <ToolbarGroup>
            <ToolbarAnchor>
              <ToolbarButton
                type="button"
                active={imageOpen}
                onClick={() => {
                  setImageOpen((value) => !value);
                  setDrawOpen(false);
                  setSelectOpen(false);
                }}
              >
                <ToolbarIcon icon="/icons/lucide/image.svg" />
                <ToolbarLabel>Image</ToolbarLabel>
              </ToolbarButton>

              {imageOpen ? (
                <ToolbarPopover role="dialog" aria-label="Image tools" subtoolbar>
                  <ToolbarSubtoolGroup>
                    <ToolbarButton type="button">
                      <ToolbarIcon icon="/icons/lucide/eye.svg" />
                      <ToolbarLabel>Visible</ToolbarLabel>
                    </ToolbarButton>
                    <ToolbarButton type="button">
                      <ToolbarIcon icon="/icons/lucide/crop.svg" />
                      <ToolbarLabel>Crop</ToolbarLabel>
                    </ToolbarButton>
                  </ToolbarSubtoolGroup>
                </ToolbarPopover>
              ) : null}
            </ToolbarAnchor>
          </ToolbarGroup>

          <ToolbarDivider />

          <ToolbarGroup>
            <ToolbarButton type="button">
              <ToolbarIcon icon="/icons/lucide/trash.svg" />
              <ToolbarLabel>Clear</ToolbarLabel>
            </ToolbarButton>
          </ToolbarGroup>
        </Toolbar>
      </div>

      <div className={styles.toolbarBottomRight}>
        <Toolbar>
          <ToolbarGroup>
            <ToolbarButton type="button">
              <ToolbarLabel style={typographyStyles.h2}>-</ToolbarLabel>
            </ToolbarButton>
            <ToolbarMeta style={typographyStyles.p2}>
              <strong>100%</strong>
            </ToolbarMeta>
            <ToolbarButton type="button">
              <ToolbarLabel style={typographyStyles.h2}>+</ToolbarLabel>
            </ToolbarButton>
          </ToolbarGroup>
        </Toolbar>
      </div>
    </div>
  );
}
