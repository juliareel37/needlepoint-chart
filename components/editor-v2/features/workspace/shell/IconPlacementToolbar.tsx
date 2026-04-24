"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ColorLibrary } from "@/components/editor-v2/features/colors";
import {
  Slider,
  Toolbar,
  ToolbarAnchor,
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup,
  ToolbarIcon,
  ToolbarLabel,
  ToolbarSwatch,
  ToolbarPopover,
} from "@/components/design-system";
import { convertIconPlacementToPaintGroups } from "@/lib/editor-v2/editor/icons/convertIconPlacementToCells";
import { getPrimitiveStrokeWidthScaleRange } from "@/lib/editor-v2/editor/icons/primitiveIcon";
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
import {
  getToolbarPopoverHorizontalPosition,
  TOOLBAR_POPOVER_VIEWPORT_PADDING,
} from "./toolbarPopoverPosition";
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

interface IconColorSlotSwatchPopoverProps {
  activeColorId: string | null;
  assignedColorHex: string;
  colors: PaletteColor[];
  featuredColorIds: string[];
  isOpen: boolean;
  isSelected: boolean;
  label: string;
  onColorSelect: (colorId: string) => void;
  onOpenChange: (open: boolean) => void;
  showSymbols: boolean;
  symbolAssignments: Record<string, string>;
}

function IconColorSlotSwatchPopover({
  activeColorId,
  assignedColorHex,
  colors,
  featuredColorIds,
  isOpen,
  isSelected,
  label,
  onColorSelect,
  onOpenChange,
  showSymbols,
  symbolAssignments,
}: IconColorSlotSwatchPopoverProps) {
  const anchorRef = useRef<HTMLDivElement | null>(null);

  return (
    <ToolbarAnchor ref={anchorRef} role="listitem">
      <ToolbarButton
        type="button"
        swatch
        active={isOpen || isSelected}
        aria-pressed={isOpen}
        aria-label={label}
        title={label}
        className={styles.libraryPopoverSwatchTrigger}
        onClick={() => onOpenChange(!isOpen)}
      >
        <ToolbarSwatch
          color={assignedColorHex}
          className={styles.libraryPopoverSwatch}
        />
      </ToolbarButton>

      {isOpen ? (
        <IconToolbarPortalPopover
          anchorRef={anchorRef}
          onRequestClose={() => onOpenChange(false)}
          role="dialog"
          aria-label={label}
          className={styles.colorLibraryPopover}
          style={{ whiteSpace: "normal" }}
        >
          <ColorLibrary
            activeColorId={activeColorId}
            className={styles.toolbarColorLibrary}
            colors={colors}
            featuredColorIds={featuredColorIds}
            showFeaturedSymbols={showSymbols}
            symbolAssignments={symbolAssignments}
            onColorSelect={(colorId) => {
              onColorSelect(colorId);
              onOpenChange(false);
            }}
          />
        </IconToolbarPortalPopover>
      ) : null}
    </ToolbarAnchor>
  );
}

interface IconPlacementToolbarProps {
  activeColorHex: string | null;
  activeColorId: string | null;
  dispatch: EditorStore["dispatch"];
  featuredColorIds: string[];
  gridMetrics: GridWorldMetrics;
  palette: PaletteColor[];
  placement: IconPlacementSession;
  showSymbols: boolean;
  symbolAssignments: Record<string, string>;
}

export function IconPlacementToolbar({
  activeColorHex,
  activeColorId,
  dispatch,
  featuredColorIds,
  gridMetrics,
  palette,
  placement,
  showSymbols,
  symbolAssignments,
}: IconPlacementToolbarProps) {
  const [colorLibraryOpen, setColorLibraryOpen] = useState(false);
  const [openColorSlotId, setOpenColorSlotId] = useState<string | null>(null);
  const [strokeWidthOpen, setStrokeWidthOpen] = useState(false);
  const [strokeWidthTooltipVisible, setStrokeWidthTooltipVisible] = useState(false);
  const [patternOpen, setPatternOpen] = useState(false);
  const [patternTooltipVisible, setPatternTooltipVisible] = useState(false);
  const [spacingOpen, setSpacingOpen] = useState(false);
  const [spacingTooltipVisible, setSpacingTooltipVisible] = useState(false);
  const colorAnchorRef = useRef<HTMLDivElement | null>(null);
  const strokeWidthAnchorRef = useRef<HTMLDivElement | null>(null);
  const patternAnchorRef = useRef<HTMLDivElement | null>(null);
  const spacingAnchorRef = useRef<HTMLDivElement | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const paletteById = useMemo(
    () =>
      palette.reduce<Record<string, PaletteColor>>((accumulator, color) => {
        accumulator[color.id] = color;
        return accumulator;
      }, {}),
    [palette],
  );
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
  const normalizedStrokeWidth = placement.strokeWidthScale;
  const { min: strokeWidthMin, max: strokeWidthMax } = getPrimitiveStrokeWidthScaleRange(
    placement.primitiveKind,
    placement.primitiveStrokeReferenceSize,
  );
  const strokeWidthTooltipPercent = Math.max(
    0,
    Math.min(
      100,
      ((normalizedStrokeWidth - strokeWidthMin) / (strokeWidthMax - strokeWidthMin)) * 100,
    ),
  );
  const strokeWidthLabel = `${normalizedStrokeWidth.toFixed(1)}x`;
  const supportsPatternScale = placement.primitiveKind === "scalloped-frame";
  const normalizedPatternScale = placement.primitivePatternScale;
  const patternTooltipPercent = Math.max(
    0,
    Math.min(100, ((normalizedPatternScale - 0.5) / (2.5 - 0.5)) * 100),
  );
  const patternLabel = `${normalizedPatternScale.toFixed(1)}x`;
  const supportsSpacingScale = placement.primitiveKind === "double-rectangle-frame";
  const normalizedSpacingScale = placement.primitiveSpacingScale;
  const spacingTooltipPercent = Math.max(
    0,
    Math.min(100, ((normalizedSpacingScale - 0.5) / (2 - 0.5)) * 100),
  );
  const spacingLabel = `${normalizedSpacingScale.toFixed(1)}x`;

  function closeColorPickers() {
    setColorLibraryOpen(false);
    setOpenColorSlotId(null);
  }

  function updateSelectedColorSlot(slotId: string) {
    dispatch(
      createUpdateIconPlacementCommand({
        selectedColorSlotId: slotId,
      }),
    );
  }

  function updateSlotColor(slotId: string, colorId: string) {
    dispatch(
      createUpdateIconPlacementCommand({
        selectedColorSlotId: slotId,
        colorSlots: placement.colorSlots.map((slot) =>
          slot.id === slotId ? { ...slot, paletteColorId: colorId } : slot,
        ),
      }),
    );
  }

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
        paletteById,
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
      {placement.colorSlots.length === 0 ? (
        <>
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
                onClick={() => {
                  setOpenColorSlotId(null);
                  setColorLibraryOpen((current) => !current);
                }}
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
                </IconToolbarPortalPopover>
              ) : null}
            </ToolbarAnchor>
          </ToolbarGroup>

          <ToolbarDivider />
        </>
      ) : null}

      {placement.supportsStrokeWidth ? (
        <>
          <ToolbarGroup>
            <ToolbarAnchor ref={strokeWidthAnchorRef}>
              <ToolbarButton
                type="button"
                active={strokeWidthOpen}
                aria-pressed={strokeWidthOpen}
                aria-label="Icon thickness"
                title="Icon thickness"
                onClick={() => setStrokeWidthOpen((current) => !current)}
                onPointerDown={closeColorPickers}
              >
                <ToolbarIcon icon="/icons/other/stroke-width.svg" />
              </ToolbarButton>

              {strokeWidthOpen ? (
                <IconToolbarPortalPopover
                  anchorRef={strokeWidthAnchorRef}
                  onRequestClose={() => setStrokeWidthOpen(false)}
                  role="dialog"
                  aria-label="Icon thickness"
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 15,
                      alignItems: "center",
                      flexWrap: "nowrap",
                      padding: "6px 8px",
                    }}
                  >
                    <ToolbarLabel>Thickness</ToolbarLabel>
                    <div
                      className={styles.traceSliderTooltipWrap}
                      style={{ width: 96, flexShrink: 0 }}
                    >
                      <div
                        className={[
                          styles.traceSliderTooltip,
                          strokeWidthTooltipVisible
                            ? styles.traceSliderTooltipVisible
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        aria-hidden="true"
                        style={{ left: `${strokeWidthTooltipPercent}%` }}
                      >
                        {strokeWidthLabel}
                      </div>
                      <Slider
                        min={strokeWidthMin}
                        max={strokeWidthMax}
                        step={0.1}
                        value={normalizedStrokeWidth}
                        aria-label="Icon thickness"
                        aria-valuetext={`${strokeWidthLabel} line thickness`}
                        onPointerDown={() => setStrokeWidthTooltipVisible(true)}
                        onBlur={() => setStrokeWidthTooltipVisible(false)}
                        onChange={(event) => {
                          dispatch(
                            createUpdateIconPlacementCommand({
                              strokeWidthScale: Number(event.currentTarget.value),
                            }),
                          );
                        }}
                        style={{ width: "100%", maxWidth: "none" }}
                      />
                    </div>
                  </div>
                </IconToolbarPortalPopover>
              ) : null}
            </ToolbarAnchor>
          </ToolbarGroup>
          <ToolbarDivider />
        </>
      ) : null}

      {supportsPatternScale ? (
        <>
          <ToolbarGroup>
            <ToolbarAnchor ref={patternAnchorRef}>
              <ToolbarButton
                type="button"
                active={patternOpen}
                aria-pressed={patternOpen}
                aria-label="Scallop spacing"
                title="Scallop spacing"
                onClick={() => setPatternOpen((current) => !current)}
                onPointerDown={closeColorPickers}
              >
                <ToolbarLabel>Wave</ToolbarLabel>
              </ToolbarButton>

              {patternOpen ? (
                <IconToolbarPortalPopover
                  anchorRef={patternAnchorRef}
                  onRequestClose={() => setPatternOpen(false)}
                  role="dialog"
                  aria-label="Scallop spacing"
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 15,
                      alignItems: "center",
                      flexWrap: "nowrap",
                      padding: "6px 8px",
                    }}
                  >
                    <ToolbarLabel>Spacing</ToolbarLabel>
                    <div
                      className={styles.traceSliderTooltipWrap}
                      style={{ width: 96, flexShrink: 0 }}
                    >
                      <div
                        className={[
                          styles.traceSliderTooltip,
                          patternTooltipVisible
                            ? styles.traceSliderTooltipVisible
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        aria-hidden="true"
                        style={{ left: `${patternTooltipPercent}%` }}
                      >
                        {patternLabel}
                      </div>
                      <Slider
                        min={0.5}
                        max={2.5}
                        step={0.1}
                        value={normalizedPatternScale}
                        aria-label="Scallop spacing"
                        aria-valuetext={`${patternLabel} scallop spacing`}
                        onPointerDown={() => setPatternTooltipVisible(true)}
                        onBlur={() => setPatternTooltipVisible(false)}
                        onChange={(event) => {
                          dispatch(
                            createUpdateIconPlacementCommand({
                              primitivePatternScale: Number(event.currentTarget.value),
                            }),
                          );
                        }}
                        style={{ width: "100%", maxWidth: "none" }}
                      />
                    </div>
                  </div>
                </IconToolbarPortalPopover>
              ) : null}
            </ToolbarAnchor>
          </ToolbarGroup>
          <ToolbarDivider />
        </>
      ) : null}

      {supportsSpacingScale ? (
        <>
          <ToolbarGroup>
            <ToolbarAnchor ref={spacingAnchorRef}>
              <ToolbarButton
                type="button"
                active={spacingOpen}
                aria-pressed={spacingOpen}
                aria-label="Frame spacing"
                title="Frame spacing"
                onClick={() => setSpacingOpen((current) => !current)}
                onPointerDown={closeColorPickers}
              >
                <ToolbarLabel>Gap</ToolbarLabel>
              </ToolbarButton>

              {spacingOpen ? (
                <IconToolbarPortalPopover
                  anchorRef={spacingAnchorRef}
                  onRequestClose={() => setSpacingOpen(false)}
                  role="dialog"
                  aria-label="Frame spacing"
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 15,
                      alignItems: "center",
                      flexWrap: "nowrap",
                      padding: "6px 8px",
                    }}
                  >
                    <ToolbarLabel>Spacing</ToolbarLabel>
                    <div
                      className={styles.traceSliderTooltipWrap}
                      style={{ width: 96, flexShrink: 0 }}
                    >
                      <div
                        className={[
                          styles.traceSliderTooltip,
                          spacingTooltipVisible
                            ? styles.traceSliderTooltipVisible
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        aria-hidden="true"
                        style={{ left: `${spacingTooltipPercent}%` }}
                      >
                        {spacingLabel}
                      </div>
                      <Slider
                        min={0.5}
                        max={2}
                        step={0.1}
                        value={normalizedSpacingScale}
                        aria-label="Frame spacing"
                        aria-valuetext={`${spacingLabel} frame spacing`}
                        onPointerDown={() => setSpacingTooltipVisible(true)}
                        onBlur={() => setSpacingTooltipVisible(false)}
                        onChange={(event) => {
                          dispatch(
                            createUpdateIconPlacementCommand({
                              primitiveSpacingScale: Number(event.currentTarget.value),
                            }),
                          );
                        }}
                        style={{ width: "100%", maxWidth: "none" }}
                      />
                    </div>
                  </div>
                </IconToolbarPortalPopover>
              ) : null}
            </ToolbarAnchor>
          </ToolbarGroup>
          <ToolbarDivider />
        </>
      ) : null}

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
                  <IconColorSlotSwatchPopover
                    key={slot.id}
                    activeColorId={slot.paletteColorId ?? null}
                    assignedColorHex={assignedColor?.hex ?? slot.sourceHex}
                    colors={palette}
                    featuredColorIds={featuredColorIds}
                    isOpen={openColorSlotId === slot.id}
                    isSelected={isSelected}
                    label={`Edit icon color ${slot.sourceHex}`}
                    onColorSelect={(colorId) => updateSlotColor(slot.id, colorId)}
                    showSymbols={showSymbols}
                    symbolAssignments={symbolAssignments}
                    onOpenChange={(open) => {
                      if (open) {
                        setColorLibraryOpen(false);
                        setOpenColorSlotId(slot.id);
                        updateSelectedColorSlot(slot.id);
                        return;
                      }

                      setOpenColorSlotId((current) =>
                        current === slot.id ? null : current,
                      );
                    }}
                  />
                );
              })}
            </div>
          </ToolbarGroup>
          <ToolbarDivider />
        </>
      ) : null}

      <ToolbarGroup>
        <ToolbarButton
          type="button"
          variant="secondary"
          labelled
          onClick={() => dispatch(createCancelIconPlacementCommand())}
        >
          Cancel
        </ToolbarButton>
        <ToolbarButton
          type="button"
          variant="primary"
          labelled
          disabled={!canConvert}
          onClick={() => {
            void handleConvert();
          }}
        >
          {isConverting ? "Converting..." : "Convert"}
        </ToolbarButton>
      </ToolbarGroup>
    </Toolbar>
  );
}
