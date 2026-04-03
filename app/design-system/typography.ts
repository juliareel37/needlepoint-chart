import type { CSSProperties } from "react";

export type DesignTypeToken =
  | "text2xs"
  | "textXs"
  | "textSm"
  | "textMd"
  | "textLg"
  | "textXl";

type TypographySpec = {
  label: string;
  size: number;
  lineHeight: number;
  weight: 400 | 500 | 700;
  usage: string;
  sample: string;
};

export const typographyOrder: DesignTypeToken[] = [
  "text2xs",
  "textXs",
  "textSm",
  "textMd",
  "textLg",
  "textXl",
];

export const typographySpecs: Record<DesignTypeToken, TypographySpec> = {
  text2xs: {
    label: "text-2xs",
    size: 10,
    lineHeight: 14,
    weight: 400,
    usage: "micro labels, rulers",
    sample: "Micro label",
  },
  textXs: {
    label: "text-xs",
    size: 11,
    lineHeight: 16,
    weight: 400,
    usage: "dense controls",
    sample: "Dense control text",
  },
  textSm: {
    label: "text-sm",
    size: 12,
    lineHeight: 16,
    weight: 400,
    usage: "default UI text",
    sample: "Default UI text",
  },
  textMd: {
    label: "text-md",
    size: 13,
    lineHeight: 18,
    weight: 500,
    usage: "slightly emphasized",
    sample: "Slightly emphasized",
  },
  textLg: {
    label: "text-lg",
    size: 16,
    lineHeight: 24,
    weight: 500,
    usage: "dialogs, headers",
    sample: "Dialog and header text",
  },
  textXl: {
    label: "text-xl",
    size: 20,
    lineHeight: 28,
    weight: 700,
    usage: "major modal titles",
    sample: "Major modal title",
  },
};

export const typographyStyles = Object.fromEntries(
  typographyOrder.map((token) => {
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
