"use client";

import { useEffect, useId, useState } from "react";
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

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.modalShell}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalCard}>
          <div className={styles.modalHeader}>
            <div className={styles.modalTitleBlock}>
              <span className={styles.eyebrow} style={typographyStyles.s}>
                Account
              </span>
              <h2 id={titleId} className={styles.title} style={typographyStyles.h3}>
                Account settings
              </h2>
            </div>
            <Button
              type="button"
              variant="ghostV2"
              size="sm"
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
