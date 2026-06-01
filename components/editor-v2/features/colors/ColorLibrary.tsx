"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/design-system";
import { ButtonIcon } from "@/components/design-system";
import { FieldInput } from "@/components/design-system";
import { SegmentedControl } from "@/components/design-system";
import {
  getDmcColorFamily,
  getDmcColorFamilyFilterOptions,
  getDmcColorFamilySections,
  type ColorLibraryPaletteSection,
  type DmcColorFamilyFilter,
} from "@/lib/editor-v2/editor/color-library";
import { hexToRgb } from "@/lib/editor-v2/editor/color-utils";
import type { PaletteColor } from "@/lib/editor-v2/editor/store";
import styles from "./ColorLibrary.module.css";

type ColorLibraryView = "featured" | "all" | "palettes";
type ColorLibraryLayoutMode = "list" | "grid";

type ColorLibraryPersistenceState = {
  view: ColorLibraryView;
  familyFilter: DmcColorFamilyFilter | "all";
  layoutMode: ColorLibraryLayoutMode;
  scrollTop: number;
};

const colorLibraryPersistence = new Map<string, ColorLibraryPersistenceState>();

function getPersistenceState(persistenceKey?: string) {
  return persistenceKey ? colorLibraryPersistence.get(persistenceKey) : undefined;
}

function getSwatchCheckColor(hex: string) {
  const rgb = hexToRgb(hex);

  if (!rgb) {
    return "#ffffff";
  }

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  return luminance > 0.6 ? "#111111" : "#ffffff";
}

function getSwatchSymbolColor(hex: string) {
  const rgb = hexToRgb(hex);

  if (!rgb) {
    return "#111827";
  }

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  return luminance > 0.68 ? "#111827" : "#f8fafc";
}

function getTransparentSwatchBackground() {
  return "linear-gradient(45deg, rgba(15, 23, 42, 0.1) 25%, transparent 25%, transparent 75%, rgba(15, 23, 42, 0.1) 75%), linear-gradient(45deg, rgba(15, 23, 42, 0.1) 25%, transparent 25%, transparent 75%, rgba(15, 23, 42, 0.1) 75%)";
}

function formatColorCodeLabel(color: PaletteColor) {
  return color.brand === "dmc" ? `DMC ${color.code}` : color.code;
}

interface ColorLibraryProps {
  activeColorId: string | null;
  className?: string;
  colors: PaletteColor[];
  defaultView?: ColorLibraryView;
  featuredSectionDisplay?: "stacked" | "tabbed";
  featuredColorIds?: string[];
  featuredSectionActionLabel?: string;
  includeTransparentSwatch?: boolean;
  onColorSelect: (colorId: string) => void;
  onFeaturedSectionAction?: (() => void) | undefined;
  onManagePalettes?: (() => void) | undefined;
  paletteSections?: ColorLibraryPaletteSection[];
  onTransparentSelect?: () => void;
  persistScrollPosition?: boolean;
  persistView?: boolean;
  persistenceKey?: string;
  selectedColorIds?: string[];
  selectionMode?: "single" | "multiple";
  scrollActiveColorIntoView?: boolean;
  showAllSectionHeader?: boolean;
  showAllSymbols?: boolean;
  showFeaturedSection?: boolean;
  showFeaturedSymbols?: boolean;
  symbolAssignments?: Record<string, string>;
  transparentSelected?: boolean;
}

export function ColorLibrary({
  activeColorId,
  className,
  colors,
  defaultView = "featured",
  featuredSectionDisplay = "tabbed",
  featuredColorIds = [],
  featuredSectionActionLabel,
  includeTransparentSwatch = false,
  onColorSelect,
  onFeaturedSectionAction,
  onManagePalettes,
  paletteSections,
  onTransparentSelect,
  persistScrollPosition = false,
  persistView = true,
  persistenceKey,
  selectedColorIds = [],
  selectionMode = "single",
  scrollActiveColorIntoView = false,
  showAllSectionHeader = false,
  showAllSymbols = false,
  showFeaturedSection = true,
  showFeaturedSymbols = false,
  symbolAssignments = {},
  transparentSelected = false,
}: ColorLibraryProps) {
  const initialPersistenceState = getPersistenceState(persistenceKey);
  const showPalettesView = Array.isArray(paletteSections);
  const [searchQuery, setSearchQuery] = useState("");
  const persistedView = persistView ? initialPersistenceState?.view : undefined;
  const [view, setViewState] = useState<ColorLibraryView>(() =>
    persistedView === "palettes" && !showPalettesView
      ? defaultView
      : (persistedView ?? defaultView),
  );
  const [familyFilter, setFamilyFilterState] = useState<DmcColorFamilyFilter | "all">(
    () => initialPersistenceState?.familyFilter ?? "all",
  );
  const [layoutMode, setLayoutModeState] = useState<ColorLibraryLayoutMode>(
    () => initialPersistenceState?.layoutMode ?? "grid",
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchInputInteractive, setSearchInputInteractive] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<{
    key: string;
    label: string;
    detail?: string;
    anchorLeft: number;
    anchorTop: number;
    placement: "top" | "bottom";
    target: HTMLButtonElement;
  } | null>(null);
  const [tooltipLayout, setTooltipLayout] = useState<{
    left: number;
    top: number;
    arrowLeft: number;
  } | null>(null);
  const libraryShellRef = useRef<HTMLDivElement | null>(null);
  const libraryRef = useRef<HTMLDivElement | null>(null);
  const stickyHeaderRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);
  const viewRef = useRef<ColorLibraryView>(view);
  const restoreFrameRef = useRef<number | null>(null);
  const featuredColorIdSet = new Set(featuredColorIds);
  const selectedColorIdSet = new Set(selectedColorIds);
  const familyFilterOptions = getDmcColorFamilyFilterOptions(colors);
  const canShowFeaturedView = showFeaturedSection;
  const useTabbedFeaturedView = canShowFeaturedView && featuredSectionDisplay === "tabbed";
  const showStackedFeaturedSection = canShowFeaturedView && featuredSectionDisplay === "stacked";
  const activeView =
    useTabbedFeaturedView
      ? view === "palettes" && !showPalettesView
        ? "all"
        : view
      : "all";
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const matchesSearch = (color: PaletteColor) =>
    normalizedSearchQuery.length === 0
      ? true
      : [color.name, color.code, color.hex, color.brand, ...(color.searchAliases ?? [])]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearchQuery);
  const filteredColors = colors.filter(matchesSearch);
  const familyFilteredColors = filteredColors.filter(
    (color) => familyFilter === "all" || getDmcColorFamily(color) === familyFilter,
  );
  const featuredColors = colors.filter((color) => featuredColorIdSet.has(color.id));
  const familySections = getDmcColorFamilySections(familyFilteredColors);
  const filteredPaletteSections = paletteSections ?? [];
  const hasSearchQuery = normalizedSearchQuery.length > 0;
  const hasActiveFamilyFilter = familyFilter !== "all";
  const showLibrarySearchHeader = activeView === "all";
  const segmentedOptions = [
    { label: "Library", value: "all" },
    { label: "Design", value: "featured" },
    ...(showPalettesView ? ([{ label: "Palettes", value: "palettes" }] as const) : []),
  ] as const;

  function writePersistence(
    nextView: ColorLibraryView,
    nextFamilyFilter: DmcColorFamilyFilter | "all",
    nextLayoutMode: ColorLibraryLayoutMode,
  ) {
    if (!persistenceKey) {
      return;
    }

    colorLibraryPersistence.set(persistenceKey, {
      view: nextView,
      familyFilter: nextFamilyFilter,
      layoutMode: nextLayoutMode,
      scrollTop: libraryRef.current?.scrollTop ?? initialPersistenceState?.scrollTop ?? 0,
    });
  }

  function setView(nextView: ColorLibraryView) {
    if (nextView === viewRef.current) {
      return;
    }

    writePersistence(nextView, familyFilter, layoutMode);

    setViewState(nextView);
  }

  function setFamilyFilter(nextFamilyFilter: DmcColorFamilyFilter | "all") {
    if (nextFamilyFilter === familyFilter) {
      if (nextFamilyFilter === "all") {
        return;
      }

      writePersistence(viewRef.current, "all", layoutMode);
      setFamilyFilterState("all");
      return;
    }

    writePersistence(viewRef.current, nextFamilyFilter, layoutMode);
    setFamilyFilterState(nextFamilyFilter);
  }

  function setLayoutMode(nextLayoutMode: ColorLibraryLayoutMode) {
    if (nextLayoutMode === layoutMode) {
      return;
    }

    writePersistence(viewRef.current, familyFilter, nextLayoutMode);
    setLayoutModeState(nextLayoutMode);
  }

  function toggleLayoutMode() {
    setLayoutMode(layoutMode === "grid" ? "list" : "grid");
  }

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    if (!settingsOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [settingsOpen]);

  useLayoutEffect(() => {
    if (!persistScrollPosition || scrollActiveColorIntoView) {
      return;
    }

    const container = libraryRef.current;
    const scrollTop = getPersistenceState(persistenceKey)?.scrollTop;

    if (!container || scrollTop === undefined) {
      return;
    }

    const restoreScrollPosition = () => {
      const latestScrollTop = getPersistenceState(persistenceKey)?.scrollTop;

      if (latestScrollTop === undefined || !libraryRef.current) {
        return;
      }

      libraryRef.current.scrollTop = latestScrollTop;
    };

    restoreScrollPosition();

    restoreFrameRef.current = window.requestAnimationFrame(() => {
      restoreScrollPosition();
      restoreFrameRef.current = window.requestAnimationFrame(() => {
        restoreScrollPosition();
        restoreFrameRef.current = null;
      });
    });

    return () => {
      if (restoreFrameRef.current !== null) {
        window.cancelAnimationFrame(restoreFrameRef.current);
        restoreFrameRef.current = null;
      }
    };
  }, [familyFilter, layoutMode, persistScrollPosition, persistenceKey, scrollActiveColorIntoView, view]);

  useLayoutEffect(() => {
    if (!scrollActiveColorIntoView || !activeColorId) {
      return;
    }

    const container = libraryRef.current;
    const target = container?.querySelector<HTMLButtonElement>(
      `[data-color-library-id="${activeColorId}"]`,
    );

    if (!container || !target) {
      return;
    }

    const targetCenterOffset =
      target.offsetTop - container.clientHeight / 2 + target.clientHeight / 2;
    const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
    const destinationScrollTop = Math.min(Math.max(targetCenterOffset, 0), maxScrollTop);

    container.scrollTop = destinationScrollTop;
  }, [activeColorId, familyFilter, layoutMode, scrollActiveColorIntoView, view, searchQuery]);

  useEffect(() => {
    if (!persistScrollPosition || !persistenceKey) {
      return;
    }

    const container = libraryRef.current;

    if (!container) {
      return;
    }

    const handleScroll = () => {
      const current = colorLibraryPersistence.get(persistenceKey);

      colorLibraryPersistence.set(persistenceKey, {
        view: current?.view ?? viewRef.current,
        familyFilter: current?.familyFilter ?? familyFilter,
        layoutMode: current?.layoutMode ?? layoutMode,
        scrollTop: container.scrollTop,
      });
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      handleScroll();
      container.removeEventListener("scroll", handleScroll);
    };
  }, [familyFilter, layoutMode, persistScrollPosition, persistenceKey]);

  function updateTooltip(target: HTMLButtonElement | null) {
    if (!target || !libraryRef.current?.contains(target)) {
      setActiveTooltip(null);
      return;
    }

    const label = target.dataset.tooltip;
    const detail = target.dataset.tooltipDetail;
    const key = target.dataset.tooltipKey;

    if (!label || !key) {
      setActiveTooltip(null);
      return;
    }

    const targetRect = target.getBoundingClientRect();
    const shellRect = libraryShellRef.current?.getBoundingClientRect();
    if (!shellRect) {
      setActiveTooltip(null);
      return;
    }

    const stickyBottom = stickyHeaderRef.current?.getBoundingClientRect().bottom ?? 0;
    const tooltipHeightEstimate = 50;
    const headerGap = 8;
    const obscuredByHeader = targetRect.top < stickyBottom + 4;
    const obscuredByBottom = targetRect.bottom > shellRect.bottom - 4;
    const shouldPlaceBelow =
      targetRect.top - tooltipHeightEstimate < stickyBottom + headerGap;

    if (obscuredByHeader || obscuredByBottom) {
      setActiveTooltip(null);
      return;
    }

    setActiveTooltip({
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
    if (!activeTooltip) {
      return;
    }

    const update = () => {
      if (!document.body.contains(activeTooltip.target)) {
        setActiveTooltip(null);
        return;
      }

      updateTooltip(activeTooltip.target);
    };

    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [activeTooltip]);

  useLayoutEffect(() => {
    if (!activeTooltip || !tooltipRef.current) {
      setTooltipLayout(null);
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = tooltipRef.current.offsetWidth;
    const tooltipHeight = tooltipRef.current.offsetHeight;
    const sidePadding = 8;
    const arrowInset = 10;
    const arrowHalfWidth = 4;
    const tooltipGap = 10;
    const minLeft = sidePadding;
    const maxLeft = Math.max(sidePadding, viewportWidth - sidePadding - tooltipWidth);
    const minTop = sidePadding;
    const maxTop = Math.max(sidePadding, viewportHeight - sidePadding - tooltipHeight);
    const left = Math.min(
      Math.max(activeTooltip.anchorLeft - tooltipWidth / 2, minLeft),
      maxLeft,
    );
    const unclampedTop =
      activeTooltip.placement === "top"
        ? activeTooltip.anchorTop - tooltipHeight - tooltipGap
        : activeTooltip.anchorTop + tooltipGap;
    const top = Math.min(Math.max(unclampedTop, minTop), maxTop);
    const arrowLeft = Math.min(
      Math.max(activeTooltip.anchorLeft, left + arrowInset),
      left + tooltipWidth - arrowInset,
    );

    setTooltipLayout((current) =>
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
  }, [activeTooltip]);

  function renderSwatch(
    color: PaletteColor | null,
    options?: { selected?: boolean; showSymbol?: boolean; transparent?: boolean },
  ) {
    const selected = options?.selected ?? false;
    const showSymbol = options?.showSymbol ?? false;
    const transparent = options?.transparent ?? false;
    const symbol = color && showSymbol ? symbolAssignments[color.id] : null;

    return (
      <span
        aria-hidden="true"
        className={styles.swatch}
        style={
          transparent
            ? {
                backgroundColor: "#ffffff",
                backgroundImage: getTransparentSwatchBackground(),
                backgroundPosition: "0 0, 4px 4px",
                backgroundSize: "8px 8px, 8px 8px",
                backgroundRepeat: "repeat, repeat",
              }
            : { backgroundColor: color?.hex ?? "#ffffff" }
        }
      >
        {symbol ? (
          <span
            aria-hidden="true"
            className={styles.swatchSymbol}
            style={{ color: color ? getSwatchSymbolColor(color.hex) : "#111827" }}
          >
            {symbol}
          </span>
        ) : selected ? (
          <span
            aria-hidden="true"
            className={styles.swatchCheck}
            style={{ color: color ? getSwatchCheckColor(color.hex) : "#111111" }}
          >
            ✓
          </span>
        ) : null}
      </span>
    );
  }

  function renderTransparentButton() {
    const selected = selectionMode === "multiple" ? transparentSelected : transparentSelected;
    return (
      <Button
        key="transparent-swatch"
        type="button"
        onClick={() => onTransparentSelect?.()}
        variant="ghostV2"
        size="sm"
        active={selected}
        inertWhenActive={selectionMode === "single"}
        className={styles.colorButton}
        data-color-library-id="transparent-swatch"
        data-tooltip="Transparent"
        data-tooltip-key="transparent-swatch"
        aria-label="Transparent"
        aria-pressed={selected}
      >
        {renderSwatch(null, { selected, transparent: true })}
      </Button>
    );
  }

  function renderColorButton(
    color: PaletteColor,
    options?: { key?: string; showSymbol?: boolean },
  ) {
    const selected =
      selectionMode === "multiple"
        ? selectedColorIdSet.has(color.id)
        : color.id === activeColorId;
    const showSymbol = options?.showSymbol ?? false;
    const symbol = showSymbol ? symbolAssignments[color.id] : null;
    const colorCodeLabel = formatColorCodeLabel(color);
    const colorLabel = `${color.name} (${colorCodeLabel})`;

    return (
      <Button
        key={options?.key ?? color.id}
        type="button"
        onClick={() => onColorSelect(color.id)}
        variant="ghostV2"
        size="sm"
        active={selected}
        inertWhenActive={selectionMode === "single"}
        className={styles.colorButton}
        data-color-library-id={color.id}
        data-tooltip={color.name}
        data-tooltip-detail={colorCodeLabel}
        data-tooltip-key={color.id}
        aria-label={colorLabel}
        aria-pressed={selected}
      >
        {renderSwatch(color, { selected, showSymbol })}
      </Button>
    );
  }

  function renderColorListRow(
    color: PaletteColor,
    options?: { key?: string; showSymbol?: boolean },
  ) {
    const selected =
      selectionMode === "multiple"
        ? selectedColorIdSet.has(color.id)
        : color.id === activeColorId;

    return (
      <button
        key={options?.key ?? color.id}
        type="button"
        onClick={() => onColorSelect(color.id)}
        className={styles.colorListRow}
        data-color-library-id={color.id}
        data-active={selected ? "true" : "false"}
        aria-label={`${color.name} (${color.code})`}
        aria-pressed={selected}
      >
        <span className={styles.colorListRowSwatch}>
          {renderSwatch(color, { selected, showSymbol: options?.showSymbol })}
        </span>
        <span className={styles.colorListRowName}>{color.name}</span>
        <span
          aria-hidden="true"
          className={styles.colorListRowDivider}
        />
        <span className={styles.colorListRowCode}>{formatColorCodeLabel(color)}</span>
      </button>
    );
  }

  return (
    <div
      ref={libraryShellRef}
      className={[styles.libraryShell, className].filter(Boolean).join(" ")}
      onMouseMove={(event) => {
        const target = event.target instanceof Element
          ? event.target.closest("button[data-tooltip]")
          : null;

        if (!(target instanceof HTMLButtonElement) || !event.currentTarget.contains(target)) {
          setActiveTooltip((current) =>
            current?.target.matches(":focus-visible") ? current : null,
          );
          return;
        }

        if (activeTooltip?.target !== target) {
          updateTooltip(target);
        }
      }}
      onMouseOver={(event) => {
        const target = event.target instanceof Element
          ? event.target.closest("button[data-tooltip]")
          : null;

        if (!(target instanceof HTMLButtonElement) || !event.currentTarget.contains(target)) {
          setActiveTooltip((current) =>
            current?.target.matches(":focus-visible") ? current : null,
          );
          return;
        }

        updateTooltip(target);
      }}
      onMouseOut={(event) => {
        const relatedTarget = event.relatedTarget;

        if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) {
          return;
        }

        setActiveTooltip((current) => (current?.target.matches(":focus-visible") ? current : null));
      }}
      onFocusCapture={(event) => {
        const target = event.target instanceof Element
          ? event.target.closest("button[data-tooltip]")
          : null;

        if (!(target instanceof HTMLButtonElement) || !event.currentTarget.contains(target)) {
          return;
        }

        updateTooltip(target);
      }}
      onBlurCapture={(event) => {
        const relatedTarget = event.relatedTarget;

        if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) {
          return;
        }

        setActiveTooltip(null);
      }}
    >
      <div
        className={[styles.library, className].filter(Boolean).join(" ")}
        data-featured-display={featuredSectionDisplay}
      >
        <div ref={stickyHeaderRef} className={styles.stickyHeaders}>
          {useTabbedFeaturedView ? (
            <div className={styles.stickyHeader}>
              <SegmentedControl<ColorLibraryView>
                ariaLabel="Color library view"
                className={styles.viewControl}
                itemClassName={styles.viewControlItem}
                value={activeView}
                options={segmentedOptions}
                onChange={setView}
              />
            </div>
          ) : null}

          {showLibrarySearchHeader ? (
            <div className={styles.stickySearchHeader}>
              <div className={styles.searchRow}>
                <div className={styles.searchField}>
                  <span aria-hidden="true" className={styles.searchIcon} />
                  <FieldInput
                    type="search"
                    name="search-query"
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    inputMode="search"
                    enterKeyHint="search"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                    aria-autocomplete="none"
                    readOnly={!searchInputInteractive}
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onPointerDown={() => {
                      if (!searchInputInteractive) {
                        setSearchInputInteractive(true);
                      }
                    }}
                    onFocus={() => {
                      if (!searchInputInteractive) {
                        setSearchInputInteractive(true);
                      }
                    }}
                    onBlur={() => {
                      if (searchQuery.length === 0) {
                        setSearchInputInteractive(false);
                      }
                    }}
                    placeholder="Color name or code"
                    aria-label="Search colors"
                    className={styles.searchInput}
                  />
                </div>
                <div className={styles.searchControls}>
                  <button
                    type="button"
                    className={styles.searchControlButton}
                    data-active={settingsOpen || hasActiveFamilyFilter ? "true" : "false"}
                    aria-label={
                      settingsOpen ? "Hide color library settings" : "Show color library settings"
                    }
                    aria-expanded={settingsOpen}
                    onClick={() => setSettingsOpen((current) => !current)}
                  >
                    <ButtonIcon
                      icon="/icons/lucide/list-filter.svg"
                      className={styles.searchControlIcon}
                    />
                  </button>

                  <button
                    type="button"
                    className={styles.searchControlButton}
                    aria-label={
                      layoutMode === "grid"
                        ? "Switch color library to list view"
                        : "Switch color library to grid view"
                    }
                    onClick={toggleLayoutMode}
                  >
                    <ButtonIcon
                      icon={
                        layoutMode === "grid"
                          ? "/icons/lucide/list.svg"
                          : "/icons/lucide/layout-grid.svg"
                      }
                      className={styles.searchControlIcon}
                    />
                  </button>
                </div>
              </div>

              {settingsOpen ? (
                <div
                  role="region"
                  aria-label="Color library settings"
                  className={styles.settingsPanel}
                >
                  <div className={styles.settingsPanelContent}>
                    {familyFilterOptions.length > 0 ? (
                      <div className={styles.settingsMenuSection}>
                        {/* <p className={styles.settingsMenuLabel}>Family</p> */}
                        <div
                          className={styles.familyFilterRow}
                          role="group"
                          aria-label="Color family"
                        >
                          <button
                            type="button"
                            className={styles.familyFilterChip}
                            data-selected={familyFilter === "all" ? "true" : "false"}
                            aria-pressed={familyFilter === "all"}
                            onClick={() => setFamilyFilter("all")}
                          >
                            All
                          </button>
                          {familyFilterOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={styles.familyFilterChip}
                              data-selected={familyFilter === option.value ? "true" : "false"}
                              aria-pressed={familyFilter === option.value}
                              onClick={() => setFamilyFilter(option.value)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div ref={libraryRef} className={styles.libraryBody}>
          {includeTransparentSwatch ? (
            <section className={styles.section} aria-label="Transparent">
              <div className={styles.sectionContent}>
                <h3 className={styles.sectionHeader}>Transparent</h3>
                <div className={styles.sectionGrid}>{renderTransparentButton()}</div>
              </div>
            </section>
          ) : null}

          {showStackedFeaturedSection || activeView === "featured" ? (
            <section
              className={[
                styles.section,
                showStackedFeaturedSection ? styles.stackedFeaturedSection : null,
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label="Design colors"
            >
              <div className={styles.sectionContent}>
                {onFeaturedSectionAction && featuredColors.length > 0 ? (
                  <div className={styles.sectionHeaderRow}>
                    <h3 className={styles.sectionHeader}>Design colors</h3>
                    <button
                      type="button"
                      className={styles.sectionHeaderAction}
                      onClick={onFeaturedSectionAction}
                    >
                      {featuredSectionActionLabel ?? "Action"}
                    </button>
                  </div>
                ) : null}
                {featuredColors.length > 0 ? (
                  layoutMode === "list" ? (
                    <div className={styles.colorList}>
                      {featuredColors.map((color) =>
                        renderColorListRow(color, { showSymbol: showFeaturedSymbols }),
                      )}
                    </div>
                  ) : (
                    <div className={styles.sectionGrid}>
                      {featuredColors.map((color) =>
                        renderColorButton(color, { showSymbol: showFeaturedSymbols }),
                      )}
                    </div>
                  )
                ) : (
                  <p className={styles.emptyState}>
                    None yet.
                  </p>
                )}
              </div>
            </section>
          ) : null}

          {activeView === "all" ? (
            <section
              className={[
                styles.section,
                showStackedFeaturedSection ? styles.stackedLibrarySection : null,
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label="All colors"
            >
              <div className={styles.sectionContent}>
                {/* {showAllSectionHeader ? (
                  <h3 className={styles.sectionHeader}>Library</h3>
                ) : null} */}
                {familySections.length > 0 ? (
                  <div className={styles.familySections}>
                    {familySections.map((section) => (
                      <div key={section.family} className={styles.familySection}>
                        <h4 className={styles.libraryFamilySectionHeader}>{section.label}</h4>
                        {layoutMode === "list" ? (
                          <div className={styles.colorList}>
                            {section.colors.map((color) =>
                              renderColorListRow(color, { showSymbol: showAllSymbols }),
                            )}
                          </div>
                        ) : (
                          <div className={styles.sectionGrid}>
                            {section.colors.map((color) =>
                              renderColorButton(color, { showSymbol: showAllSymbols }),
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyState}>
                    {hasSearchQuery
                      ? `No colors found for "${searchQuery.trim()}".`
                      : familyFilter === "all"
                        ? "No colors found."
                        : "No colors found in this family."}
                  </p>
                )}
              </div>
            </section>
          ) : null}

          {activeView === "palettes" ? (
            <section className={styles.section} aria-label="Palettes">
              <div className={styles.sectionContent}>
                {filteredPaletteSections.length > 0 ? (
                  <div className={styles.familySections}>
                    {filteredPaletteSections.map((section) => (
                      <div key={section.id} className={styles.familySection}>
                        <h4 className={styles.paletteSectionHeader}>{section.label}</h4>
                        {section.colors.length > 0 ? (
                          layoutMode === "list" ? (
                            <div className={styles.colorList}>
                              {section.colors.map((color, index) =>
                                renderColorListRow(color, {
                                  key: `${section.id}-${color.id}-${index}`,
                                  showSymbol: showAllSymbols,
                                }),
                              )}
                            </div>
                          ) : (
                            <div className={styles.sectionGrid}>
                              {section.colors.map((color, index) =>
                                renderColorButton(color, {
                                  key: `${section.id}-${color.id}-${index}`,
                                  showSymbol: showAllSymbols,
                                }),
                              )}
                            </div>
                          )
                        ) : (
                          <p className={styles.emptyState}>No colors in this palette.</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyState}>
                    {!paletteSections || paletteSections.length === 0
                      ? "No palettes created yet."
                      : "No palette colors found."}
                  </p>
                )}
                {onManagePalettes ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className={styles.palettesManageButton}
                    onClick={onManagePalettes}
                  >
                    <ButtonIcon icon="/icons/lucide/sliders-horizontal.svg" />
                    <span>Manage Palettes</span>
                  </Button>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      </div>
      {activeTooltip
        ? createPortal(
            <div aria-hidden="true" className={styles.tooltipLayer}>
              <span
                ref={tooltipRef}
                className={styles.tooltip}
                data-placement={activeTooltip.placement}
                style={{
                  left: `${tooltipLayout?.left ?? activeTooltip.anchorLeft}px`,
                  top: `${
                    tooltipLayout?.top ??
                    (activeTooltip.placement === "top"
                      ? activeTooltip.anchorTop
                      : activeTooltip.anchorTop + 10)
                  }px`,
                }}
              >
                <span className={styles.tooltipTitle}>{activeTooltip.label}</span>
                {activeTooltip.detail ? (
                  <span className={styles.tooltipDetail}>{activeTooltip.detail}</span>
                ) : null}
              </span>
              <span
                className={styles.tooltipArrow}
                data-placement={activeTooltip.placement}
                style={{
                  left: `${tooltipLayout?.arrowLeft ?? activeTooltip.anchorLeft - 4}px`,
                  top:
                    activeTooltip.placement === "top"
                      ? `${activeTooltip.anchorTop - 14}px`
                      : `${activeTooltip.anchorTop + 6}px`,
                }}
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
