"use client";

import { useEffect, useRef, useState } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import { Button, ButtonIcon } from "@/components/design-system";
import { ColorLibrary } from "@/components/editor-v2/features/colors";
import type { EditorStore, PaletteColor } from "@/lib/editor-v2/editor/store";
import {
  createSetActiveColorCommand,
  createDeleteUsedColorsCommand,
  createMergeUsedColorsCommand,
  createSwapPaletteColorCommand,
} from "../../workspaceCommands";
import { UsedColorsSummary } from "../UsedColorsSummary";
import styles from "../EditorV2Shell.module.css";

export type ColorPanelView = "overview" | "design-colors";

const COLOR_PREVIEW_ROWS = 1;
const COLOR_PREVIEW_SWATCH_SIZE = 16;
const COLOR_PREVIEW_COLUMN_GAP = 4;
const COLOR_PREVIEW_MORE_BADGE_COLUMNS = 3;

interface ColorPanelPageProps {
  activeColor: PaletteColor | null;
  activeColorId: string | null;
  colorsById: Record<string, PaletteColor>;
  dispatch: EditorStore["dispatch"];
  highlightedColorId: string | null;
  isBottomPanelLayout: boolean;
  onViewChange: (view: ColorPanelView) => void;
  onHighlightColorChange: (colorId: string | null) => void;
  palette: PaletteColor[];
  showSymbols: boolean;
  symbolAssignments: Record<string, string>;
  usedColors: Array<{ colorId: string; count: number }>;
  view: ColorPanelView;
}

export function ColorPanelPage({
  activeColor,
  activeColorId,
  colorsById,
  dispatch,
  highlightedColorId,
  isBottomPanelLayout,
  onViewChange,
  onHighlightColorChange,
  palette,
  showSymbols,
  symbolAssignments,
  usedColors,
  view,
}: ColorPanelPageProps) {
  const pageRef = useRef<HTMLElement | null>(null);
  const previewGridRef = useRef<HTMLDivElement | null>(null);
  const [previewColumnCount, setPreviewColumnCount] = useState(1);

  useEffect(() => {
    const node = previewGridRef.current;

    if (!node) {
      return;
    }

    const updateColumnCount = () => {
      const nextColumnCount = Math.max(
        1,
        Math.floor(
          (node.clientWidth + COLOR_PREVIEW_COLUMN_GAP) /
            (COLOR_PREVIEW_SWATCH_SIZE + COLOR_PREVIEW_COLUMN_GAP),
        ),
      );
      setPreviewColumnCount((current) =>
        current === nextColumnCount ? current : nextColumnCount,
      );
    };

    updateColumnCount();

    const resizeObserver = new ResizeObserver(() => {
      updateColumnCount();
    });

    resizeObserver.observe(node);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isBottomPanelLayout, view]);

  useEffect(() => {
    if (view !== "design-colors") {
      return;
    }

    const node = pageRef.current;

    if (!node) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      let current: HTMLElement | null = node;

      while (current) {
        if (current.scrollHeight > current.clientHeight) {
          const overflowY = window.getComputedStyle(current).overflowY;
          if (overflowY === "auto" || overflowY === "scroll") {
            current.scrollTop = 0;
          }
        }

        current = current.parentElement;
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [view]);

  const previewCapacity = previewColumnCount * COLOR_PREVIEW_ROWS;
  const hiddenBadgeSpan = Math.min(COLOR_PREVIEW_MORE_BADGE_COLUMNS, previewColumnCount);
  const visiblePreviewCount =
    usedColors.length > previewCapacity
      ? Math.max(previewCapacity - hiddenBadgeSpan, 0)
      : usedColors.length;
  const previewItems = usedColors.slice(0, visiblePreviewCount);
  const hiddenCount = Math.max(usedColors.length - visiblePreviewCount, 0);
  const showMoreButton = hiddenCount > 0;

  return (
    <section ref={pageRef} className={styles.sidebarSection}>
      <div className={styles.sidebarPageBody}>
        {view === "overview" ? (
          <>

            <div className={styles.sidebarSubsection}>
              <div className={styles.sidebarSubsectionHeaderRow}>
                <div className={styles.sidebarSubsectionHeader}>
                  <h3 style={typographyStyles.h5}>Design colors </h3>
                  <p className={styles.sidebarSubsectionHint} style={typographyStyles.p2}>
                    {usedColors.length === 0
                      ? "Review, replace, merge, or delete the colors used in this design."
                      : `${usedColors.length} colors used in this design.`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghostV2"
                  size="sm"
                  className={styles.sidebarHeaderAction}
                  aria-label="View all design colors"
                  title="View all design colors"
                  onClick={() => onViewChange("design-colors")}
                >
                  <ButtonIcon icon="/icons/lucide/arrow-right.svg" />
                </Button>
              </div>

              {usedColors.length > 0 ? (
                <div ref={previewGridRef} className={styles.sidebarColorPreviewGrid}>
                  {previewItems.map((entry) => {
                    const color = colorsById[entry.colorId];

                    return (
                      <div
                        key={entry.colorId}
                        className={styles.sidebarColorPreviewSwatch}
                        aria-label={color ? `${color.name} (${color.code})` : "Design color"}
                        title={color ? `${color.name} (${color.code})` : "Design color"}
                        role="img"
                        style={{ backgroundColor: color?.hex ?? "#ffffff" }}
                      >
                      </div>
                    );
                  })}
                  {showMoreButton ? (
                    <Button
                      type="button"
                      variant="ghostV2"
                      size="sm"
                      className={styles.sidebarColorPreviewMoreBadge}
                      aria-label={`View ${hiddenCount} more design colors`}
                      title={`View ${hiddenCount} more design colors`}
                      onClick={() => onViewChange("design-colors")}
                      style={{ gridColumn: `span ${hiddenBadgeSpan}` }}
                    >
                      + {hiddenCount} more
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>

                      <div className={styles.traceSectionDivider} aria-hidden="true" />


            <div className={styles.sidebarSubsection}>
              <div className={styles.metaRow} style={typographyStyles.p2}>
                <span>Active:</span>
                <strong className={styles.activeColorValue}>
                  {activeColor ? `${activeColor.name} (${activeColor.code})` : "None selected"}
                </strong>
              </div>
              <div className={styles.sidebarColorLibraryCard}>
                <ColorLibrary
                  activeColorId={activeColorId}
                  className={styles.sidebarColorLibrary}
                  colors={palette}
                  featuredColorIds={usedColors.map((entry) => entry.colorId)}
                  onColorSelect={(colorId) => dispatch(createSetActiveColorCommand(colorId))}
                  showFeaturedSymbols={showSymbols}
                  symbolAssignments={symbolAssignments}
                />
              </div>
            </div>

          </>
        ) : (
          <div className={styles.sidebarSubsection}>
            <UsedColorsSummary
              usedColors={usedColors}
              colorsById={colorsById}
              highlightedColorId={highlightedColorId}
              palette={palette}
              onHighlightColorChange={onHighlightColorChange}
              showSymbols={showSymbols}
              symbolAssignments={symbolAssignments}
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
