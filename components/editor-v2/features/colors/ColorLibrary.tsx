"use client";

import { useState } from "react";
import { FieldInput } from "@/components/design-system";
import { Button } from "@/components/design-system";
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

interface ColorLibraryProps {
  activeColorId: string | null;
  className?: string;
  colors: PaletteColor[];
  featuredColorIds?: string[];
  onColorSelect: (colorId: string) => void;
  showAllSectionHeader?: boolean;
  showAllSymbols?: boolean;
  showFeaturedSection?: boolean;
  showFeaturedSymbols?: boolean;
  symbolAssignments?: Record<string, string>;
}

export function ColorLibrary({
  activeColorId,
  className,
  colors,
  featuredColorIds = [],
  onColorSelect,
  showAllSectionHeader = true,
  showAllSymbols = false,
  showFeaturedSection = true,
  showFeaturedSymbols = false,
  symbolAssignments = {},
}: ColorLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const featuredColorIdSet = new Set(featuredColorIds);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const matchesSearch = (color: PaletteColor) =>
    normalizedSearchQuery.length === 0
      ? true
      : [color.name, color.code, color.hex, color.brand]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearchQuery);
  const filteredColors = colors.filter(matchesSearch);
  const featuredColors = filteredColors.filter((color) => featuredColorIdSet.has(color.id));
  const hasSearchQuery = normalizedSearchQuery.length > 0;

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
        aria-label={`${color.name} (${color.code})`}
        aria-pressed={selected}
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
          placeholder="Search colors"
          aria-label="Search colors"
          className={styles.searchInput}
        />
      </div>

      {showFeaturedSection && featuredColors.length > 0 ? (
        <section className={styles.section} aria-label="Design colors">
          <div className={styles.sectionContent}>
            <h3 className={styles.sectionHeader}>Design Colors</h3>
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
            <h3 className={styles.sectionHeader}>All Colors</h3>
          ) : null}
          {filteredColors.length > 0 ? (
            <div className={styles.sectionGrid}>
              {filteredColors.map((color) =>
                renderColorButton(color, { showSymbol: showAllSymbols }),
              )}
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
