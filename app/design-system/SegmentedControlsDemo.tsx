"use client";

import { useState } from "react";

const options = ["Preview", "Symbols", "Density"] as const;

type SegmentedControlsDemoProps = {
  variant?: "filled" | "outlined-active";
  labelledBy?: string;
};

export function SegmentedControlsDemo({ variant = "filled", labelledBy = "ds-label-segmented-controls" }: SegmentedControlsDemoProps) {
  const [selected, setSelected] = useState<(typeof options)[number]>("Symbols");

  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      className={`ds-segmented-control${variant === "outlined-active" ? " ds-segmented-control-outlined-active" : ""}`}
    >
      {options.map((label) => (
        <button
          key={label}
          type="button"
          className="ds-segmented-control-item"
          data-active={selected === label ? "true" : undefined}
          aria-pressed={selected === label}
          onClick={() => setSelected(label)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
