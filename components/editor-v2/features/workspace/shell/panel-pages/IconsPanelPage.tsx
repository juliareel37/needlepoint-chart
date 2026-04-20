"use client";

import { useMemo } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import type { EditorStore, IconPlacementSession } from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics, WorldPoint } from "@/lib/editor-v2/editor/viewport";
import { createBeginIconPlacementCommand } from "../../workspaceCommands";
import { getInitialPlacementTransform } from "./getInitialPlacementTransform";
import { SHAPE_ICON_LIBRARY, type ShapeIconLibraryItem } from "./iconLibrary";
import styles from "../EditorV2Shell.module.css";

const CATEGORY_ORDER: ShapeIconLibraryItem["category"][] = ["Shapes", "Frames"];
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
  const iconGroups = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        items: SHAPE_ICON_LIBRARY.filter((item) => item.category === category),
      })).filter((group) => group.items.length > 0),
    [],
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
