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
  onColorSelect: (colorId: string) => void;
}

export function ColorLibrary({
  activeColorId,
  className,
  colors,
  onColorSelect,
}: ColorLibraryProps) {
  return (
    <div className={[styles.library, className].filter(Boolean).join(" ")}>
      {colors.map((color) => {
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
      })}
    </div>
  );
}
