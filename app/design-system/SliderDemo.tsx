"use client";

import { useEffect, useState } from "react";

type SliderRowProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  inline?: boolean;
  readout?: boolean;
  dragTooltip?: boolean;
};

function SliderRow({ label, value, onChange, inline = false, readout = false, dragTooltip = false }: SliderRowProps) {
  const percent = `${value}%`;
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!showTooltip) return;

    function handlePointerUp() {
      setShowTooltip(false);
    }

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [showTooltip]);

  if (readout) {
    const readoutWidth = `${Math.max(3, String(value).length + 0.5)}ch`;

    return (
      <div className="ds-slider-row">
        <div className="ds-control-label">{label}</div>
        <div className="ds-slider-readout-row">
          <div className="ds-slider-wrap">
            <div className="ds-slider" aria-hidden="true">
              <div className="ds-slider-track">
                <div className="ds-slider-fill" style={{ width: percent }} />
                <div className="ds-slider-thumb" style={{ left: percent }} />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={value}
              onChange={(event) => onChange(Number(event.target.value))}
              className="ds-slider-input"
              aria-label={label}
            />
          </div>
          <div className="ds-slider-value-readout" aria-hidden="true" style={{ width: readoutWidth }}>{value}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={inline ? "ds-slider-inline-row" : "ds-slider-row"}>
      <div className="ds-control-label">{label}</div>
      <div className="ds-slider-wrap">
        {dragTooltip ? (
          <div
            className={`ds-slider-thumb-tooltip${showTooltip ? " ds-slider-thumb-tooltip-visible" : ""}`}
            aria-hidden="true"
            style={{ left: percent }}
          >
            {value}
          </div>
        ) : null}
        <div className="ds-slider" aria-hidden="true">
          <div className="ds-slider-track">
            <div className="ds-slider-fill" style={{ width: percent }} />
            <div className="ds-slider-thumb" style={{ left: percent }} />
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          onPointerDown={() => {
            if (dragTooltip) setShowTooltip(true);
          }}
          onBlur={() => setShowTooltip(false)}
          className="ds-slider-input"
          aria-label={label}
        />
      </div>
    </div>
  );
}

type SliderNumberRowProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
};

function SliderNumberRow({ id, label, value, onChange }: SliderNumberRowProps) {
  const percent = `${value}%`;
  const inputWidth = `${Math.max(3, String(value).length + 0.5)}ch`;

  return (
    <div className="ds-slider-linked-row">
      <label htmlFor={id} className="ds-control-label">{label}</label>
      <div className="ds-slider-wrap">
        <div className="ds-slider" aria-hidden="true">
          <div className="ds-slider-track">
            <div className="ds-slider-fill" style={{ width: percent }} />
            <div className="ds-slider-thumb" style={{ left: percent }} />
          </div>
        </div>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="ds-slider-input"
          aria-label={label}
        />
      </div>
      <div
        className="ds-number-field-wrap ds-slider-number-field ds-slider-number-field-compact"
        style={{ width: inputWidth }}
      >
        <input
          type="text"
          inputMode="numeric"
          className="ds-number-input ds-slider-number-input"
          value={value}
          onChange={(event) => {
            const digitsOnly = event.target.value.replace(/\D/g, "");
            if (digitsOnly === "") {
              onChange(0);
              return;
            }
            const nextValue = Number(digitsOnly);
            if (Number.isFinite(nextValue)) onChange(Math.max(0, Math.min(100, nextValue)));
          }}
          aria-label={`${label} value`}
        />
      </div>
    </div>
  );
}

export function SliderDemo() {
  const [opacity, setOpacity] = useState(68);
  const [gridSpacing, setGridSpacing] = useState(32);
  const [zoom, setZoom] = useState(56);
  const [rangeWithValue, setRangeWithValue] = useState(42);

  return (
    <div className="ds-slider-demo-grid">
      <div className="ds-slider-demo-section">
        <div className="ds-slider-stack ds-slider-stack-section">
          <SliderRow label="Range" value={opacity} onChange={setOpacity} dragTooltip />
          <SliderRow label="Range" value={gridSpacing} onChange={setGridSpacing} readout />
        </div>
      </div>
      <div className="ds-slider-demo-section">
        <div className="ds-slider-stack ds-slider-stack-section">
          <SliderRow label="Range" value={zoom} onChange={setZoom} inline dragTooltip />
          <SliderNumberRow id="ds-slider-range-linked" label="Range" value={rangeWithValue} onChange={setRangeWithValue} />
        </div>
      </div>
    </div>
  );
}
