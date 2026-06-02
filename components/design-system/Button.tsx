"use client";

import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, ReactNode } from "react";
import { space } from "@/app/design-system/spacing";
import { typographySpecs } from "@/app/design-system/typography";
import styles from "./Button.module.css";
import { assetPath } from "@/lib/assetPath";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outlined"
  | "destructive"
  | "ghost"
  | "ghostV2"
  | "toolbarX";
type ButtonSize = "sm" | "md" | "lg";

const sizeStyles: Record<ButtonSize, CSSProperties> = {
  sm: {
    padding: `${space[8]} ${space[12]}`,
    fontSize: typographySpecs.s.size,
    lineHeight: `${typographySpecs.s.lineHeight}px`,
    // fontWeight: typographySpecs.s.weight,
  },
  md: {
    padding: `${space[8]} ${space[16]}`,
    fontSize: typographySpecs.p2.size,
    lineHeight: `${typographySpecs.p2.lineHeight}px`,
    // fontWeight: typographySpecs.p2.weight,
  },
  lg: {
    padding: `${space[12]} ${space[20]}`,
    fontSize: typographySpecs.p1.size,
    lineHeight: `${typographySpecs.p1.lineHeight}px`,
    fontWeight: typographySpecs.p1.weight,
  },
};

const iconOnlySizeStyles: Record<ButtonSize, CSSProperties> = {
  sm: {
    width: 24,
    minWidth: 24,
    height: 24,
    minHeight: 24,
    padding: 0,
  },
  md: {
    width: 32,
    minWidth: 32,
    height: 32,
    minHeight: 32,
    padding: 0,
  },
  lg: {
    width: 40,
    minWidth: 40,
    height: 40,
    minHeight: 40,
    padding: 0,
  },
};

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
  iconOnly?: boolean;
  inertWhenActive?: boolean;
}

export function Button({
  active = false,
  children,
  className,
  iconOnly = false,
  inertWhenActive = false,
  onClick,
  size = "md",
  style,
  variant = "secondary",
  ...props
}: ButtonProps) {
  const isInertActive = active && inertWhenActive;
  const classes = [
    styles.button,
    styles[size],
    styles[variant],
    iconOnly ? styles.iconOnly : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      className={classes}
      data-active={active ? "true" : undefined}
      data-inert-active={isInertActive ? "true" : undefined}
      onClick={(event) => {
        if (isInertActive) {
          event.preventDefault();
          return;
        }

        onClick?.(event);
      }}
      style={{
        ...(iconOnly ? iconOnlySizeStyles[size] : sizeStyles[size]),
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function ButtonIcon({
  icon,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { icon: string }) {
  return (
    <span
      {...props}
      aria-hidden={props["aria-hidden"] ?? "true"}
      className={[styles.icon, className].filter(Boolean).join(" ")}
    >
      <span
        className={styles.glyph}
        style={{
          WebkitMaskImage: `url(${assetPath(icon)})`,
          maskImage: `url(${assetPath(icon)})`,
        }}
      />
    </span>
  );
}
