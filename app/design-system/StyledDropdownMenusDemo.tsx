"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { typographySpecs } from "./typography";

const triggerDropdownStyle: CSSProperties = {
  width: "100%",
  padding: "5px 10px",
  border: "1px solid var(--ui-border-subtle)",
  background: "var(--card-bg)",
  color: "var(--foreground)",
  borderRadius: 8,
  fontSize: typographySpecs.textSm.size,
  lineHeight: `${typographySpecs.textSm.lineHeight}px`,
  fontWeight: typographySpecs.textSm.weight,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 6,
  cursor: "pointer",
};

const triggerDropupStyle: CSSProperties = {
  padding: "6px 12px",
  border: "none",
  background: "var(--card-bg)",
  color: "var(--foreground)",
  borderRadius: 10,
  fontSize: typographySpecs.textSm.size,
  lineHeight: `${typographySpecs.textSm.lineHeight}px`,
  fontWeight: typographySpecs.textSm.weight,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 6,
  cursor: "pointer",
  minWidth: 146,
};

const menuSurfaceStyle: CSSProperties = {
  width: 172,
  borderRadius: 14,
  border: "1px solid var(--ui-border-subtle)",
  background: "color-mix(in srgb, var(--card-bg) 96%, transparent)",
  boxShadow: "0 12px 28px color-mix(in srgb, var(--foreground) 12%, transparent)",
  backdropFilter: "blur(10px)",
  padding: 8,
  display: "grid",
  gap: 4,
};

const menuItemBaseStyle: CSSProperties = {
  padding: "7px 10px",
  borderRadius: 10,
  border: "none",
  textAlign: "left",
  fontSize: typographySpecs.textSm.size,
  lineHeight: `${typographySpecs.textSm.lineHeight}px`,
  fontWeight: typographySpecs.textSm.weight,
  cursor: "pointer",
};

type DemoProps = {
  labelledBy?: string;
};

export function StyledDropdownDemo({ labelledBy }: DemoProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("Medium");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target || !rootRef.current?.contains(target)) setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} style={{ position: "relative", width: 160, alignSelf: "start" }}>
      <button
        type="button"
        className="gridline-menu-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={labelledBy}
        onClick={() => setOpen((value) => !value)}
        style={triggerDropdownStyle}
      >
        <span>{selected}</span>
        <span aria-hidden="true" className="ds-text-xs" style={{ opacity: 0.55 }}>{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Gridline density"
          style={{ ...menuSurfaceStyle, position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 6, width: "100%" }}
        >
          {["Subtle", "Medium", "Strong"].map((option) => {
            const active = option === selected;
            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={active}
                className="menu-item"
                onClick={() => {
                  setSelected(option);
                  setOpen(false);
                }}
                style={{
                  ...menuItemBaseStyle,
                  background: active ? "var(--accent-wash)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>{option}</span>
                <span aria-hidden="true" className="ds-text-xs" style={{ opacity: active ? 0.9 : 0 }}>✓</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function StyledUpwardDropdownDemo({ labelledBy }: DemoProps) {
  const [open, setOpen] = useState(false);
  const [zoomPreset, setZoomPreset] = useState(100);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target || !rootRef.current?.contains(target)) setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} style={{ position: "relative", width: "fit-content", alignSelf: "start" }}>
      <button
        type="button"
        className="gridline-menu-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-labelledby={labelledBy}
        onClick={() => setOpen((value) => !value)}
        style={triggerDropupStyle}
      >
        Zoom {zoomPreset}%
        <span aria-hidden="true" className="ds-text-xs" style={{ opacity: 0.55 }}>{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Zoom presets"
          style={{ ...menuSurfaceStyle, position: "absolute", bottom: "calc(100% + 6px)", left: 0, zIndex: 6, width: 160 }}
        >
          {[50, 75, 100, 125, 150].map((preset) => {
            const selected = preset === zoomPreset;
            return (
              <button
                key={preset}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                className="menu-item"
                onClick={() => {
                  setZoomPreset(preset);
                  setOpen(false);
                }}
                style={{
                  ...menuItemBaseStyle,
                  background: selected ? "var(--accent-wash)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>{preset}%</span>
                <span aria-hidden="true" className="ds-text-xs" style={{ opacity: selected ? 0.9 : 0 }}>✓</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
