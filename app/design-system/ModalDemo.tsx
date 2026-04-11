"use client";

import { useState } from "react";
import { assetPath } from "../../lib/assetPath";

type ModalDemoProps = {
  variant?: "default" | "destructive";
};

export function ModalDemo({ variant = "default" }: ModalDemoProps) {
  const [open, setOpen] = useState(true);
  const destructive = variant === "destructive";

  const title = destructive ? "Delete chart?" : "Save changes?";
  const description = destructive
    ? "This will permanently remove the current chart and its stitch data. This action cannot be undone."
    : "Your chart edits are ready to save. You can keep working, save a draft, or close without saving.";
  const primaryLabel = destructive ? "Delete" : "Save";
  const secondaryLabel = destructive ? "No, keep it" : "Cancel";
  const triggerLabel = destructive ? "Open destructive modal" : "Open modal";

  return (
    <div className="ds-modal-demo">
      <button type="button" className="ds-btn ds-btn-secondary ds-btn-sm" onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>

      <div className="ds-modal-stage" aria-hidden={open ? undefined : "true"}>
        {open ? (
          <div className="ds-modal-scrim">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="ds-modal-title"
              aria-describedby="ds-modal-description"
              className="ds-modal-card"
            >
              {destructive ? (
                <div className="ds-modal-alert-badge" aria-hidden="true">
                  <span
                    className="ds-modal-alert-icon"
                    style={{
                      WebkitMaskImage: `url(${assetPath("icons/alert.svg")})`,
                      maskImage: `url(${assetPath("icons/alert.svg")})`,
                    }}
                  />
                </div>
              ) : null}
              <div className="ds-modal-header">
                <div id="ds-modal-title" className="ds-h4 ds-modal-title">{title}</div>
                <button
                  type="button"
                  className="ds-btn ds-btn-ghost ds-btn-sm ds-modal-close"
                  aria-label="Close modal"
                  onClick={() => setOpen(false)}
                >
                  <svg aria-hidden="true" viewBox="0 0 16 16" width="12" height="12">
                    <path
                      d="M4 4L12 12M12 4L4 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
              <div id="ds-modal-description" className="ds-p2 ds-text-faint ds-modal-description">
                {description}
              </div>
              <div className="ds-modal-actions">
                <button type="button" className="ds-btn ds-btn-tertiaryold ds-btn-md" onClick={() => setOpen(false)}>
                  {secondaryLabel}
                </button>
                <button type="button" className={`ds-btn ${destructive ? "ds-btn-destructive" : "ds-btn-primary"} ds-btn-md`}>
                  {destructive ? "Yes, delete" : primaryLabel}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
