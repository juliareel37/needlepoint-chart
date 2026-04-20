"use client";

import { useEffect, useMemo, useState } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import type { EditorStore, IconPlacementSession } from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics, WorldPoint } from "@/lib/editor-v2/editor/viewport";
import { createBeginIconPlacementCommand } from "../../workspaceCommands";
import { getInitialPlacementTransform } from "./getInitialPlacementTransform";
import type { ShapeIconLibraryItem } from "./iconLibrary";
import styles from "../EditorV2Shell.module.css";

const DEFAULT_INITIAL_WIDTH_RATIO = 0.42;

interface IconsPanelPageProps {
  dispatch: EditorStore["dispatch"];
  gridMetrics: GridWorldMetrics;
  placement: IconPlacementSession | null;
  viewportCenter: WorldPoint | null;
}

export function IconsPanelPage({
  dispatch,
  gridMetrics,
  placement,
  viewportCenter,
}: IconsPanelPageProps) {
  const [icons, setIcons] = useState<ShapeIconLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLibrary() {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await fetch("/api/editor-v2/icon-library");
        if (!response.ok) {
          throw new Error(`Icon library request failed with ${response.status}`);
        }

        const payload = (await response.json()) as { icons?: ShapeIconLibraryItem[] };
        if (!cancelled) {
          setIcons(Array.isArray(payload.icons) ? payload.icons : []);
        }
      } catch (error) {
        if (!cancelled) {
          setIcons([]);
          setLoadError(error instanceof Error ? error.message : "Unable to load icons.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadLibrary();

    return () => {
      cancelled = true;
    };
  }, []);

  const iconGroups = useMemo(
    () => {
      const groups = new Map<string, ShapeIconLibraryItem[]>();

      for (const icon of icons) {
        const group = groups.get(icon.category);
        if (group) {
          group.push(icon);
        } else {
          groups.set(icon.category, [icon]);
        }
      }

      return Array.from(groups.entries()).map(([category, items]) => ({
        category,
        items,
      }));
    },
    [icons],
  );
  const placementActive = Boolean(placement);

  return (
    <section className={styles.sidebarSection}>
      <div className={styles.sidebarPageBody}>
        <div className={styles.sidebarSubsection}>
          <div className={styles.sidebarSubsectionHeader}>
            <h3 style={typographyStyles.h5}>Icon library</h3>
          </div>
          <p className={styles.sidebarSubsectionHint} style={typographyStyles.p2}>
            Click any icon to place it on the canvas, then size, color, and convert it.
          </p>
        </div>

        {loading ? (
          <p className={styles.sidebarSubsectionHint} style={typographyStyles.p2}>
            Loading icons...
          </p>
        ) : null}

        {!loading && loadError ? (
          <p className={styles.sidebarSubsectionHint} style={typographyStyles.p2}>
            {loadError}
          </p>
        ) : null}

        {iconGroups.map((group) => (
          <div key={group.category} className={styles.sidebarSubsection}>
            <div className={styles.sidebarSubsectionHeader}>
              <h3 style={typographyStyles.h5}>{group.category}</h3>
            </div>

            <div className={styles.iconLibraryGrid}>
              {group.items.map((item) => {
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.iconLibraryCard}
                    aria-label={item.name}
                    title={item.name}
                    disabled={placementActive}
                    onClick={() => {
                      dispatch(
                        createBeginIconPlacementCommand({
                          iconId: item.id,
                          name: item.name,
                          src: item.src,
                          intrinsicWidth: item.intrinsicWidth,
                          intrinsicHeight: item.intrinsicHeight,
                          colorSlots: item.colorSlots,
                          selectedColorSlotId: item.colorSlots[0]?.id ?? null,
                          ...getInitialPlacementTransform({
                            intrinsicWidth: item.intrinsicWidth,
                            intrinsicHeight: item.intrinsicHeight,
                            metrics: gridMetrics,
                            viewportCenter,
                            widthRatio: DEFAULT_INITIAL_WIDTH_RATIO,
                          }),
                        }),
                      );
                    }}
                  >
                    <span className={styles.iconLibraryPreview} aria-hidden="true">
                      <img
                        src={item.src}
                        alt=""
                        width="72"
                        height="72"
                        className={styles.iconLibraryPreviewImage}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
