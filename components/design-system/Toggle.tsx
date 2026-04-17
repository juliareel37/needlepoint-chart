"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import styles from "./Toggle.module.css";

export function Toggle({
  checked,
  className,
  label,
  onChange,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
  checked: boolean;
  label?: ReactNode;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className={[styles.row, className].filter(Boolean).join(" ")}>
      {label ? (
        <span className={styles.label} style={typographyStyles.p2}>
          {label}
        </span>
      ) : null}
      <button
        {...props}
        type={props.type ?? "button"}
        role="switch"
        aria-checked={checked}
        className={styles.toggle}
        data-checked={checked ? "true" : "false"}
        onClick={(event) => {
          props.onClick?.(event);
          if (!event.defaultPrevented) {
            onChange(!checked);
          }
        }}
      >
        <span className={styles.knob} aria-hidden="true" />
      </button>
    </div>
  );
}
