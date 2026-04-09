"use client";

import type { CSSProperties, InputHTMLAttributes } from "react";
import styles from "./Slider.module.css";

type SliderProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function Slider({
  className,
  max = 100,
  min = 0,
  style,
  value = 0,
  ...props
}: SliderProps) {
  const numericMin = typeof min === "number" ? min : Number(min);
  const numericMax = typeof max === "number" ? max : Number(max);
  const numericValue =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : 0;
  const range = numericMax - numericMin;
  const percent =
    range <= 0 ? 0 : ((numericValue - numericMin) / range) * 100;
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const percentStyle = `${clampedPercent}%`;

  return (
    <div
      className={[styles.wrap, className].filter(Boolean).join(" ")}
      style={style}
    >
      <div className={styles.slider} aria-hidden="true">
        <div className={styles.track}>
          <div
            className={styles.fill}
            style={{ width: percentStyle }}
          />
          <div
            className={styles.thumb}
            style={{ left: percentStyle }}
          />
        </div>
      </div>
      <input
        {...props}
        type="range"
        min={min}
        max={max}
        value={value}
        className={styles.input}
      />
    </div>
  );
}
