"use client";

import { useEffect, useMemo, useState } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import { Button, ButtonIcon } from "@/components/design-system";
import { FieldInput } from "@/components/design-system/Field";
import { buildPrimitiveIconDataUrl } from "@/lib/editor-v2/editor/icons/primitiveIcon";
import type { EditorStore, IconPlacementSession } from "@/lib/editor-v2/editor/store";
import { getContainedRect } from "@/lib/editor-v2/editor/positioning";
import type { GridWorldMetrics, WorldPoint } from "@/lib/editor-v2/editor/viewport";
import { createBeginIconPlacementCommand } from "../../workspaceCommands";
import { getInitialPlacementTransform } from "./getInitialPlacementTransform";
import type { ShapeIconLibraryItem } from "./iconLibrary";
import styles from "../EditorV2Shell.module.css";

const DEFAULT_INITIAL_WIDTH_RATIO = 0.42;
const ICON_PREVIEW_ROWS = 2;
const ICON_COLUMNS = 3;
const ICON_PREVIEW_LIMIT = ICON_PREVIEW_ROWS * ICON_COLUMNS;
const ICON_PREVIEW_VISIBLE_ICONS = ICON_PREVIEW_LIMIT - 1;
const ICON_PREVIEW_SIZE = 72;
const PRIMITIVE_ICON_PREVIEW_DRAW_SIZE = 50;

export type IconsPanelView =
  | { type: "overview" }
  | { type: "category"; category: string };

interface IconsPanelPageProps {
  dispatch: EditorStore["dispatch"];
  gridMetrics: GridWorldMetrics;
  onViewChange: (view: IconsPanelView) => void;
  placement: IconPlacementSession | null;
  view: IconsPanelView;
  viewportCenter: WorldPoint | null;
}

export function IconsPanelPage({
  dispatch,
  gridMetrics,
  onViewChange,
  placement,
  view,
  viewportCenter,
}: IconsPanelPageProps) {
  const [icons, setIcons] = useState<ShapeIconLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const selectedCategory = view.type === "category" ? view.category : null;

  useEffect(() => {
    setSearchQuery("");
  }, [selectedCategory]);

  const filteredIcons = useMemo(
    () =>
      normalizedSearchQuery
        ? icons.filter((icon) => {
            if (icon.name.toLowerCase().includes(normalizedSearchQuery)) {
              return true;
            }

            return icon.searchKeywords.some((keyword) => keyword.includes(normalizedSearchQuery));
          })
        : icons,
    [icons, normalizedSearchQuery],
  );

  const iconGroups = useMemo(
    () => {
      const groups = new Map<string, ShapeIconLibraryItem[]>();

      for (const icon of filteredIcons) {
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
    [filteredIcons],
  );
  const categoryIcons = useMemo(
    () =>
      selectedCategory
        ? icons.filter((icon) => icon.category === selectedCategory)
        : [],
    [icons, selectedCategory],
  );
  const filteredCategoryIcons = useMemo(
    () =>
      normalizedSearchQuery
        ? categoryIcons.filter((icon) => {
            if (icon.name.toLowerCase().includes(normalizedSearchQuery)) {
              return true;
            }

            return icon.searchKeywords.some((keyword) => keyword.includes(normalizedSearchQuery));
          })
        : categoryIcons,
    [categoryIcons, normalizedSearchQuery],
  );
  const placementActive = Boolean(placement);
  const hasSearchResults = iconGroups.length > 0;
  const hasCategorySearchResults = filteredCategoryIcons.length > 0;
  const iconPreviewSrcById = useMemo(
    () =>
      icons.reduce<Record<string, string>>((accumulator, icon) => {
        accumulator[icon.id] = icon.primitiveKind
          ? buildPrimitiveIconDataUrl({
              kind: icon.primitiveKind,
              width: PRIMITIVE_ICON_PREVIEW_DRAW_SIZE,
              height: PRIMITIVE_ICON_PREVIEW_DRAW_SIZE,
              strokeColor: "#121923",
              strokeReferenceSize: PRIMITIVE_ICON_PREVIEW_DRAW_SIZE,
              strokeWidthScale: 1,
            })
          : icon.src;
        return accumulator;
      }, {}),
    [icons],
  );

  function renderIconButton(item: ShapeIconLibraryItem) {
    return (
      <button
        key={item.id}
        type="button"
        className={styles.iconLibraryCard}
        aria-label={item.name}
        title={item.name}
        disabled={placementActive}
        onClick={() => {
          const initialTransform = getInitialPlacementTransform({
            intrinsicWidth: item.intrinsicWidth,
            intrinsicHeight: item.intrinsicHeight,
            metrics: gridMetrics,
            viewportCenter,
            widthRatio: DEFAULT_INITIAL_WIDTH_RATIO,
          });
          const baseRect = getContainedRect(
            item.intrinsicWidth,
            item.intrinsicHeight,
            gridMetrics.surfaceWidth,
            gridMetrics.surfaceHeight,
          );
          dispatch(
            createBeginIconPlacementCommand({
              iconId: item.id,
              name: item.name,
              src: item.src,
              intrinsicWidth: item.intrinsicWidth,
              intrinsicHeight: item.intrinsicHeight,
              colorSlots: item.colorSlots,
              primitiveKind: item.primitiveKind,
              lockAspectRatio: item.lockAspectRatio,
              primitiveStrokeReferenceSize: item.primitiveKind
                ? Math.min(baseRect.width, baseRect.height) * initialTransform.scale
                : null,
              supportsStrokeWidth: item.supportsStrokeWidth,
              strokeWidthScale: 1,
              selectedColorSlotId: item.colorSlots[0]?.id ?? null,
              ...initialTransform,
            }),
          );
        }}
      >
        <span
          className={[
            styles.iconLibraryPreview,
            item.primitiveKind ? styles.iconLibraryPreviewPrimitive : null,
          ]
            .filter(Boolean)
            .join(" ")}
          aria-hidden="true"
        >
          <img
            src={iconPreviewSrcById[item.id] ?? item.src}
            alt=""
            width={ICON_PREVIEW_SIZE}
            height={ICON_PREVIEW_SIZE}
            className={styles.iconLibraryPreviewImage}
          />
        </span>
      </button>
    );
  }

  return (
    <section className={styles.sidebarSection}>
      <div className={styles.sidebarPageBody}>
        {/* <div className={styles.sidebarSubsection}>
          <div className={styles.sidebarSubsectionHeader}>
            <h3 style={typographyStyles.h5}>Icon library</h3>
          </div>
          <p className={styles.sidebarSubsectionHint} style={typographyStyles.p2}>
            Click any icon to place it on the canvas, then size, color, and convert it.
          </p>
        </div> */}

        <div className={styles.sidebarSubsection}>
          <div className={styles.sidebarSearchField}>
            <img
              src="/icons/lucide/search.svg"
              alt=""
              aria-hidden="true"
              width="16"
              height="16"
              className={styles.sidebarSearchIcon}
            />
            <FieldInput
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search icons"
              aria-label="Search icons"
              className={styles.sidebarSearchInput}
            />
          </div>
        </div>

        {view.type === "category" ? (
          <>
            {!loading && !loadError && !hasCategorySearchResults ? (
              <p className={styles.sidebarSubsectionHint} style={typographyStyles.p2}>
                No icons found in {selectedCategory} for "{searchQuery.trim()}".
              </p>
            ) : null}

            {!loading && !loadError && hasCategorySearchResults ? (
              <div className={styles.sidebarSubsection}>
                <div className={styles.iconLibraryGrid}>
                  {filteredCategoryIcons.map((item) => renderIconButton(item))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}

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

        {!loading && !loadError && view.type === "overview" && !hasSearchResults ? (
          <p className={styles.sidebarSubsectionHint} style={typographyStyles.p2}>
            No icons found for "{searchQuery.trim()}".
          </p>
        ) : null}

        {view.type === "overview"
          ? iconGroups.map((group) => {
              const previewItems = normalizedSearchQuery
                ? group.items
                : group.items.slice(
                    0,
                    group.items.length > ICON_PREVIEW_VISIBLE_ICONS
                      ? ICON_PREVIEW_VISIBLE_ICONS
                      : ICON_PREVIEW_LIMIT,
                  );
              const hiddenCount = normalizedSearchQuery
                ? 0
                : Math.max(group.items.length - ICON_PREVIEW_VISIBLE_ICONS, 0);

              return (
                <div key={group.category} className={styles.sidebarSubsection}>
                  <div className={styles.sidebarSubsectionHeaderRow}>
                    <div className={styles.sidebarSubsectionHeader}>
                      <h3 style={typographyStyles.h5}>{group.category}</h3>
                      {!normalizedSearchQuery && hiddenCount > 0 ? (
                        <p className={styles.sidebarSubsectionHint} style={typographyStyles.p2}>
                          {group.items.length} icons
                        </p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="ghostV2"
                      size="sm"
                      className={styles.sidebarHeaderAction}
                      aria-label={`View all icons in ${group.category}`}
                      title={`View all icons in ${group.category}`}
                      onClick={() => onViewChange({ type: "category", category: group.category })}
                    >
                      <ButtonIcon icon="/icons/lucide/arrow-right.svg" />
                    </Button>
                  </div>

                  <div className={styles.iconLibraryGrid}>
                    {previewItems.map((item) => renderIconButton(item))}
                    {!normalizedSearchQuery && hiddenCount > 0 ? (
                      <Button
                        type="button"
                        variant="ghostV2"
                        size="sm"
                        className={styles.iconLibraryMoreButton}
                        aria-label={`View ${hiddenCount} more icons in ${group.category}`}
                        title={`View ${hiddenCount} more icons in ${group.category}`}
                        onClick={() => onViewChange({ type: "category", category: group.category })}
                      >
                        + {hiddenCount} more
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })
          : null}
      </div>
    </section>
  );
}
