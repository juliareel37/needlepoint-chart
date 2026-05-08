"use client";

import { useEffect, useMemo, useState } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import { useThemeMode } from "@/components/editor-v2/app/useThemeMode";
import { Button, ButtonIcon } from "@/components/design-system";
import { FieldInput } from "@/components/design-system/Field";
import { DMC_COLOR_LIBRARY_BY_ID } from "@/lib/editor-v2/editor/color-library";
import { findClosestPaletteColorId, hexToRgb, type Rgb } from "@/lib/editor-v2/editor/color-utils";
import type { IconColorSlot } from "@/lib/editor-v2/editor/icons/iconColorSlots";
import {
  buildPrimitiveIconDataUrl,
  getPrimitiveDefaultSpacingScale,
  getPrimitiveDefaultStrokeWidthScale,
  isPrimitiveFrameKind,
} from "@/lib/editor-v2/editor/icons/primitiveIcon";
import type { EditorStore, IconPlacementSession } from "@/lib/editor-v2/editor/store";
import { getContainedRect } from "@/lib/editor-v2/editor/positioning";
import type { GridWorldMetrics, WorldPoint } from "@/lib/editor-v2/editor/viewport";
import { createBeginIconPlacementCommand } from "../../workspaceCommands";
import { getInitialPlacementTransform } from "./getInitialPlacementTransform";
import type { ShapeIconLibraryItem, ShapeIconLibraryOverviewGroup } from "./iconLibrary";
import styles from "../EditorV2Shell.module.css";

const DEFAULT_INITIAL_WIDTH_RATIO = 0.42;
const ICON_PREVIEW_ROWS = 2;
const ICON_COLUMNS = 3;
const ICON_PREVIEW_LIMIT = ICON_PREVIEW_ROWS * ICON_COLUMNS;
const ICON_PREVIEW_VISIBLE_ICONS = ICON_PREVIEW_LIMIT - 1;
const ICON_PREVIEW_SIZE = 72;
const PRIMITIVE_ICON_PREVIEW_DRAW_SIZE = 50;
const DEFAULT_FRAME_INITIAL_SIZE_RATIO = 0.82;
const ICON_INITIAL_MIN_SCALE = 0.005;
const ICON_INITIAL_MAX_SCALE = 64;
const CATEGORY_ORDER_PRIORITY: Record<string, number> = {
  Shapes: 0,
  Frames: 1,
};

let iconOverviewCache: ShapeIconLibraryOverviewGroup[] | null = null;
let iconOverviewPromise: Promise<ShapeIconLibraryOverviewGroup[]> | null = null;
let iconFullLibraryCache: ShapeIconLibraryItem[] | null = null;
let iconFullLibraryPromise: Promise<ShapeIconLibraryItem[]> | null = null;
const iconCategoryCache = new Map<string, ShapeIconLibraryItem[]>();
const iconCategoryPromises = new Map<string, Promise<ShapeIconLibraryItem[]>>();

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
  viewportWidth: number | null;
  viewportHeight: number | null;
}

export function IconsPanelPage({
  dispatch,
  gridMetrics,
  onViewChange,
  placement,
  view,
  viewportCenter,
  viewportWidth,
  viewportHeight,
}: IconsPanelPageProps) {
  const { resolvedThemeMode } = useThemeMode();
  const [overviewGroups, setOverviewGroups] = useState<ShapeIconLibraryOverviewGroup[]>(
    () => iconOverviewCache ?? [],
  );
  const [searchIcons, setSearchIcons] = useState<ShapeIconLibraryItem[] | null>(
    () => iconFullLibraryCache,
  );
  const [loadedCategoryIcons, setLoadedCategoryIcons] = useState<ShapeIconLibraryItem[]>(
    () => {
      if (view.type !== "category") {
        return [];
      }

      return iconCategoryCache.get(view.category) ?? [];
    },
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const primitivePreviewStrokeColor = useMemo(
    () => resolvePrimitivePreviewStrokeColor(resolvedThemeMode),
    [resolvedThemeMode],
  );
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const selectedCategory = view.type === "category" ? view.category : null;

  useEffect(() => {
    let cancelled = false;

    async function loadIconsForCurrentView() {
      setLoading(true);
      setLoadError(null);

      try {
        if (view.type === "overview") {
          const groups = await loadIconOverview();
          if (!cancelled) {
            setOverviewGroups(groups);
          }

          if (normalizedSearchQuery.length > 0) {
            const icons = await loadFullIconLibrary();
            if (!cancelled) {
              setSearchIcons(icons);
            }
          }
        } else {
          const icons = await loadIconCategory(view.category);
          if (!cancelled) {
            setLoadedCategoryIcons(icons);
          }
        }
      } catch (error) {
        if (!cancelled) {
          if (view.type === "overview") {
            setOverviewGroups([]);
            if (normalizedSearchQuery.length > 0) {
              setSearchIcons([]);
            }
          } else {
            setLoadedCategoryIcons([]);
          }
          setLoadError(error instanceof Error ? error.message : "Unable to load icons.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadIconsForCurrentView();

    return () => {
      cancelled = true;
    };
  }, [normalizedSearchQuery, view]);

  useEffect(() => {
    setSearchQuery("");
  }, [selectedCategory]);

  const filteredIcons = useMemo(
    () =>
      normalizedSearchQuery
        ? (searchIcons ?? []).filter((icon) => {
            if (icon.name.toLowerCase().includes(normalizedSearchQuery)) {
              return true;
            }

            return icon.searchKeywords.some((keyword) => keyword.includes(normalizedSearchQuery));
          })
        : searchIcons ?? [],
    [normalizedSearchQuery, searchIcons],
  );

  const iconGroups = useMemo(
    () => {
      if (normalizedSearchQuery.length === 0) {
        return overviewGroups;
      }

      const groups = new Map<string, ShapeIconLibraryItem[]>();

      for (const icon of filteredIcons) {
        const group = groups.get(icon.category);
        if (group) {
          group.push(icon);
        } else {
          groups.set(icon.category, [icon]);
        }
      }

      return Array.from(groups.entries())
        .map(([category, items]) => ({
          category,
          count: items.length,
          previewItems: items,
        }))
        .sort((left, right) => {
          const leftPriority = CATEGORY_ORDER_PRIORITY[left.category] ?? Number.POSITIVE_INFINITY;
          const rightPriority = CATEGORY_ORDER_PRIORITY[right.category] ?? Number.POSITIVE_INFINITY;

          if (leftPriority !== rightPriority) {
            return leftPriority - rightPriority;
          }

          return left.category.localeCompare(right.category);
        });
    },
    [filteredIcons, normalizedSearchQuery, overviewGroups],
  );
  const visibleCategoryIcons = useMemo(
    () =>
      normalizedSearchQuery
        ? loadedCategoryIcons.filter((icon) => {
            if (icon.name.toLowerCase().includes(normalizedSearchQuery)) {
              return true;
            }

            return icon.searchKeywords.some((keyword) => keyword.includes(normalizedSearchQuery));
          })
        : loadedCategoryIcons,
    [loadedCategoryIcons, normalizedSearchQuery],
  );
  const placementActive = Boolean(placement);
  const hasSearchResults = iconGroups.length > 0;
  const hasCategorySearchResults = visibleCategoryIcons.length > 0;
  const iconItemsForPreview = useMemo(() => {
    if (view.type === "category") {
      return visibleCategoryIcons;
    }

    if (normalizedSearchQuery.length > 0) {
      return filteredIcons;
    }

    return overviewGroups.flatMap((group) => group.previewItems);
  }, [filteredIcons, normalizedSearchQuery, overviewGroups, view, visibleCategoryIcons]);
  const iconPreviewSrcById = useMemo(
    () =>
      iconItemsForPreview.reduce<Record<string, string>>((accumulator, icon) => {
        const themedPrimitiveColorSlots = icon.primitiveKind
          ? getThemedPrimitiveColorSlots(icon.colorSlots, resolvedThemeMode)
          : icon.colorSlots;
        const themedPrimitiveColors = icon.primitiveKind
          ? resolvePrimitivePreviewColors(themedPrimitiveColorSlots)
          : null;

        accumulator[icon.id] = icon.primitiveKind
          ? buildPrimitiveIconDataUrl({
              kind: icon.primitiveKind,
              width: PRIMITIVE_ICON_PREVIEW_DRAW_SIZE,
              height: PRIMITIVE_ICON_PREVIEW_DRAW_SIZE,
              strokeColor: themedPrimitiveColors?.stroke ?? primitivePreviewStrokeColor,
              secondaryStrokeColor: themedPrimitiveColors?.shadow,
              fillColor: themedPrimitiveColors?.fill,
              strokeReferenceSize: PRIMITIVE_ICON_PREVIEW_DRAW_SIZE,
              strokeWidthScale: getPrimitiveDefaultStrokeWidthScale(icon.primitiveKind),
              spacingScale: getPrimitiveDefaultSpacingScale(icon.primitiveKind),
            })
          : icon.src;
        return accumulator;
      }, {}),
    [iconItemsForPreview, primitivePreviewStrokeColor, resolvedThemeMode],
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
          const baseRect = getContainedRect(
            item.intrinsicWidth,
            item.intrinsicHeight,
            gridMetrics.surfaceWidth,
            gridMetrics.surfaceHeight,
          );
          const initialTransform = isPrimitiveFrameKind(item.primitiveKind)
            ? getInitialFramePlacementTransform({
                baseRect,
                metrics: gridMetrics,
                viewportCenter,
                sizeRatio: DEFAULT_FRAME_INITIAL_SIZE_RATIO,
              })
            : getInitialPlacementTransform({
                intrinsicWidth: item.intrinsicWidth,
                intrinsicHeight: item.intrinsicHeight,
                metrics: gridMetrics,
                viewportCenter,
                viewportWidth,
                widthRatio: DEFAULT_INITIAL_WIDTH_RATIO,
                clampReferenceToSurface: false,
                minScale: ICON_INITIAL_MIN_SCALE,
                maxScale: ICON_INITIAL_MAX_SCALE,
              });
          const initialReferenceSize = item.primitiveKind
            ? Math.min(
                baseRect.width * ("scaleX" in initialTransform ? initialTransform.scaleX : initialTransform.scale),
                baseRect.height *
                  ("scaleY" in initialTransform ? initialTransform.scaleY : initialTransform.scale),
              )
            : null;
          const themedPrimitiveColorSlots = item.primitiveKind
            ? getThemedPrimitiveColorSlots(item.colorSlots, resolvedThemeMode)
            : item.colorSlots;
          dispatch(
            createBeginIconPlacementCommand({
              iconId: item.id,
              name: item.name,
              src: item.src,
              intrinsicWidth: item.intrinsicWidth,
              intrinsicHeight: item.intrinsicHeight,
              colorSlots: themedPrimitiveColorSlots,
              primitiveKind: item.primitiveKind,
              lockAspectRatio: item.lockAspectRatio,
              primitiveStrokeReferenceSize: initialReferenceSize,
              supportsStrokeWidth: item.supportsStrokeWidth,
              strokeWidthScale: getPrimitiveDefaultStrokeWidthScale(
                item.primitiveKind,
                initialReferenceSize,
              ),
              primitivePatternScale: 1,
              primitiveSpacingScale: getPrimitiveDefaultSpacingScale(item.primitiveKind),
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
      <div className={styles.iconsPanelPageBody}>

        <div className={styles.sidebarSubsection}>
          <div className={styles.sidebarSearchField}>
            <span aria-hidden="true" className={styles.sidebarSearchIcon} />
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
                  {visibleCategoryIcons.map((item) => renderIconButton(item))}
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
                ? group.previewItems
                : group.previewItems.slice(
                    0,
                    group.count > ICON_PREVIEW_VISIBLE_ICONS
                      ? ICON_PREVIEW_VISIBLE_ICONS
                      : ICON_PREVIEW_LIMIT,
                  );
              const hiddenCount = normalizedSearchQuery
                ? 0
                : Math.max(group.count - ICON_PREVIEW_VISIBLE_ICONS, 0);

              return (
                <div key={group.category} className={styles.sidebarSubsection}>
                  <div className={styles.sidebarSubsectionHeaderRow}>
                    <div className={styles.sidebarSubsectionHeader}>
                      <h3 style={typographyStyles.h5}>{group.category}</h3>
                      {!normalizedSearchQuery && hiddenCount > 0 ? (
                        <p className={styles.sidebarSubsectionHint} style={typographyStyles.p2}>
                          {group.count} icons
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

async function loadIconOverview(): Promise<ShapeIconLibraryOverviewGroup[]> {
  if (iconOverviewCache) {
    return iconOverviewCache;
  }

  if (iconOverviewPromise) {
    return iconOverviewPromise;
  }

  iconOverviewPromise = fetch("/api/editor-v2/icon-library?mode=overview&previewLimit=6")
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Icon library request failed with ${response.status}`);
      }

      const payload = (await response.json()) as { groups?: ShapeIconLibraryOverviewGroup[] };
      iconOverviewCache = Array.isArray(payload.groups) ? payload.groups : [];
      return iconOverviewCache;
    })
    .finally(() => {
      iconOverviewPromise = null;
    });

  return iconOverviewPromise;
}

async function loadIconCategory(category: string): Promise<ShapeIconLibraryItem[]> {
  if (iconCategoryCache.has(category)) {
    return iconCategoryCache.get(category) ?? [];
  }

  if (iconFullLibraryCache) {
    const icons = iconFullLibraryCache.filter((icon) => icon.category === category);
    iconCategoryCache.set(category, icons);
    return icons;
  }

  const pendingPromise = iconCategoryPromises.get(category);
  if (pendingPromise) {
    return pendingPromise;
  }

  const requestPromise = fetch(
    `/api/editor-v2/icon-library?mode=category&category=${encodeURIComponent(category)}`,
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Icon library request failed with ${response.status}`);
      }

      const payload = (await response.json()) as { icons?: ShapeIconLibraryItem[] };
      const icons = Array.isArray(payload.icons) ? payload.icons : [];
      iconCategoryCache.set(category, icons);
      return icons;
    })
    .finally(() => {
      iconCategoryPromises.delete(category);
    });

  iconCategoryPromises.set(category, requestPromise);
  return requestPromise;
}

async function loadFullIconLibrary(): Promise<ShapeIconLibraryItem[]> {
  if (iconFullLibraryCache) {
    return iconFullLibraryCache;
  }

  if (iconFullLibraryPromise) {
    return iconFullLibraryPromise;
  }

  iconFullLibraryPromise = fetch("/api/editor-v2/icon-library")
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Icon library request failed with ${response.status}`);
      }

      const payload = (await response.json()) as { icons?: ShapeIconLibraryItem[] };
      const icons = Array.isArray(payload.icons) ? payload.icons : [];
      iconFullLibraryCache = icons;

      const iconsByCategory = new Map<string, ShapeIconLibraryItem[]>();
      for (const icon of icons) {
        const existing = iconsByCategory.get(icon.category);
        if (existing) {
          existing.push(icon);
        } else {
          iconsByCategory.set(icon.category, [icon]);
        }
      }

      for (const [category, categoryIcons] of iconsByCategory.entries()) {
        iconCategoryCache.set(category, categoryIcons);
      }

      return icons;
    })
    .finally(() => {
      iconFullLibraryPromise = null;
    });

  return iconFullLibraryPromise;
}

function getInitialFramePlacementTransform(options: {
  baseRect: { left: number; top: number; width: number; height: number };
  metrics: GridWorldMetrics;
  viewportCenter: WorldPoint | null;
  sizeRatio: number;
}): { offsetX: number; offsetY: number; scaleX: number; scaleY: number } {
  const targetWidth = options.metrics.surfaceWidth * options.sizeRatio;
  const targetHeight = options.metrics.surfaceHeight * options.sizeRatio;
  const scaleX = clampInitialFrameScale(
    targetWidth / Math.max(options.baseRect.width, 1),
  );
  const scaleY = clampInitialFrameScale(
    targetHeight / Math.max(options.baseRect.height, 1),
  );
  const targetCenterX = options.viewportCenter?.x ?? options.metrics.surfaceWidth / 2;
  const targetCenterY = options.viewportCenter?.y ?? options.metrics.surfaceHeight / 2;
  const targetLeft = targetCenterX - (options.baseRect.width * scaleX) / 2;
  const targetTop = targetCenterY - (options.baseRect.height * scaleY) / 2;

  return {
    offsetX: targetLeft - options.baseRect.left,
    offsetY: targetTop - options.baseRect.top,
    scaleX,
    scaleY,
  };
}

function clampInitialFrameScale(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(ICON_INITIAL_MAX_SCALE, Math.max(ICON_INITIAL_MIN_SCALE, Number(value.toFixed(4))));
}

function resolvePrimitivePreviewStrokeColor(resolvedThemeMode: "light" | "dark"): string {
  return resolvedThemeMode === "dark" ? "#ffffff" : "#000000";
}

function getThemedPrimitiveColorSlots(
  slots: IconColorSlot[],
  resolvedThemeMode: "light" | "dark",
): IconColorSlot[] {
  const strokeColor = resolvePrimitivePreviewStrokeColor(resolvedThemeMode);
  const shadowColor = resolvedThemeMode === "dark" ? "#d4d4d8" : "#6b7280";

  return slots.map((slot) => {
    if (slot.id === "stroke") {
      return {
        ...slot,
        sourceHex: strokeColor,
        paletteColorId: findClosestPaletteColorId(
          DMC_COLOR_LIBRARY_BY_ID,
          hexToRgb(strokeColor) as Rgb,
        ),
      };
    }

    if (slot.id === "shadow") {
      return {
        ...slot,
        sourceHex: shadowColor,
        paletteColorId: findClosestPaletteColorId(
          DMC_COLOR_LIBRARY_BY_ID,
          hexToRgb(shadowColor) as Rgb,
        ),
      };
    }

    return slot;
  });
}

function resolvePrimitivePreviewColors(slots: IconColorSlot[]): {
  fill: string | null;
  shadow: string | null;
  stroke: string | null;
} {
  return {
    stroke: slots.find((slot) => slot.id === "stroke")?.sourceHex ?? null,
    shadow: slots.find((slot) => slot.id === "shadow")?.sourceHex ?? null,
    fill: slots.find((slot) => slot.id === "fill")?.sourceHex ?? null,
  };
}
