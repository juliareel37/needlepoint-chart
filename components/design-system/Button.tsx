"use client";

import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, ReactNode } from "react";
import { space } from "@/app/design-system/spacing";
import { typographySpecs } from "@/app/design-system/typography";
import styles from "./Button.module.css";
import { assetPath } from "@/lib/assetPath";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "secondary2"
  | "destructive"
  | "ghost"
  | "ghostV2";
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

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
  inertWhenActive?: boolean;
}

export function Button({
  active = false,
  children,
  className,
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
      style={{ ...sizeStyles[size], ...style }}
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
