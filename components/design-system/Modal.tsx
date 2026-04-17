"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { typographyStyles } from "@/app/design-system/typography";
import { assetPath } from "@/lib/assetPath";
import { Button, type ButtonVariant } from "./Button";
import styles from "./Modal.module.css";

type ModalTone = "none" | "info" | "confirmation" | "warning" | "fail";

const toneConfig: Record<
  Exclude<ModalTone, "none">,
  { badgeBackground: string; badgeForeground: string; icon: string }
> = {
  info: {
    badgeBackground: "var(--brand-200)",
    badgeForeground: "var(--brand-600)",
    icon: "/icons/lucide/info.svg",
  },
  confirmation: {
    badgeBackground: "var(--status-success-soft)",
    badgeForeground: "var(--status-success-strong)",
    icon: "/icons/lucide/check.svg",
  },
  warning: {
    badgeBackground: "var(--status-warning-soft)",
    badgeForeground: "var(--status-warning-strong)",
    icon: "/icons/lucide/alert.svg",
  },
  fail: {
    badgeBackground: "var(--status-destructive-soft)",
    badgeForeground: "var(--status-destructive-strong)",
    icon: "/icons/lucide/alert.svg",
  },
};

export interface ModalProps {
  isOpen: boolean;
  title: ReactNode;
  description: ReactNode;
  dismissLabel: ReactNode;
  confirmLabel: ReactNode;
  onDismiss: () => void;
  onConfirm: () => void;
  onClose?: () => void;
  confirmVariant?: Extract<ButtonVariant, "primary" | "secondary" | "destructive" | "ghost" | "ghostV2">;
  tone?: ModalTone;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  confirmDisabled?: boolean;
  dismissDisabled?: boolean;
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  title,
  description,
  dismissLabel,
  confirmLabel,
  onDismiss,
  onConfirm,
  onClose,
  confirmVariant = "primary",
  tone = "none",
  closeOnBackdropClick = false,
  closeOnEscape = false,
  confirmDisabled = false,
  dismissDisabled = false,
  showCloseButton = false,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !closeOnEscape) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        (onClose ?? onDismiss)();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeOnEscape, isOpen, onClose, onDismiss]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!mounted || !isOpen) {
    return null;
  }

  const handleClose = onClose ?? onDismiss;
  const toneStyles = tone === "none" ? null : toneConfig[tone];

  return createPortal(
    <div
      className={styles.overlay}
      onClick={() => {
        if (closeOnBackdropClick) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={styles.card}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.body}>
          {toneStyles ? (
            <div
              className={styles.badge}
              aria-hidden="true"
              style={{
                background: toneStyles.badgeBackground,
                color: toneStyles.badgeForeground,
              }}
            >
              <span
                className={styles.badgeIcon}
                style={{
                  WebkitMaskImage: `url(${assetPath(toneStyles.icon)})`,
                  maskImage: `url(${assetPath(toneStyles.icon)})`,
                }}
              />
            </div>
          ) : null}

          <div className={styles.content}>
            <div className={styles.header}>
              <div className={styles.titleWrap}>
                <div id={titleId} className={styles.title} style={typographyStyles.h4}>
                  {title}
                </div>
              </div>
              {showCloseButton ? (
                <Button
                  type="button"
                  variant="ghostV2"
                  size="sm"
                  className={styles.closeButton}
                  aria-label="Close modal"
                  onClick={handleClose}
                >
                  <img src="/icons/lucide/x.svg" alt="" aria-hidden="true" width="12" height="12" />
                </Button>
              ) : null}
            </div>

            <div id={descriptionId} className={styles.description} style={typographyStyles.p2}>
              {description}
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={onDismiss}
            disabled={dismissDisabled}
          >
            {dismissLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
      document.body
    );
}

export type { ModalTone };
