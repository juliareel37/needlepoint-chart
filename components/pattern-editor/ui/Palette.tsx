"use client";

import React, { useMemo, useState } from "react";
import type { Color } from "../../../lib/grid";
import { sortPaletteByHsv } from "../utils/paletteSort";

type Props = {
  palette: Color[];
  extractedIds?: number[];
  showExtractedFilter?: boolean;
  usedIds?: number[];
  showUsedFilter?: boolean;
  usedCounts?: Record<number, number>;
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
  activeColorId,
  onSelect,
  remapSourceId,
  remapTargetId,
  onRemapSelect,
  onAddColor,
}: Props) {
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
  const [activePanel, setActivePanel] = useState<"All" | "Used">("All");
  const [query, setQuery] = useState("");
  const familySwatches: Record<string, string> = {
    red: "#d62b5b",
    orange: "#f27842",
    yellow: "#ffd24d",
    green: "#4caf50",
    blue: "#3b82f6",
    violet: "#8b5cf6",
    neutrals: "#9ca3af",
  };
  const sortedPalette = useMemo(() => {
    return sortPaletteByHsv(palette);
  }, [palette]);
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
    const panelFiltered = activePanel === "Used" ? sortedPalette.filter((c) => usedSet.has(c.id)) : sortedPalette;
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
  }, [sortedPalette, activeFamily, activePanel, query, extractedSet, usedSet]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div>
        <div style={{ display: "grid", gap: 8, marginBottom: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 6,
              flexWrap: "wrap",
              borderBottom: "1px solid rgba(15,23,42,0.12)",
              paddingBottom: 4,
            }}
          >
            <button
              type="button"
              onClick={() => setActivePanel("All")}
              aria-pressed={activePanel === "All"}
              style={{
                padding: "6px 12px",
                borderRadius: "8px 8px 0 0",
                border:
                  activePanel === "All"
                    ? "1px solid rgba(15,23,42,0.18)"
                    : "1px solid transparent",
                borderBottom: activePanel === "All" ? "1px solid var(--card-bg)" : "1px solid transparent",
                background: activePanel === "All" ? "var(--card-bg)" : "transparent",
                color: "var(--foreground)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("Used")}
              aria-pressed={activePanel === "Used"}
              style={{
                padding: "6px 12px",
                borderRadius: "8px 8px 0 0",
                border:
                  activePanel === "Used"
                    ? "1px solid rgba(15,23,42,0.18)"
                    : "1px solid transparent",
                borderBottom: activePanel === "Used" ? "1px solid var(--card-bg)" : "1px solid transparent",
                background: activePanel === "Used" ? "var(--card-bg)" : "transparent",
                color: "var(--foreground)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Used
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {activePanel === "All" && showExtractedFilter && hasExtracted && (
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
                        border: isActive ? "2px solid var(--accent-strong)" : "1px solid rgba(15,23,42,0.2)",
                        boxShadow: isActive ? "0 0 0 2px var(--accent-soft)" : "none",
                        cursor: "pointer",
                      }}
                    />
                  );
                })}
            </div>
          </div>
        </div>
        <div style={{ height: 1, background: "rgba(15,23,42,0.12)", margin: "6px 0 8px" }} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 4,
            maxHeight: 240,
            overflowY: "auto",
            paddingRight: 4,
            overscrollBehavior: "contain",
          }}
        >
          {activePanel === "Used" && !hasUsed ? (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "12px 8px",
                borderRadius: 10,
                border: "1px dashed rgba(15,23,42,0.2)",
                background: "rgba(15,23,42,0.03)",
                textAlign: "center",
                fontSize: 12,
                color: "var(--foreground)",
                opacity: 0.75,
              }}
            >
              No colors used. Let's start painting!
            </div>
          ) : (
            filteredPalette.map((c) => {
              const isRemapTarget = remapTargetId != null && c.id === remapTargetId;
              const isRemapSource = remapSourceId != null && c.id === remapSourceId;
              const showRemapSource = isRemapSource && (remapTargetId == null || remapTargetId === remapSourceId);
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
                  style={{
                    display: "grid",
                    gap: 2,
                    justifyItems: "center",
                    padding: 2,
                  }}
                >
                  <button
                    type="button"
                    onClick={handleSelect}
                    aria-label={`Select ${c.name}`}
                    title={`${c.name} (${c.code ?? c.hex})`}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      border:
                        isRemapTarget || showRemapSource
                          ? "2px solid var(--accent-strong)"
                          : c.id === activeColorId
                          ? "2px solid var(--accent-strong)"
                          : "1px solid rgba(255,255,255,0.4)",
                      background: c.hex,
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                      padding: 0,
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 4,
                        background: c.hex,
                        display: "inline-block",
                        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
                        position: "relative",
                      }}
                    >
                      {usedCount != null && usedCount > 0 && (
                        <span
                          style={{
                            position: "absolute",
                            top: -4,
                            left: -4,
                            minWidth: 14,
                            height: 14,
                            padding: "0 3px",
                            borderRadius: 999,
                            background: "rgba(15,23,42,0.85)",
                            color: "#ffffff",
                            fontSize: 8,
                            fontWeight: 700,
                            display: "grid",
                            placeItems: "center",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                            pointerEvents: "none",
                          }}
                          aria-hidden="true"
                        >
                          {usedCount}
                        </span>
                      )}
                    </span>
                  </button>
                  <span
                    onClick={handleSelect}
                    style={{ fontSize: 10, opacity: 0.75, lineHeight: 1, cursor: "pointer" }}
                  >
                    {c.code ?? ""}
                  </span>
                </div>
              );
            })
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
