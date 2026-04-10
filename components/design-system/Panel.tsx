"use client";

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import styles from "./Panel.module.css";

export interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}

export function Panel({
  children,
  className,
  description,
  style,
  title,
  ...props
}: PanelProps) {
  return (
    <section
      {...props}
      className={[styles.panel, className].filter(Boolean).join(" ")}
      style={style}
    >
      {title || description ? (
        <header className={styles.header}>
          {title ? (
            <h2 className={styles.title} style={typographyStyles.h4}>
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className={styles.description} style={typographyStyles.p2}>
              {description}
            </p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export const panelMutedTextStyle = {
  ...typographyStyles.p2,
  color: "var(--text-secondary)",
} satisfies CSSProperties;
