import type { CSSProperties } from "react";

export type DesignTypeToken = "h1" | "h2" | "h3" | "h4" | "h5" | "p1" | "p2" | "s";

type TypographySpec = {
  label: string;
  size: number;
  lineHeight: number;
  weight: 400 | 700;
  usage: string;
  sample: string;
};

export const typographyOrder: DesignTypeToken[] = ["h1", "h2", "h3", "h4", "h5", "p1", "p2", "s"];

export const typographySpecs: Record<DesignTypeToken, TypographySpec> = {
  h1: {
    label: "h1",
    size: 28,
    lineHeight: 36,
    weight: 700,
    usage: "hero titles, page titles",
    sample: "Header One",
  },
  h2: {
    label: "h2",
    size: 22,
    lineHeight: 30,
    weight: 700,
    usage: "section titles, major dialogs",
    sample: "Header Two",
  },
  h3: {
    label: "h3",
    size: 18,
    lineHeight: 24,
    weight: 700,
    usage: "subsection titles",
    sample: "Header Three",
  },
  h4: {
    label: "h4",
    size: 15,
    lineHeight: 20,
    weight: 700,
    usage: "minor headings, card titles",
    sample: "Header Four",
  },
  h5: {
    label: "h5",
    size: 13,
    lineHeight: 18,
    weight: 700,
    usage: "compact emphasis headings, alert titles",
    sample: "Header Five",
  },
  p1: {
    label: "p1",
    size: 14,
    lineHeight: 20,
    weight: 400,
    usage: "primary body copy",
    sample: "Primary body copy",
  },
  p2: {
    label: "p2",
    size: 12,
    lineHeight: 18,
    weight: 400,
    usage: "secondary UI/body text",
    sample: "Secondary body copy",
  },
  s: {
    label: "s",
    size: 10,
    lineHeight: 14,
    weight: 400,
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
