"use client";

import React, { useMemo, useRef, useState } from "react";
import type { Color } from "../../../lib/grid";
import { assetPath } from "../../../lib/assetPath";
import { organizePaletteByHueAndLightness } from "../utils/paletteSort";

type CustomPaletteRecord = {
  id: string;
  name: string;
  colorIds: number[];
};

type CustomPalettesSectionProps = {
  cardStyle: React.CSSProperties;
  cardShadow: string;
  cardShadowCollapsed: string;
  collapseStyle: (open: boolean, maxHeight?: number) => React.CSSProperties;
  palette: Color[];
  usedColorIds: number[];
};

type PaletteBand = {
  key: string;
  rows: Color[][];
};

const CUSTOM_PALETTE_COLUMNS = 9;

const NAME_FIELD_STYLE: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  padding: "6px 8px",
  borderRadius: 8,
  border: "1px solid var(--panel-border)",
  background: "var(--card-bg)",
  color: "var(--foreground)",
  fontSize: 12,
};

const INLINE_EDITOR_STYLE: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 6,
  width: "100%",
  minWidth: 0,
  alignItems: "center",
};

const TOUCHING_ICON_ROW_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 0,
  flex: "0 0 auto",
};

const PLAIN_ICON_BUTTON_STYLE: React.CSSProperties = {
  width: 20,
  height: 20,
  padding: 0,
  border: "none",
  background: "transparent",
  color: "var(--foreground)",
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  lineHeight: 1,
};

function shiftGlyph(dx: number): React.CSSProperties {
  return {
    display: "block",
    transform: `translateX(${dx}px)`,
    pointerEvents: "none",
  };
}

function normalizeFamily(family?: string | null) {
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
}

function renderConfirmCancelRow({
  value,
  onChange,
  onConfirm,
  onCancel,
}: {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={INLINE_EDITOR_STYLE}>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Palette name"
        style={NAME_FIELD_STYLE}
      />
      <div style={TOUCHING_ICON_ROW_STYLE}>
        <button type="button" onClick={onConfirm} aria-label="Confirm" style={PLAIN_ICON_BUTTON_STYLE}>
          <span style={{ ...shiftGlyph(-2), fontSize: 15, fontWeight: 700 }}>✓</span>
        </button>
        <button type="button" onClick={onCancel} aria-label="Cancel" style={PLAIN_ICON_BUTTON_STYLE}>
          <span style={{ ...shiftGlyph(2), fontSize: 15, fontWeight: 700 }}>X</span>
        </button>
      </div>
    </div>
  );
}

function ConfirmCancelRow(props: {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return renderConfirmCancelRow(props);
}

function preventPointerFocus(event: React.MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}

export function CustomPalettesSection({
  cardStyle,
  cardShadow,
  cardShadowCollapsed,
  collapseStyle,
  palette,
  usedColorIds,
}: CustomPalettesSectionProps) {
  const [open, setOpen] = useState(true);
  const [creatingPalette, setCreatingPalette] = useState(false);
  const [newPaletteName, setNewPaletteName] = useState("");
  const [customPalettes, setCustomPalettes] = useState<CustomPaletteRecord[]>([]);
  const [editingPaletteId, setEditingPaletteId] = useState<string | null>(null);
  const [editingPaletteName, setEditingPaletteName] = useState("");
  const [expandedPaletteId, setExpandedPaletteId] = useState<string | null>(null);
  const [customPaletteQuery, setCustomPaletteQuery] = useState("");
  const [customPaletteFamily, setCustomPaletteFamily] = useState("All");
  const [customPaletteSource, setCustomPaletteSource] = useState<"all" | "used">("all");
  const [hoveredCustomSwatchKey, setHoveredCustomSwatchKey] = useState<string | null>(null);
  const paletteSequenceRef = useRef(0);
  const usedColorIdSet = useMemo(() => new Set(usedColorIds), [usedColorIds]);

  const familySwatches: Record<string, string> = {
    red: "#d62b5b",
    orange: "#f27842",
    yellow: "#ffd24d",
    green: "#4caf50",
    blue: "#3b82f6",
    violet: "#8b5cf6",
    neutrals: "#9ca3af",
  };

  const paletteFamilies = useMemo(() => {
    const set = new Set<string>();
    palette.forEach((color) => {
      const family = normalizeFamily(color.family);
      if (family) set.add(family);
    });
    const order = ["All", "red", "orange", "yellow", "green", "blue", "violet", "neutrals"];
    const rest = Array.from(set).filter((family) => !order.includes(family)).sort();
    return ["All", ...order.filter((family) => family !== "All" && set.has(family)), ...rest];
  }, [palette]);

  const customPaletteBands = useMemo<PaletteBand[]>(() => {
    const query = customPaletteQuery.trim().toLowerCase();
    const filteredColors = palette.filter((color) => {
      if (customPaletteSource === "used" && !usedColorIdSet.has(color.id)) return false;
      if (customPaletteFamily !== "All" && normalizeFamily(color.family) !== customPaletteFamily) return false;
      if (!query) return true;
      const code = (color.code ?? "").toLowerCase();
      return color.name.toLowerCase().includes(query) || code.includes(query) || `#${code}`.includes(query);
    });

    if (filteredColors.length === 0) return [];
    return [{ key: "all-colors", rows: organizePaletteByHueAndLightness(filteredColors, CUSTOM_PALETTE_COLUMNS) }];
  }, [customPaletteFamily, customPaletteQuery, customPaletteSource, palette, usedColorIdSet]);

  const closePicker = () => {
    setExpandedPaletteId(null);
    setCustomPaletteQuery("");
    setCustomPaletteFamily("All");
    setCustomPaletteSource("all");
  };

  const createPalette = () => {
    const trimmed = newPaletteName.trim();
    if (!trimmed) return;
    paletteSequenceRef.current += 1;
    const id = `custom-${paletteSequenceRef.current}`;
    setCustomPalettes((prev) => [...prev, { id, name: trimmed, colorIds: [] }]);
    setCreatingPalette(false);
    setNewPaletteName("");
  };

  const startRenamePalette = (paletteId: string, name: string) => {
    setEditingPaletteId(paletteId);
    setEditingPaletteName(name);
  };

  const commitRenamePalette = () => {
    const trimmed = editingPaletteName.trim();
    if (!editingPaletteId || !trimmed) return;
    setCustomPalettes((prev) => prev.map((item) => (item.id === editingPaletteId ? { ...item, name: trimmed } : item)));
    setEditingPaletteId(null);
    setEditingPaletteName("");
  };

  const cancelRenamePalette = () => {
    setEditingPaletteId(null);
    setEditingPaletteName("");
  };

  const removePalette = (paletteId: string) => {
    setCustomPalettes((prev) => prev.filter((item) => item.id !== paletteId));
    if (expandedPaletteId === paletteId) closePicker();
    if (editingPaletteId === paletteId) cancelRenamePalette();
  };

  const addPaletteColor = (paletteId: string, colorId: number) => {
    setCustomPalettes((prev) =>
      prev.map((item) =>
        item.id !== paletteId
          ? item
          : item.colorIds.includes(colorId)
            ? item
            : { ...item, colorIds: [...item.colorIds, colorId] },
      ),
    );
  };

  const removePaletteColor = (paletteId: string, colorId: number) => {
    setCustomPalettes((prev) =>
      prev.map((item) =>
        item.id !== paletteId ? item : { ...item, colorIds: item.colorIds.filter((id) => id !== colorId) },
      ),
    );
  };

  return (
    <div
      className="app-card"
      style={{
        ...cardStyle,
        boxShadow: open ? cardShadow : cardShadowCollapsed,
        minWidth: 0,
        overflowX: "hidden",
      }}
    >
      <button
        onClick={() => setOpen((value) => !value)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          border: "none",
          background: "transparent",
          padding: 0,
          marginBottom: open ? 10 : 0,
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 14,
        }}
        type="button"
      >
        <span>Custom Palettes</span>
        <span style={{ opacity: 0.7, width: 14, textAlign: "center" }}>{open ? "▾" : "▸"}</span>
      </button>
      <div style={{ display: "grid", gap: 10, minWidth: 0, ...collapseStyle(open, 1600) }}>
        {!creatingPalette ? (
          <button
            type="button"
            onClick={() => setCreatingPalette(true)}
            style={{
              width: "100%",
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid var(--ui-border-subtle)",
              background: "var(--accent)",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            + New Palette
          </button>
        ) : (
          <ConfirmCancelRow
            value={newPaletteName}
            onChange={setNewPaletteName}
            onConfirm={createPalette}
            onCancel={() => {
              setCreatingPalette(false);
              setNewPaletteName("");
            }}
          />
        )}

        {customPalettes.length === 0 ? (
          <div
            style={{
              display: "grid",
              justifyItems: "center",
              gap: 6,
              padding: "16px 12px",
              borderRadius: 10,
              background: "var(--ui-surface-faint)",
              color: "var(--foreground)",
              textAlign: "center",
            }}
          >
            <img
              src={assetPath("/icons/palette.svg")}
              alt=""
              aria-hidden="true"
              width={18}
              height={18}
              style={{ display: "block", filter: "var(--icon-on-bg-filter)", opacity: 0.8 }}
            />
            <div style={{ fontSize: 13, fontWeight: 700 }}>No palettes yet</div>
            <div style={{ fontSize: 12, opacity: 0.72 }}>Create your first palette to begin</div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
            {customPalettes.map((customPalette) => {
              const isExpanded = expandedPaletteId === customPalette.id;
              const isEditing = editingPaletteId === customPalette.id;
              const selectedColors = customPalette.colorIds
                .map((id) => palette.find((color) => color.id === id) ?? null)
                .filter((color): color is Color => Boolean(color));

              return (
                <div
                  key={customPalette.id}
                  style={{
                    display: "grid",
                    gap: 10,
                    minWidth: 0,
                    overflow: "hidden",
                    padding: "10px 10px 12px",
                    borderRadius: 12,
                    background: "var(--ui-surface-soft)",
                    border: "1px solid var(--ui-border-subtle)",
                  }}
                >
                  {isEditing ? (
                    <ConfirmCancelRow
                      value={editingPaletteName}
                      onChange={setEditingPaletteName}
                      onConfirm={commitRenamePalette}
                      onCancel={cancelRenamePalette}
                    />
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) auto",
                        gap: 8,
                        alignItems: "center",
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {customPalette.name}
                      </span>
                      <div style={TOUCHING_ICON_ROW_STYLE}>
                        <button
                          type="button"
                          onClick={() => startRenamePalette(customPalette.id, customPalette.name)}
                          aria-label={`Rename ${customPalette.name}`}
                          style={PLAIN_ICON_BUTTON_STYLE}
                        >
                          <span style={{ ...shiftGlyph(-2), fontSize: 13, fontWeight: 700 }}>✎</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removePalette(customPalette.id)}
                          aria-label={`Delete ${customPalette.name}`}
                          style={PLAIN_ICON_BUTTON_STYLE}
                        >
                          <img
                            src={assetPath("/icons/trash.svg")}
                            alt=""
                            aria-hidden="true"
                            width={14}
                            height={14}
                            style={{ ...shiftGlyph(2), filter: "var(--icon-on-bg-filter)" }}
                          />
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedColors.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minWidth: 0, overflowAnchor: "none" }}>
                      {selectedColors.map((color) => {
                        const hoverKey = `${customPalette.id}:${color.id}`;
                        return (
                          <div
                            key={color.id}
                            style={{ position: "relative" }}
                            onMouseEnter={() => setHoveredCustomSwatchKey(hoverKey)}
                            onMouseLeave={() => setHoveredCustomSwatchKey((prev) => (prev === hoverKey ? null : prev))}
                          >
                            <div
                              title={`${color.name} (${color.code ?? color.hex})`}
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 0,
                                background: color.hex,
                                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)",
                                border: "1px solid rgba(0,0,0,0.08)",
                              }}
                            />
                            {hoveredCustomSwatchKey === hoverKey && (
                              <button
                                type="button"
                                onClick={() => removePaletteColor(customPalette.id, color.id)}
                                aria-label={`Remove ${color.name}`}
                                style={{
                                  position: "absolute",
                                  top: -4,
                                  right: -4,
                                  width: 16,
                                  height: 16,
                                  padding: 0,
                                  border: "none",
                                  borderRadius: 999,
                                  background: "#ffffff",
                                  color: "#171717",
                                  cursor: "pointer",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  lineHeight: 1,
                                  display: "grid",
                                  placeItems: "center",
                                }}
                              >
                                X
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!isExpanded ? (
                    <div style={{ display: "flex", justifyContent: "center", minWidth: 0 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedPaletteId(customPalette.id);
                          setCustomPaletteQuery("");
                          setCustomPaletteFamily("All");
                          setCustomPaletteSource("all");
                        }}
                        style={{
                          maxWidth: "100%",
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: "1px solid var(--ui-border-subtle)",
                          background: "var(--card-bg)",
                          color: "var(--foreground)",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        + Add Color
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 10, minWidth: 0, overflow: "hidden" }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>Add your colors:</div>
                      <div
                        role="tablist"
                        aria-label="Color source"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: 2,
                          borderRadius: 10,
                          border: "1px solid var(--ui-border-subtle)",
                          background: "var(--ui-surface-soft)",
                        }}
                      >
                        {[
                          { id: "all" as const, label: "All" },
                          { id: "used" as const, label: "Used" },
                        ].map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            role="tab"
                            onClick={() => setCustomPaletteSource(option.id)}
                            aria-selected={customPaletteSource === option.id}
                            data-active={customPaletteSource === option.id ? "true" : undefined}
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
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <input
                        value={customPaletteQuery}
                        onChange={(event) => setCustomPaletteQuery(event.target.value)}
                        placeholder="Search name or #DMC"
                        style={NAME_FIELD_STYLE}
                      />
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", minWidth: 0 }}>
                        {paletteFamilies
                          .filter((family) => family !== "All")
                          .map((family) => {
                            const swatch = familySwatches[family] ?? "#9ca3af";
                            const isActive = customPaletteFamily === family;
                            return (
                              <button
                                key={family}
                                type="button"
                                onClick={() => setCustomPaletteFamily(isActive ? "All" : family)}
                                aria-pressed={isActive}
                                aria-label={`Filter ${family}`}
                                title={family}
                                style={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: 6,
                                  background: swatch,
                                  border: isActive
                                    ? "2px solid var(--accent-strong)"
                                    : "1px solid var(--ui-border-strong)",
                                  boxShadow: isActive ? "0 0 0 2px var(--accent-soft)" : "none",
                                  cursor: "pointer",
                                }}
                              />
                            );
                          })}
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gap: 2,
                          width: "100%",
                          minWidth: 0,
                          maxWidth: "100%",
                          maxHeight: 220,
                          overflowY: "auto",
                          overflowX: "hidden",
                          overscrollBehavior: "contain",
                          WebkitOverflowScrolling: "touch",
                          scrollbarGutter: "stable",
                          overflowAnchor: "none",
                          paddingRight: 2,
                        }}
                      >
                        {customPaletteBands.map((band) => (
                          <div
                            key={`custom-band-${band.key}`}
                            style={{ display: "grid", gap: 2, minWidth: 0 }}
                          >
                            {band.rows.map((row, rowIndex) => (
                              <div
                                key={`custom-band-${band.key}-row-${rowIndex}`}
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: `repeat(${CUSTOM_PALETTE_COLUMNS}, minmax(0, 1fr))`,
                                  gap: 2,
                                  width: "100%",
                                  minWidth: 0,
                                }}
                              >
                                {row.map((color) => (
                                  <button
                                    key={color.id}
                                    type="button"
                                    onMouseDown={preventPointerFocus}
                                    onClick={() => addPaletteColor(customPalette.id, color.id)}
                                    aria-label={`Add ${color.name}`}
                                    title={`${color.name} (${color.code ?? color.hex})`}
                                    style={{
                                      width: "100%",
                                      minWidth: 0,
                                      aspectRatio: "1 / 1",
                                      borderRadius: 0,
                                      border: customPalette.colorIds.includes(color.id)
                                        ? "2px solid var(--accent-strong)"
                                        : "1px solid rgba(0,0,0,0.08)",
                                      background: color.hex,
                                      cursor: "pointer",
                                      display: "block",
                                      padding: 0,
                                      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
                                    }}
                                  />
                                ))}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", minWidth: 0 }}>
                        <button
                          type="button"
                          onClick={closePicker}
                          style={{
                            maxWidth: "100%",
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: "1px solid var(--ui-border-subtle)",
                            background: "var(--card-bg)",
                            color: "var(--foreground)",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
