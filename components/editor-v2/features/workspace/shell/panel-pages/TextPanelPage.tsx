"use client";

import { Button, ButtonIcon } from "@/components/design-system";
import { typographyStyles } from "@/app/design-system/typography";
import {
  DEFAULT_DMC_COLOR_ID,
  DMC_COLOR_LIBRARY_BY_ID,
} from "@/lib/editor-v2/editor/color-library";
import type {
  EditorStore,
  PaletteColor,
  TextPlacementSession,
} from "@/lib/editor-v2/editor/store";
import { measureIntrinsicText } from "@/lib/editor-v2/editor/text/measureIntrinsicText";
import type { GridWorldMetrics, WorldPoint } from "@/lib/editor-v2/editor/viewport";
import {
  createBeginTextPlacementCommand,
  createSetToolWithColorCommand,
} from "../../workspaceCommands";
import { getInitialPlacementTransform } from "./getInitialPlacementTransform";
import styles from "../EditorV2Shell.module.css";

const DEFAULT_BASE_FONT_SIZE = 32;
const DEFAULT_FONT_FAMILY = "Inter";
const DEFAULT_INITIAL_WIDTH_RATIO = 0.5;
const DEFAULT_TEXT_PLACEHOLDER = "Text";
const QUICK_ADD_PRESETS: TextQuickAddPreset[] = [
  {
    id: "homebody",
    label: "Homebody",
    text: "Homebody",
    fontFamily: "DM Serif Display",
    baseFontSize: 30,
    fontWeight: 400,
    fontStyle: "normal",
    underline: false,
    colorCode: "3822",
    previewTone: "neutral",
  },
  {
    id: "stay-curious",
    label: "Stay Curious",
    text: "Stay Curious",
    fontFamily: "Syne",
    baseFontSize: 28,
    fontWeight: 700,
    fontStyle: "normal",
    underline: false,
    colorCode: "3846",
    previewTone: "neutral",
  },
  {
    id: "let-them",
    label: "Let Them",
    text: "Let Them",
    fontFamily: "Great Vibes",
    baseFontSize: 32,
    fontWeight: 400,
    fontStyle: "normal",
    underline: false,
    colorCode: "315",
    previewTone: "neutral",
  },
  {
    id: "cozy-home",
    label: "Cozy Home",
    text: "Cozy Home",
    fontFamily: "Bree Serif",
    baseFontSize: 26,
    fontWeight: 400,
    fontStyle: "normal",
    underline: false,
    colorCode: "433",
    previewTone: "neutral",
  },
  {
    id: "wild-bloom",
    label: "Wild Bloom",
    text: "Wild Bloom",
    fontFamily: "Caveat",
    baseFontSize: 30,
    fontWeight: 700,
    fontStyle: "normal",
    underline: false,
    colorCode: "958",
    previewTone: "neutral",
  },
  {
    id: "love-ya",
    label: "Love ya. Mean it.",
    text: "Love ya. Mean it.",
    fontFamily: "Bebas Neue",
    baseFontSize: 34,
    fontWeight: 700,
    fontStyle: "normal",
    underline: false,
    colorCode: "350",
    previewTone: "neutral",
  },
  {
    id: "good-vibes",
    label: "Good Vibes",
    text: "Good Vibes",
    fontFamily: "Pacifico",
    baseFontSize: 28,
    fontWeight: 400,
    fontStyle: "normal",
    underline: false,
    colorCode: "352",
    previewTone: "neutral",
  },
  {
    id: "for-the-record",
    label: "For The Record",
    text: "For The Record",
    fontFamily: "Fjalla One",
    baseFontSize: 24,
    fontWeight: 400,
    fontStyle: "italic",
    underline: false,
    colorCode: "3371",
    previewTone: "neutral",
  },
  {
    id: "tini-time",
    label: "Tini time!",
    text: "Tini time!",
    fontFamily: "Allura",
    baseFontSize: 34,
    fontWeight: 400,
    fontStyle: "normal",
    underline: false,
    colorCode: "761",
    previewTone: "neutral",
  },
  {
    id: "new-arrivals",
    label: "New Arrivals",
    text: "New Arrivals",
    fontFamily: "Montserrat",
    baseFontSize: 22,
    fontWeight: 700,
    fontStyle: "normal",
    underline: false,
    colorCode: "699",
    previewTone: "neutral",
  },
];

interface TextPanelPageProps {
  activeColorId: string | null;
  dispatch: EditorStore["dispatch"];
  gridMetrics: GridWorldMetrics;
  palette: PaletteColor[];
  placement: TextPlacementSession | null;
  viewportCenter: WorldPoint | null;
  viewportWidth: number | null;
}

export function TextPanelPage({
  activeColorId,
  dispatch,
  gridMetrics,
  palette,
  placement,
  viewportCenter,
  viewportWidth,
}: TextPanelPageProps) {
  const placementActive = Boolean(placement);

  return (
    <section className={styles.sidebarSection}>
      <div className={styles.sidebarPageBody}>
        <div className={styles.sidebarSubsection}>
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={placementActive}
            onClick={() => {
              beginTextPlacement(
                {
                  text: DEFAULT_TEXT_PLACEHOLDER,
                  fontFamily: DEFAULT_FONT_FAMILY,
                  baseFontSize: DEFAULT_BASE_FONT_SIZE,
                  fontStyle: "normal",
                  fontWeight: 400,
                  underline: false,
                  colorId: activeColorId ?? DEFAULT_DMC_COLOR_ID,
                },
                {
                  dispatch,
                  gridMetrics,
                  viewportCenter,
                  viewportWidth,
                },
              );
            }}
          >
            <ButtonIcon icon="/icons/lucide/plus.svg" />
            Add text
          </Button>

          {/* <p className={styles.sidebarSubsectionHint} style={typographyStyles.p2}>
            Quick add a styled text box, then edit it on canvas before converting it to stitches.
          </p> */}
        </div>

        <div className={styles.sidebarSubsection}>
          <div className={styles.sidebarSubsectionHeader}>
            <h3 style={typographyStyles.h5}>Styles</h3>
            {/* <p className={styles.sidebarSubsectionHint} style={typographyStyles.p2}>
              10 starters
            </p> */}
          </div>

          <div className={styles.textQuickAddGrid}>
            {QUICK_ADD_PRESETS.map((preset) => {
              const resolvedColorId = resolvePresetColorId(palette, preset.colorCode, activeColorId);
              const previewColorHex = resolvePreviewColorHex(palette, resolvedColorId);

              return (
                <button
                  key={preset.id}
                  type="button"
                  className={[styles.iconLibraryCard, styles.textQuickAddCard].join(" ")}
                  disabled={placementActive}
                  aria-label={`Add ${preset.label} text style`}
                  title={`Add ${preset.label}`}
                  data-tone={preset.previewTone}
                  onClick={() => {
                    beginTextPlacement(
                      {
                        text: preset.text,
                        fontFamily: preset.fontFamily,
                        baseFontSize: preset.baseFontSize,
                        fontStyle: preset.fontStyle,
                        fontWeight: preset.fontWeight,
                        underline: preset.underline,
                        colorId: resolvedColorId,
                      },
                      {
                        dispatch,
                        gridMetrics,
                        viewportCenter,
                        viewportWidth,
                      },
                    );
                  }}
                >
                  <span className={styles.textQuickAddPreview} aria-hidden="true">
                    <span
                      className={styles.textQuickAddSample}
                      style={{
                        color: previewColorHex,
                        fontFamily: preset.fontFamily,
                        fontStyle: preset.fontStyle,
                        fontWeight: preset.fontWeight,
                        fontSize: `${Math.max(16, preset.baseFontSize * 0.62)}px`,
                        textDecoration: preset.underline ? "underline" : "none",
                      }}
                    >
                      {preset.text}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

interface TextQuickAddPreset {
  id: string;
  label: string;
  text: string;
  fontFamily: string;
  baseFontSize: number;
  fontStyle: "normal" | "italic";
  fontWeight: number;
  underline: boolean;
  colorCode: string;
  previewTone: "neutral" | "neutral" | "neutral" | "neutral" | "neutral";
}

function beginTextPlacement(
  preset: Omit<TextQuickAddPreset, "id" | "label" | "colorCode" | "previewHex" | "previewTone"> & {
    colorId: string;
  },
  context: {
    dispatch: EditorStore["dispatch"];
    gridMetrics: GridWorldMetrics;
    viewportCenter: WorldPoint | null;
    viewportWidth: number | null;
  },
) {
  const measured = getTextMetrics(preset);

  context.dispatch(createSetToolWithColorCommand("text", preset.colorId));
  context.dispatch(
    createBeginTextPlacementCommand({
      text: preset.text,
      intrinsicWidth: measured.width,
      intrinsicHeight: measured.height,
      baseFontSize: preset.baseFontSize,
      fontFamily: preset.fontFamily,
      fontStyle: preset.fontStyle,
      fontWeight: preset.fontWeight,
      underline: preset.underline,
      ...getInitialPlacementTransform({
        intrinsicWidth: measured.width,
        intrinsicHeight: measured.height,
        metrics: context.gridMetrics,
        viewportCenter: context.viewportCenter,
        viewportWidth: context.viewportWidth,
        widthRatio: DEFAULT_INITIAL_WIDTH_RATIO,
      }),
    }),
  );
}

function getTextMetrics(preset: {
  text: string;
  baseFontSize: number;
  fontFamily: string;
  fontStyle: "normal" | "italic";
  fontWeight: number;
}): { width: number; height: number } {
  return (
    measureIntrinsicText(preset.text, {
      baseFontSize: preset.baseFontSize,
      fontFamily: preset.fontFamily,
      fontStyle: preset.fontStyle,
      fontWeight: preset.fontWeight,
    }) ?? {
      width: Math.ceil(preset.baseFontSize * Math.max(preset.text.length * 0.8, 3.25)),
      height: Math.ceil(preset.baseFontSize * 1.5),
    }
  );
}

function resolvePresetColorId(
  palette: PaletteColor[],
  colorCode: string,
  activeColorId: string | null,
): string {
  const matchedPaletteColor = palette.find(
    (color) => color.brand === "dmc" && color.code.toLowerCase() === colorCode.toLowerCase(),
  );

  return matchedPaletteColor?.id ?? activeColorId ?? DEFAULT_DMC_COLOR_ID;
}

function resolvePreviewColorHex(
  palette: PaletteColor[],
  colorId: string,
): string {
  const paletteColor = palette.find((color) => color.id === colorId);

  if (paletteColor) {
    return paletteColor.hex;
  }

  return DMC_COLOR_LIBRARY_BY_ID[colorId]?.hex ?? DMC_COLOR_LIBRARY_BY_ID[DEFAULT_DMC_COLOR_ID].hex;
}
