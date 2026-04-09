"use client";

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import styles from "./Menu.module.css";

type MenuTriggerVariant = "default" | "selection" | "ghost" | "upward";
type MenuItemLayout = "leading" | "trailing";

export interface MenuTriggerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  open?: boolean;
  variant?: MenuTriggerVariant;
}

export function MenuTrigger({
  children,
  className,
  open = false,
  style,
  variant = "default",
  ...props
}: MenuTriggerProps) {
  const classes = [
    styles.trigger,
    variant === "default"
      ? styles.triggerDefault
      : variant === "selection"
        ? styles.triggerSelection
        : variant === "ghost"
          ? styles.triggerGhost
          : styles.triggerUpward,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      className={classes}
      data-open={open ? "true" : undefined}
      style={{ ...typographyStyles.p2, ...style }}
    >
      {children}
    </button>
  );
}

export interface MenuSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function MenuSurface({
  children,
  className,
  style,
  ...props
}: MenuSurfaceProps) {
  return (
    <div
      {...props}
      className={[styles.surface, className].filter(Boolean).join(" ")}
      style={style}
    >
      {children}
    </div>
  );
}

export interface MenuItemProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  active?: boolean;
  layout?: MenuItemLayout;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function MenuItem({
  active = false,
  children,
  className,
  leading,
  layout = "leading",
  style,
  trailing,
  ...props
}: MenuItemProps) {
  const classes = [
    styles.item,
    layout === "trailing" ? styles.itemTrailing : styles.itemLeading,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      className={classes}
      data-active={active ? "true" : undefined}
      style={{ ...typographyStyles.p2, ...style }}
    >
      {leading ? <span className={styles.itemContent}>{leading}</span> : null}
      {!leading || layout === "trailing" ? (
        <span className={styles.itemLabel}>{children}</span>
      ) : null}
      {leading && layout === "leading" ? (
        <span className={styles.itemLabel}>{children}</span>
      ) : null}
      {trailing ? <span className={styles.itemContent}>{trailing}</span> : null}
    </button>
  );
}

export function MenuDivider({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={[styles.divider, className].filter(Boolean).join(" ")}
    />
  );
}

export function MenuRadioIcon({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={[styles.selectionIcon, styles.radioIcon].join(" ")}
      data-checked={checked ? "true" : undefined}
    >
      <span
        className={styles.radioDot}
        data-checked={checked ? "true" : undefined}
      />
    </span>
  );
}

export function MenuCheckboxIcon({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={[styles.selectionIcon, styles.checkboxIcon].join(" ")}
      data-checked={checked ? "true" : undefined}
    >
      <span
        className={styles.checkmark}
        data-checked={checked ? "true" : undefined}
        style={typographyStyles.s}
      >
        ✓
      </span>
    </span>
  );
}

export function MenuTrailingCheck({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={styles.trailingCheck}
      data-active={active ? "true" : undefined}
      style={typographyStyles.s}
    >
      ✓
    </span>
  );
}

export function MenuCaretIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
      className={styles.caretIcon}
    >
      <path
        d="M6.25 3.5 10.75 8l-4.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MenuChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
      className={styles.chevronIcon}
    >
      <path
        d={open ? "M3.5 10 8 5.5 12.5 10" : "M3.5 6 8 10.5 12.5 6"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MenuLeadingIcon({ children }: { children: ReactNode }) {
  return <span className={styles.leadingIcon}>{children}</span>;
}

export function MenuPlaceholder({
  children,
}: {
  children: ReactNode;
}) {
  return <span className={styles.placeholder}>{children}</span>;
}
