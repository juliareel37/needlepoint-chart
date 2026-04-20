"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/design-system";
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
  const [selectedIconId, setSelectedIconId] = useState<string>(SHAPE_ICON_LIBRARY[0]?.id ?? "");

  const iconGroups = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        items: SHAPE_ICON_LIBRARY.filter((item) => item.category === category),
      })).filter((group) => group.items.length > 0),
    [],
  );

  const selectedIcon =
    SHAPE_ICON_LIBRARY.find((item) => item.id === selectedIconId) ?? SHAPE_ICON_LIBRARY[0] ?? null;
  const placementActive = Boolean(placement);

  return (
    <section className={styles.sidebarSection}>
      <div className={styles.sidebarPageBody}>
        <div className={styles.sidebarSubsection}>
          <div className={styles.sidebarSubsectionHeader}>
            <h3 style={typographyStyles.h5}>Icon library</h3>
          </div>
          <p className={styles.sidebarSubsectionHint} style={typographyStyles.p2}>
            Browse the shapes library for stitchable icon art, then add your selected
            icon to the canvas to place, size, color, and convert it.
          </p>
        </div>

        {selectedIcon ? (
          <div className={styles.sidebarSubsection}>
            <div className={styles.iconSelectionSummary}>
              <div className={styles.iconSelectionPreview} aria-hidden="true">
                <img
                  src={selectedIcon.src}
                  alt=""
                  width="88"
                  height="88"
                  className={styles.iconSelectionPreviewImage}
                />
              </div>
              <div className={styles.iconSelectionDetails}>
                <p className={styles.iconSelectionLabel} style={typographyStyles.s}>
                  Selected icon
                </p>
                <h4 className={styles.iconSelectionTitle} style={typographyStyles.h5}>
                  {selectedIcon.name}
                </h4>
                {/* <p className={styles.iconSelectionHint} style={typographyStyles.p2}>
                  Place this icon on the canvas, resize it with the placement box, pick
                  a color, then convert it to stitches when it looks right.
                </p> */}
              </div>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={placementActive}
                className={styles.iconSelectionAction}
                onClick={() => {
                  dispatch(
                    createBeginIconPlacementCommand({
                      iconId: selectedIcon.id,
                      name: selectedIcon.name,
                      src: selectedIcon.src,
                      intrinsicWidth: selectedIcon.intrinsicWidth,
                      intrinsicHeight: selectedIcon.intrinsicHeight,
                      ...getInitialPlacementTransform({
                        intrinsicWidth: selectedIcon.intrinsicWidth,
                        intrinsicHeight: selectedIcon.intrinsicHeight,
                        metrics: gridMetrics,
                        viewportCenter,
                        widthRatio: DEFAULT_INITIAL_WIDTH_RATIO,
                      }),
                    }),
                  );
                }}
              >
                Add icon
              </Button>
            </div>
          </div>
        ) : null}

        {iconGroups.map((group) => (
          <div key={group.category} className={styles.sidebarSubsection}>
            <div className={styles.sidebarSubsectionHeader}>
              <h3 style={typographyStyles.h5}>{group.category}</h3>
            </div>

            <div className={styles.iconLibraryGrid}>
              {group.items.map((item) => {
                const selected = item.id === selectedIconId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.iconLibraryCard}
                    data-selected={selected ? "true" : "false"}
                    aria-label={item.name}
                    title={item.name}
                    onClick={() => setSelectedIconId(item.id)}
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
