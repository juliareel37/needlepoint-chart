"use client";

import React from "react";

type ToggleProps = {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
};

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label
      style={{
        display: "grid",
        gap: 4,
        width: "100%",
        justifyItems: "end",
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 12, opacity: 0.8, textAlign: "right", width: "100%" }}>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
      />
      <span
        aria-hidden="true"
        style={{
          width: 36,
          height: 20,
          borderRadius: 999,
          border: "1px solid var(--toggle-track-border)",
          background: checked ? "var(--toggle-track-on)" : "var(--toggle-track-off)",
          justifySelf: "end",
          position: "relative",
          transition: "background 150ms ease",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 18 : 2,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "var(--toggle-knob)",
            boxShadow: "0 1px 2px var(--ui-border-strong)",
            transition: "left 150ms ease, background 150ms ease",
          }}
        />
      </span>
    </label>
  );
}
