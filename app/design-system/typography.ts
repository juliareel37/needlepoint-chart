import type { CSSProperties } from "react";

export type DesignTypeToken = "h1" | "h2" | "h3" | "h4" | "h5" | "p1" | "p2" | "s";
export type DesignFontWeightToken = "regular" | "medium" | "semibold" | "bold";

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const satisfies Record<DesignFontWeightToken, 400 | 500 | 600 | 700>;

type TypographySpec = {
  label: string;
  size: number;
  lineHeight: number;
  weight: (typeof fontWeights)[DesignFontWeightToken];
  usage: string;
  sample: string;
};

export const typographyOrder: DesignTypeToken[] = ["h1", "h2", "h3", "h4", "h5", "p1", "p2", "s"];

export const typographySpecs: Record<DesignTypeToken, TypographySpec> = {
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

export const typographyStyles = Object.fromEntries(
  (Object.keys(typographySpecs) as DesignTypeToken[]).map((token) => {
    const spec = typographySpecs[token];
    return [
      token,
      {
        fontSize: spec.size,
        lineHeight: `${spec.lineHeight}px`,
        fontWeight: spec.weight,
      } satisfies CSSProperties,
    ];
  })
) as Record<DesignTypeToken, CSSProperties>;
