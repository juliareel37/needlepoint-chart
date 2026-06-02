"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { typographyStyles } from "@/app/design-system/typography";
import { assetPath } from "@/lib/assetPath";
import { Button, ButtonIcon, type ButtonVariant } from "./Button";
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

const MODAL_TRANSITION_MS = 180;

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
  presentation?: "default" | "centered";
  size?: "default" | "wide";
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
  closeOnEscape = true,
  confirmDisabled = false,
  dismissDisabled = false,
  showCloseButton = false,
  presentation = "default",
  size = "default",
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const openAnimationFrameRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const handleClose = onClose ?? onDismiss;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (openAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(openAnimationFrameRef.current);
      openAnimationFrameRef.current = null;
    }

    if (closeTimeoutRef.current !== null) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (isOpen) {
      setIsVisible(false);
      setShouldRender(true);
      openAnimationFrameRef.current = window.requestAnimationFrame(() => {
        openAnimationFrameRef.current = window.requestAnimationFrame(() => {
          setIsVisible(true);
          openAnimationFrameRef.current = null;
        });
      });
      return;
    }

    setIsVisible(false);
    closeTimeoutRef.current = setTimeout(() => {
      setShouldRender(false);
      closeTimeoutRef.current = null;
    }, MODAL_TRANSITION_MS);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (openAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(openAnimationFrameRef.current);
      }

      if (closeTimeoutRef.current !== null) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!closeOnEscape || dismissDisabled) {
          return;
        }

        event.preventDefault();
        handleClose();
        return;
      }

      if (
        event.key !== "Enter" ||
        event.defaultPrevented ||
        event.isComposing ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        confirmDisabled
      ) {
        return;
      }

      const target =
        event.target instanceof HTMLElement ? event.target : null;
      const tagName = target?.tagName;

      if (tagName === "TEXTAREA" || target?.closest("button, a, [role='button']")) {
        return;
      }

      event.preventDefault();
      onConfirm();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeOnEscape, confirmDisabled, dismissDisabled, handleClose, isOpen, onConfirm]);

  useEffect(() => {
    if (!shouldRender) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [shouldRender]);

  if (!mounted || !shouldRender) {
    return null;
  }

  const toneStyles = tone === "none" ? null : toneConfig[tone];

  return createPortal(
    <div
      className={styles.overlay}
      data-state={isVisible ? "open" : "closed"}
      onClick={() => {
        if (closeOnBackdropClick && isOpen) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={[
          styles.card,
          size === "wide" ? styles.wideCard : null,
          presentation === "centered" ? styles.centeredCard : null,
        ]
          .filter(Boolean)
          .join(" ")}
        data-state={isVisible ? "open" : "closed"}
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
                  iconOnly
                  className={styles.closeButton}
                  aria-label="Close modal"
                  onClick={handleClose}
                >
                  <ButtonIcon icon="/icons/lucide/x.svg" />
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
