"use client";

import { useEffect, useRef } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import { ButtonIcon } from "@/components/design-system";
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

const SIDEBAR_COLOR_PREVIEW_MAX_SWATCHES = 14;
const BOTTOM_PANEL_COLOR_PREVIEW_MAX_SWATCHES = 16;

interface ColorPanelPageProps {
  activeColor: PaletteColor | null;
  activeColorId: string | null;
  colorsById: Record<string, PaletteColor>;
  dispatch: EditorStore["dispatch"];
  highlightedColorId: string | null;
  isBottomPanelCanvasFocusActive: boolean;
  isBottomPanelLayout: boolean;
  onExitBottomPanelCanvasFocus: () => void;
  onEnterBottomPanelCanvasFocus: () => void;
  onViewChange: (view: ColorPanelView) => void;
  onHighlightColorChange: (colorId: string | null) => void;
  onScopeModeChange: (mode: "full-canvas" | "selection") => void;
  palette: PaletteColor[];
  selectionControlActive: boolean;
  selectionPromptVisible: boolean;
  selectionScopeActive: boolean;
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
  isBottomPanelCanvasFocusActive,
  isBottomPanelLayout,
  onExitBottomPanelCanvasFocus,
  onEnterBottomPanelCanvasFocus,
  onViewChange,
  onHighlightColorChange,
  onScopeModeChange,
  palette,
  selectionControlActive,
  selectionPromptVisible,
  selectionScopeActive,
  showSymbols,
  symbolAssignments,
  usedColors,
  view,
}: ColorPanelPageProps) {
  const pageRef = useRef<HTMLElement | null>(null);
  const colorPreviewMaxSwatches = isBottomPanelLayout
    ? BOTTOM_PANEL_COLOR_PREVIEW_MAX_SWATCHES
    : SIDEBAR_COLOR_PREVIEW_MAX_SWATCHES;

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

  const hiddenBadgeSpan = 3;
  const visiblePreviewCount =
    usedColors.length > colorPreviewMaxSwatches
      ? Math.max(colorPreviewMaxSwatches - hiddenBadgeSpan, 0)
      : usedColors.length;
  const previewItems = usedColors.slice(0, visiblePreviewCount);
  const hiddenCount = Math.max(usedColors.length - visiblePreviewCount, 0);
  const showMoreButton = hiddenCount > 0;
  const openDesignColorsView = () => onViewChange("design-colors");
  const activeColorCodeLabel = activeColor
    ? activeColor.brand === "dmc"
      ? `DMC ${activeColor.code}`
      : activeColor.code
    : null;

  return (
    <section ref={pageRef} className={[styles.sidebarSection, styles.colorPanelPageSection].join(" ")}>
      <div className={styles.colorPanelPageBody}>
        {view === "overview" ? (
          <>
              <div
                className={[styles.metaRow, styles.activeColorRow].join(" ")}
                style={typographyStyles.p2}
              >
                <span
                  aria-hidden="true"
                  className={[styles.swatch, styles.activeColorSwatch].join(" ")}
                  style={{ backgroundColor: activeColor?.hex ?? "#ffffff" }}
                />
                {activeColor ? (
                  <>
                    <strong className={styles.activeColorName}>{activeColor.name}</strong>
                    <span
                      aria-hidden="true"
                      className={styles.activeColorDivider}
                    />
                    <span className={styles.activeColorCode}>{activeColorCodeLabel}</span>
                  </>
                ) : (
                  <strong className={styles.activeColorValue}>None selected</strong>
                )}
              </div>


            <div className={styles.traceSectionDivider} aria-hidden="true" />


            <div
              className={[styles.sidebarSubsection, styles.sidebarColorPreviewSection].join(" ")}
              role="button"
              tabIndex={0}
              aria-label="View all design colors"
              onClick={openDesignColorsView}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") {
                  return;
                }

                event.preventDefault();
                openDesignColorsView();
              }}
            >
              <div className={styles.sidebarSubsectionHeaderRow}>
                <div className={styles.sidebarSubsectionHeader}>
                  <div className={styles.sidebarColorPreviewTitleRow}>
                    <h3 style={typographyStyles.h5}>
                      {/* Design colors */}
                      {selectionScopeActive ? "Selection colors" : "Design colors"}
                      </h3>
                       <span
                        className={styles.sidebarColorPreviewCountBadge}
                        style={typographyStyles.p2}
                      >
                        {usedColors.length}
                      </span>
                  </div>

                </div>
                <span className={styles.sidebarHeaderAction} aria-hidden="true">
                  <ButtonIcon icon="/icons/lucide/arrow-right.svg" />
                </span>
              </div>

              {usedColors.length > 0 ? (
                <div className={styles.sidebarColorPreviewButton}>
                  <span className={styles.sidebarColorPreviewGrid}>
                  {previewItems.map((entry) => {
                    const color = colorsById[entry.colorId];

                    return (
                      <span
                        key={entry.colorId}
                        className={styles.sidebarColorPreviewSwatch}
                        aria-label={color ? `${color.name} (${color.code})` : "Design color"}
                        title={color ? `${color.name} (${color.code})` : "Design color"}
                        role="img"
                        style={{ backgroundColor: color?.hex ?? "#ffffff" }}
                      />
                    );
                  })}
                  {showMoreButton ? (
                    <span
                      className={styles.sidebarColorPreviewMoreBadge}
                      style={{ gridColumn: `span ${hiddenBadgeSpan}` }}
                    >
                      + {hiddenCount}
                    </span>
                  ) : null}
                  </span>
                </div>
              ) : null}
            </div>

          <div className={styles.traceSectionDivider} aria-hidden="true" />


            <div className={[styles.sidebarSubsection, styles.sidebarColorLibrarySection].join(" ")}>
              
              <h3 style={typographyStyles.h5}>Library</h3>

              <div className={styles.sidebarColorLibraryCard}>
                <ColorLibrary
                  activeColorId={activeColorId}
                  className={styles.sidebarColorLibrary}
                  colors={palette}
                  featuredColorIds={usedColors.map((entry) => entry.colorId)}
                  onColorSelect={(colorId) => dispatch(createSetActiveColorCommand(colorId))}
                  persistScrollPosition
                  persistenceKey="sidebar-color-panel-library"
                  showAllSectionHeader={false}
                  showFeaturedSection={false}
                  showFeaturedSymbols={showSymbols}
                  symbolAssignments={symbolAssignments}
                />
              </div>
            </div>

          </>
        ) : (
          <div className={styles.sidebarSubsection}>
            <UsedColorsSummary
              activeColorId={activeColorId}
              usedColors={usedColors}
              colorsById={colorsById}
              highlightedColorId={highlightedColorId}
              isBottomPanelCanvasFocusActive={isBottomPanelCanvasFocusActive}
              isBottomPanelLayout={isBottomPanelLayout}
              palette={palette}
              onActiveColorChange={(colorId) =>
                dispatch(createSetActiveColorCommand(colorId))
              }
              onExitBottomPanelCanvasFocus={onExitBottomPanelCanvasFocus}
              onEnterBottomPanelCanvasFocus={onEnterBottomPanelCanvasFocus}
              onHighlightColorChange={onHighlightColorChange}
              onScopeModeChange={onScopeModeChange}
              showSymbols={showSymbols}
              selectionControlActive={selectionControlActive}
              selectionPromptVisible={selectionPromptVisible}
              selectionScopeActive={selectionScopeActive}
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
