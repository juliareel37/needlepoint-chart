"use client";

import { useEffect, useRef, useState } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import { Button, ButtonIcon, Modal } from "@/components/design-system";
import { ColorLibrary } from "@/components/editor-v2/features/colors";
import type {
  CustomPalette,
  EditorStore,
  PaletteColor,
} from "@/lib/editor-v2/editor/store";
import {
  createAddColorToCustomPaletteCommand,
  createCustomPaletteCommand,
  createDeleteCustomPaletteCommand,
  createRemoveColorFromCustomPaletteCommand,
  createRenameCustomPaletteCommand,
  createSetActiveColorCommand,
  createDeleteUsedColorsCommand,
  createMergeUsedColorsCommand,
  createSwapPaletteColorCommand,
} from "../../workspaceCommands";
import { EditableDesignTitle } from "../EditableDesignTitle";
import { UsedColorsSummary } from "../UsedColorsSummary";
import styles from "../EditorV2Shell.module.css";

export type ColorPanelView =
  | "overview"
  | "design-colors"
  | "custom-palettes"
  | "custom-palette-create";

const SIDEBAR_COLOR_PREVIEW_MAX_SWATCHES = 14;
const BOTTOM_PANEL_COLOR_PREVIEW_MAX_SWATCHES = 16;

interface ColorPanelPageProps {
  activeColor: PaletteColor | null;
  activeColorId: string | null;
  colorsById: Record<string, PaletteColor>;
  customPalettesById: Record<string, CustomPalette>;
  customPaletteDraftColorIds: string[];
  customPaletteDraftId: string | null;
  customPaletteDraftName: string;
  dispatch: EditorStore["dispatch"];
  highlightedColorId: string | null;
  isBottomPanelCanvasFocusActive: boolean;
  isBottomPanelLayout: boolean;
  onCustomPaletteCreateOpen: () => void;
  onCustomPaletteEditOpen: (paletteId: string) => void;
  onCustomPaletteDraftNameChange: (nextName: string) => void;
  onCustomPaletteDraftColorToggle: (colorId: string) => void;
  onCustomPaletteDraftReset: () => void;
  onCustomPaletteDraftSelectAll: (colorIds: string[]) => void;
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
  customPalettesById,
  customPaletteDraftColorIds,
  customPaletteDraftId,
  customPaletteDraftName,
  dispatch,
  highlightedColorId,
  isBottomPanelCanvasFocusActive,
  isBottomPanelLayout,
  onCustomPaletteCreateOpen,
  onCustomPaletteEditOpen,
  onCustomPaletteDraftNameChange,
  onCustomPaletteDraftColorToggle,
  onCustomPaletteDraftReset,
  onCustomPaletteDraftSelectAll,
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
  const [paletteDeleteTarget, setPaletteDeleteTarget] = useState<CustomPalette | null>(null);
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
  const openCustomPalettesView = () => onViewChange("custom-palettes");
  const openCustomPaletteCreateView = () => onCustomPaletteCreateOpen();
  const activeColorCodeLabel = activeColor
    ? activeColor.brand === "dmc"
      ? `DMC ${activeColor.code}`
      : activeColor.code
    : null;
  const customPalettes = Object.values(customPalettesById);
  const customPaletteDraftColors = customPaletteDraftColorIds
    .map((colorId) => colorsById[colorId])
    .filter((color): color is PaletteColor => Boolean(color));
  const canSaveCustomPalette = customPaletteDraftColorIds.length > 0;
  const saveCustomPalette = () => {
    if (!canSaveCustomPalette) {
      return;
    }

    if (customPaletteDraftId) {
      const existingPalette = customPalettesById[customPaletteDraftId];

      if (existingPalette) {
        if (existingPalette.name !== customPaletteDraftName.trim()) {
          dispatch(
            createRenameCustomPaletteCommand(customPaletteDraftId, customPaletteDraftName),
          );
        }

        const existingColorIdSet = new Set(existingPalette.colorIds);
        const nextColorIdSet = new Set(customPaletteDraftColorIds);

        for (const colorId of existingPalette.colorIds) {
          if (!nextColorIdSet.has(colorId)) {
            dispatch(createRemoveColorFromCustomPaletteCommand(customPaletteDraftId, colorId));
          }
        }

        for (const colorId of customPaletteDraftColorIds) {
          if (!existingColorIdSet.has(colorId)) {
            dispatch(createAddColorToCustomPaletteCommand(customPaletteDraftId, colorId));
          }
        }
      }
    } else {
      dispatch(
        createCustomPaletteCommand(
          createCustomPaletteId(),
          customPaletteDraftName,
          customPaletteDraftColorIds,
        ),
      );
    }

    onCustomPaletteDraftReset();
    onViewChange("custom-palettes");
  };

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

            <div
              className={[styles.sidebarSubsection, styles.sidebarColorPreviewSection].join(" ")}
              role="button"
              tabIndex={0}
              aria-label="View custom palettes"
              onClick={openCustomPalettesView}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") {
                  return;
                }

                event.preventDefault();
                openCustomPalettesView();
              }}
            >
              <div className={styles.sidebarSubsectionHeaderRow}>
                <div className={styles.sidebarSubsectionHeader}>
                  <div className={styles.sidebarColorPreviewTitleRow}>
                    <h3 style={typographyStyles.h5}>Custom palettes</h3>
                  </div>
                </div>
                <span className={styles.sidebarHeaderAction} aria-hidden="true">
                  <ButtonIcon icon="/icons/lucide/arrow-right.svg" />
                </span>
              </div>

              {customPalettes.length > 0 ? (
                <div className={styles.customPaletteList}>
                  {customPalettes.map((customPalette) => (
                    <div key={customPalette.id} className={styles.customPaletteRow}>
                      <div className={styles.customPaletteRowText}>
                        <span className={styles.customPaletteRowName}>
                          {customPalette.name}
                        </span>
                        <span className={styles.customPaletteRowCount}>
                          ({customPalette.colorIds.length})
                        </span>
                      </div>
                      <div className={styles.customPalettePreview}>
                        {customPalette.colorIds.slice(0, 4).map((colorId) => {
                          const color = colorsById[colorId];

                          return (
                            <span
                              key={`${customPalette.id}-${colorId}`}
                              className={styles.customPalettePreviewSwatch}
                              aria-label={
                                color ? `${color.name} (${color.code})` : "Palette color"
                              }
                              title={color ? `${color.name} (${color.code})` : "Palette color"}
                              role="img"
                              style={{ backgroundColor: color?.hex ?? "#ffffff" }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyMessage} style={typographyStyles.p2}>
                  No custom palettes yet. Create palettes to keep favorite color groups handy.
                </p>
              )}
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
        ) : view === "design-colors" ? (
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
        ) : view === "custom-palettes" ? (
          <div className={styles.sidebarPageBody}>
            <Button
              type="button"
              variant="primary"
              size="md"
              className={styles.customPaletteCreateButton}
              onClick={openCustomPaletteCreateView}
            >
              <ButtonIcon icon="/icons/lucide/plus.svg" />
              <span>Create new palette</span>
            </Button>

            {customPalettes.length === 0 ? (
              <p className={styles.emptyMessage} style={typographyStyles.p2}>
                You don&apos;t have any custom palettes yet. Create one to collect color groups
                you want to reuse in this design.
              </p>
            ) : (
                <div className={styles.customPaletteCardList}>
                  {customPalettes.map((customPalette) => (
                    <div
                      key={customPalette.id}
                      className={styles.customPaletteCard}
                      role="button"
                      tabIndex={0}
                      aria-label={`Edit ${customPalette.name}`}
                      onClick={() => onCustomPaletteEditOpen(customPalette.id)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") {
                          return;
                        }

                        event.preventDefault();
                        onCustomPaletteEditOpen(customPalette.id);
                      }}
                    >
                      <h3 className={styles.customPaletteCardTitle} style={typographyStyles.h5}>
                        <span>{customPalette.name}</span>
                        <button
                          type="button"
                          className={styles.customPaletteCardDeleteButton}
                          aria-label={`Delete ${customPalette.name}`}
                          title={`Delete ${customPalette.name}`}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setPaletteDeleteTarget(customPalette);
                          }}
                        >
                          <ButtonIcon
                            icon="/icons/lucide/trash.svg"
                            className={styles.customPaletteCardDeleteIcon}
                          />
                        </button>
                      </h3>
                      <div className={styles.customPaletteCardSwatches}>
                        {customPalette.colorIds.map((colorId) => {
                          const color = colorsById[colorId];

                          return (
                            <span
                              key={`${customPalette.id}-${colorId}`}
                              className={styles.customPaletteCardSwatch}
                              aria-label={
                                color ? `${color.name} (${color.code})` : "Palette color"
                              }
                              title={color ? `${color.name} (${color.code})` : "Palette color"}
                              role="img"
                              style={{ backgroundColor: color?.hex ?? "#ffffff" }}
                            />
                          );
                        })}
                      </div>
                      <span className={styles.customPaletteCardMeta}>
                        {customPalette.colorIds.length}{" "}
                        {customPalette.colorIds.length === 1 ? "color" : "colors"}
                      </span>
                    </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={[styles.sidebarPageBody, styles.customPaletteCreatePage].join(" ")}>
            {/* <div className={styles.customPaletteCreateHeaderRow}>
              <button
                type="button"
                className={styles.customPaletteBackLink}
                onClick={() => onViewChange("custom-palettes")}
              >
                <ButtonIcon icon="/icons/lucide/arrow-left.svg" />
                <span>Back to Palettes</span>
              </button>
            </div> */}

            <div
              className={[styles.sidebarSubsection, styles.sidebarColorLibrarySection].join(" ")}
            >
              <div className={styles.sidebarColorLibraryCard}>
                <ColorLibrary
                  activeColorId={null}
                  className={[styles.sidebarColorLibrary, styles.customPaletteCreateLibrary].join(" ")}
                  colors={palette}
                  featuredSectionDisplay="stacked"
                  featuredColorIds={usedColors.map((entry) => entry.colorId)}
                  onColorSelect={onCustomPaletteDraftColorToggle}
                  onFeaturedSectionAction={() =>
                    onCustomPaletteDraftSelectAll(usedColors.map((entry) => entry.colorId))
                  }
                  featuredSectionActionLabel="Select all"
                  persistScrollPosition
                  persistenceKey="sidebar-color-panel-custom-palette-create-library"
                  selectedColorIds={customPaletteDraftColorIds}
                  selectionMode="multiple"
                  showAllSectionHeader
                  showFeaturedSection
                  showFeaturedSymbols={showSymbols}
                  symbolAssignments={symbolAssignments}
                />
              </div>
            </div>

            <div
              className={[
                styles.customPaletteCreateFooterBar,
                customPaletteDraftColors.length === 0 ? styles.customPaletteCreateFooterBarEmpty : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div
                className={[
                  styles.customPaletteSelectionSummary,
                  customPaletteDraftColors.length === 0
                    ? styles.customPaletteSelectionSummaryEmpty
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className={styles.customPaletteSelectionSummaryTop}>
                  <div className={styles.customPaletteSelectionSummaryText}>
                    <EditableDesignTitle
                      className={styles.customPaletteSelectionSummaryTitle}
                      documentTitle={customPaletteDraftName}
                      inputAriaLabel="Palette name"
                      onCommitTitle={onCustomPaletteDraftNameChange}
                      renameAriaLabel="Rename palette"
                      renameRequestToken={0}
                    />
                  </div>
                </div>

                {customPaletteDraftColors.length > 0 ? (
                  <div className={styles.customPaletteSelectionMetaRow}>
                    <span
                      className={styles.customPaletteSelectionCount}
                      style={typographyStyles.p2}
                    >
                      {customPaletteDraftColors.length}{" "}
                      {customPaletteDraftColors.length === 1
                        ? "color selected"
                        : "colors selected"}
                    </span>
                    <button
                      type="button"
                      className={styles.customPaletteSelectionSummaryAction}
                      onClick={onCustomPaletteDraftReset}
                    >
                      Clear
                    </button>
                  </div>
                ) : null}

                {customPaletteDraftColors.length > 0 ? (
                  <div className={styles.customPaletteSelectionSwatches}>
                    {customPaletteDraftColors.map((color) => (
                      <span
                        key={color.id}
                        className={styles.customPaletteSelectionSwatchItem}
                        aria-label={`${color.name} (${color.code})`}
                        title={`${color.name} (${color.code})`}
                        role="img"
                      >
                        <span
                          className={styles.customPaletteSelectionSwatch}
                          aria-hidden="true"
                          style={{ backgroundColor: color.hex }}
                        />
                        <button
                          type="button"
                          className={styles.customPaletteSelectionRemoveButton}
                          aria-label={`Remove ${color.name} (${color.code}) from palette`}
                          title={`Remove ${color.name} (${color.code})`}
                          onClick={() => onCustomPaletteDraftColorToggle(color.id)}
                        >
                          <span
                            className={styles.customPaletteSelectionRemoveGlyph}
                            aria-hidden="true"
                          />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p
                    className={styles.customPaletteSelectionSummaryCaption}
                    style={typographyStyles.p2}
                  >
                    Select colors from Design colors or the Library to start building this palette.
                  </p>
                )}
              </div>

              <Button
                type="button"
                variant="primary"
                size="md"
                className={styles.customPaletteCreateFooterButton}
                disabled={!canSaveCustomPalette}
                onClick={saveCustomPalette}
              >
                <span>Save palette</span>
              </Button>
            </div>
          </div>
        )}
      </div>
      <Modal
        isOpen={paletteDeleteTarget !== null}
        title="Delete this palette?"
        description={
          paletteDeleteTarget
            ? `Delete "${paletteDeleteTarget.name}" from this design? This will not remove any colors from the design itself.`
            : ""
        }
        tone="fail"
        dismissLabel="Cancel"
        confirmLabel="Delete palette"
        confirmVariant="destructive"
        onDismiss={() => setPaletteDeleteTarget(null)}
        onConfirm={() => {
          if (!paletteDeleteTarget) {
            return;
          }

          dispatch(createDeleteCustomPaletteCommand(paletteDeleteTarget.id));
          setPaletteDeleteTarget(null);
        }}
      />
    </section>
  );
}

function createCustomPaletteId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `custom-palette_${crypto.randomUUID()}`;
  }

  return `custom-palette_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
