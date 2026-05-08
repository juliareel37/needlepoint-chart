"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/design-system";
import { ButtonIcon } from "@/components/design-system";
import { FieldInput } from "@/components/design-system";
import { SegmentedControl } from "@/components/design-system";
import {
  getDmcColorFamily,
  getDmcColorFamilyFilterOptions,
  getDmcColorFamilySections,
  type DmcColorFamilyFilter,
} from "@/lib/editor-v2/editor/color-library";
import { hexToRgb } from "@/lib/editor-v2/editor/color-utils";
import type { PaletteColor } from "@/lib/editor-v2/editor/store";
import styles from "./ColorLibrary.module.css";

type ColorLibraryView = "featured" | "all";
type ColorLibraryLayoutMode = "list" | "grid";

type ColorLibraryPersistenceState = {
  view: ColorLibraryView;
  familyFilter: DmcColorFamilyFilter | "all";
};

const colorLibraryPersistence = new Map<string, ColorLibraryPersistenceState>();
const TOOLTIP_OVERFLOW_PADDING = 16;

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
  featuredColorIds?: string[];
  includeTransparentSwatch?: boolean;
  onColorSelect: (colorId: string) => void;
  onTransparentSelect?: () => void;
  persistenceKey?: string;
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
  featuredColorIds = [],
  includeTransparentSwatch = false,
  onColorSelect,
  onTransparentSelect,
  persistenceKey,
  scrollActiveColorIntoView = false,
  showAllSectionHeader = true,
  showAllSymbols = false,
  showFeaturedSection = true,
  showFeaturedSymbols = false,
  symbolAssignments = {},
  transparentSelected = false,
}: ColorLibraryProps) {
  const initialPersistenceState = persistenceKey
    ? colorLibraryPersistence.get(persistenceKey)
    : undefined;
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setViewState] = useState<ColorLibraryView>(() =>
    initialPersistenceState?.view ?? "featured",
  );
  const [familyFilter, setFamilyFilterState] = useState<DmcColorFamilyFilter | "all">(
    () => initialPersistenceState?.familyFilter ?? "all",
  );
  const [layoutMode, setLayoutMode] = useState<ColorLibraryLayoutMode>("grid");
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
  const scrollToActiveFrameRef = useRef<number | null>(null);
  const featuredColorIdSet = new Set(featuredColorIds);
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
  const featuredColors = familyFilteredColors.filter((color) => featuredColorIdSet.has(color.id));
  const familySections = getDmcColorFamilySections(familyFilteredColors);
  const familyFilterOptions = getDmcColorFamilyFilterOptions(colors);
  const hasSearchQuery = normalizedSearchQuery.length > 0;
  const canShowFeaturedView = showFeaturedSection;
  const activeView = canShowFeaturedView ? view : "all";
  const segmentedOptions = [
    { label: "Design colors", value: "featured" },
    { label: "Library", value: "all" },
  ] as const;

  function writePersistence(
    nextView: ColorLibraryView,
    nextFamilyFilter: DmcColorFamilyFilter | "all",
  ) {
    if (!persistenceKey) {
      return;
    }

    colorLibraryPersistence.set(persistenceKey, {
      view: nextView,
      familyFilter: nextFamilyFilter,
    });
  }

  function setView(nextView: ColorLibraryView) {
    if (nextView === viewRef.current) {
      return;
    }

    writePersistence(nextView, familyFilter);

    setViewState(nextView);
  }

  function setFamilyFilter(nextFamilyFilter: DmcColorFamilyFilter | "all") {
    if (nextFamilyFilter === familyFilter) {
      if (nextFamilyFilter === "all") {
        return;
      }

      writePersistence(viewRef.current, "all");
      setFamilyFilterState("all");
      return;
    }

    writePersistence(viewRef.current, nextFamilyFilter);
    setFamilyFilterState(nextFamilyFilter);
  }

  function toggleLayoutMode() {
    setLayoutMode((current) => (current === "grid" ? "list" : "grid"));
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
    if (!scrollActiveColorIntoView || !activeColorId) {
      return;
    }

    const target = libraryRef.current?.querySelector<HTMLButtonElement>(
      `[data-color-library-id="${activeColorId}"]`,
    );

    if (!target) {
      return;
    }

    if (scrollToActiveFrameRef.current !== null) {
      cancelAnimationFrame(scrollToActiveFrameRef.current);
    }

    scrollToActiveFrameRef.current = window.requestAnimationFrame(() => {
      scrollToActiveFrameRef.current = window.requestAnimationFrame(() => {
        target.scrollIntoView({
          block: "center",
          inline: "nearest",
        });
        scrollToActiveFrameRef.current = null;
      });
    });

    return () => {
      if (scrollToActiveFrameRef.current !== null) {
        cancelAnimationFrame(scrollToActiveFrameRef.current);
        scrollToActiveFrameRef.current = null;
      }
    };
  }, [activeColorId, familyFilter, layoutMode, scrollActiveColorIntoView, view, searchQuery]);

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
      anchorLeft: targetRect.left - shellRect.left + targetRect.width / 2,
      anchorTop: shouldPlaceBelow
        ? targetRect.bottom - shellRect.top
        : targetRect.top - shellRect.top,
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
    if (!activeTooltip || !libraryShellRef.current || !tooltipRef.current) {
      setTooltipLayout(null);
      return;
    }

    const shellWidth = libraryShellRef.current.clientWidth;
    const shellHeight = libraryShellRef.current.clientHeight;
    const tooltipWidth = tooltipRef.current.offsetWidth;
    const tooltipHeight = tooltipRef.current.offsetHeight;
    const sidePadding = 8;
    const arrowInset = 10;
    const arrowHalfWidth = 4;
    const tooltipGap = 10;
    const minLeft = sidePadding;
    const maxLeft = Math.max(sidePadding, shellWidth - sidePadding - tooltipWidth);
    const minTop = sidePadding;
    const maxTop = Math.max(sidePadding, shellHeight - sidePadding - tooltipHeight);
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
    return (
      <Button
        key="transparent-swatch"
        type="button"
        onClick={() => onTransparentSelect?.()}
        variant="ghostV2"
        size="sm"
        active={transparentSelected}
        inertWhenActive
        className={styles.colorButton}
        data-color-library-id="transparent-swatch"
        data-tooltip="Transparent"
        data-tooltip-key="transparent-swatch"
        aria-label="Transparent"
        aria-pressed={transparentSelected}
      >
        {renderSwatch(null, { selected: transparentSelected, transparent: true })}
      </Button>
    );
  }

  function renderColorButton(color: PaletteColor, options?: { showSymbol?: boolean }) {
    const selected = color.id === activeColorId;
    const showSymbol = options?.showSymbol ?? false;
    const symbol = showSymbol ? symbolAssignments[color.id] : null;
    const colorCodeLabel = formatColorCodeLabel(color);
    const colorLabel = `${color.name} (${colorCodeLabel})`;

    return (
      <Button
        key={color.id}
        type="button"
        onClick={() => onColorSelect(color.id)}
        variant="ghostV2"
        size="sm"
        active={selected}
        inertWhenActive
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

  function renderColorListRow(color: PaletteColor, options?: { showSymbol?: boolean }) {
    const selected = color.id === activeColorId;

    return (
      <button
        key={color.id}
        type="button"
        onClick={() => onColorSelect(color.id)}
        className={styles.colorListRow}
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
      <div className={[styles.library, className].filter(Boolean).join(" ")}>
        <div ref={stickyHeaderRef} className={styles.stickyHeader}>
          {canShowFeaturedView ? (
            <SegmentedControl<ColorLibraryView>
              ariaLabel="Color library view"
              className={styles.viewControl}
              itemClassName={styles.viewControlItem}
              value={activeView}
              options={segmentedOptions}
              onChange={setView}
            />
          ) : null}

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
                data-active={settingsOpen ? "true" : "false"}
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
                    <div className={styles.familyFilterRow} role="group" aria-label="Color family">
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

        <div ref={libraryRef} className={styles.libraryBody}>
          {includeTransparentSwatch ? (
            <section className={styles.section} aria-label="Transparent">
              <div className={styles.sectionContent}>
                <h3 className={styles.sectionHeader}>Transparent</h3>
                <div className={styles.sectionGrid}>{renderTransparentButton()}</div>
              </div>
            </section>
          ) : null}

          {activeView === "featured" ? (
            <section className={styles.section} aria-label="Design colors">
              <div className={styles.sectionContent}>
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
                    {hasSearchQuery
                      ? `No design colors found for "${searchQuery.trim()}".`
                      : familyFilter === "all"
                        ? "None yet."
                        : "No design colors found in this family."}
                  </p>
                )}
              </div>
            </section>
          ) : null}

          {activeView === "all" ? (
            <section className={styles.section} aria-label="All colors">
              <div className={styles.sectionContent}>
                {familySections.length > 0 ? (
                  <div className={styles.familySections}>
                    {familySections.map((section) => (
                      <div key={section.family} className={styles.familySection}>
                        <h4 className={styles.familySectionHeader}>{section.label}</h4>
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
        </div>
      </div>
      {activeTooltip ? (
        <div aria-hidden="true" className={styles.tooltipLayer}>
          <span
            ref={tooltipRef}
            className={styles.tooltip}
            data-placement={activeTooltip.placement}
            style={{
              left: `${
                (tooltipLayout?.left ?? activeTooltip.anchorLeft) + TOOLTIP_OVERFLOW_PADDING
              }px`,
              top: `${
                (tooltipLayout?.top ??
                  (activeTooltip.placement === "top"
                    ? activeTooltip.anchorTop
                    : activeTooltip.anchorTop + 10)) + TOOLTIP_OVERFLOW_PADDING
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
              left: `${
                (tooltipLayout?.arrowLeft ?? activeTooltip.anchorLeft - 4) +
                TOOLTIP_OVERFLOW_PADDING
              }px`,
              top:
                activeTooltip.placement === "top"
                  ? `${activeTooltip.anchorTop - 14 + TOOLTIP_OVERFLOW_PADDING}px`
                  : `${activeTooltip.anchorTop + 6 + TOOLTIP_OVERFLOW_PADDING}px`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
