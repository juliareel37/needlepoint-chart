"use client";

import type { ButtonHTMLAttributes } from "react";
import { assetPath } from "@/lib/assetPath";
import { typographySpecs, typographyStyles } from "@/app/design-system/typography";
import styles from "./VerticalTabGroup.module.css";

export interface VerticalTabItem {
  id: string;
  icon: string;
  label: string;
}

interface VerticalTabGroupProps {
  activeId: string;
  ariaLabel: string;
  className?: string;
  iconOnly?: boolean;
  items: VerticalTabItem[];
  onChange: (id: string) => void;
}

export function VerticalTabGroup({
  activeId,
  ariaLabel,
  className,
  iconOnly = false,
  items,
  onChange,
}: VerticalTabGroupProps) {
  return (
    <div className={[styles.group, className].filter(Boolean).join(" ")} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const selected = item.id === activeId;

        return (
          <VerticalTabGroupItem
            key={item.id}
            active={selected}
            icon={item.icon}
            iconOnly={iconOnly}
            label={item.label}
            onClick={() => onChange(item.id)}
          />
        );
      })}
    </div>
  );
}

function VerticalTabGroupItem({
  active,
  icon,
  iconOnly = false,
  label,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  icon: string;
  iconOnly?: boolean;
  label: string;
}) {
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      role="tab"
      aria-label={label}
      aria-selected={active}
      className={styles.item}
      data-active={active ? "true" : undefined}
      style={{
        ...typographyStyles.p2,
        fontWeight: typographySpecs.p2.weight,
      }}
      >
      <span
        className={styles.icon}
        aria-hidden="true"
        style={{
          WebkitMaskImage: `url(${assetPath(icon)})`,
          maskImage: `url(${assetPath(icon)})`,
        }}
      />
      {!iconOnly ? <span className={styles.label}>{label}</span> : null}
    </button>
  );
}
