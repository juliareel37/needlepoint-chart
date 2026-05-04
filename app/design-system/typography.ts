import type { CSSProperties } from "react";

export type DesignTypeToken = "h1" | "h2" | "h3" | "h4" | "h5" | "p1" | "p2" | "s";
export type MarketingTypeToken =
  | "eyebrow"
  | "bodyLg"
  | "body"
  | "bodySm"
  | "titleSm"
  | "title"
  | "featureTitle"
  | "display"
  | "sectionTitle"
  | "footerTitle";
export type DesignFontWeightToken = "regular" | "medium" | "semibold" | "bold";

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const satisfies Record<DesignFontWeightToken, 400 | 500 | 600 | 700>;

type TypographySpec<
  Size extends number | string = number,
  LineHeight extends number | string = number,
> = {
  label: string;
  size: Size;
  lineHeight: LineHeight;
  weight: (typeof fontWeights)[DesignFontWeightToken];
  usage: string;
  sample: string;
  fontFamily?: string;
  letterSpacing?: string;
};

function createTypographyStyles<
  TToken extends string,
  TSize extends number | string,
  TLineHeight extends number | string,
>(
  specs: Record<TToken, TypographySpec<TSize, TLineHeight>>,
  options?: { numericLineHeightAsPx?: boolean }
) {
  return Object.fromEntries(
    (Object.keys(specs) as TToken[]).map((token) => {
      const spec = specs[token];
      return [
        token,
        {
          fontSize: spec.size,
          lineHeight:
            typeof spec.lineHeight === "number" && options?.numericLineHeightAsPx
              ? `${spec.lineHeight}px`
              : spec.lineHeight,
          fontWeight: spec.weight,
          ...(spec.fontFamily ? { fontFamily: spec.fontFamily } : null),
          ...(spec.letterSpacing ? { letterSpacing: spec.letterSpacing } : null),
        } satisfies CSSProperties,
      ];
    })
  ) as Record<TToken, CSSProperties>;
}

export const uiTypographyOrder: DesignTypeToken[] = ["h1", "h2", "h3", "h4", "h5", "p1", "p2", "s"];

export const uiTypographySpecs: Record<DesignTypeToken, TypographySpec<number, number>> = {
  h1: {
    label: "h1",
    size: 28,
    lineHeight: 36,
    weight: fontWeights.bold,
    usage: "hero titles, page titles",
    sample: "Header One",
  },
  h2: {
    label: "h2",
    size: 24,
    lineHeight: 30,
    weight: fontWeights.bold,
    usage: "section titles, major dialogs",
    sample: "Header Two",
  },
  h3: {
    label: "h3",
    size: 20,
    lineHeight: 24,
    weight: fontWeights.bold,
    usage: "subsection titles",
    sample: "Header Three",
  },
  h4: {
    label: "h4",
    size: 16,
    lineHeight: 20,
    weight: fontWeights.bold,
    usage: "minor headings, card titles",
    sample: "Header Four",
  },
  h5: {
    label: "h5",
    size: 14,
    lineHeight: 18,
    weight: fontWeights.bold,
    usage: "compact emphasis headings, alert titles",
    sample: "Header Five",
  },
  p1: {
    label: "p1",
    size: 13,
    lineHeight: 20,
    weight: fontWeights.medium,
    usage: "primary body copy",
    sample: "Primary body copy",
  },
  p2: {
    label: "p2",
    size: 12,
    lineHeight: 18,
    weight: fontWeights.medium,
    usage: "secondary UI/body text",
    sample: "Secondary body copy",
  },
  s: {
    label: "s",
    size: 11,
    lineHeight: 14,
    weight: fontWeights.regular,
    usage: "supporting labels, dense UI",
    sample: "Support text",
  },
};

export const uiTypographyStyles = createTypographyStyles(uiTypographySpecs, {
  numericLineHeightAsPx: true,
});

export const marketingTypographyOrder: MarketingTypeToken[] = [
  "eyebrow",
  "bodyLg",
  "body",
  "bodySm",
  "titleSm",
  "title",
  "featureTitle",
  "display",
  "sectionTitle",
  "footerTitle",
];

export const marketingTypographySpecs: Record<
  MarketingTypeToken,
  TypographySpec<string, number | string>
> = {
  eyebrow: {
    label: "eyebrow",
    size: "11px",
    lineHeight: "14px",
    weight: fontWeights.regular,
    usage: "capsule labels, section kickers, metadata",
    sample: "Work in progress",
    letterSpacing: "0.14em",
  },
  bodyLg: {
    label: "bodyLg",
    size: "clamp(1rem, .8vw, 1.1rem)",
    lineHeight: 1.65,
    weight: fontWeights.medium,
    usage: "hero body copy on marketing pages",
    sample: "A systematic canvas for modern needlepoint and cross-stitch designers.",
  },
  body: {
    label: "body",
    size: "clamp(0.95rem, 0.9vw, 1rem)",
    lineHeight: 1.6,
    weight: fontWeights.medium,
    usage: "standard landing-page body copy",
    sample: "Wippa treats every needlepoint chart like a technical drawing.",
  },
  bodySm: {
    label: "bodySm",
    size: "clamp(0.84rem, 0.82vw, 0.875rem)",
    lineHeight: 1.55,
    weight: fontWeights.medium,
    usage: "secondary landing-page copy",
    sample: "Thread-accurate color mapped to real materials.",
  },
  titleSm: {
    label: "titleSm",
    size: "clamp(1.1rem, 1.15vw, 1.25rem)",
    lineHeight: 1.2,
    weight: fontWeights.semibold,
    usage: "compact sans-serif marketing titles",
    sample: "Meadow_Study_IV.wip",
    letterSpacing: "-0.02em",
  },
  title: {
    label: "title",
    size: "clamp(1.45rem, 2vw, 1.75rem)",
    lineHeight: 1.1,
    weight: fontWeights.semibold,
    usage: "sans-serif marketing subheads and prominent card titles",
    sample: "Custom Grid Math",
    letterSpacing: "-0.03em",
  },
  featureTitle: {
    label: "featureTitle",
    size: "clamp(1.45rem, 2vw, 1.75rem)",
    lineHeight: 1.1,
    weight: fontWeights.bold,
    usage: "feature cards and supporting marketing headings",
    sample: "Pixel-perfect placement.",
    fontFamily: "Playfair Display, serif",
    letterSpacing: "-0.04em",
  },
  display: {
    label: "display",
    size: "clamp(3rem, 6.5vw, 4.5rem)",
    lineHeight: 0.92,
    weight: fontWeights.bold,
    usage: "hero display title",
    sample: "Every work in progress, in one place.",
    fontFamily: "Playfair Display, serif",
    letterSpacing: "-0.08em",
  },
  sectionTitle: {
    label: "sectionTitle",
    size: "clamp(2.1rem, 4.1vw, 3.35rem)",
    lineHeight: 0.96,
    weight: fontWeights.bold,
    usage: "section titles on marketing pages",
    sample: "Built for the way designers actually draft.",
    fontFamily: "Playfair Display, serif",
    letterSpacing: "-0.06em",
  },
  footerTitle: {
    label: "footerTitle",
    size: "clamp(2rem, 4.5vw, 3.6rem)",
    lineHeight: 0.92,
    weight: fontWeights.bold,
    usage: "footer call-to-action title",
    sample: "Your next pattern is one grid square away.",
    fontFamily: "Playfair Display, serif",
    letterSpacing: "-0.08em",
  },
};

export const marketingTypographyStyles = createTypographyStyles(marketingTypographySpecs);

// Backwards-compatible aliases for the existing app/editor typography scale.
export const typographyOrder = uiTypographyOrder;
export const typographySpecs = uiTypographySpecs;
export const typographyStyles = uiTypographyStyles;
