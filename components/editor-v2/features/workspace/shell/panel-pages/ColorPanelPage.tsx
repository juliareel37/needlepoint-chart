"use client";

import { typographyStyles } from "@/app/design-system/typography";
import {
  ButtonIcon,
} from "@/components/design-system";
import type {
  EditorStore,
  PaletteColor,
} from "@/lib/editor-v2/editor/store";
import {
  createSetActiveColorCommand,
  createDeleteUsedColorsCommand,
  createMergeUsedColorsCommand,
  createSwapPaletteColorCommand,
} from "../../workspaceCommands";
import { UsedColorsSummary } from "../UsedColorsSummary";
import { ColorLibrary } from "@/components/editor-v2/features/colors";
import styles from "../EditorV2Shell.module.css";

export type ColorPanelView = "overview" | "design-colors";

interface ColorPanelPageProps {
  activeColor: PaletteColor | null;
  activeColorId: string | null;
  colorsById: Record<string, PaletteColor>;
  dispatch: EditorStore["dispatch"];
  onViewChange: (view: ColorPanelView) => void;
  palette: PaletteColor[];
  usedColors: Array<{ colorId: string; count: number }>;
  view: ColorPanelView;
}

export function ColorPanelPage({
  activeColor,
  activeColorId,
  colorsById,
  dispatch,
  onViewChange,
  palette,
  usedColors,
  view,
}: ColorPanelPageProps) {
  return (
    <section className={styles.sidebarSection}>
      <div className={styles.sidebarPageBody}>
        {view === "overview" ? (
          <>
          {/* style={{ background : "var(--surface-card)" }} */}
            <div className={styles.sidebarSubsection} >
              <div className={styles.metaRow} style={typographyStyles.p2}>
                <span>Active:</span>
                <strong className={styles.activeColorValue}>
                  {activeColor ? `${activeColor.name} (${activeColor.code})` : "None selected"}
                </strong>
              </div>
              <div style={{"border": "solid 1px var(--ui-border-subtle)",
                "borderRadius": "16px",
                "background": "var(--surface-card)"}}>
              <ColorLibrary
                activeColorId={activeColorId}
                className={styles.sidebarColorLibrary}
                colors={palette}
                featuredColorIds={usedColors.map((entry) => entry.colorId)}
                onColorSelect={(colorId) => dispatch(createSetActiveColorCommand(colorId))}
              />
              </div>

            </div>

            <div className={styles.sidebarSubsection}>
              <button
                type="button"
                className={styles.sidebarDetailCard}
                onClick={() => onViewChange("design-colors")}
              >
                <span className={styles.sidebarDetailCardBody}>
                  <span className={styles.sidebarDetailCardTitle} style={typographyStyles.h5}>
                    Design Colors
                  </span>
                  <span className={styles.sidebarDetailCardHint} style={typographyStyles.p2}>
                    {usedColors.length === 0
                      ? "Review, replace, merge, or delete the colors used in this design."
                      : `${usedColors.length} colors used in this design.`}
                  </span>
                  {usedColors.length > 0 ? (
                    <span className={styles.sidebarDetailSwatchGrid} aria-hidden="true">
                      {usedColors.map((entry) => (
                        <span
                          key={entry.colorId}
                          className={styles.sidebarDetailSwatch}
                          style={{
                            backgroundColor: colorsById[entry.colorId]?.hex ?? "#ffffff",
                          }}
                        />
                      ))}
                    </span>
                  ) : null}
                </span>
                <ButtonIcon icon="/icons/lucide/arrow-right.svg" />
              </button>
            </div>
          </>
        ) : (
          <div className={styles.sidebarSubsection}>
            <UsedColorsSummary
              usedColors={usedColors}
              colorsById={colorsById}
              palette={palette}
              onSwapColor={(fromColorId, toColorId) =>
                dispatch(createSwapPaletteColorCommand(fromColorId, toColorId))
              }
              onDeleteColors={(colorIds) => dispatch(createDeleteUsedColorsCommand(colorIds))}
              onMergeColors={(fromColorIds, toColorId) =>
                dispatch(createMergeUsedColorsCommand(fromColorIds, toColorId))
              }
            />
          </div>
        )}
      </div>
    </section>
  );
}
