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
  ButtonIcon,
  Button,
  Checkbox,
  Field,
  FieldInput,
  Modal,
  Notification,
  SegmentedControl,
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
  { id: "document", label: "Document", icon: "/icons/legacy/file.svg" },
  { id: "color", label: "Color", icon: "/icons/legacy/grid_view.svg" },
  { id: "trace", label: "Trace", icon: "/icons/legacy/photo.svg" },
];

const savedDesigns = [
  { id: "sunset_12x18", label: "Sunset Study (12x18)" },
  { id: "flora_24x24", label: "Flora Tiles (24x24)" },
  { id: "portrait_32x40", label: "Portrait Draft (32x40)" },
  { id: "bird_18x18", label: "Bird Sampler (18x18)" },
  { id: "alpha_10x10", label: "Alphabet Block (10x10)" },
  { id: "garden_28x20", label: "Garden Border (28x20)" },
];

const waitlistCtaCurveFirstThirdPath =
  "M-60 392 C 88 420 224 360 310 270 C 384 176 310 120 250 160 C 182 208 226 346 378 360 C 560 376 690 296 756 174 C 856 -12 1126 36 1300 106 C 1500 186 1498 372 1372 398 C 1246 424 1192 290 1278 196 C 1370 96 1558 106 1688 126 C 1770 138 1822 58 1874 -44";

const marketingCurveMasterPath = `${waitlistCtaCurveFirstThirdPath} C 1970 -108 2118 -42 2198 82 C 2290 226 2130 318 2036 236 C 1958 168 2052 72 2188 116 C 2368 174 2388 346 2598 366 C 2744 378 2864 326 2912 244 C 2964 156 2884 68 2768 118 C 2638 174 2702 332 2864 350 C 3108 378 3198 18 3440 88 C 3630 142 3638 342 3820 388 C 4020 438 4218 332 4300 202 C 4380 56 4530 36 4700 126 C 4892 228 4838 392 4688 368 C 4558 348 4560 190 4708 166 C 4936 130 4962 380 5140 328 C 5320 288 5430 164 5582 42`;

const marketingVectors = [
  {
    id: "marketing-curve-master",
    name: "Marketing Curve Master",
    status: "Source",
    usage: "One continuous path that future decorative curve placements should slice from.",
    path: marketingCurveMasterPath,
    viewBox: "-60 -140 5660 700",
    wide: true,
  },
  {
    id: "waitlist-cta-curve",
    name: "Waitlist CTA Curve",
    status: "Live",
    usage: "First third of the master curve, used behind the landing page waitlist call-to-action.",
    path: marketingCurveMasterPath,
    viewBox: "0 0 1800 480",
    wide: false,
  },
  {
    id: "hero-thread-loop",
    name: "Hero Thread Loop",
    status: "Available",
    usage: "Middle third slice, reserved for a future hero or product-flow accent.",
    path: marketingCurveMasterPath,
    viewBox: "1800 0 1800 480",
    wide: false,
  },
  {
    id: "panel-stitch-wave",
    name: "Panel Stitch Wave",
    status: "Available",
    usage: "Final third slice, reserved for a future feature divider or product education section.",
    path: marketingCurveMasterPath,
    viewBox: "3600 0 1800 480",
    wide: false,
  },
] as const;

const shortMarketingVectors = [
  {
    id: "playful-hook-loop",
    name: "Playful Hook Loop",
    status: "Available",
    usage: "Compact accent for callouts, badges, or small editorial moments.",
    path: "M-34 170 C 44 126 96 80 132 38 C 174 -10 224 42 176 92 C 134 136 112 186 168 198 C 234 214 298 142 258 92 C 220 44 156 88 178 154 C 208 244 374 246 560 208",
    viewBox: "0 0 520 280",
    wide: false,
  },
  {
    id: "ribbon-switchback",
    name: "Ribbon Switchback",
    status: "Available",
    usage: "Large hero crop or background flourish when the layout needs more motion.",
    path: "M-56 76 C 74 156 220 -12 314 50 C 410 114 210 176 112 190 C -2 206 16 322 160 304 C 276 288 412 204 494 270 C 586 344 438 430 300 402 C 172 376 138 488 272 516 C 422 548 552 462 606 354",
    viewBox: "0 0 560 520",
    wide: false,
  },
  {
    id: "wandering-stitch-line",
    name: "Wandering Stitch Line",
    status: "Available",
    usage: "Tall crop for side panels, vertical promos, or image overlays.",
    path: "M112 -42 C 216 40 22 70 54 176 C 86 286 226 132 284 196 C 344 264 192 284 216 360 C 242 442 380 292 420 390 C 466 504 268 540 148 514 C 28 488 28 626 176 624 C 314 622 450 542 528 606",
    viewBox: "0 0 560 660",
    wide: false,
  },
  {
    id: "double-knot-sweep",
    name: "Double Knot Sweep",
    status: "Available",
    usage: "Horizontal divider or form-adjacent accent with a little extra personality.",
    path: "M-42 162 C 64 118 150 136 210 178 C 272 222 158 282 120 218 C 80 150 170 70 260 106 C 356 146 326 282 424 286 C 526 290 478 140 392 176 C 302 214 366 356 502 344 C 620 334 690 238 772 214",
    viewBox: "0 0 760 420",
    wide: false,
  },
  {
    id: "landscape-text-frame",
    name: "Landscape Text Accent",
    status: "Available",
    usage: "Calmer landscape accent that avoids the copy center while adding one playful side loop.",
    path: "M-96 342 C 72 262 230 252 336 314 C 252 292 148 330 154 410 C 160 490 314 478 382 384 C 424 326 380 304 336 314 C 486 328 616 390 760 414 C 948 446 1104 424 1248 374 C 1418 312 1562 252 1768 218",
    viewBox: "0 0 1720 520",
    wide: true,
  },
] as const;

const vectorDisplayBackgroundOptions = [
  { id: "green", label: "Green", value: "var(--green-lightest)" },
  { id: "cream", label: "Cream", value: "var(--butter-yellow)" },
  { id: "pink", label: "Pink", value: "var(--accent-pink)" },
  { id: "white", label: "White", value: "var(--neutral-0)" },
  { id: "ink", label: "Ink", value: "var(--neutral-900)" },
] as const;

const vectorDisplayCurveOptions = [
  { id: "green", label: "Green", value: "var(--green-med)" },
  { id: "brand", label: "Deep green", value: "var(--brand-600)" },
  { id: "pink", label: "Pink", value: "var(--secondary-300)" },
  { id: "orange", label: "Orange", value: "#e44716" },
  { id: "cream", label: "Cream", value: "var(--butter-yellow)" },
  { id: "ink", label: "Ink", value: "var(--neutral-900)" },
] as const;

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
      { name: "brand-50", cssVar: "--brand-50", sourceType: "literal" },
      { name: "brand-100", cssVar: "--brand-100", sourceType: "literal" },
      { name: "brand-200", cssVar: "--brand-200", sourceType: "literal" },
      { name: "brand-300", cssVar: "--brand-300", sourceType: "literal" },
      { name: "brand-400", cssVar: "--brand-400", sourceType: "literal" },
      { name: "brand-500", cssVar: "--brand-500", sourceType: "literal" },
      { name: "brand-600", cssVar: "--brand-600", sourceType: "literal" },
    ],
  },
  {
    title: "Secondary",
    tokens: [
      { name: "brand-50", cssVar: "--secondary-50", sourceType: "literal" },
      { name: "brand-100", cssVar: "--secondary-100", sourceType: "literal" },
      { name: "brand-300", cssVar: "--secondary-300", sourceType: "literal" },
      { name: "brand-400", cssVar: "--secondary-400", sourceType: "literal" },
      { name: "brand-700", cssVar: "--secondary-700", sourceType: "literal" },
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
  variant: "primary" | "secondary" | "outlined" | "destructive" | "ghost" | "ghostV2";
  label: string;
}> = [
  { variant: "primary", label: "Primary" },
  { variant: "secondary", label: "Secondary" },
  { variant: "outlined", label: "outlined" },
  // { variant: "destructive", label: "Destructive" },
  // { variant: "ghost", label: "Ghost" },
  { variant: "ghostV2", label: "Ghost v2" },
];

const buttonHoverStyles: Record<
  "primary" | "secondary" | "outlined" | "destructive" | "ghost" | "ghostV2",
  CSSProperties
> = {
  primary: {
    background: "var(--button-primary-hover)",
  },
  secondary: {
    background: "var(--button-secondary-hover)",
  },
  outlined: {
    background: "var(--button-outlined-hover)",
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
  const { resolvedThemeMode, themeMode, setThemeMode } = useThemeMode();

  return (
    <main className={styles.page}>
      <div className={styles.stack}>
        <header className={styles.hero}>
          <div className={styles.heroTopRow}>
            <Link href="/editor" className={styles.tempLink}>
              Back to editor
            </Link>
            <div className={styles.themeToggleWrap}>
              <span className={styles.themeToggleMeta} style={typographyStyles.s}>
                {themeMode === "system"
                  ? `System (${resolvedThemeMode === "dark" ? "Dark" : "Light"})`
                  : `${themeMode === "dark" ? "Dark" : "Light"} mode`}
              </span>
              <SegmentedControl
                ariaLabel="Application theme"
                value={themeMode}
                onChange={setThemeMode}
                options={[
                  {
                    label: (
                      <>
                        <ButtonIcon icon="/icons/lucide/sun.svg" />
                        Light
                      </>
                    ),
                    value: "light",
                  },
                  {
                    label: "System",
                    value: "system",
                  },
                  {
                    label: (
                      <>
                        <ButtonIcon icon="/icons/lucide/moon.svg" />
                        Dark
                      </>
                    ),
                    value: "dark",
                  },
                ]}
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
              Marketing Vectors
            </h2>
            <p className={styles.sectionBody} style={typographyStyles.p2}>
              Shared decorative vector assets for landing and marketing surfaces.
              These are slices of one long curve, so placements can line up side by side.
            </p>
          </div>
          <MarketingVectorsDemo />
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

function MarketingVectorsDemo() {
  const [backgroundColorId, setBackgroundColorId] =
    useState<(typeof vectorDisplayBackgroundOptions)[number]["id"]>("green");
  const [curveColorId, setCurveColorId] =
    useState<(typeof vectorDisplayCurveOptions)[number]["id"]>("green");
  const selectedBackgroundColor =
    vectorDisplayBackgroundOptions.find((option) => option.id === backgroundColorId) ??
    vectorDisplayBackgroundOptions[0];
  const selectedCurveColor =
    vectorDisplayCurveOptions.find((option) => option.id === curveColorId) ??
    vectorDisplayCurveOptions[0];
  const vectorDisplayStyle = {
    "--vector-preview-bg": selectedBackgroundColor.value,
    "--vector-preview-line": selectedCurveColor.value,
  } as CSSProperties;

  return (
    <div className={styles.vectorLibraryStack} style={vectorDisplayStyle}>
      <div className={styles.vectorDisplayControls} aria-label="Vector preview colors">
        <VectorColorPicker
          label="Background"
          options={vectorDisplayBackgroundOptions}
          value={backgroundColorId}
          onChange={setBackgroundColorId}
        />
        <VectorColorPicker
          label="Curve"
          options={vectorDisplayCurveOptions}
          value={curveColorId}
          onChange={setCurveColorId}
        />
      </div>

      <div className={styles.vectorCollection}>
        <div className={styles.vectorCollectionHeader}>
          <h3 className={styles.vectorCollectionTitle} style={typographyStyles.h5}>
            Long continuous curve
          </h3>
          <p className={styles.muted} style={typographyStyles.p2}>
            One source path with viewBox slices for connected campaign moments.
          </p>
        </div>
        <div className={styles.vectorGrid}>
          {marketingVectors.map((vector) => (
            <VectorCard key={vector.id} vector={vector} />
          ))}
        </div>
      </div>

      <div className={styles.vectorCollection}>
        <div className={styles.vectorCollectionHeader}>
          <h3 className={styles.vectorCollectionTitle} style={typographyStyles.h5}>
            Short playful curves
          </h3>
          <p className={styles.muted} style={typographyStyles.p2}>
            Standalone accents for tighter surfaces, with the same stroke width as the master curve.
          </p>
        </div>
        <div className={styles.vectorGrid}>
          {shortMarketingVectors.map((vector) => (
            <VectorCard key={vector.id} vector={vector} />
          ))}
        </div>
      </div>
    </div>
  );
}

type VectorDisplayColorOption<T extends string = string> = {
  id: T;
  label: string;
  value: string;
};

function VectorColorPicker<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: readonly VectorDisplayColorOption<T>[];
  value: T;
}) {
  return (
    <div className={styles.vectorColorPicker}>
      <span className={styles.vectorColorPickerLabel} style={typographyStyles.s}>
        {label}
      </span>
      <div className={styles.vectorColorSwatches}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={styles.vectorColorSwatchButton}
            aria-label={`${label}: ${option.label}`}
            aria-pressed={value === option.id}
            title={option.label}
            onClick={() => onChange(option.id)}
          >
            <span
              className={styles.vectorColorSwatch}
              style={{ background: option.value }}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

type MarketingVector = (typeof marketingVectors)[number] | (typeof shortMarketingVectors)[number];

function VectorCard({ vector }: { vector: MarketingVector }) {
  return (
    <article
      className={[styles.vectorCard, vector.wide ? styles.vectorCardWide : null]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.vectorPreview} aria-hidden="true">
        <svg className={styles.vectorSvg} viewBox={vector.viewBox} role="img" focusable="false">
          <path d={vector.path} />
        </svg>
      </div>
      <div className={styles.vectorMeta}>
        <div className={styles.vectorTitleRow}>
          <h3 className={styles.cardTitle} style={typographyStyles.h5}>
            {vector.name}
          </h3>
          <span
            className={[
              styles.vectorStatus,
              vector.status === "Source" ? styles.vectorStatusSource : styles.vectorStatusLive,
            ].join(" ")}
            style={typographyStyles.s}
          >
            {vector.status}
          </span>
        </div>
        <p className={styles.muted} style={typographyStyles.p2}>
          {vector.usage}
        </p>
        <code className={styles.vectorCode}>{vector.id}</code>
      </div>
    </article>
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
  variant: "primary" | "secondary" | "outlined" | "destructive" | "ghost" | "ghostV2";
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
