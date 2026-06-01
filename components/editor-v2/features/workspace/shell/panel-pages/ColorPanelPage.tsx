"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { typographyStyles } from "@/app/design-system/typography";
import { Button, ButtonIcon, Modal } from "@/components/design-system";
import { ColorLibrary } from "@/components/editor-v2/features/colors";
import { hexToRgb } from "@/lib/editor-v2/editor/color-utils";
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

function getSwatchCheckColor(hex: string) {
  const rgb = hexToRgb(hex);

  if (!rgb) {
    return "#ffffff";
  }

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  return luminance > 0.6 ? "#111111" : "#ffffff";
}

function formatColorCodeLabel(color: PaletteColor) {
  return color.brand === "dmc" ? `DMC ${color.code}` : color.code;
}

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
  onColorSwapPreviewChange: (preview: { fromColorId: string; toColorId: string } | null) => void;
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
  onColorSwapPreviewChange,
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
  const designColorTooltipRef = useRef<HTMLSpanElement | null>(null);
  const [paletteDeleteTarget, setPaletteDeleteTarget] = useState<CustomPalette | null>(null);
  const [activeDesignColorTooltip, setActiveDesignColorTooltip] = useState<{
    key: string;
    label: string;
    detail?: string;
    anchorLeft: number;
    anchorTop: number;
    placement: "top" | "bottom";
    target: HTMLButtonElement;
  } | null>(null);
  const [designColorTooltipLayout, setDesignColorTooltipLayout] = useState<{
    left: number;
    top: number;
    arrowLeft: number;
  } | null>(null);
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
  const orderedOverviewUsedColors = useMemo(() => {
    const usedColorEntryById = new Map(usedColors.map((entry) => [entry.colorId, entry]));
    const paletteColorIdSet = new Set(palette.map((color) => color.id));
    const paletteOrderedUsedColors = palette
      .map((color) => usedColorEntryById.get(color.id))
      .filter((entry): entry is { colorId: string; count: number } => Boolean(entry));
    const nonPaletteUsedColors = usedColors.filter((entry) => !paletteColorIdSet.has(entry.colorId));

    return [...paletteOrderedUsedColors, ...nonPaletteUsedColors];
  }, [palette, usedColors]);
  const openDesignColorsView = () => onViewChange("design-colors");
  const openCustomPalettesView = () => onViewChange("custom-palettes");
  const openCustomPaletteCreateView = () => onCustomPaletteCreateOpen();
  const activeColorCodeLabel = activeColor ? formatColorCodeLabel(activeColor) : null;
  const customPalettes = Object.values(customPalettesById);
  const customPaletteDraftColors = customPaletteDraftColorIds
    .map((colorId) => colorsById[colorId])
    .filter((color): color is PaletteColor => Boolean(color));
  const canSaveCustomPalette = customPaletteDraftColorIds.length > 0;

  function updateDesignColorTooltip(target: HTMLButtonElement | null) {
    if (!target || !pageRef.current?.contains(target)) {
      setActiveDesignColorTooltip(null);
      return;
    }

    const label = target.dataset.tooltip;
    const detail = target.dataset.tooltipDetail;
    const key = target.dataset.tooltipKey;

    if (!label || !key) {
      setActiveDesignColorTooltip(null);
      return;
    }

    const targetRect = target.getBoundingClientRect();
    const tooltipHeightEstimate = 50;
    const headerGap = 8;
    const shouldPlaceBelow = targetRect.top - tooltipHeightEstimate < headerGap;

    setActiveDesignColorTooltip({
      key,
      label,
      detail,
      anchorLeft: targetRect.left + targetRect.width / 2,
      anchorTop: shouldPlaceBelow ? targetRect.bottom : targetRect.top,
      placement: shouldPlaceBelow ? "bottom" : "top",
      target,
    });
  }

  useEffect(() => {
    if (!activeDesignColorTooltip) {
      return;
    }

    const update = () => {
      if (!document.body.contains(activeDesignColorTooltip.target)) {
        setActiveDesignColorTooltip(null);
        return;
      }

      updateDesignColorTooltip(activeDesignColorTooltip.target);
    };

    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [activeDesignColorTooltip]);

  useLayoutEffect(() => {
    if (!activeDesignColorTooltip || !designColorTooltipRef.current) {
      setDesignColorTooltipLayout(null);
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = designColorTooltipRef.current.offsetWidth;
    const tooltipHeight = designColorTooltipRef.current.offsetHeight;
    const sidePadding = 8;
    const arrowInset = 10;
    const arrowHalfWidth = 4;
    const tooltipGap = 10;
    const minLeft = sidePadding;
    const maxLeft = Math.max(sidePadding, viewportWidth - sidePadding - tooltipWidth);
    const minTop = sidePadding;
    const maxTop = Math.max(sidePadding, viewportHeight - sidePadding - tooltipHeight);
    const left = Math.min(
      Math.max(activeDesignColorTooltip.anchorLeft - tooltipWidth / 2, minLeft),
      maxLeft,
    );
    const unclampedTop =
      activeDesignColorTooltip.placement === "top"
        ? activeDesignColorTooltip.anchorTop - tooltipHeight - tooltipGap
        : activeDesignColorTooltip.anchorTop + tooltipGap;
    const top = Math.min(Math.max(unclampedTop, minTop), maxTop);
    const arrowLeft = Math.min(
      Math.max(activeDesignColorTooltip.anchorLeft, left + arrowInset),
      left + tooltipWidth - arrowInset,
    );

    setDesignColorTooltipLayout((current) =>
      current &&
      current.left === left &&
      current.top === top &&
      current.arrowLeft === arrowLeft - arrowHalfWidth
        ? current
        : {
            left,
            top,
            arrowLeft: arrowLeft - arrowHalfWidth,
          },
    );
  }, [activeDesignColorTooltip]);

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
    <section
      ref={pageRef}
      className={[
        styles.sidebarSection,
        styles.colorPanelPageSection,
        view === "design-colors" ? styles.designColorsPageSection : "",
        view === "custom-palette-create" ? styles.customPaletteCreateSection : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.colorPanelPageBody}>
        {view === "overview" ? (
          <>
            <div
              className={[
                styles.metaRow,
                styles.activeColorRow,
                styles.colorPanelActiveColorRow,
              ].join(" ")}
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
              className={[
                styles.sidebarSubsection,
                styles.sidebarColorPreviewSection,
                styles.sidebarDesignColorsGridSection,
              ].join(" ")}
            >
              <div className={styles.sidebarSubsectionHeaderRow}>
                <div className={styles.sidebarSubsectionHeader}>
                  <div className={styles.sidebarColorPreviewTitleRow}>
                    <h3 style={typographyStyles.h5}>
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
                <button
                  type="button"
                  className={styles.sidebarHeaderActionButtonIconOnly}
                  aria-label="View all design colors"
                  onClick={openDesignColorsView}
                >
                  <ButtonIcon icon="/icons/lucide/arrow-right.svg" />
                </button>
              </div>

              {usedColors.length > 0 ? (
                <div
                  className={styles.sidebarDesignColorsGrid}
                  role="group"
                  aria-label={selectionScopeActive ? "Selection colors" : "Design colors"}
                  onMouseMove={(event) => {
                    const target = event.target instanceof Element
                      ? event.target.closest("button[data-tooltip]")
                      : null;

                    if (!(target instanceof HTMLButtonElement) || !event.currentTarget.contains(target)) {
                      setActiveDesignColorTooltip((current) =>
                        current?.target.matches(":focus-visible") ? current : null,
                      );
                      return;
                    }

                    if (activeDesignColorTooltip?.target !== target) {
                      updateDesignColorTooltip(target);
                    }
                  }}
                  onMouseOver={(event) => {
                    const target = event.target instanceof Element
                      ? event.target.closest("button[data-tooltip]")
                      : null;

                    if (!(target instanceof HTMLButtonElement) || !event.currentTarget.contains(target)) {
                      setActiveDesignColorTooltip((current) =>
                        current?.target.matches(":focus-visible") ? current : null,
                      );
                      return;
                    }

                    updateDesignColorTooltip(target);
                  }}
                  onMouseOut={(event) => {
                    const relatedTarget = event.relatedTarget;

                    if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) {
                      return;
                    }

                    setActiveDesignColorTooltip((current) =>
                      current?.target.matches(":focus-visible") ? current : null,
                    );
                  }}
                  onFocusCapture={(event) => {
                    const target = event.target instanceof Element
                      ? event.target.closest("button[data-tooltip]")
                      : null;

                    if (!(target instanceof HTMLButtonElement) || !event.currentTarget.contains(target)) {
                      return;
                    }

                    updateDesignColorTooltip(target);
                  }}
                  onBlurCapture={(event) => {
                    const relatedTarget = event.relatedTarget;

                    if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) {
                      return;
                    }

                    setActiveDesignColorTooltip(null);
                  }}
                >
                  {orderedOverviewUsedColors.map((entry) => {
                    const color = colorsById[entry.colorId];

                    if (!color) {
                      return null;
                    }

                    const selected = color.id === activeColorId;
                    const colorCodeLabel = formatColorCodeLabel(color);

                    return (
                      <button
                        key={entry.colorId}
                        type="button"
                        className={styles.sidebarDesignColorButton}
                        data-active={selected ? "true" : "false"}
                        data-tooltip={color.name}
                        data-tooltip-detail={colorCodeLabel}
                        data-tooltip-key={color.id}
                        aria-label={`${color.name} (${colorCodeLabel})`}
                        aria-pressed={selected}
                        onClick={() => dispatch(createSetActiveColorCommand(color.id))}
                      >
                        <span
                          aria-hidden="true"
                          className={styles.sidebarDesignColorSwatch}
                          style={{ backgroundColor: color.hex }}
                        >
                          {selected ? (
                            <span
                              aria-hidden="true"
                              className={styles.sidebarDesignColorSwatchCheck}
                              style={{ color: getSwatchCheckColor(color.hex) }}
                            >
                              ✓
                            </span>
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {/*
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
            */}

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
                  No palettes in this design.
                </p>
              )}
            </div>

          <div className={styles.traceSectionDivider} aria-hidden="true" />

            <div
              className={[
                styles.sidebarSubsection,
                styles.sidebarColorLibrarySection,
                styles.sidebarOverviewColorLibrarySection,
              ].join(" ")}
            >
              <div className={styles.sidebarColorLibraryCard}>
                <ColorLibrary
                  activeColorId={activeColorId}
                  className={[
                    styles.sidebarColorLibrary,
                    styles.sidebarOverviewColorLibrary,
                  ].join(" ")}
                  colors={palette}
                  featuredColorIds={usedColors.map((entry) => entry.colorId)}
                  onColorSelect={(colorId) => dispatch(createSetActiveColorCommand(colorId))}
                  persistenceKey="sidebar-color-panel-library"
                  scrollMode="page"
                  showAllSectionHeader={false}
                  showFeaturedSection={false}
                  showFeaturedSymbols={showSymbols}
                  stickyHeaderContent={
                    <h3 style={typographyStyles.h5}>Library</h3>
                  }
                  symbolAssignments={symbolAssignments}
                />
              </div>
            </div>

          </>
        ) : view === "design-colors" ? (
          <div className={[styles.sidebarSubsection, styles.designColorsPageBody].join(" ")}>
            <UsedColorsSummary
              activeColorId={activeColorId}
              usedColors={usedColors}
              colorsById={colorsById}
              customPalettesById={customPalettesById}
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
              onColorSwapPreviewChange={onColorSwapPreviewChange}
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
              <span>New Palette</span>
            </Button>

            {customPalettes.length === 0 ? (
              <div className={styles.customPaletteEmptyState}>
                <p className={styles.emptyMessage} style={typographyStyles.p2}>
                  No palettes created for this design yet.
                </p>
                {/* <button
                  type="button"
                  className={styles.customPaletteEmptyAction}
                  onClick={openCustomPaletteCreateView}
                >
                  Create your first palette
                </button> */}
              </div>
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

                  {customPaletteDraftColors.length > 0 ? (
                    <button
                      type="button"
                      className={styles.customPaletteSelectionSummaryAction}
                      onClick={onCustomPaletteDraftReset}
                    >
                      Clear
                    </button>
                  ) : null}
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
                  Select colors to add to your palette
                  </p>
                )}
              </div>

              <div className={styles.customPaletteCreateFooterActions}>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className={styles.customPaletteCreateFooterButton}
                  onClick={() => {
                    onCustomPaletteDraftReset();
                    onViewChange("custom-palettes");
                  }}
                >
                  <span>Cancel</span>
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className={styles.customPaletteCreateFooterButton}
                  disabled={!canSaveCustomPalette}
                  onClick={saveCustomPalette}
                >
                  <span>Save</span>
                </Button>
              </div>
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
      {activeDesignColorTooltip
        ? createPortal(
            <div aria-hidden="true" className={styles.sidebarDesignColorTooltipLayer}>
              <span
                ref={designColorTooltipRef}
                className={styles.sidebarDesignColorTooltip}
                data-placement={activeDesignColorTooltip.placement}
                style={{
                  left: `${designColorTooltipLayout?.left ?? activeDesignColorTooltip.anchorLeft}px`,
                  top: `${
                    designColorTooltipLayout?.top ??
                    (activeDesignColorTooltip.placement === "top"
                      ? activeDesignColorTooltip.anchorTop
                      : activeDesignColorTooltip.anchorTop + 10)
                  }px`,
                }}
              >
                <span className={styles.sidebarDesignColorTooltipTitle}>
                  {activeDesignColorTooltip.label}
                </span>
                {activeDesignColorTooltip.detail ? (
                  <span className={styles.sidebarDesignColorTooltipDetail}>
                    {activeDesignColorTooltip.detail}
                  </span>
                ) : null}
              </span>
              <span
                className={styles.sidebarDesignColorTooltipArrow}
                data-placement={activeDesignColorTooltip.placement}
                style={{
                  left: `${designColorTooltipLayout?.arrowLeft ?? activeDesignColorTooltip.anchorLeft - 4}px`,
                  top:
                    activeDesignColorTooltip.placement === "top"
                      ? `${activeDesignColorTooltip.anchorTop - 14}px`
                      : `${activeDesignColorTooltip.anchorTop + 6}px`,
                }}
              />
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}

function createCustomPaletteId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `custom-palette_${crypto.randomUUID()}`;
  }

  return `custom-palette_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
