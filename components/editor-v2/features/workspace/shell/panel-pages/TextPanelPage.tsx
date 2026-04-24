"use client";

import { useMemo } from "react";
import { Button } from "@/components/design-system";
import { typographyStyles } from "@/app/design-system/typography";
import type {
  EditorStore,
  PaletteColor,
  TextPlacementSession,
} from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics, WorldPoint } from "@/lib/editor-v2/editor/viewport";
import { createBeginTextPlacementCommand } from "../../workspaceCommands";
import { getInitialPlacementTransform } from "./getInitialPlacementTransform";
import styles from "../EditorV2Shell.module.css";

const DEFAULT_BASE_FONT_SIZE = 32;
const DEFAULT_FONT_FAMILY = "Inter";
const DEFAULT_INITIAL_WIDTH_RATIO = 0.5;
const DEFAULT_TEXT_PLACEHOLDER = "Text";

interface TextPanelPageProps {
  activeColorId: string | null;
  dispatch: EditorStore["dispatch"];
  gridMetrics: GridWorldMetrics;
  palette: PaletteColor[];
  placement: TextPlacementSession | null;
  viewportCenter: WorldPoint | null;
}

export function TextPanelPage({
  dispatch,
  gridMetrics,
  placement,
  viewportCenter,
}: TextPanelPageProps) {
  const placementActive = Boolean(placement);
  const helperText = useMemo(
    () =>
      placementActive
        ? "Convert text to painted cells."
        : "Convert text to painted cells.",
    [placementActive],
  );

  return (
    <section className={styles.sidebarSection}>
      <div className={styles.sidebarPageBody}>
        <div className={styles.sidebarSubsection}>
          <div className={styles.sidebarSubsectionHeader}>
            <h3 style={typographyStyles.h5}>Text to pattern</h3>
            {/* <p className={styles.sidebarSubsectionHint} style={typographyStyles.p2}>
              Add a text box, edit it on canvas, then convert it to stitches.
            </p> */}
          </div>

          <p className={styles.sidebarSubsectionHint} style={typographyStyles.p2}>
            {helperText}
          </p>

          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={placementActive}
            onClick={() => {
              const measured = getDefaultTextMetrics();

              dispatch(
                createBeginTextPlacementCommand({
                  text: DEFAULT_TEXT_PLACEHOLDER,
                  intrinsicWidth: measured.width,
                  intrinsicHeight: measured.height,
                  baseFontSize: DEFAULT_BASE_FONT_SIZE,
                  fontFamily: DEFAULT_FONT_FAMILY,
                  fontStyle: "normal",
                  fontWeight: 400,
                  underline: false,
                  ...getInitialPlacementTransform({
                    intrinsicWidth: measured.width,
                    intrinsicHeight: measured.height,
                  metrics: gridMetrics,
                  viewportCenter,
                  widthRatio: DEFAULT_INITIAL_WIDTH_RATIO,
                }),
                }),
              );
            }}
          >
            Add text box
          </Button>
        </div>
      </div>
    </section>
  );
}

function getDefaultTextMetrics(): { width: number; height: number } {
  return {
    width: Math.ceil(DEFAULT_BASE_FONT_SIZE * 3.25),
    height: Math.ceil(DEFAULT_BASE_FONT_SIZE * 1.5),
  };
}
