"use client";

import React, { useMemo, useState } from "react";
import type { Color } from "../../../lib/grid";
import { DMC_PALETTE_BANDS } from "../../../lib/dmcPaletteBands";
import { assetPath } from "../../../lib/assetPath";
import { organizePaletteByHueAndLightness } from "../utils/paletteSort";

type Props = {
  palette: Color[];
  extractedIds?: number[];
  showExtractedFilter?: boolean;
  usedIds?: number[];
  showUsedFilter?: boolean;
  usedCounts?: Record<number, number>;
  favoriteIds: number[];
  setFavoriteIds: React.Dispatch<React.SetStateAction<number[]>>;
  activeColorId: number;
  onSelect: (id: number) => void;
  remapSourceId?: number | null;
  remapTargetId?: number | null;
  onRemapSelect?: (id: number) => void;
  onAddColor: (name: string, hex: string) => void;
};

export default function Palette({
  palette,
  extractedIds,
  showExtractedFilter = true,
  usedIds,
  showUsedFilter = true,
  usedCounts,
  favoriteIds,
  setFavoriteIds,
  activeColorId,
  onSelect,
  remapSourceId,
  remapTargetId,
  onRemapSelect,
  onAddColor,
}: Props) {
  const favoritesEnabled = false;
  const curatedPaletteIds = useMemo<Set<number>>(
    () => new Set<number>(DMC_PALETTE_BANDS.flatMap((band) => band.rows.flat())),
    []
  );

  const normalizeFamily = (family?: string | null) => {
    if (!family) return null;
    const key = family.trim().toLowerCase();
    const map: Record<string, string> = {
      red: "red",
      pink: "red",
      orange: "orange",
      yellow: "yellow",
      green: "green",
      blue: "blue",
      purple: "violet",
      violet: "violet",
      gray: "neutrals",
      grey: "neutrals",
      white: "neutrals",
      black: "neutrals",
      beige: "neutrals",
      brown: "neutrals",
      neutral: "neutrals",
      neutrals: "neutrals",
      custom: "neutrals",
    };
    return map[key] ?? key;
  };

  const [newHex, setNewHex] = useState("#c9b08b");
  const [newName, setNewName] = useState("Custom");
  const [activeFamily, setActiveFamily] = useState("All");
  const [activePanel, setActivePanel] = useState<"All" | "Used" | "Custom">("All");
  const [query, setQuery] = useState("");
  const [hoveredSwatchId, setHoveredSwatchId] = useState<number | null>(null);
  const effectivePanel = activePanel;
  const paletteTabs = ["All", "Used", "Custom"] as const;
  const familySwatches: Record<string, string> = {
    red: "#d62b5b",
    orange: "#f27842",
    yellow: "#ffd24d",
    green: "#4caf50",
    blue: "#3b82f6",
    violet: "#8b5cf6",
    neutrals: "#9ca3af",
  };
  const families = useMemo(() => {
    const set = new Set<string>();
    palette.forEach((c) => {
      const normalized = normalizeFamily(c.family);
      if (normalized) set.add(normalized);
    });
    set.delete("Extracted");
    const order = [
      "All",
      "red",
      "orange",
      "yellow",
      "green",
      "blue",
      "violet",
      "neutrals",
    ];
    const rest = Array.from(set).filter((f) => !order.includes(f)).sort();
    return ["All", ...order.filter((f) => f !== "All" && set.has(f)), ...rest];
  }, [palette]);
  const extractedSet = useMemo(() => new Set(extractedIds ?? []), [extractedIds]);
  const usedSet = useMemo(() => new Set(usedIds ?? []), [usedIds]);
  const hasExtracted = extractedSet.size > 0;
  const hasUsed = usedSet.size > 0;
  const filteredPalette = useMemo(() => {
    const panelFiltered =
      effectivePanel === "Used"
          ? palette.filter((c) => usedSet.has(c.id))
        : effectivePanel === "Custom"
          ? palette.filter((c) => !curatedPaletteIds.has(c.id))
          : palette;
    if (effectivePanel !== "All") {
      return panelFiltered;
    }
    const familyFiltered =
      activeFamily === "Extracted"
        ? panelFiltered.filter((c) => extractedSet.has(c.id))
        : activeFamily === "All"
          ? panelFiltered
          : panelFiltered.filter((c) => normalizeFamily(c.family) === activeFamily);
    const q = query.trim().toLowerCase();
    if (!q) return familyFiltered;
    return familyFiltered.filter((c) => {
      const name = c.name.toLowerCase();
      const code = (c.code ?? "").toLowerCase();
      return name.includes(q) || code.includes(q) || `#${code}`.includes(q);
    });
  }, [palette, activeFamily, curatedPaletteIds, effectivePanel, query, extractedSet, usedSet]);
  const paletteBands = useMemo(() => {
    const filteredById = new Map(filteredPalette.map((color) => [color.id, color]));
    const curatedBands: Array<{ key: string; rows: Color[][] }> = DMC_PALETTE_BANDS.map((band) => ({
      key: band.key,
      rows: band.rows
        .map((row) => row.map((id) => filteredById.get(id)).filter((color): color is Color => Boolean(color)))
        .filter((row) => row.length > 0),
    })).filter((band) => band.rows.length > 0);

    const extraColors = filteredPalette.filter((color) => !curatedPaletteIds.has(color.id));
    if (extraColors.length > 0) {
      curatedBands.push({
        key: "extras",
        rows: organizePaletteByHueAndLightness(extraColors, 10),
      });
    }

    return curatedBands;
  }, [curatedPaletteIds, filteredPalette]);
  const emptyMessage =
    effectivePanel === "Used" && !hasUsed
      ? "No colors used. Let's start painting!"
      : effectivePanel === "Custom" && filteredPalette.length === 0
        ? "No custom colors yet."
        : filteredPalette.length === 0
          ? "No colors match the current filter."
          : null;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div>
        <div style={{ display: "grid", gap: 8, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {effectivePanel === "All" && showExtractedFilter && hasExtracted && (
              <button
                type="button"
                onClick={() => setActiveFamily(activeFamily === "Extracted" ? "All" : "Extracted")}
                style={{
                  padding: "6px 8px",
                  borderRadius: 8,
                  border: activeFamily === "Extracted" ? "1px solid var(--accent-strong)" : "none",
                  background: activeFamily === "Extracted" ? "var(--accent-soft)" : "var(--muted-bg)",
                  color: activeFamily === "Extracted" ? "var(--accent-strong)" : "var(--foreground)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  fontSize: 10,
                }}
              >
                Image Colors
              </button>
            )}
          </div>
          <div
            role="tablist"
            aria-label="Palette tabs"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: 4,
              borderRadius: 10,
              border: "1px solid var(--ui-border-subtle)",
              background: "var(--ui-surface-soft)",
            }}
          >
            {paletteTabs.map((tab) => {
              const isActive = effectivePanel === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  onClick={() => setActivePanel(tab)}
                  aria-pressed={isActive}
                  aria-selected={isActive}
                  data-active={isActive ? "true" : undefined}
                  className="menu-tab-button"
                  style={{
                    padding: "6px 10px",
                    flex: "1 1 0",
                    borderRadius: 8,
                    border: "none",
                    color: "var(--foreground)",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>
          {effectivePanel === "All" && (
            <>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or #DMC"
                style={{
                  padding: "6px 8px",
                  borderRadius: 8,
                  border: "1px solid var(--panel-border)",
                  background: "transparent",
                  color: "var(--foreground)",
                  fontSize: 12,
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>Family</span>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  {families
                    .filter((family) => family !== "All")
                    .map((family) => {
                      const swatch = familySwatches[family] ?? "#9ca3af";
                      const isActive = activeFamily === family;
                      return (
                        <button
                          key={family}
                          type="button"
                          onClick={() => setActiveFamily(isActive ? "All" : family)}
                          aria-pressed={isActive}
                          aria-label={`Filter ${family}`}
                          title={family}
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 6,
                            background: swatch,
                            border: isActive ? "2px solid var(--accent-strong)" : "1px solid var(--ui-border-strong)",
                            boxShadow: isActive ? "0 0 0 2px var(--accent-soft)" : "none",
                            cursor: "pointer",
                          }}
                        />
                      );
                    })}
                </div>
              </div>
            </>
          )}
        </div>
        {activePanel === "All" && (
          <div style={{ height: 1, background: "var(--ui-border-subtle)", margin: "6px 0 8px" }} />
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            rowGap: 6,
            alignItems: "start",
            maxHeight: 520,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "2px 0 0",
            overscrollBehavior: "contain",
          }}
        >
          {emptyMessage ? (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "12px 8px",
                borderRadius: 10,
                border: "none",
                background: "var(--ui-surface-faint)",
                textAlign: "center",
                fontSize: 12,
                color: "var(--foreground)",
                opacity: 0.75,
              }}
            >
              {emptyMessage}
            </div>
          ) : (
            paletteBands.map((band) => (
              <div
                key={`palette-band-${band.key}`}
                style={{
                  display: "grid",
                  gap: 2,
                  alignContent: "start",
                }}
              >
                {band.rows.map((row, rowIndex) => (
                  <div
                    key={`${band.key}-row-${rowIndex}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(10, minmax(0, 1fr))",
                      gap: 2,
                    }}
                  >
                    {row.map((c) => {
                      const isRemapTarget = remapTargetId != null && c.id === remapTargetId;
                      const isRemapSource = remapSourceId != null && c.id === remapSourceId;
                      const showRemapSource =
                        isRemapSource && (remapTargetId == null || remapTargetId === remapSourceId);
                      const isFavorite = favoritesEnabled && favoriteIds.includes(c.id);
                      const showHeart = favoritesEnabled && (hoveredSwatchId === c.id || isFavorite);
                      const usedCount = usedCounts?.[c.id];
                      const handleSelect = () => {
                        if (remapSourceId != null && onRemapSelect) {
                          onRemapSelect(c.id);
                          return;
                        }
                        onSelect(c.id);
                      };

                      return (
                        <div
                          key={c.id}
                          style={{ position: "relative" }}
                          onMouseEnter={() => setHoveredSwatchId(c.id)}
                          onMouseLeave={() => setHoveredSwatchId((prev) => (prev === c.id ? null : prev))}
                        >
                          <button
                            type="button"
                            onClick={handleSelect}
                            aria-label={`Select ${c.name}`}
                            title={`${c.name} (${c.code ?? c.hex})`}
                            style={{
                              width: "100%",
                              aspectRatio: "1 / 1",
                              borderRadius: 0,
                              border:
                                isRemapTarget || showRemapSource || c.id === activeColorId
                                  ? "2px solid var(--accent-strong)"
                                  : "1px solid rgba(0,0,0,0.08)",
                              background: c.hex,
                              cursor: "pointer",
                              display: "block",
                              padding: 0,
                              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
                            }}
                          />
                          {favoritesEnabled && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(event) => {
                                event.stopPropagation();
                                setFavoriteIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(c.id)) {
                                    next.delete(c.id);
                                  } else {
                                    next.add(c.id);
                                  }
                                  return Array.from(next);
                                });
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  setFavoriteIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(c.id)) {
                                      next.delete(c.id);
                                    } else {
                                      next.add(c.id);
                                    }
                                    return Array.from(next);
                                  });
                                }
                              }}
                              aria-label={isFavorite ? `Unfavorite ${c.name}` : `Favorite ${c.name}`}
                              title={isFavorite ? "Unfavorite" : "Favorite"}
                              style={{
                                position: "absolute",
                                top: 1,
                                right: 1,
                                width: 12,
                                height: 12,
                                borderRadius: 999,
                                background: "rgba(255,255,255,0.92)",
                                border: "1px solid rgba(15,23,42,0.1)",
                                boxShadow: "0 1px 2px rgba(15,23,42,0.12)",
                                display: showHeart ? "grid" : "none",
                                placeItems: "center",
                                padding: 0,
                                cursor: "pointer",
                              }}
                            >
                              <img
                                src={assetPath(isFavorite ? "/icons/heart_fill.svg" : "/icons/heart_empty.svg")}
                                alt=""
                                aria-hidden="true"
                                width={9}
                                height={9}
                                style={{ display: "block", filter: "none" }}
                              />
                            </span>
                          )}
                          {usedCount != null && usedCount > 0 && (
                            <span
                              style={{
                                position: "absolute",
                                bottom: 1,
                                left: 1,
                                minWidth: 10,
                                height: 10,
                                padding: "0 2px",
                                borderRadius: 999,
                                background: "rgba(255,255,255,0.94)",
                                color: "rgba(15,23,42,0.9)",
                                fontSize: 7,
                                fontWeight: 700,
                                display: "grid",
                                placeItems: "center",
                                pointerEvents: "none",
                                lineHeight: 1,
                              }}
                              aria-hidden="true"
                            >
                              {usedCount}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {false && (
      <div>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Add color</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="color"
            value={newHex}
            onChange={(e) => setNewHex(e.target.value)}
            style={{ width: 34, height: 34, borderRadius:8 }}
            aria-label="Pick color"
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.2)" }}
          />
          <button
            onClick={() => onAddColor(newName || "Custom", newHex)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid var(--foreground)",
              background: "var(--foreground)",
              color: "var(--background)",
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
