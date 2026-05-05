"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { typographyStyles } from "@/app/design-system/typography";
import {
  MenuChevronIcon,
  Toolbar,
  ToolbarAnchor,
  ToolbarButton,
  ToolbarIcon,
  ToolbarLabel,
  ToolbarPopover,
} from "@/components/design-system";
import type { EditorStore } from "@/lib/editor-v2/editor/store";
import {
  getToolbarPopoverMeasuredWidth,
  getToolbarPopoverHorizontalPosition,
  TOOLBAR_POPOVER_VIEWPORT_PADDING,
} from "./toolbarPopoverPosition";
import { CanvasAidsControls } from "./CanvasAidsControls";
import styles from "./EditorV2Shell.module.css";

interface CanvasAidsFloatingToolbarProps {
  dispatch: EditorStore["dispatch"];
  showGridlines: boolean;
  showRuler: boolean;
  showSymbols: boolean;
}

export function CanvasAidsFloatingToolbar({
  dispatch,
  showGridlines,
  showRuler,
  showSymbols,
}: CanvasAidsFloatingToolbarProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number | "auto";
    right: number | "auto";
    transform: string;
  } | null>(null);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;

    if (!anchor) {
      setPosition(null);
      return;
    }

    const rect = anchor.getBoundingClientRect();
    const popoverWidth = getToolbarPopoverMeasuredWidth(popoverRef.current);
    const popoverHeight = popoverRef.current?.getBoundingClientRect().height ?? 0;
    const horizontalPosition = getToolbarPopoverHorizontalPosition({
      align: "end",
      anchorRect: rect,
      popoverWidth,
    });
    const transform =
      horizontalPosition.transform === "none"
        ? "none"
        : horizontalPosition.transform;

    setPosition({
      top: Math.max(TOOLBAR_POPOVER_VIEWPORT_PADDING, rect.top - 8),
      left: horizontalPosition.left,
      right: horizontalPosition.right,
      transform,
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!mounted || !open) {
      return;
    }

    updatePosition();
  }, [mounted, open, updatePosition]);

  useEffect(() => {
    if (!mounted || !open || typeof ResizeObserver === "undefined") {
      return;
    }

    const popover = popoverRef.current;

    if (!popover) {
      return;
    }

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(updatePosition);
    });

    observer.observe(popover);

    return () => observer.disconnect();
  }, [mounted, open, updatePosition]);

  useEffect(() => {
    if (!mounted || !open) {
      return;
    }

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [mounted, open, updatePosition]);

  useEffect(() => {
    if (!mounted || !open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (popoverRef.current?.contains(target) || anchorRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [mounted, open]);

  return (
    <>
      <Toolbar className={styles.canvasAidsToolbar}>
        <ToolbarAnchor ref={anchorRef}>
          <ToolbarButton
            type="button"
            variant="ghostNeutral"
            iconOnly
            popoverTrigger
            active={open}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-label="Canvas aids settings"
            title="Canvas aids settings"
            onClick={() => setOpen((current) => !current)}
          >
            <ToolbarIcon icon="/icons/lucide/settings.svg" />
            {/* <ToolbarLabel>Canvas Aids</ToolbarLabel> */}
            {/* <MenuChevronIcon open={open} direction="up" /> */}
          </ToolbarButton>
        </ToolbarAnchor>
      </Toolbar>
      {mounted && open
        ? createPortal(
            <ToolbarPopover
              ref={popoverRef}
              className={styles.canvasAidsPopover}
              style={{
                position: "fixed",
                top: position?.top ?? 0,
                left: position?.left ?? 0,
                right: position?.right ?? "auto",
                zIndex: "var(--z-editor-popover)",
                padding: "12px 16px",
                transform:
                  !position || position.transform === "none"
                    ? "translateY(-100%)"
                    : `translateY(-100%) ${position.transform}`,
                minWidth: "260px",
                maxWidth: `calc(100vw - ${TOOLBAR_POPOVER_VIEWPORT_PADDING * 2}px)`,
                visibility: position ? "visible" : "hidden",
              }}
            >
              <div className={styles.canvasAidsPopoverCard}>
                {/* <p className={styles.canvasAidsPopoverTitle} style={typographyStyles.p2}>
                  Canvas Aids
                </p> */}
                <CanvasAidsControls
                  dispatch={dispatch}
                  showGridlines={showGridlines}
                  showRuler={showRuler}
                  showSymbols={showSymbols}
                />
              </div>
            </ToolbarPopover>,
            document.body,
          )
        : null}
    </>
  );
}
