"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { assetPath } from "@/lib/assetPath";
import { typographySpecs, typographyStyles } from "@/app/design-system/typography";
import styles from "./Toolbar.module.css";

export function Toolbar({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      {...props}
      className={[styles.toolbar, className].filter(Boolean).join(" ")}
      style={{ ...typographyStyles.p2, ...props.style }}
    >
      {children}
    </div>
  );
}

export function ToolbarGroup({
  children,
  className,
  actions = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  actions?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      {...props}
      className={[
        styles.group,
        actions ? styles.groupActions : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

export function ToolbarMeta({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      {...props}
      className={[styles.meta, className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}

export function ToolbarDivider({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      aria-hidden={props["aria-hidden"] ?? "true"}
      className={[styles.divider, className].filter(Boolean).join(" ")}
    />
  );
}

export function ToolbarButton({
  active = false,
  children,
  className,
  iconOnly = false,
  inertWhenActive = false,
  labelled = false,
  onClick,
  primary = false,
  style,
  swatch = false,
  variant,
  wide = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  children: ReactNode;
  iconOnly?: boolean;
  inertWhenActive?: boolean;
  labelled?: boolean;
  primary?: boolean;
  swatch?: boolean;
  variant?:
    | "toolbar"
    | "ghost"
    | "ghostNeutral"
    | "secondary"
    | "primary"
    | "destructive";
  wide?: boolean;
}) {
  const isInertActive = active && inertWhenActive;
  const resolvedVariant = variant ?? (primary ? "primary" : "toolbar");

  return (
    <button
      {...props}
      className={[
        styles.button,
        styles[`buttonVariant${resolvedVariant[0].toUpperCase()}${resolvedVariant.slice(1)}`],
        iconOnly ? styles.buttonIconOnly : null,
        labelled ? styles.buttonLabelled : null,
        swatch ? styles.buttonSwatch : null,
        wide ? styles.buttonWide : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
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
        fontWeight: typographySpecs.p2.weight,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export const ToolbarAnchor = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { children: ReactNode }
>(function ToolbarAnchor({ children, className, ...props }, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={[styles.anchor, className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
});

export const ToolbarPopover = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & {
    children: ReactNode;
    subtoolbar?: boolean;
  }
>(function ToolbarPopover({
  children,
  className,
  subtoolbar = false,
  style,
  ...props
}, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={[
        styles.popover,
        subtoolbar ? styles.popoverSubtoolbar : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ ...typographyStyles.p2, ...style }}
    >
      {children}
    </div>
  );
});

export function ToolbarSubtoolGroup({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      {...props}
      className={[styles.subtoolGroup, className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}

export function ToolbarIcon({
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

export function ToolbarLabel({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { children: ReactNode }) {
  return (
    <span
      {...props}
      className={[styles.label, className].filter(Boolean).join(" ")}
    >
      {children}
    </span>
  );
}

export function ToolbarSwatch({
  color,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { color: string }) {
  const isTransparent =
    color.trim().toLowerCase() === "transparent" || color.trim().toLowerCase() === "none";

  return (
    <span
      {...props}
      aria-hidden={props["aria-hidden"] ?? "true"}
      className={[styles.swatch, className].filter(Boolean).join(" ")}
      style={{
        ...props.style,
        background: isTransparent
          ? "linear-gradient(45deg, rgba(15, 23, 42, 0.1) 25%, transparent 25%, transparent 75%, rgba(15, 23, 42, 0.1) 75%), linear-gradient(45deg, rgba(15, 23, 42, 0.1) 25%, transparent 25%, transparent 75%, rgba(15, 23, 42, 0.1) 75%), #ffffff"
          : color,
        backgroundPosition: isTransparent ? "0 0, 4px 4px, 0 0" : props.style?.backgroundPosition,
        backgroundSize: isTransparent ? "8px 8px, 8px 8px, auto" : props.style?.backgroundSize,
      }}
    />
  );
}
