"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { convertIconPlacementToPaintGroups } from "@/lib/editor-v2/editor/icons/convertIconPlacementToCells";
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
  createUpdateIconPlacementCommand,
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
  const selectedSlot = useMemo(
    () =>
      placement.selectedColorSlotId
        ? placement.colorSlots.find((slot) => slot.id === placement.selectedColorSlotId) ?? null
        : null,
    [placement.colorSlots, placement.selectedColorSlotId],
  );
  const selectedSlotColor = selectedSlot?.paletteColorId
    ? palette.find((color) => color.id === selectedSlot.paletteColorId) ?? null
    : null;
  const triggerColorHex =
    selectedSlotColor?.hex ?? activeColorHex ?? "var(--neutral-400)";
  const canConvert =
    !isConverting &&
    (placement.colorSlots.length > 0
      ? placement.colorSlots.some((slot) => Boolean(slot.paletteColorId))
      : Boolean(activeColorId));

  async function handleConvert() {
    if (isConverting) {
      return;
    }

    setIsConverting(true);
    try {
      const conversionTransactionKey = `icon-convert-${placement.iconId}-${Date.now()}`;
      const groups = await convertIconPlacementToPaintGroups(
        placement,
        gridMetrics,
        activeColorId,
      );
      if (groups.length === 0) {
        return;
      }

      for (const group of groups) {
        if (group.cells.length === 0) {
          continue;
        }

        dispatch(
          createPaintCellsCommand(
            group.colorId,
            group.cells,
            conversionTransactionKey,
          ),
        );
      }
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
            disabled={placement.colorSlots.length > 0 && !selectedSlot}
            onClick={() => setColorLibraryOpen((current) => !current)}
          >
            <ToolbarSwatch
              color={triggerColorHex}
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
                activeColorId={selectedSlot?.paletteColorId ?? activeColorId}
                className={styles.toolbarColorLibrary}
                colors={palette}
                onColorSelect={(colorId) => {
                  if (selectedSlot) {
                    dispatch(
                      createUpdateIconPlacementCommand({
                        colorSlots: placement.colorSlots.map((slot) =>
                          slot.id === selectedSlot.id
                            ? { ...slot, paletteColorId: colorId }
                            : slot,
                        ),
                      }),
                    );
                  } else {
                    dispatch(createSetActiveColorCommand(colorId));
                  }
                  setColorLibraryOpen(false);
                }}
              />
            </IconToolbarPortalPopover>
          ) : null}
        </ToolbarAnchor>
      </ToolbarGroup>

      <ToolbarDivider />

      {placement.colorSlots.length > 0 ? (
        <>
          <ToolbarGroup>
            <div className={styles.iconPlacementSwatchList} role="list" aria-label="Icon colors">
              {placement.colorSlots.map((slot) => {
                const assignedColor = slot.paletteColorId
                  ? palette.find((color) => color.id === slot.paletteColorId) ?? null
                  : null;
                const isSelected = slot.id === placement.selectedColorSlotId;

                return (
                  <button
                    key={slot.id}
                    type="button"
                    role="listitem"
                    className={styles.iconPlacementSwatchButton}
                    data-selected={isSelected ? "true" : "false"}
                    aria-pressed={isSelected}
                    title={`Edit icon color ${slot.sourceHex}`}
                    onClick={() =>
                      dispatch(
                        createUpdateIconPlacementCommand({
                          selectedColorSlotId: slot.id,
                        }),
                      )
                    }
                  >
                    <ToolbarSwatch
                      color={assignedColor?.hex ?? slot.sourceHex}
                      className={styles.libraryPopoverSwatch}
                    />
                  </button>
                );
              })}
            </div>
          </ToolbarGroup>
          <ToolbarDivider />
        </>
      ) : null}

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
