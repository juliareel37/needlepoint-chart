"use client";

import type { PaletteColor } from "@/lib/editor-v2/editor/store";
import type { UsedColorSummary } from "@/lib/editor-v2/editor/selectors";
import { typographyStyles } from "@/app/design-system/typography";
import styles from "./EditorV2Shell.module.css";

export function UsedColorsSummary({
  usedColors,
  colorsById,
}: {
  usedColors: UsedColorSummary[];
  colorsById: Record<string, PaletteColor>;
}) {
  return (
    <div className={styles.usedColorsBlock}>
      <p className={styles.usedColorsHeader} style={typographyStyles.h5}>
        Used colors
      </p>
      {usedColors.length === 0 ? (
        <span className={styles.emptyMessage} style={typographyStyles.p2}>
          None yet
        </span>
      ) : (
        <ul className={styles.usedColorsList}>
          {usedColors.map((entry) => (
            <li key={entry.colorId} className={styles.usedColorsItem} style={typographyStyles.p2}>
              <span
                aria-hidden="true"
                className={styles.usedColorSwatch}
                style={{
                  backgroundColor: colorsById[entry.colorId]?.hex ?? "#ffffff",
                }}
              />
              <span>{colorsById[entry.colorId]?.name ?? entry.colorId}</span>
              <span className={styles.usedColorsItemCount}>×{entry.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
