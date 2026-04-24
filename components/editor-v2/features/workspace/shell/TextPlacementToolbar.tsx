"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ColorLibrary } from "@/components/editor-v2/features/colors";
import {
  SingleSelectDropdown,
  Toolbar,
  ToolbarAnchor,
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup,
  ToolbarIcon,
  ToolbarLabel,
  ToolbarMeta,
  ToolbarPopover,
  ToolbarSwatch,
} from "@/components/design-system";
import { TEXT_FONT_OPTIONS } from "@/lib/editor-v2/editor/text/textFontOptions";
import { measureIntrinsicText } from "@/lib/editor-v2/editor/text/measureIntrinsicText";
import { convertTextPlacementToCells } from "@/lib/editor-v2/editor/text/convertTextPlacementToCells";
import type {
  EditorStore,
  PaletteColor,
  TextPlacementSession,
} from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics } from "@/lib/editor-v2/editor/viewport";
import {
  createCancelTextPlacementCommand,
  createPaintCellsCommand,
  createSetActiveColorCommand,
  createUpdateTextPlacementCommand,
} from "../workspaceCommands";
import {
  getToolbarPopoverHorizontalPosition,
  TOOLBAR_POPOVER_VIEWPORT_PADDING,
} from "./toolbarPopoverPosition";
import styles from "./EditorV2Shell.module.css";

function TextToolbarPortalPopover({
  anchorRef,
  children,
  onRequestClose,
  ...props
}: React.ComponentProps<typeof ToolbarPopover> & {
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
        right: position.right,
        zIndex: 40,
        transform: position.transform,
        maxWidth: `calc(100vw - ${TOOLBAR_POPOVER_VIEWPORT_PADDING * 2}px)`,
      }}
    >
      {children}
    </ToolbarPopover>,
    document.body,
  );
}

interface TextPlacementToolbarProps {
  activeColorHex: string | null;
  activeColorId: string | null;
  dispatch: EditorStore["dispatch"];
  featuredColorIds: string[];
  gridMetrics: GridWorldMetrics;
  palette: PaletteColor[];
  placement: TextPlacementSession;
  showSymbols: boolean;
  symbolAssignments: Record<string, string>;
}

export function TextPlacementToolbar({
  activeColorHex,
  activeColorId,
  dispatch,
  featuredColorIds,
  gridMetrics,
  palette,
  placement,
  showSymbols,
  symbolAssignments,
}: TextPlacementToolbarProps) {
  const [colorLibraryOpen, setColorLibraryOpen] = useState(false);
  const colorAnchorRef = useRef<HTMLDivElement | null>(null);
  const bold = placement.fontWeight >= 700;
  const italic = placement.fontStyle === "italic";
  const underline = placement.underline;
  const canConvert = Boolean(activeColorId);

  function updatePlacementStyle(next: {
    fontFamily?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  }) {
    const nextFontFamily = next.fontFamily ?? placement.fontFamily;
    const nextBold = next.bold ?? bold;
    const nextItalic = next.italic ?? italic;
    const nextUnderline = next.underline ?? underline;
    const measured = measureIntrinsicText(placement.text, {
      baseFontSize: placement.baseFontSize,
      fontFamily: nextFontFamily,
      fontStyle: nextItalic ? "italic" : "normal",
      fontWeight: nextBold ? 700 : 400,
    });

    dispatch(
      createUpdateTextPlacementCommand({
        intrinsicWidth: measured?.width ?? placement.intrinsicWidth,
        intrinsicHeight: measured?.height ?? placement.intrinsicHeight,
        fontFamily: nextFontFamily,
        fontStyle: nextItalic ? "italic" : "normal",
        fontWeight: nextBold ? 700 : 400,
        underline: nextUnderline,
      }),
    );
  }

  function handleConvert() {
    if (!activeColorId) {
      return;
    }

    const cells = convertTextPlacementToCells(placement, gridMetrics);
    if (cells.length === 0) {
      return;
    }

    dispatch(createPaintCellsCommand(activeColorId, cells));
    dispatch(createCancelTextPlacementCommand());
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
            <TextToolbarPortalPopover
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
                featuredColorIds={featuredColorIds}
                showFeaturedSymbols={showSymbols}
                symbolAssignments={symbolAssignments}
                onColorSelect={(colorId) => {
                  dispatch(createSetActiveColorCommand(colorId));
                  setColorLibraryOpen(false);
                }}
              />
            </TextToolbarPortalPopover>
          ) : null}
        </ToolbarAnchor>
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup>
        <ToolbarMeta>
          <SingleSelectDropdown
            ariaLabel="Text font"
            items={TEXT_FONT_OPTIONS}
            value={placement.fontFamily}
            placeholder="Font"
            triggerLabel={
              <span style={{ fontFamily: placement.fontFamily, fontWeight: 400 }}>
                {placement.fontFamily}
              </span>
            }
            triggerVariant="ghost"
            menuPlacement="bottom-start"
            minWidth="auto"
            menuWidth={180}
            getItemValue={(item) => item.value}
            getItemLabel={(item) => (
              <span style={{ fontFamily: item.value }}>{item.label}</span>
            )}
            onValueChange={(value) => {
              updatePlacementStyle({ fontFamily: value });
            }}
            wrapperStyle={{ width: "fit-content", maxWidth: 180 }}
            triggerStyle={{ minWidth: "auto", padding: "6px 8px", fontWeight: 700 }}
          />
        </ToolbarMeta>

        <ToolbarButton
          type="button"
          active={bold}
          aria-pressed={bold}
          aria-label="Bold"
          title="Bold"
          onClick={() => updatePlacementStyle({ bold: !bold })}
        >
          <ToolbarIcon icon="/icons/lucide/bold.svg" />
        </ToolbarButton>

        <ToolbarButton
          type="button"
          active={italic}
          aria-pressed={italic}
          aria-label="Italic"
          title="Italic"
          onClick={() => updatePlacementStyle({ italic: !italic })}
        >
          <ToolbarIcon icon="/icons/lucide/italic.svg" />
        </ToolbarButton>

        <ToolbarButton
          type="button"
          active={underline}
          aria-pressed={underline}
          aria-label="Underline"
          title="Underline"
          onClick={() => updatePlacementStyle({ underline: !underline })}
        >
          <ToolbarIcon icon="/icons/lucide/underline.svg" />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup actions style={{ marginLeft: 6, gap: 8 }}>
        <ToolbarButton
          type="button"
          variant="secondary"
          labelled
          onClick={() => dispatch(createCancelTextPlacementCommand())}
        >
          Cancel
        </ToolbarButton>
        <ToolbarButton
          type="button"
          variant="primary"
          labelled
          disabled={!canConvert}
          onClick={handleConvert}
        >
          Convert
        </ToolbarButton>
      </ToolbarGroup>
    </Toolbar>
  );
}
