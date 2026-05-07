"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/design-system";
import { ButtonIcon } from "@/components/design-system";
import { FieldInput } from "@/components/design-system";
import { MenuSurface } from "@/components/design-system";
import { SegmentedControl } from "@/components/design-system";
import { getDmcColorFamilySections } from "@/lib/editor-v2/editor/color-library";
import { hexToRgb } from "@/lib/editor-v2/editor/color-utils";
import type { PaletteColor } from "@/lib/editor-v2/editor/store";
import styles from "./ColorLibrary.module.css";

type ColorLibraryView = "featured" | "all";
type ColorLibraryLayoutMode = "list" | "grid";

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
  showAllSectionHeader = true,
  showAllSymbols = false,
  showFeaturedSection = true,
  showFeaturedSymbols = false,
  symbolAssignments = {},
  transparentSelected = false,
}: ColorLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<ColorLibraryView>("featured");
  const [layoutMode, setLayoutMode] = useState<ColorLibraryLayoutMode>("grid");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);
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
  const featuredColors = filteredColors.filter((color) => featuredColorIdSet.has(color.id));
  const familySections = getDmcColorFamilySections(filteredColors);
  const hasSearchQuery = normalizedSearchQuery.length > 0;
  const canShowFeaturedView = showFeaturedSection && featuredColorIds.length > 0;
  const activeView = canShowFeaturedView ? view : "all";
  const segmentedOptions = [
    { label: "Design colors", value: "featured" },
    { label: "All colors", value: "all" },
  ] as const;

  useEffect(() => {
    if (!settingsOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;

      if (
        (settingsTriggerRef.current && settingsTriggerRef.current.contains(target)) ||
        (settingsMenuRef.current && settingsMenuRef.current.contains(target))
      ) {
        return;
      }

      setSettingsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [settingsOpen]);

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
        data-tooltip="Transparent"
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
        data-tooltip={color.code}
        aria-label={`${color.name} (${color.code})`}
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
        <span className={styles.colorListRowCode}>{formatColorCodeLabel(color)}</span>
        <span className={styles.colorListRowName}>{color.name}</span>
      </button>
    );
  }

  return (
    <div className={[styles.library, className].filter(Boolean).join(" ")}>
      <div className={styles.stickyHeader}>
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

        <div className={styles.searchField}>
          <span aria-hidden="true" className={styles.searchIcon} />
          <FieldInput
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search"
            aria-label="Search colors"
            className={styles.searchInput}
          />
          <button
            ref={settingsTriggerRef}
            type="button"
            className={styles.searchSettingsTrigger}
            aria-label="Open color library settings"
            aria-haspopup="dialog"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((current) => !current)}
          >
            <ButtonIcon
              icon="/icons/lucide/sliders-horizontal.svg"
              className={styles.searchSettingsTriggerIcon}
            />
          </button>

          {settingsOpen ? (
            <MenuSurface
              ref={settingsMenuRef}
              role="dialog"
              aria-label="Color library settings"
              className={styles.settingsMenu}
            >
              <div className={styles.settingsMenuSection}>
                <p className={styles.settingsMenuLabel}>View</p>
                <SegmentedControl<ColorLibraryLayoutMode>
                  ariaLabel="Color library layout"
                  className={styles.layoutToggle}
                  itemClassName={styles.layoutToggleItem}
                  value={layoutMode}
                  options={[
                    {
                      value: "list",
                      label: (
                        <ButtonIcon
                          icon="/icons/lucide/list.svg"
                          className={styles.layoutToggleIcon}
                        />
                      ),
                    },
                    {
                      value: "grid",
                      label: (
                        <ButtonIcon
                          icon="/icons/lucide/layout-grid.svg"
                          className={styles.layoutToggleIcon}
                        />
                      ),
                    },
                  ]}
                  onChange={setLayoutMode}
                />
              </div>
            </MenuSurface>
          ) : null}
        </div>
      </div>

      <div className={styles.libraryBody}>
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
                    : "No design colors found."}
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
                    : "No colors found."}
                </p>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
