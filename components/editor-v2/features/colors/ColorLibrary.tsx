"use client";

import { useState } from "react";
import { FieldInput } from "@/components/design-system";
import { Button } from "@/components/design-system";
import { getDmcColorFamilySections } from "@/lib/editor-v2/editor/color-library";
import { hexToRgb } from "@/lib/editor-v2/editor/color-utils";
import type { PaletteColor } from "@/lib/editor-v2/editor/store";
import styles from "./ColorLibrary.module.css";

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
        aria-label="Transparent"
        aria-pressed={transparentSelected}
      >
        <span
          aria-hidden="true"
          className={styles.swatch}
          style={{
            backgroundColor: "#ffffff",
            backgroundImage: getTransparentSwatchBackground(),
            backgroundPosition: "0 0, 4px 4px",
            backgroundSize: "8px 8px, 8px 8px",
            backgroundRepeat: "repeat, repeat",
          }}
        >
          {transparentSelected ? (
            <span
              aria-hidden="true"
              className={styles.swatchCheck}
              style={{ color: "#111111" }}
            >
              ✓
            </span>
          ) : null}
        </span>
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
        title={color.code}
      >
        <span
          aria-hidden="true"
          className={styles.swatch}
          style={{ backgroundColor: color.hex }}
        >
          {symbol ? (
            <span
              aria-hidden="true"
              className={styles.swatchSymbol}
              style={{ color: getSwatchSymbolColor(color.hex) }}
            >
              {symbol}
            </span>
          ) : selected ? (
            <span
              aria-hidden="true"
              className={styles.swatchCheck}
              style={{ color: getSwatchCheckColor(color.hex) }}
            >
              ✓
            </span>
          ) : null}
        </span>
      </Button>
    );
  }

  return (
    <div className={[styles.library, className].filter(Boolean).join(" ")}>
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
      </div>

      {includeTransparentSwatch ? (
        <section className={styles.section} aria-label="Transparent">
          <div className={styles.sectionContent}>
            <h3 className={styles.sectionHeader}>Transparent</h3>
            <div className={styles.sectionGrid}>{renderTransparentButton()}</div>
          </div>
        </section>
      ) : null}

      {showFeaturedSection && featuredColors.length > 0 ? (
        <section className={styles.section} aria-label="Design colors">
          <div className={styles.sectionContent}>
            <h3 className={styles.sectionHeader}>Design colors</h3>
            <div className={styles.sectionGrid}>
              {featuredColors.map((color) =>
                renderColorButton(color, { showSymbol: showFeaturedSymbols }),
              )}
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.section} aria-label="All colors">
        <div className={styles.sectionContent}>
          {showAllSectionHeader ? (
            <h3 className={styles.sectionHeader}>All colors</h3>
          ) : null}
          {familySections.length > 0 ? (
            <div className={styles.familySections}>
              {familySections.map((section) => (
                <div key={section.family} className={styles.familySection}>
                  <h4 className={styles.familySectionHeader}>{section.label}</h4>
                  <div className={styles.sectionGrid}>
                    {section.colors.map((color) =>
                      renderColorButton(color, { showSymbol: showAllSymbols }),
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>
              {hasSearchQuery ? `No colors found for "${searchQuery.trim()}".` : "No colors found."}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
