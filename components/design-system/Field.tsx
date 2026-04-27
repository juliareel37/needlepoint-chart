"use client";

import type {
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { typographyStyles } from "@/app/design-system/typography";
import styles from "./Field.module.css";

export function Field({
  children,
  hint,
  label,
}: {
  children: ReactNode;
  hint?: ReactNode;
  label?: ReactNode;
}) {
  return (
    <label className={styles.field}>
      {label ? (
        <span className={styles.label} style={typographyStyles.p2}>
          {label}
        </span>
      ) : null}
      {children}
      {hint ? (
        <span className={styles.hint} style={typographyStyles.s}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function FieldInput({
  className,
  suffix,
  style,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { suffix?: ReactNode }) {
  const input = (
    <input
      {...props}
      className={[
        styles.control,
        suffix ? styles.controlWithSuffix : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ ...inputTypographyStyle, ...style }}
    />
  );

  if (!suffix) {
    return input;
  }

  return (
    <span className={styles.inputWithSuffix}>
      {input}
      <span aria-hidden="true" className={styles.suffix}>
        {suffix}
      </span>
    </span>
  );
}

export function FieldSelect({
  children,
  className,
  style,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[styles.control, className].filter(Boolean).join(" ")}
      style={{ ...inputTypographyStyle, ...style }}
    >
      {children}
    </select>
  );
}

export function FieldCheckboxRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={[styles.checkboxRow, className].filter(Boolean).join(" ")}>
      {children}
    </span>
  );
}

const inputTypographyStyle = {
  fontSize: typographyStyles.p2.fontSize,
  lineHeight: typographyStyles.p2.lineHeight,
  fontWeight: typographyStyles.p2.fontWeight,
} satisfies CSSProperties;
