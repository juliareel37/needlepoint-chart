"use client";

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

interface ColorLibraryProps {
  activeColorId: string | null;
  className?: string;
  colors: PaletteColor[];
  featuredColorIds?: string[];
  onColorSelect: (colorId: string) => void;
}

export function ColorLibrary({
  activeColorId,
  className,
  colors,
  featuredColorIds = [],
  onColorSelect,
}: ColorLibraryProps) {
  const featuredColorIdSet = new Set(featuredColorIds);
  const featuredColors = colors.filter((color) => featuredColorIdSet.has(color.id));

  function renderColorButton(color: PaletteColor) {
    const selected = color.id === activeColorId;

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
          {selected ? (
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
      {featuredColors.length > 0 ? (
        <section className={styles.section} aria-label="Design colors">
          <div className={styles.sectionContent}>
            <h3 className={styles.sectionHeader}>Design Colors</h3>
            <div className={styles.sectionGrid}>{featuredColors.map(renderColorButton)}</div>
          </div>
        </section>
      ) : null}

      <section className={styles.section} aria-label="All colors">
        <div className={styles.sectionContent}>
          <h3 className={styles.sectionHeader}>All Colors</h3>
          <div className={styles.sectionGrid}>{colors.map(renderColorButton)}</div>
        </div>
      </section>
    </div>
  );
}
