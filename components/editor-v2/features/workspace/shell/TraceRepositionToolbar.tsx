"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TraceDocument } from "@/lib/editor-v2/editor/store";
import {
  MenuChevronIcon,
  Toolbar,
  ToolbarAnchor,
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup,
  ToolbarIcon,
  ToolbarLabel,
  ToolbarPopover,
} from "@/components/design-system";
import type { EditorStore } from "@/lib/editor-v2/editor/store";
import {
  createSetActiveSidebarSectionCommand,
  createSetSidebarCollapsedCommand,
} from "../workspaceCommands";
import {
  getToolbarPopoverHorizontalPosition,
  TOOLBAR_POPOVER_VIEWPORT_PADDING,
} from "./toolbarPopoverPosition";
import styles from "./EditorV2Shell.module.css";

export type TraceCropAspectRatioId =
  | "freehand"
  | "original"
  | "1:1"
  | "2:3"
  | "3:2"
  | "3:4"
  | "4:3"
  | "4:5"
  | "5:4"
  | "9:16"
  | "16:9";

export const TRACE_CROP_ASPECT_RATIO_OPTIONS: Array<{
  id: TraceCropAspectRatioId;
  label: string;
}> = [
  { id: "freehand", label: "Free-form" },
  { id: "original", label: "Original" },
  { id: "1:1", label: "1:1" },
  { id: "2:3", label: "2:3" },
  { id: "3:2", label: "3:2" },
  { id: "3:4", label: "3:4" },
  { id: "4:3", label: "4:3" },
  { id: "4:5", label: "4:5" },
  { id: "5:4", label: "5:4" },
  { id: "9:16", label: "9:16" },
  { id: "16:9", label: "16:9" },
];

function getAspectRatioValue(
  optionId: TraceCropAspectRatioId,
  trace: TraceDocument,
): number | null {
  if (optionId === "freehand") {
    return null;
  }

  if (optionId === "original") {
    const width = trace.imageWidth ?? 0;
    const height = trace.imageHeight ?? 0;
    return width > 0 && height > 0 ? width / height : 1;
  }

  const [widthText, heightText] = optionId.split(":");
  const width = Number(widthText);
  const height = Number(heightText);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return 1;
  }

  return width / height;
}

function getAspectRatioGlyphDimensions(aspectRatio: number | null): { width: number; height: number } {
  const maxSize = 14;
  const minSize = 6;

  if (!aspectRatio || !(aspectRatio > 0)) {
    return { width: 11, height: 11 };
  }

  if (aspectRatio >= 1) {
    return {
      width: maxSize,
      height: Math.max(minSize, Math.round(maxSize / aspectRatio)),
    };
  }

  return {
    width: Math.max(minSize, Math.round(maxSize * aspectRatio)),
    height: maxSize,
  };
}

function AspectRatioGlyph({
  optionId,
  trace,
}: {
  optionId: TraceCropAspectRatioId;
  trace: TraceDocument;
}) {
  if (optionId === "freehand") {
    return <ToolbarIcon icon="/icons/lucide/free.svg" />;
  }

  if (optionId === "original") {
    return <ToolbarIcon icon="/icons/lucide/image.svg" />;
  }

  const aspectRatio = getAspectRatioValue(optionId, trace);
  const dimensions = getAspectRatioGlyphDimensions(aspectRatio);

  return (
    <span aria-hidden="true" className={styles.aspectRatioGlyph}>
      <span
        className={styles.aspectRatioGlyphFrame}
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
      />
    </span>
  );
}

interface TraceRepositionToolbarProps {
  cropEditing?: boolean;
  cropAspectRatioId?: TraceCropAspectRatioId;
  dispatch: EditorStore["dispatch"];
  onBeginCrop?: () => void;
  onCancelCrop?: () => void;
  onCommitCrop?: () => void;
  onCropAspectRatioChange?: (value: TraceCropAspectRatioId) => void;
  onCancel: () => void;
  onCommit: () => void;
  trace: TraceDocument;
}

function TraceToolbarPortalPopover({
  align = "start",
  anchorRef,
  children,
  onRequestClose,
  ...props
}: React.ComponentProps<typeof ToolbarPopover> & {
  align?: "start" | "center";
  anchorRef: React.RefObject<HTMLDivElement | null>;
  onRequestClose?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number | "auto";
    right: number | "auto";
    transform: string;
  } | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    function updatePosition() {
      const anchor = anchorRef.current;

      if (!anchor) {
        setPosition(null);
        return;
      }

      const rect = anchor.getBoundingClientRect();
      const popoverWidth = popoverRef.current?.offsetWidth ?? 0;
      const horizontalPosition = getToolbarPopoverHorizontalPosition({
        align,
        anchorRect: rect,
        popoverWidth,
      });

      setPosition({
        top: rect.bottom + 8,
        left: horizontalPosition.left,
        right: horizontalPosition.right,
        transform: horizontalPosition.transform,
      });
    }

    updatePosition();

    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [align, anchorRef, mounted]);

  useEffect(() => {
    if (!mounted || !onRequestClose) {
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

      onRequestClose?.();
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [anchorRef, mounted, onRequestClose]);

  if (!mounted || !position) {
    return null;
  }

  return createPortal(
    <ToolbarPopover
      {...props}
      ref={popoverRef}
      style={{
        ...props.style,
        position: "fixed",
        top: position.top,
        left: position.left,
        right: position.right,
        zIndex: "var(--z-editor-popover)",
        transform: position.transform,
        maxWidth: `calc(100vw - ${TOOLBAR_POPOVER_VIEWPORT_PADDING * 2}px)`,
        minWidth: "168px",
        maxHeight: "240px",
        overflowY: "auto",
      }}
    >
      {children}
    </ToolbarPopover>,
    document.body,
  );
}

export function TraceRepositionToolbar({
  cropEditing = false,
  cropAspectRatioId,
  dispatch,
  onBeginCrop,
  onCancelCrop,
  onCommitCrop,
  onCropAspectRatioChange,
  onCancel,
  onCommit,
  trace,
}: TraceRepositionToolbarProps) {
  const [cropAspectRatioMenuOpen, setCropAspectRatioMenuOpen] = useState(false);
  const cropToolbarAnchorRef = useRef<HTMLDivElement | null>(null);
  const cropAspectRatioAnchorRef = useRef<HTMLDivElement | null>(null);
  const activeCropAspectRatio =
    TRACE_CROP_ASPECT_RATIO_OPTIONS.find((option) => option.id === cropAspectRatioId) ??
    TRACE_CROP_ASPECT_RATIO_OPTIONS[0];

  useEffect(() => {
    if (!cropEditing) {
      setCropAspectRatioMenuOpen(false);
    }
  }, [cropEditing]);

  return (
    <div className={styles.selectionToolbarCluster}>
      <div className={styles.selectionToolbarCloseViewport}>
        <Toolbar className={[styles.floatingToolbar, styles.selectionToolbarCloseBar].join(" ")}>
          <ToolbarButton
            type="button"
            variant="ghost"
            iconOnly
            className={styles.selectionToolbarCloseButton}
            onClick={onCancel}
          >
            <ToolbarIcon icon="/icons/lucide/x.svg" />
          </ToolbarButton>
        </Toolbar>
      </div>

      <div className={styles.selectionToolbarMainViewport}>
        <Toolbar className={styles.floatingToolbar}>
          <ToolbarGroup>
            <ToolbarButton
              type="button"
              labelled
              onClick={() => {
                dispatch(createSetActiveSidebarSectionCommand("trace"));
                dispatch(createSetSidebarCollapsedCommand(false));
              }}
            >
              <ToolbarIcon icon="/icons/lucide/sliders-horizontal.svg" />
              <ToolbarLabel>Settings</ToolbarLabel>
            </ToolbarButton>
            {onBeginCrop ? (
              <>
                <ToolbarDivider />
                <ToolbarAnchor ref={cropToolbarAnchorRef}>
                  <ToolbarButton
                    type="button"
                    iconOnly
                    popoverTrigger
                    active={cropEditing}
                    onClick={() => {
                      if (cropEditing) {
                        setCropAspectRatioMenuOpen(false);
                        onCancelCrop?.();
                        return;
                      }

                      onBeginCrop();
                    }}
                  >
                    <ToolbarIcon icon="/icons/lucide/crop.svg" />
                    {/* <ToolbarLabel>Crop</ToolbarLabel> */}
                  </ToolbarButton>
                </ToolbarAnchor>
              </>
            ) : null}
          {/* <ToolbarDivider /> */}
          </ToolbarGroup>
            {/* <ToolbarButton
              type="button"
              variant="secondary"
              textOnly
              // className={styles.selectionToolbarCloseButton}
              onClick={onCancel}
            >
            Cancel
            </ToolbarButton>

            <ToolbarButton
              type="button"
              variant="primary"
              textOnly
              // className={styles.selectionToolbarCloseButton}
              onClick={onCommit}
            >
            Done
            </ToolbarButton> */}
        </Toolbar>
      </div>

      <div className={styles.selectionToolbarCloseViewport}>
        <Toolbar className={[styles.floatingToolbar, styles.selectionToolbarCloseBar].join(" ")}>
          <ToolbarButton
            type="button"
            variant="ghost"
            iconOnly
            className={styles.selectionToolbarCloseButton}
            onClick={onCommit}
          >
            <ToolbarIcon icon="/icons/lucide/check.svg" />
          </ToolbarButton>
        </Toolbar>
      </div>

      {cropEditing && cropAspectRatioId && onCropAspectRatioChange ? (
        <TraceToolbarPortalPopover
          align="center"
          anchorRef={cropToolbarAnchorRef}
          subtoolbar
          role="dialog"
          aria-label="Crop tools"
        >
          <ToolbarGroup>

            <ToolbarAnchor ref={cropAspectRatioAnchorRef}>
              <ToolbarButton
                type="button"
                labelled
                active={cropAspectRatioMenuOpen}
                aria-expanded={cropAspectRatioMenuOpen}
                aria-haspopup="menu"
                onClick={() => setCropAspectRatioMenuOpen((open) => !open)}
                className={styles.selectionShapeTrigger}
              >
                <AspectRatioGlyph optionId={activeCropAspectRatio.id} trace={trace} />
                <ToolbarLabel>{activeCropAspectRatio.label}</ToolbarLabel>
                <MenuChevronIcon open={cropAspectRatioMenuOpen} />
              </ToolbarButton>

              {cropAspectRatioMenuOpen ? (
                <TraceToolbarPortalPopover
                  anchorRef={cropAspectRatioAnchorRef}
                  onRequestClose={() => setCropAspectRatioMenuOpen(false)}
                  role="menu"
                  aria-label="Crop aspect ratio"
                  className={styles.selectionShapeMenu}
                >
                  {TRACE_CROP_ASPECT_RATIO_OPTIONS.map((option) => (
                    <ToolbarButton
                      key={option.id}
                      type="button"
                      labelled
                      role="menuitemradio"
                      active={cropAspectRatioId === option.id}
                      aria-checked={cropAspectRatioId === option.id}
                      onClick={() => {
                        onCropAspectRatioChange(option.id);
                        setCropAspectRatioMenuOpen(false);
                      }}
                      className={styles.selectionShapeMenuItem}
                    >
                      <AspectRatioGlyph optionId={option.id} trace={trace} />
                      <ToolbarLabel>{option.label}</ToolbarLabel>
                    </ToolbarButton>
                  ))}
                </TraceToolbarPortalPopover>
              ) : null}
            </ToolbarAnchor>

            <ToolbarDivider />
            <ToolbarButton
              type="button"
              variant="secondary"
              textOnly
              // className={styles.selectionToolbarCloseButton}
              onClick={() => {
                setCropAspectRatioMenuOpen(false);
                onCancelCrop?.();
              }}
            >
              Cancel
              {/* <ToolbarIcon icon="/icons/lucide/x.svg" /> */}
            </ToolbarButton>

            <ToolbarButton
              type="button"
              variant="primary"
              textOnly
              // className={styles.selectionToolbarCloseButton}
              onClick={() => {
                setCropAspectRatioMenuOpen(false);
                onCommitCrop?.();
              }}
            >
              {/* <ToolbarIcon icon="/icons/lucide/check.svg" /> */}
              Apply crop
            </ToolbarButton>
          </ToolbarGroup>
        </TraceToolbarPortalPopover>
      ) : null}
    </div>
  );
}
