"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Color } from "../../../lib/grid";
import { hexToRgb } from "../utils/colorUtils";

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
  placementActive,
  onAddTextBox,
}: TextToolCardProps) {
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const [hoveredFontIndex, setHoveredFontIndex] = useState<number | null>(null);
  const [hoveredColorId, setHoveredColorId] = useState<number | null>(null);
  const fontMenuRef = useRef<HTMLDivElement | null>(null);
  const colorMenuRef = useRef<HTMLDivElement | null>(null);
  const selectedColor = useMemo(() => palette.find((color) => color.id === selectedColorId) ?? null, [palette, selectedColorId]);
  const orderedPalette = useMemo(() => {
    const toHueSat = (hex: string) => {
      const rgb = hexToRgb(hex);
      if (!rgb) return { hue: 0, sat: 0 };
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const d = max - min;
      const sat = max === 0 ? 0 : d / max;
      let hue = 0;
      if (d !== 0) {
        if (max === r) hue = ((g - b) / d) % 6;
        else if (max === g) hue = (b - r) / d + 2;
        else hue = (r - g) / d + 4;
        hue *= 60;
        if (hue < 0) hue += 360;
      }
      return { hue, sat };
    };

    return [...palette].sort((a, b) => {
      const ah = toHueSat(a.hex);
      const bh = toHueSat(b.hex);
      const aNeutral = ah.sat < 0.12;
      const bNeutral = bh.sat < 0.12;
      if (aNeutral !== bNeutral) return aNeutral ? 1 : -1;
      if (aNeutral && bNeutral) return a.name.localeCompare(b.name);
      return ah.hue - bh.hue;
    });
  }, [palette]);
  const selectedFontLabel = useMemo(
    () => fontOptions.find((option) => option.value === fontValue)?.label ?? "Select font",
    [fontOptions, fontValue]
  );

  useEffect(() => {
    if (!fontMenuOpen && !colorMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (fontMenuRef.current && fontMenuRef.current.contains(target)) return;
      if (colorMenuRef.current && colorMenuRef.current.contains(target)) return;
      setFontMenuOpen(false);
      setColorMenuOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [fontMenuOpen, colorMenuOpen]);

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
          fontWeight: 600,
          fontSize: 14,
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
              fontSize: 12,
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
              {fontOptions.map((option, index) => {
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
                    <span style={{ fontSize: 12, fontFamily: option.value, fontWeight: 500 }}>{option.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Style</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 }}>
            <button
              type="button"
              onClick={() => onBoldChange(!bold)}
              style={{
                padding: "6px 8px",
                borderRadius: 8,
                border: bold ? "1px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                background: bold ? "var(--accent-wash)" : "var(--card-bg)",
                color: "var(--foreground)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              B
            </button>
            <button
              type="button"
              onClick={() => onItalicChange(!italic)}
              style={{
                padding: "6px 8px",
                borderRadius: 8,
                border: italic ? "1px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                background: italic ? "var(--accent-wash)" : "var(--card-bg)",
                color: "var(--foreground)",
                fontSize: 12,
                fontStyle: "italic",
                cursor: "pointer",
              }}
            >
              I
            </button>
            <button
              type="button"
              onClick={() => onUnderlineChange(!underline)}
              style={{
                padding: "6px 8px",
                borderRadius: 8,
                border: underline ? "1px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                background: underline ? "var(--accent-wash)" : "var(--card-bg)",
                color: "var(--foreground)",
                fontSize: 12,
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              U
            </button>
            <div ref={colorMenuRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => {
                  setColorMenuOpen((open) => !open);
                  setFontMenuOpen(false);
                }}
                aria-label="Text color"
                title={selectedColor ? selectedColor.name : "Select color"}
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: 32,
                  padding: 0,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  outline: "none",
                  boxShadow: "none",
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    border: "1px solid rgba(15, 23, 42, 0.35)",
                    background: selectedColor?.hex ?? "#000000",
                    display: "block",
                  }}
                />
              </button>
              {colorMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    right: 0,
                    width: 220,
                    zIndex: 20,
                    display: "grid",
                    gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
                    gap: 6,
                    maxHeight: 180,
                    overflowY: "auto",
                    border: "1px solid var(--ui-border-subtle)",
                    borderRadius: 10,
                    padding: 8,
                    background: "var(--card-bg)",
                    boxShadow: "var(--ui-shadow-lg)",
                  }}
                >
                  {orderedPalette.map((color) => {
                    const isActive = color.id === selectedColorId;
                    const hovered = hoveredColorId === color.id;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        aria-label={color.name}
                        title={color.name}
                        onClick={() => {
                          onSelectColor(color.id);
                          setColorMenuOpen(false);
                        }}
                        onMouseEnter={() => setHoveredColorId(color.id)}
                        onMouseLeave={() => setHoveredColorId(null)}
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 5,
                          background: color.hex,
                          border: isActive ? "2px solid var(--accent-strong)" : "1px solid rgba(15, 23, 42, 0.35)",
                          boxShadow: isActive
                            ? "0 0 0 2px var(--accent-soft)"
                            : hovered
                              ? "0 0 0 2px rgba(15, 23, 42, 0.18)"
                              : "none",
                          cursor: "pointer",
                          justifySelf: "center",
                          transition: "box-shadow 120ms ease",
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Font size: {fontSize}px</span>
          <input
            type="range"
            min={6}
            max={96}
            step={1}
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "7px 10px",
            borderRadius: 8,
            border: "1px solid var(--ui-border-subtle)",
            background: "var(--card-bg)",
            color: "var(--foreground)",
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
