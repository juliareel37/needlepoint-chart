"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ColorLibrary } from "@/components/editor-v2/features/colors";
import {
  Button,
  Toolbar,
  ToolbarAnchor,
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup,
  ToolbarSwatch,
  ToolbarPopover,
} from "@/components/design-system";
import { convertIconPlacementToCells } from "@/lib/editor-v2/editor/icons/convertIconPlacementToCells";
import type {
  EditorStore,
  IconPlacementSession,
  PaletteColor,
} from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics } from "@/lib/editor-v2/editor/viewport";
import {
  createCancelIconPlacementCommand,
  createPaintCellsCommand,
  createSetActiveColorCommand,
} from "../workspaceCommands";
import styles from "./EditorV2Shell.module.css";

function IconToolbarPortalPopover({
  anchorRef,
  children,
  onRequestClose,
  ...props
}: React.ComponentProps<typeof ToolbarPopover> & {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  onRequestClose?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
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
      setPosition({
        top: rect.bottom + 8,
        left: rect.left - 12,
      });
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, mounted]);

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
        zIndex: 40,
        transform: "none",
      }}
    >
      {children}
    </ToolbarPopover>,
    document.body,
  );
}

interface IconPlacementToolbarProps {
  activeColorHex: string | null;
  activeColorId: string | null;
  dispatch: EditorStore["dispatch"];
  gridMetrics: GridWorldMetrics;
  palette: PaletteColor[];
  placement: IconPlacementSession;
}

export function IconPlacementToolbar({
  activeColorHex,
  activeColorId,
  dispatch,
  gridMetrics,
  palette,
  placement,
}: IconPlacementToolbarProps) {
  const [colorLibraryOpen, setColorLibraryOpen] = useState(false);
  const colorAnchorRef = useRef<HTMLDivElement | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const canConvert = Boolean(activeColorId) && !isConverting;

  async function handleConvert() {
    if (!activeColorId || isConverting) {
      return;
    }

    setIsConverting(true);
    try {
      const cells = await convertIconPlacementToCells(placement, gridMetrics);
      if (cells.length === 0) {
        return;
      }

      dispatch(createPaintCellsCommand(activeColorId, cells));
      dispatch(createCancelIconPlacementCommand());
    } finally {
      setIsConverting(false);
    }
  }

  return (
    <Toolbar className={styles.floatingToolbar}>
      <ToolbarGroup>
        <ToolbarAnchor ref={colorAnchorRef}>
          <ToolbarButton
            type="button"
            swatch
            active={colorLibraryOpen}
            aria-pressed={colorLibraryOpen}
            aria-label="Open color library"
            title="Open color library"
            className={styles.libraryPopoverSwatchTrigger}
            onClick={() => setColorLibraryOpen((current) => !current)}
          >
            <ToolbarSwatch
              color={activeColorHex ?? "var(--neutral-400)"}
              className={styles.libraryPopoverSwatch}
            />
          </ToolbarButton>

          {colorLibraryOpen ? (
            <IconToolbarPortalPopover
              anchorRef={colorAnchorRef}
              onRequestClose={() => setColorLibraryOpen(false)}
              role="dialog"
              aria-label="Color library"
              className={styles.colorLibraryPopover}
              style={{ whiteSpace: "normal" }}
            >
              <ColorLibrary
                activeColorId={activeColorId}
                className={styles.toolbarColorLibrary}
                colors={palette}
                onColorSelect={(colorId) => {
                  dispatch(createSetActiveColorCommand(colorId));
                  setColorLibraryOpen(false);
                }}
              />
            </IconToolbarPortalPopover>
          ) : null}
        </ToolbarAnchor>
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => dispatch(createCancelIconPlacementCommand())}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={!canConvert}
          onClick={() => {
            void handleConvert();
          }}
        >
          {isConverting ? "Converting..." : "Convert to stitches"}
        </Button>
      </ToolbarGroup>
    </Toolbar>
  );
}
