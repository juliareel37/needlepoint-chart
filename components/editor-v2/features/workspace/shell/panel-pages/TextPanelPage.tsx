"use client";

import { useMemo, useState } from "react";
import { Button, Field, SingleSelectDropdown } from "@/components/design-system";
import { typographyStyles } from "@/app/design-system/typography";
import { TEXT_FONT_OPTIONS } from "@/components/pattern-editor/utils/textFontOptions";
import type {
  EditorStore,
  PaletteColor,
  TextPlacementSession,
} from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics } from "@/lib/editor-v2/editor/viewport";
import { getContainedRect } from "@/lib/editor-v2/editor/positioning";
import { convertTextPlacementToCells } from "@/lib/editor-v2/editor/text/convertTextPlacementToCells";
import {
  createBeginTextPlacementCommand,
  createCancelTextPlacementCommand,
  createPaintCellsCommand,
} from "../../workspaceCommands";
import styles from "../EditorV2Shell.module.css";

const DEFAULT_BASE_FONT_SIZE = 32;
const DEFAULT_FONT_FAMILY = TEXT_FONT_OPTIONS[0]?.value ?? "Inter";
const DEFAULT_INITIAL_WIDTH_RATIO = 0.5;

interface TextPanelPageProps {
  activeColorId: string | null;
  dispatch: EditorStore["dispatch"];
  gridMetrics: GridWorldMetrics;
  palette: PaletteColor[];
  placement: TextPlacementSession | null;
}

export function TextPanelPage({
  activeColorId,
  dispatch,
  gridMetrics,
  palette,
  placement,
}: TextPanelPageProps) {
  const [text, setText] = useState("");
  const [fontFamily, setFontFamily] = useState(DEFAULT_FONT_FAMILY);
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const colorId = activeColorId;
  const placementActive = Boolean(placement);
  const canAddTextBox = text.trim().length > 0;
  const canConvert = placementActive && Boolean(colorId);
  const helperText = useMemo(() => {
    if (!colorId) {
      return "Choose an active color before converting text to stitches.";
    }

    return placementActive
      ? "Move or resize the text box on the canvas, then convert it with the active color."
      : "Add a text box to preview it on the canvas, then reposition and convert.";
  }, [colorId, placementActive]);

  return (
    <section className={styles.sidebarSection}>
      <div className={styles.sidebarPageBody}>
        <div className={styles.sidebarSubsection}>
          <div className={styles.sidebarSubsectionHeader}>
            <h3 style={typographyStyles.h5}>Text to pattern</h3>
            <p className={styles.sidebarSubsectionHint} style={typographyStyles.p2}>
              Type text, place the text box, then convert it to stitches.
            </p>
          </div>

          <Field label="Text" hint={helperText}>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Type text"
              rows={4}
              style={{
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
                resize: "vertical",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid var(--ui-border-subtle)",
                background: "var(--surface-card)",
                boxShadow: "var(--ui-shadow-sm)",
                color: "var(--foreground)",
                fontSize: typographyStyles.p2.fontSize,
                lineHeight: typographyStyles.p2.lineHeight,
              }}
            />
          </Field>

          <p className={styles.sidebarSubsectionHint} style={typographyStyles.p2}>
              Style
            </p>

 <div style={{ display: "flex", gap: 8 }}>
          <SingleSelectDropdown
            ariaLabel="Font"
            // label="Font"
            items={TEXT_FONT_OPTIONS}
            value={fontFamily}
            placeholder="Select font"
            minWidth="100%"
            menuWidth="min(360px, 100%)"
            getItemValue={(item) => item.value}
            getItemLabel={(item) => (
              <span style={{ fontFamily: item.value }}>{item.label}</span>
            )}
            onValueChange={(value) => setFontFamily(value)}
            wrapperStyle={{
              opacity: placementActive ? 0.6 : 1,
              pointerEvents: placementActive ? "none" : "auto",
            }}
          />

          {/* <Field label="Style"> */}
           
              <Button
                type="button"
                variant="secondary"
                size="md"
                aria-pressed={bold}
                onClick={() => setBold((current) => !current)}
                disabled={placementActive}
                style={{
                  fontWeight: 800,
                  textDecoration: "none",
                  // color: "white",
                  // backgroundColor: bold ? "var(--brand-primary-strong)" : undefined,
                  outline: bold ? "1px solid var(--ui-border-strong)" : undefined,
                }}
              >
                B
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                aria-pressed={italic}
                onClick={() => setItalic((current) => !current)}
                disabled={placementActive}
                style={{
                  fontStyle: "italic",
                  textDecoration: "none",
                  outline: italic ? "1px solid var(--ui-border-strong)" : undefined,
                }}
              >
                I
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                aria-pressed={underline}
                onClick={() => setUnderline((current) => !current)}
                disabled={placementActive}
                style={{
                  textDecoration: "underline",
                  outline: underline ? "1px solid var(--ui-border-strong)" : undefined,
                }}
              >
                U
              </Button>
            </div>
          {/* </Field> */}

          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={!canAddTextBox || placementActive}
            onClick={() => {
              const measured = measureIntrinsicText(text.trim(), {
                baseFontSize: DEFAULT_BASE_FONT_SIZE,
                fontFamily,
                fontStyle: italic ? "italic" : "normal",
                fontWeight: bold ? 700 : 400,
              });
              if (!measured) return;

              dispatch(
                createBeginTextPlacementCommand({
                  text: text.trim(),
                  intrinsicWidth: measured.width,
                  intrinsicHeight: measured.height,
                  baseFontSize: DEFAULT_BASE_FONT_SIZE,
                  fontFamily,
                  fontStyle: italic ? "italic" : "normal",
                  fontWeight: bold ? 700 : 400,
                  underline,
                  ...getInitialPlacementTransform({
                    intrinsicWidth: measured.width,
                    intrinsicHeight: measured.height,
                    metrics: gridMetrics,
                    widthRatio: DEFAULT_INITIAL_WIDTH_RATIO,
                  }),
                }),
              );
            }}
          >
            Add text box
          </Button>

          {placementActive ? (
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => dispatch(createCancelTextPlacementCommand())}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={!canConvert}
                onClick={() => {
                  if (!placement || !colorId) return;

                  const cells = convertTextPlacementToCells(placement, gridMetrics);
                  if (cells.length === 0) return;

                  dispatch(createPaintCellsCommand(colorId, cells));
                  dispatch(createCancelTextPlacementCommand());
                }}
              >
                Convert
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function measureIntrinsicText(
  text: string,
  options: {
    baseFontSize: number;
    fontFamily: string;
    fontStyle: "normal" | "italic";
    fontWeight: number;
  },
): { width: number; height: number } | null {
  if (!text.trim()) return null;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.font = `${options.fontWeight} ${options.fontStyle} ${options.baseFontSize}px ${options.fontFamily}, sans-serif`;

  const lines = text.split("\n");
  let maxWidth = 0;
  for (const line of lines) {
    const width = context.measureText(line).width;
    maxWidth = Math.max(maxWidth, width);
  }

  const height = Math.max(1, lines.length) * options.baseFontSize * 1.1;
  return {
    width: Math.max(1, Math.ceil(maxWidth + options.baseFontSize * 0.6)),
    height: Math.max(1, Math.ceil(height + options.baseFontSize * 0.4)),
  };
}

function getInitialPlacementTransform(options: {
  intrinsicWidth: number;
  intrinsicHeight: number;
  metrics: GridWorldMetrics;
  widthRatio: number;
}): { offsetX: number; offsetY: number; scale: number } {
  const baseRect = getContainedRect(
    options.intrinsicWidth,
    options.intrinsicHeight,
    options.metrics.surfaceWidth,
    options.metrics.surfaceHeight,
  );
  const targetWidth = options.metrics.surfaceWidth * options.widthRatio;
  const scale = clampScale(targetWidth / Math.max(baseRect.width, 1));
  const targetLeft = (options.metrics.surfaceWidth - baseRect.width * scale) / 2;
  const targetTop = (options.metrics.surfaceHeight - baseRect.height * scale) / 2;
  return {
    scale,
    offsetX: targetLeft - baseRect.left,
    offsetY: targetTop - baseRect.top,
  };
}

function clampScale(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(4, Math.max(0.1, Number(value.toFixed(4))));
}
