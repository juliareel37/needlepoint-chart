"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import styles from "./Checkbox.module.css";

export function Checkbox({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      type="checkbox"
      className={[styles.checkbox, className].filter(Boolean).join(" ")}
    />
  );
}

export function CheckboxField({
  checkboxClassName,
  children,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  checkboxClassName?: string;
  children: ReactNode;
}) {
  return (
    <label className={[styles.checkboxField, className].filter(Boolean).join(" ")}>
      <Checkbox {...props} className={checkboxClassName} />
      <span className={styles.label} style={typographyStyles.p2}>
        {children}
      </span>
    </label>
  );
}
