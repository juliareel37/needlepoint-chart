"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { typographyStyles } from "@/app/design-system/typography";
import { Button, ButtonIcon } from "@/components/design-system";
import { AuthAccountSettingsPanel } from "./AuthAccountSettingsPanel";
import styles from "./AuthPage.module.css";

export function AuthAccountSettingsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const modalShellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const activeElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    activeElement?.blur();

    const frameId = window.requestAnimationFrame(() => {
      const modalShell = modalShellRef.current;

      if (!modalShell) {
        return;
      }

      const firstFocusable = modalShell.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]), button:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      (firstFocusable ?? modalShell).focus();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const overlay = overlayRef.current;

    if (!overlay) {
      return;
    }

    const siblings = Array.from(document.body.children).filter(
      (element): element is HTMLElement => element instanceof HTMLElement && element !== overlay,
    );
    const previousStates = siblings.map((element) => ({
      element,
      ariaHidden: element.getAttribute("aria-hidden"),
      inert: element.inert,
    }));

    previousStates.forEach(({ element }) => {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    });

    return () => {
      previousStates.forEach(({ element, ariaHidden, inert }) => {
        element.inert = inert;
        if (ariaHidden === null) {
          element.removeAttribute("aria-hidden");
        } else {
          element.setAttribute("aria-hidden", ariaHidden);
        }
      });
    };
  }, [isOpen]);

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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) {
    return null;
  }

  return createPortal(
    <div ref={overlayRef} className={styles.modalOverlay} onClick={onClose}>
      <div
        ref={modalShellRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={styles.modalShell}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalCard}>
          <div className={styles.modalHeader}>
            <div className={styles.modalTitleBlock}>
              {/* <span className={styles.eyebrow} style={typographyStyles.s}>
                Account
              </span> */}
              <h2 id={titleId} className={styles.title} style={typographyStyles.h3}>
                Account settings
              </h2>
            </div>
            <Button
              type="button"
              variant="ghostV2"
              size="sm"
              iconOnly
              className={styles.modalCloseButton}
              onClick={onClose}
              aria-label="Close account settings"
            >
              <ButtonIcon icon="/icons/lucide/x.svg" />
            </Button>
          </div>

          <div className={styles.modalBody}>
            <AuthAccountSettingsPanel onAfterSignOut={onClose} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
