"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Color } from "../../../lib/grid";
import { sortPaletteByHsv } from "../utils/paletteSort";

type FontOption = {
  label: string;
  value: string;
};

type TextToolCardProps = {
  cardStyle: React.CSSProperties;
  cardShadow: string;
  cardShadowCollapsed: string;
  collapseStyle: (open: boolean, maxHeight?: number) => React.CSSProperties;
  textOpen: boolean;
  setTextOpen: React.Dispatch<React.SetStateAction<boolean>>;
  textValue: string;
  onTextValueChange: (value: string) => void;
  fontValue: string;
  onFontValueChange: (value: string) => void;
  fontOptions: FontOption[];
  bold: boolean;
  italic: boolean;
  underline: boolean;
  onBoldChange: (value: boolean) => void;
  onItalicChange: (value: boolean) => void;
  onUnderlineChange: (value: boolean) => void;
  fontSize: number;
  onFontSizeChange: (value: number) => void;
  selectedColorId: number;
  onSelectColor: (id: number) => void;
  palette: Color[];
  usedColorCounts: Record<number, number>;
  placementActive: boolean;
  onAddTextBox: () => void;
};

export function TextToolCard({
  cardStyle,
  cardShadow,
  cardShadowCollapsed,
  collapseStyle,
  textOpen,
  setTextOpen,
  textValue,
  onTextValueChange,
  fontValue,
  onFontValueChange,
  fontOptions,
  bold,
  italic,
  underline,
  onBoldChange,
  onItalicChange,
  onUnderlineChange,
  fontSize,
  onFontSizeChange,
  selectedColorId,
  onSelectColor,
  palette,
  usedColorCounts,
  placementActive,
  onAddTextBox,
}: TextToolCardProps) {
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const [activePaletteFamily, setActivePaletteFamily] = useState("All");
  const [colorButtonHovered, setColorButtonHovered] = useState(false);
  const [hoveredFontIndex, setHoveredFontIndex] = useState<number | null>(null);
  const [colorMenuPos, setColorMenuPos] = useState<{ top: number; left: number; openUp: boolean } | null>(null);
  const fontMenuRef = useRef<HTMLDivElement | null>(null);
  const colorMenuRef = useRef<HTMLDivElement | null>(null);
  const colorButtonRef = useRef<HTMLButtonElement | null>(null);
  const selectedColor = useMemo(() => palette.find((color) => color.id === selectedColorId) ?? null, [palette, selectedColorId]);
  const orderedPalette = useMemo(() => sortPaletteByHsv(palette), [palette]);
  const normalizePaletteFamily = (family?: string | null) => {
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
  const paletteFamilySwatches: Record<string, string> = {
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
    orderedPalette.forEach((c) => {
      const normalized = normalizePaletteFamily(c.family);
      if (normalized) set.add(normalized);
    });
    set.delete("Extracted");
    const order = ["All", "red", "orange", "yellow", "green", "blue", "violet", "neutrals"];
    const rest = Array.from(set).filter((f) => !order.includes(f)).sort();
    return ["All", ...order.filter((f) => f !== "All" && set.has(f)), ...rest];
  }, [orderedPalette]);
  const filteredPaletteEntries = useMemo(() => {
    if (activePaletteFamily === "All") return orderedPalette;
    return orderedPalette.filter((color) => normalizePaletteFamily(color.family) === activePaletteFamily);
  }, [activePaletteFamily, orderedPalette]);
  const selectedFontLabel = useMemo(
    () => fontOptions.find((option) => option.value === fontValue)?.label ?? "Select font",
    [fontOptions, fontValue]
  );
  const visibleFontOptions = useMemo(() => {
    return [...fontOptions].sort((a, b) => a.label.localeCompare(b.label));
  }, [fontOptions]);

  useEffect(() => {
    if (!fontMenuOpen && !colorMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (fontMenuRef.current && fontMenuRef.current.contains(target)) return;
      if (colorButtonRef.current && colorButtonRef.current.contains(target)) return;
      if (colorMenuRef.current && colorMenuRef.current.contains(target)) return;
      setFontMenuOpen(false);
      setColorMenuOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [fontMenuOpen, colorMenuOpen]);

  useEffect(() => {
    if (!colorMenuOpen) return;
    const updateColorMenuPos = () => {
      const trigger = colorButtonRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      const panelWidth = 220;
      const estimatedPanelHeight = 320;
      const gap = 6;
      const openUp = rect.bottom + gap + estimatedPanelHeight > viewportH - 8 && rect.top - gap - estimatedPanelHeight > 8;
      const left = Math.min(Math.max(8, rect.left), Math.max(8, viewportW - panelWidth - 8));
      const top = openUp ? rect.top - gap : rect.bottom + gap;
      setColorMenuPos({ top, left, openUp });
    };
    updateColorMenuPos();
    window.addEventListener("resize", updateColorMenuPos);
    window.addEventListener("scroll", updateColorMenuPos, true);
    return () => {
      window.removeEventListener("resize", updateColorMenuPos);
      window.removeEventListener("scroll", updateColorMenuPos, true);
    };
  }, [colorMenuOpen]);

  return (
    <div
      className="app-card"
      style={{
        ...cardStyle,
        boxShadow: textOpen ? cardShadow : cardShadowCollapsed,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <button
        type="button"
        onClick={() => setTextOpen((open) => !open)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          border: "none",
          background: "transparent",
          padding: 0,
          marginBottom: textOpen ? 10 : 0,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        <span>Text</span>
        <span style={{ opacity: 0.7, width: 14, textAlign: "center" }}>{textOpen ? "▾" : "▸"}</span>
      </button>

      <div style={{ display: "grid", gap: 10, width: "100%", ...collapseStyle(textOpen, 1200) }}>
        <label style={{ display: "grid", gap: 6, position: "relative" }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Text content</span>
          <textarea
            value={textValue}
            onChange={(e) => onTextValueChange(e.target.value)}
            placeholder="Type your text"
            rows={3}
            style={{
              width: "100%",
              resize: "vertical",
              minHeight: 66,
              padding: "8px 9px",
              borderRadius: 8,
              border: "1px solid var(--ui-border-subtle)",
              background: "var(--card-bg)",
              color: "var(--foreground)",
              fontSize: 12,
              boxSizing: "border-box",
            }}
          />
        </label>

        <div ref={fontMenuRef} style={{ display: "grid", gap: 6, position: "relative" }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Font</span>
          <button
            type="button"
            onClick={() => {
              setFontMenuOpen((open) => !open);
              setColorMenuOpen(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              width: "100%",
              padding: "7px 8px",
              borderRadius: 8,
              border: "1px solid var(--ui-border-subtle)",
              background: "var(--card-bg)",
              color: "var(--foreground)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: fontValue,
                fontWeight: 500,
              }}
            >
              {selectedFontLabel}
            </span>
            <span style={{ opacity: 0.7, width: 14, textAlign: "center" }}>{fontMenuOpen ? "▾" : "▸"}</span>
          </button>
          {fontMenuOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                zIndex: 20,
                display: "grid",
                gap: 4,
                maxHeight: 180,
                overflowY: "auto",
                border: "1px solid var(--ui-border-subtle)",
                borderRadius: 10,
                padding: 6,
                background: "var(--card-bg)",
                boxShadow: "var(--ui-shadow-lg)",
              }}
            >
              {visibleFontOptions.map((option, index) => {
                const active = option.value === fontValue;
                const hovered = hoveredFontIndex === index;
                return (
                  <button
                    key={`${option.label}-${index}`}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onFontValueChange(option.value);
                      setFontMenuOpen(false);
                    }}
                    onMouseEnter={() => setHoveredFontIndex(index)}
                    onMouseLeave={() => setHoveredFontIndex(null)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      gap: 8,
                      padding: "6px 8px",
                      borderRadius: 8,
                      border: active ? "1px solid var(--accent-strong)" : "1px solid transparent",
                      background: active ? "var(--accent-wash)" : hovered ? "var(--ui-surface-soft)" : "transparent",
                      color: "var(--foreground)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background-color 120ms ease",
                    }}
                  >
                    <span style={{ fontSize: 13, fontFamily: option.value, fontWeight: 500 }}>{option.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Style</span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "28px 28px 28px 28px",
              gap: 6,
              justifyContent: "start",
              alignItems: "center",
            }}
          >
            <div ref={colorMenuRef} style={{ position: "relative" }}>
              <button
                ref={colorButtonRef}
                type="button"
                onClick={() => {
                  setColorMenuOpen((open) => !open);
                  setFontMenuOpen(false);
                }}
                onMouseEnter={() => setColorButtonHovered(true)}
                onMouseLeave={() => setColorButtonHovered(false)}
                aria-label="Text color"
                title={selectedColor ? selectedColor.name : "Select color"}
                style={{
                  width: 28,
                  height: 28,
                  padding: 0,
                  borderRadius: 10,
                  cursor: "pointer",
                  display: "grid",
                  gap: 1,
                  justifyItems: "center",
                  border: "none",
                  background: "transparent",
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: selectedColor?.hex ?? "transparent",
                    border: colorMenuOpen
                      ? "2px solid var(--accent-strong)"
                      : colorButtonHovered
                        ? "1px solid var(--ui-border-strong)"
                        : "1px solid rgba(0,0,0,0.18)",
                    boxShadow: colorMenuOpen ? "0 0 0 2px var(--accent-soft)" : "none",
                    display: "grid",
                    placeItems: "center",
                    padding: 0,
                    transition: "border-color 120ms ease, box-shadow 120ms ease",
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      background: selectedColor?.hex ?? "transparent",
                      display: "inline-block",
                      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
                    }}
                  />
                </span>
              </button>
              {colorMenuOpen && colorMenuPos
                ? createPortal(
                <div
                  ref={colorMenuRef}
                  style={{
                    position: "fixed",
                    top: colorMenuPos.top,
                    left: colorMenuPos.left,
                    transform: colorMenuPos.openUp ? "translateY(-100%)" : "none",
                    zIndex: 999,
                    background: "var(--surface-elevated)",
                    borderRadius: 12,
                    padding: 8,
                    boxShadow: "0 8px 18px var(--ui-border)",
                    border: "1px solid var(--ui-border-subtle)",
                    overflow: "hidden",
                    display: "grid",
                    gap: 6,
                    minWidth: 200,
                    width: 220,
                    maxWidth: 220,
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ display: "grid", gap: 6 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          width: "100%",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                        }}
                      >
                        {paletteFamilies
                          .filter((family) => family !== "All")
                          .map((family) => {
                            const swatch = paletteFamilySwatches[family] ?? "#9ca3af";
                            const isActive = activePaletteFamily === family;
                            return (
                              <button
                                key={family}
                                type="button"
                                onClick={() => setActivePaletteFamily(isActive ? "All" : family)}
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
                    <div style={{ height: 1, background: "var(--ui-border-subtle)" }} />
                  </div>
                  <div
                    className="toolbar-palette-scroll"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      columnGap: 4,
                      rowGap: 6,
                      maxHeight: 170,
                      overflowY: "auto",
                      overflowX: "hidden",
                      padding: "10px 6px 8px 6px",
                    }}
                  >
                      {filteredPaletteEntries.map((color) => {
                        const usedCount = usedColorCounts[color.id];
                        const isActive = color.id === selectedColorId;
                        return (
                          <div
                            key={color.id}
                            style={{
                              display: "grid",
                              gap: 2,
                              justifyItems: "center",
                              padding: 1,
                            }}
                          >
                            <button
                              type="button"
                              aria-label={color.name}
                              title={color.name}
                              onClick={() => {
                                onSelectColor(color.id);
                                setColorMenuOpen(false);
                              }}
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 6,
                                border: isActive ? "2px solid var(--accent-strong)" : "1px solid rgba(0,0,0,0.18)",
                                background: color.hex,
                                cursor: "pointer",
                                display: "grid",
                                placeItems: "center",
                                padding: 0,
                                overflow: "visible",
                              }}
                            >
                              <span
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: 5,
                                  background: color.hex,
                                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
                                  display: "block",
                                  position: "relative",
                                }}
                              >
                                {usedCount != null && usedCount > 0 && (
                                  <span
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      minWidth: 14,
                                      height: 14,
                                      padding: "0 3px",
                                      borderRadius: 999,
                                      background: "#ffffff",
                                      color: "rgba(15,23,42,0.9)",
                                      fontSize: 8,
                                      fontWeight: 700,
                                      display: "grid",
                                      placeItems: "center",
                                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                                      pointerEvents: "none",
                                      transform: "translate(-50%, -50%)",
                                      zIndex: 2,
                                    }}
                                    aria-hidden="true"
                                  >
                                    {usedCount}
                                  </span>
                                )}
                              </span>
                            </button>
                            <span
                              style={{
                                fontSize: 9,
                                lineHeight: 1.1,
                                textAlign: "center",
                                color: "var(--foreground)",
                                opacity: 0.8,
                                width: 44,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {color.id}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                </div>
                ,
                document.body
                  )
                : null}
            </div>
            <button
              type="button"
              onClick={() => onBoldChange(!bold)}
              style={{
                width: 28,
                height: 28,
                padding: 0,
                borderRadius: 8,
                border: bold ? "1px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                background: bold ? "var(--accent-wash)" : "var(--card-bg)",
                color: "var(--foreground)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                lineHeight: 1,
              }}
            >
              B
            </button>
            <button
              type="button"
              onClick={() => onItalicChange(!italic)}
              style={{
                width: 28,
                height: 28,
                padding: 0,
                borderRadius: 8,
                border: italic ? "1px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                background: italic ? "var(--accent-wash)" : "var(--card-bg)",
                color: "var(--foreground)",
                fontSize: 12,
                fontStyle: "italic",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                lineHeight: 1,
              }}
            >
              I
            </button>
            <button
              type="button"
              onClick={() => onUnderlineChange(!underline)}
              style={{
                width: 28,
                height: 28,
                padding: 0,
                borderRadius: 8,
                border: underline ? "1px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                background: underline ? "var(--accent-wash)" : "var(--card-bg)",
                color: "var(--foreground)",
                fontSize: 12,
                textDecoration: "underline",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                lineHeight: 1,
              }}
            >
              U
            </button>
          </div>
        </div>

        <label
          style={{
            display: "grid",
            gridTemplateColumns: "auto minmax(0, 1fr) auto",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600 }}>Font size</span>
          <input
            type="range"
            min={6}
            max={96}
            step={1}
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
          />
          <input
            type="number"
            min={6}
            max={96}
            step={1}
            value={fontSize}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (!Number.isFinite(next)) return;
              onFontSizeChange(Math.max(6, Math.min(96, Math.round(next))));
            }}
            aria-label="Font size"
            style={{
              width: 50,
              minWidth: 0,
              padding: "4px 6px",
              borderRadius: 8,
              border: "1px solid var(--ui-border-subtle)",
              background: "var(--card-bg)",
              color: "var(--foreground)",
              fontSize: 12,
              fontWeight: 400,
              textAlign: "left",
            }}
          />
        </label>

        <div style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Preview</span>
          <div
            style={{
              minHeight: 76,
              borderRadius: 10,
              border: "1px solid var(--ui-border-subtle)",
              background: "var(--ui-surface-soft)",
              padding: 10,
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: fontValue,
                fontSize: Math.max(6, fontSize),
                fontWeight: bold ? 700 : 400,
                fontStyle: italic ? "italic" : "normal",
                textDecoration: underline ? "underline" : "none",
                color: selectedColor?.hex ?? "#000000",
                lineHeight: 1.15,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                width: "100%",
              }}
            >
              {textValue.trim() || "Preview text"}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddTextBox}
          disabled={!textValue.trim() || placementActive}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "7px 10px",
            borderRadius: 8,
            border: "1px solid var(--ui-border-subtle)",
            background: "var(--accent)",
            color: "#ffffff",
            cursor: !textValue.trim() || placementActive ? "not-allowed" : "pointer",
            fontSize: 12,
            fontWeight: 600,
            opacity: !textValue.trim() || placementActive ? 0.6 : 1,
          }}
        >
          {placementActive ? "Text box active on canvas" : "Add text box"}
        </button>
      </div>
    </div>
  );
}
