"use client";

import { useState } from "react";

type NumberFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  inline?: boolean;
};

function NumberField({ id, label, value, onChange, inline = false }: NumberFieldProps) {
  function updateBy(delta: number) {
    const numericValue = Number(value);
    const nextValue = Number.isFinite(numericValue) ? numericValue + delta : delta;
    onChange(String(nextValue));
  }

  return (
    <div className={inline ? "ds-number-inline-row" : "ds-control-stack"}>
      <label htmlFor={id} className="ds-control-label">{label}</label>
      <div className="ds-number-field-wrap">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          className="ds-number-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <div className="ds-number-stepper" aria-hidden="true">
          <button type="button" className="ds-number-step" tabIndex={-1} onClick={() => updateBy(1)}>
            <svg viewBox="0 0 16 16" width="12" height="12">
              <path d="M4.5 10 8 6.5 11.5 10" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className="ds-number-step" tabIndex={-1} onClick={() => updateBy(-1)}>
            <svg viewBox="0 0 16 16" width="12" height="12">
              <path d="M4.5 6 8 9.5 11.5 6" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function NumberInputDemo() {
  const [stackedValue, setStackedValue] = useState("12");
  const [inlineValue, setInlineValue] = useState("24");

  return (
    <div className="ds-lane">
      <NumberField id="ds-input-number" label="Number value" value={stackedValue} onChange={setStackedValue} />
      <NumberField id="ds-input-number-inline" label="Count" value={inlineValue} onChange={setInlineValue} inline />
    </div>
  );
}
