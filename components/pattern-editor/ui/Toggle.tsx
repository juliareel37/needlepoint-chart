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
        justifyItems: "start",
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 12, opacity: 0.8 }}>{label}</span>
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
          border: "1px solid var(--foreground)",
          background: checked ? "var(--foreground)" : "transparent",
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
            background: checked ? "var(--background)" : "var(--foreground)",
            transition: "left 150ms ease, background 150ms ease",
          }}
        />
      </span>
    </label>
  );
}
