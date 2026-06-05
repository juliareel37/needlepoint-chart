"use client";

import type { ReactNode } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import { assetPath } from "@/lib/assetPath";
import { Button, ButtonIcon, type ButtonVariant } from "./Button";
import styles from "./Notification.module.css";

export type NotificationTone = "info" | "success" | "warning" | "destructive";
export type NotificationLayout = "default" | "compact";

const toneConfig: Record<
  NotificationTone,
  { icon: string; badge: string; badgeForeground: string }
> = {
  info: {
    icon: "/icons/lucide/info.svg",
    badge: "var(--brand-200)",
    badgeForeground: "var(--brand-600)",
  },
  success: {
    icon: "/icons/lucide/check.svg",
    badge: "var(--status-success-base)",
    badgeForeground: "var(--neutral-0)",
  },
  warning: {
    icon: "/icons/lucide/alert.svg",
    badge: "var(--status-warning-base)",
    badgeForeground: "var(--neutral-900)",
  },
  destructive: {
    icon: "/icons/lucide/alert.svg",
    badge: "var(--status-destructive-base)",
    badgeForeground: "var(--neutral-0)",
  },
};

export interface NotificationProps {
  tone: NotificationTone;
  title: ReactNode;
  description?: ReactNode;
  layout?: NotificationLayout;
  actionLabel?: ReactNode;
  actionVariant?: ButtonVariant;
  onAction?: () => void;
  onDismiss?: () => void;
  dismissLabel?: string;
  neutralSurface?: boolean;
}

export function Notification({
  tone,
  title,
  description,
  layout = "default",
  actionLabel,
  actionVariant = "secondary",
  onAction,
  onDismiss,
  dismissLabel,
  neutralSurface = false,
}: NotificationProps) {
  const toneStyles = toneConfig[tone];
  const hasAction = Boolean(actionLabel);

  return (
    <div
      className={[styles.card, layout === "compact" ? styles.compact : null]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className={styles.iconBadge}
        aria-hidden="true"
        style={{ background: toneStyles.badge, color: toneStyles.badgeForeground }}
      >
        <span
          className={styles.icon}
          style={{
            WebkitMaskImage: `url(${assetPath(toneStyles.icon)})`,
            maskImage: `url(${assetPath(toneStyles.icon)})`,
          }}
        />
      </span>

      <div className={styles.content}>
        <div className={styles.title} style={typographyStyles.h5}>
          {title}
        </div>
        {description ? (
          <div className={styles.description} style={typographyStyles.p2}>
            {description}
          </div>
        ) : null}
      </div>

      {hasAction ? (
        <div className={styles.controls}>
          <Button type="button" variant={actionVariant} size="md" onClick={onAction}>
            {actionLabel}
          </Button>
          {onDismiss ? (
            <DismissButton
              label={dismissLabel ?? `Dismiss ${titleText(title)}`}
              onClick={onDismiss}
            />
          ) : null}
        </div>
      ) : onDismiss ? (
        <DismissButton
          className={!neutralSurface ? styles.closeGhost : undefined}
          label={dismissLabel ?? `Dismiss ${titleText(title)}`}
          onClick={onDismiss}
        />
      ) : null}
    </div>
  );
}

function DismissButton({
  className,
  label,
  onClick,
}: {
  className?: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghostV2"
      size="sm"
      iconOnly
      aria-label={label}
      className={[styles.closeButton, className].filter(Boolean).join(" ")}
      onClick={onClick}
    >
      <ButtonIcon icon="/icons/lucide/x.svg" />
    </Button>
  );
}

function titleText(title: ReactNode) {
  return typeof title === "string" ? title : "notification";
}
