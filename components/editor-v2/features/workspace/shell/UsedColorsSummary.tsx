"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PaletteColor } from "@/lib/editor-v2/editor/store";
import type { UsedColorSummary } from "@/lib/editor-v2/editor/selectors";
import { typographyStyles } from "@/app/design-system/typography";
import {
  Button,
  ButtonIcon,
  Checkbox,
  Modal,
  Notification,
} from "@/components/design-system";
import {
  ToolbarAnchor,
  ToolbarButton,
  ToolbarPopover,
  ToolbarSwatch,
} from "@/components/design-system/Toolbar";
import { ColorLibrary } from "@/components/editor-v2/features/colors";
import {
  findClosestColorIdFromCandidates,
  hexToRgb,
} from "@/lib/editor-v2/editor/color-utils";
import {
  getToolbarPopoverHorizontalPosition,
  TOOLBAR_POPOVER_VIEWPORT_PADDING,
} from "./toolbarPopoverPosition";
import styles from "./EditorV2Shell.module.css";

function getSwatchIconColor(hex: string) {
  const rgb = hexToRgb(hex);

  if (!rgb) {
    return "#ffffff";
  }

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  return luminance > 0.75 ? "#111111" : "#ffffff";
}

type UsedColorsToolMode = "idle" | "select";
type UsedColorsActionMode = "none" | "merge";
type UsedColorsSuccessNotification = {
  title: string;
  description: string;
};

function UsedColorsPortalPopover({
  anchorRef,
  children,
  onRequestClose,
  preferredDirection = "auto",
  ...props
}: React.ComponentProps<typeof ToolbarPopover> & {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  onRequestClose?: () => void;
  preferredDirection?: "auto" | "up" | "down";
}) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number | "auto";
    right: number | "auto";
    direction: "up" | "down";
    maxHeight: number;
    transform: string;
  } | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;

    if (!anchor) {
      setPosition(null);
      return;
    }

    const gap = 10;
    const viewportPadding = 12;
    const rect = anchor.getBoundingClientRect();
    const spaceAbove = Math.max(rect.top - viewportPadding, 0);
    const spaceBelow = Math.max(window.innerHeight - rect.bottom - viewportPadding, 0);
    const popoverHeight = popoverRef.current?.scrollHeight ?? 0;
    const popoverWidth = popoverRef.current?.offsetWidth ?? 0;
    const horizontalPosition = getToolbarPopoverHorizontalPosition({
      anchorRect: rect,
      popoverWidth,
      viewportPadding,
    });
    const direction =
      preferredDirection === "auto"
        ? popoverHeight > 0
          ? popoverHeight <= spaceBelow || spaceBelow >= spaceAbove
            ? "down"
            : "up"
          : spaceBelow >= spaceAbove
            ? "down"
            : "up"
        : preferredDirection;
    const availableSpace = direction === "up" ? spaceAbove : spaceBelow;

    setPosition({
      top: direction === "up" ? rect.top - gap : rect.bottom + gap,
      left: horizontalPosition.left,
      right: horizontalPosition.right,
      direction,
      maxHeight: Math.max(availableSpace - gap, 140),
      transform:
        direction === "up"
          ? `${horizontalPosition.transform} translateY(-100%)`.trim()
          : horizontalPosition.transform,
    });
  }, [anchorRef, preferredDirection]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [mounted, updatePosition]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      updatePosition();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [children, mounted, updatePosition]);

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
        ["--used-colors-popover-max-height" as string]: `${position.maxHeight}px`,
      }}
    >
      {children}
    </ToolbarPopover>,
    document.body,
  );
}

export function UsedColorsSummary({
  usedColors,
  colorsById,
  highlightedColorId,
  palette,
  onHighlightColorChange,
  onSwapColor,
  onDeleteColors,
  onMergeColors,
}: {
  usedColors: UsedColorSummary[];
  colorsById: Record<string, PaletteColor>;
  highlightedColorId: string | null;
  palette: PaletteColor[];
  onHighlightColorChange: (colorId: string | null) => void;
  onSwapColor: (fromColorId: string, toColorId: string) => void;
  onDeleteColors: (colorIds: string[]) => void;
  onMergeColors: (fromColorIds: string[], toColorId: string) => void;
}) {
  const [toolMode, setToolMode] = useState<UsedColorsToolMode>("idle");
  const [actionMode, setActionMode] = useState<UsedColorsActionMode>("none");
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>([]);
  const [mergeTargetColorId, setMergeTargetColorId] = useState<string | null>(null);
  const [mergePickerOpen, setMergePickerOpen] = useState(false);
  const [swapSourceColorId, setSwapSourceColorId] = useState<string | null>(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [mergeConfirmationOpen, setMergeConfirmationOpen] = useState(false);
  const [successNotification, setSuccessNotification] =
    useState<UsedColorsSuccessNotification | null>(null);
  const mergeTargetAnchorRef = useRef<HTMLDivElement | null>(null);
  const swapSourceAnchorRef = useRef<HTMLDivElement | null>(null);
  const featuredColorIds = usedColors.map((entry) => entry.colorId);
  const isSelecting = toolMode !== "idle";

  useEffect(() => {
    setSelectedColorIds((current) =>
      current.filter((colorId) => usedColors.some((entry) => entry.colorId === colorId)),
    );
  }, [usedColors]);

  useEffect(() => {
    if (highlightedColorId && !usedColors.some((entry) => entry.colorId === highlightedColorId)) {
      onHighlightColorChange(null);
    }
  }, [highlightedColorId, onHighlightColorChange, usedColors]);

  useEffect(() => {
    if (!isSelecting) {
      return;
    }

    onHighlightColorChange(null);
  }, [isSelecting, onHighlightColorChange]);

  useEffect(
    () => () => {
      onHighlightColorChange(null);
    },
    [onHighlightColorChange],
  );

  useEffect(() => {
    if (!swapSourceColorId) {
      return;
    }

    if (!usedColors.some((entry) => entry.colorId === swapSourceColorId)) {
      setSwapSourceColorId(null);
    }
  }, [swapSourceColorId, usedColors]);

  useEffect(() => {
    if (selectedColorIds.length === 0) {
      setDeleteConfirmationOpen(false);
      setMergeConfirmationOpen(false);
    }
  }, [selectedColorIds]);

  useEffect(() => {
    if (!successNotification) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessNotification(null);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [successNotification]);

  const selectedColorIdSet = useMemo(() => new Set(selectedColorIds), [selectedColorIds]);
  const selectedUsedColors = useMemo(
    () => usedColors.filter((entry) => selectedColorIdSet.has(entry.colorId)),
    [selectedColorIdSet, usedColors],
  );
  const defaultMergeTargetColorId = useMemo(
    () =>
      usedColors.find((entry) => !selectedColorIdSet.has(entry.colorId))?.colorId ?? null,
    [selectedColorIdSet, usedColors],
  );
  const canDelete =
    selectedColorIds.length > 0 &&
    selectedColorIds.some((colorId) =>
      Boolean(
        findClosestColorIdFromCandidates(
          colorsById,
          usedColors
            .map((entry) => entry.colorId)
            .filter((entryColorId) => !selectedColorIdSet.has(entryColorId)),
          colorId,
        ),
      ),
    );
  const canMerge =
    actionMode === "merge" &&
    selectedColorIds.length > 0 &&
    mergeTargetColorId !== null &&
    selectedColorIds.some((colorId) => colorId !== mergeTargetColorId);
  const mergeSourceColorIds = mergeTargetColorId
    ? selectedColorIds.filter((colorId) => colorId !== mergeTargetColorId)
    : [];
  const deleteSelectionCount = selectedColorIds.length;
  const deleteStitchCount = selectedUsedColors.reduce(
    (total, entry) => total + entry.count,
    0,
  );
  const mergeColorCount = mergeSourceColorIds.length;
  const mergeStitchCount = selectedUsedColors
    .filter((entry) => mergeTargetColorId === null || entry.colorId !== mergeTargetColorId)
    .reduce((total, entry) => total + entry.count, 0);
  const mergeTargetName = mergeTargetColorId
    ? (colorsById[mergeTargetColorId]?.name ?? mergeTargetColorId)
    : "selected target color";
  const mergeTitle =
    mergeColorCount === 1 ? "Merge 1 color?" : `Merge ${mergeColorCount} colors?`;
  const mergeDescription =
    mergeColorCount === 1
      ? `${mergeStitchCount} canvas cell${mergeStitchCount === 1 ? "" : "s"} will be reassigned to ${mergeTargetName}.`
      : `${mergeStitchCount} canvas cells will be reassigned to ${mergeTargetName}.`;
  const deleteTitle =
    deleteSelectionCount === 1 ? "Delete 1 color?" : `Delete ${deleteSelectionCount} colors?`;
  const deleteDescription =
    deleteSelectionCount === 1
      ? `${deleteStitchCount} canvas cell${deleteStitchCount === 1 ? "" : "s"} will be replaced with the closest remaining color in the design palette.`
      : `${deleteStitchCount} canvas cells will be replaced with the most similar remaining color in the design palette.`;

  const exitToolMode = () => {
    setToolMode("idle");
    setActionMode("none");
    setSelectedColorIds([]);
    setMergeTargetColorId(null);
    setMergePickerOpen(false);
    setSwapSourceColorId(null);
    setDeleteConfirmationOpen(false);
    setMergeConfirmationOpen(false);
  };

  const clearSelection = () => {
    setActionMode("none");
    setSelectedColorIds([]);
    setMergeTargetColorId(null);
    setMergePickerOpen(false);
    setSwapSourceColorId(null);
    setDeleteConfirmationOpen(false);
    setMergeConfirmationOpen(false);
  };

  const toggleColorSelection = (colorId: string) => {
    if (!isSelecting) {
      return;
    }

    setSelectedColorIds((current) =>
      current.includes(colorId)
        ? current.filter((currentColorId) => currentColorId !== colorId)
        : [...current, colorId],
    );
  };

  const enterToolMode = () => {
    setToolMode("select");
    setActionMode("none");
    setSelectedColorIds([]);
    setMergeTargetColorId(null);
    setMergePickerOpen(false);
    setSwapSourceColorId(null);
  };

  return (
    <>
      {successNotification
        ? createPortal(
            <div className={styles.editorNotificationOverlay}>
              <div className={styles.editorNotificationStack} data-auto-dismiss="true">
                <Notification
                  tone="success"
                  title={successNotification.title}
                  description={successNotification.description}
                  onDismiss={() => setSuccessNotification(null)}
                />
              </div>
            </div>,
            document.body,
          )
        : null}

      <div className={styles.usedColorsBlock}>
      <div className={styles.usedColorsHeaderRow}>
        <p className={styles.usedColorsHeader} style={typographyStyles.h5}>
          {`Colors in canvas (${usedColors.length})`}
        </p>
        {isSelecting ? (
          <Button
            type="button"
            variant="ghostV2"
            size="sm"
            className={styles.usedColorsEditButton}
            aria-label="Exit used colors tool"
            title="Exit used colors tool"
            onClick={exitToolMode}
          >
            <ButtonIcon icon="/icons/lucide/x.svg" />
          </Button>
        ) : usedColors.length > 0 ? (
          <div className={styles.usedColorsToolButtons}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className={styles.usedColorsEditButton}
              onClick={enterToolMode}
            >
              Select
            </Button>
          </div>
        ) : null}
      </div>

      {usedColors.length === 0 ? (
        <span className={styles.emptyMessage} style={typographyStyles.p2}>
          None yet
        </span>
      ) : (
        <div className={styles.usedColorsListFrame}>
          {actionMode === "merge" ? (
            <div 
            // className={styles.usedColorsMergePanel}
            >
              {/* <span className={styles.usedColorsMergeLabel} style={typographyStyles.p2}>
                Choose a target color, then merge selected colors into it.
              </span> */}
            </div>
          ) : null}
          <div className={styles.usedColorsListCard}>
            <ul
              className={styles.usedColorsList}
              data-selection-mode={isSelecting ? "true" : "false"}
              data-selection-overlay={
                isSelecting && selectedColorIds.length > 0 ? "true" : "false"
              }
            >
            {usedColors.map((entry) => (
              <li key={entry.colorId}>
                <div
                  className={styles.usedColorsItem}
                  data-selectable={isSelecting ? "true" : "false"}
                  data-selected={selectedColorIdSet.has(entry.colorId) ? "true" : "false"}
                  role={isSelecting ? "button" : undefined}
                  tabIndex={isSelecting ? 0 : undefined}
                  style={typographyStyles.p2}
                  onClick={() => toggleColorSelection(entry.colorId)}
                  onKeyDown={(event) => {
                    if (!isSelecting) {
                      return;
                    }

                    if (event.key !== "Enter" && event.key !== " ") {
                      return;
                    }

                    event.preventDefault();
                    toggleColorSelection(entry.colorId);
                  }}
                >
                  {isSelecting ? (
                    <span className={styles.usedColorsSelectionCheckbox} aria-hidden="true">
                      <Checkbox
                        checked={selectedColorIdSet.has(entry.colorId)}
                        readOnly
                        tabIndex={-1}
                      />
                    </span>
                  ) : null}

                  <ToolbarAnchor
                    ref={
                      swapSourceColorId === entry.colorId
                        ? swapSourceAnchorRef
                        : undefined
                    }
                    className={styles.usedColorSwatchTriggerWrap}
                  >
                    <button
                      type="button"
                      className={styles.usedColorSwatchButton}
                      aria-label={
                        isSelecting
                          ? `${colorsById[entry.colorId]?.name ?? entry.colorId} color`
                          : `Replace ${colorsById[entry.colorId]?.name ?? entry.colorId}`
                      }
                      aria-haspopup={isSelecting ? undefined : "dialog"}
                      aria-expanded={
                        !isSelecting && swapSourceColorId === entry.colorId
                          ? true
                          : undefined
                      }
                      disabled={isSelecting}
                      onClick={() => {
                        if (isSelecting) {
                          return;
                        }

                        setSwapSourceColorId((current) =>
                          current === entry.colorId ? null : entry.colorId,
                        );
                      }}
                    >
                      {(() => {
                        const swatchColor = colorsById[entry.colorId]?.hex ?? "#ffffff";

                        return (
                      <span
                        aria-hidden="true"
                        className={styles.swatch}
                        style={{
                          backgroundColor: swatchColor,
                        }}
                      >
                        {!isSelecting ? (
                          <span
                            className={styles.usedColorSwatchSwapIcon}
                            style={{ color: getSwatchIconColor(swatchColor) }}
                          >
                            <ButtonIcon icon="/icons/lucide/swap.svg" />
                          </span>
                        ) : null}
                      </span>
                        );
                      })()}
                    </button>

                    {!isSelecting && swapSourceColorId === entry.colorId ? (
                      <UsedColorsPortalPopover
                        anchorRef={swapSourceAnchorRef}
                        onRequestClose={() => setSwapSourceColorId(null)}
                        role="dialog"
                        aria-label={`Replace ${colorsById[entry.colorId]?.name ?? entry.colorId}`}
                        className={styles.usedColorsMergePopover}
                        style={{ whiteSpace: "normal" }}
                      >
                        <ColorLibrary
                          activeColorId={entry.colorId}
                          className={styles.usedColorsMergeLibraryGrid}
                          colors={palette}
                          featuredColorIds={featuredColorIds}
                          onColorSelect={(colorId) => {
                            if (colorId !== entry.colorId) {
                              onSwapColor(entry.colorId, colorId);
                            }
                            setSwapSourceColorId(null);
                          }}
                        />
                      </UsedColorsPortalPopover>
                    ) : null}
                  </ToolbarAnchor>

                  <button
                    type="button"
                    className={styles.usedColorsItemButton}
                    data-selectable={isSelecting ? "true" : "false"}
                    data-selected={selectedColorIdSet.has(entry.colorId) ? "true" : "false"}
                    style={typographyStyles.p2}
                    onClick={(event) => {
                      if (isSelecting) {
                        event.stopPropagation();
                      }
                      toggleColorSelection(entry.colorId);
                    }}
                    disabled={!isSelecting}
                    aria-pressed={
                      isSelecting ? selectedColorIdSet.has(entry.colorId) : undefined
                    }
                  >
                    <span>{colorsById[entry.colorId]?.name ?? entry.colorId}</span>
                    <span className={styles.usedColorsItemCount}>×{entry.count}</span>
                  </button>

                  {!isSelecting ? (
                    <button
                      type="button"
                      className={styles.usedColorsHighlightButton}
                      aria-label={
                        highlightedColorId === entry.colorId
                          ? `Stop highlighting ${colorsById[entry.colorId]?.name ?? entry.colorId} on canvas`
                          : `Highlight ${colorsById[entry.colorId]?.name ?? entry.colorId} on canvas`
                      }
                      aria-pressed={highlightedColorId === entry.colorId}
                      title={
                        highlightedColorId === entry.colorId
                          ? "Stop highlight"
                          : "Highlight on canvas"
                      }
                      onClick={(event) => {
                        event.stopPropagation();
                        onHighlightColorChange(
                          highlightedColorId === entry.colorId ? null : entry.colorId,
                        );
                      }}
                    >
                      <ButtonIcon icon="/icons/lucide/search.svg" />
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
            </ul>
            {isSelecting ? (
              <div className={styles.usedColorsSelectionBar}>
                <div className={styles.usedColorsSelectionBarTop}>
                  {actionMode === "merge" ? (
                    <Button
                      type="button"
                      variant="ghostV2"
                      size="sm"
                      className={styles.usedColorsClearSelectionButton}
                      aria-label="Back to selection actions"
                      title="Back to selection actions"
                      onClick={() => {
                        setActionMode("none");
                        setMergePickerOpen(false);
                        setMergeConfirmationOpen(false);
                      }}
                    >
                      <ButtonIcon icon="/icons/lucide/arrow-left.svg" />
                    </Button>
                  ) : (
                    <>
                      <span
                        className={styles.usedColorsSelectionCount}
                        style={typographyStyles.p2}
                      >
                        {selectedColorIds.length > 0
                          ? `${selectedColorIds.length} selected`
                          : "0 selected"}
                      </span>
                      <Button
                        type="button"
                        variant="ghostV2"
                        size="sm"
                        className={styles.usedColorsClearSelectionButton}
                        disabled={selectedColorIds.length === 0}
                        onClick={clearSelection}
                      >
                        <ButtonIcon icon="/icons/lucide/x.svg" />
                      </Button>
                    </>
                  )}
                </div>
                <div className={styles.usedColorsSelectionBarActions}>
                  {actionMode === "merge" ? (
                    <>
                      <div className={styles.usedColorsMergeActionGroup}>
                        <span className={styles.usedColorsMergeActionLabel} style={typographyStyles.p2}>
                          Target
                        </span>
                        <ToolbarAnchor
                          ref={mergeTargetAnchorRef}
                          className={styles.usedColorsMergeTriggerWrap}
                        >
                          <ToolbarButton
                            type="button"
                            swatch
                            active={mergePickerOpen}
                            aria-pressed={mergePickerOpen}
                            className={styles.libraryPopoverSwatchTrigger}
                            aria-label={
                              mergeTargetColorId
                                ? `Merge target ${colorsById[mergeTargetColorId]?.name ?? mergeTargetColorId}`
                                : "Choose merge target color"
                            }
                            title={
                              mergeTargetColorId
                                ? `${colorsById[mergeTargetColorId]?.name ?? mergeTargetColorId}`
                                : "Choose merge target color"
                            }
                            onClick={() => setMergePickerOpen((current) => !current)}
                          >
                            <ToolbarSwatch
                              className={styles.libraryPopoverSwatch}
                              color={mergeTargetColorId ? (colorsById[mergeTargetColorId]?.hex ?? "#ffffff") : "#ffffff"}
                            />
                          </ToolbarButton>

                          {mergePickerOpen ? (
                            <UsedColorsPortalPopover
                              anchorRef={mergeTargetAnchorRef}
                              onRequestClose={() => setMergePickerOpen(false)}
                              preferredDirection="up"
                              role="dialog"
                              aria-label="Merge target color library"
                              className={styles.usedColorsMergePopover}
                              style={{ whiteSpace: "normal" }}
                            >
                              <ColorLibrary
                                activeColorId={mergeTargetColorId}
                                className={styles.usedColorsMergeLibraryGrid}
                                colors={palette}
                                featuredColorIds={featuredColorIds}
                                onColorSelect={(colorId) => {
                                  setMergeTargetColorId(colorId);
                                  setMergePickerOpen(false);
                                }}
                              />
                            </UsedColorsPortalPopover>
                          ) : null}
                        </ToolbarAnchor>
                      </div>
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        className={styles.usedColorsDeleteButton}
                        disabled={!canMerge}
                        onClick={() => {
                          if (!canMerge || !mergeTargetColorId) {
                            return;
                          }
                          setMergeConfirmationOpen(true);
                        }}
                      >
                        {/* <ButtonIcon icon="/icons/lucide/merge.svg" /> */}
                        Merge
                      </Button>
                    </>
                  ) : (
                    <>


                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        className={styles.usedColorsSecondaryAction}
                        disabled={selectedColorIds.length === 0}
                        onClick={() => {
                          if (selectedColorIds.length === 0) {
                            return;
                          }

                          setActionMode("merge");
                          setMergeTargetColorId(defaultMergeTargetColorId);
                          setMergePickerOpen(false);
                        }}
                      >
                        {/* Merge */}
                        <ButtonIcon icon="/icons/lucide/merge.svg" />
                      </Button>


                        <Button
                        type="button"
                        variant="destructive"
                        size="md"
                        className={styles.usedColorsDeleteButton}
                        disabled={!canDelete}
                        onClick={() => {
                          if (!canDelete) {
                            return;
                          }
                          setDeleteConfirmationOpen(true);
                        }}
                      >
                        <ButtonIcon icon="/icons/lucide/trash.svg" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <Modal
        isOpen={mergeConfirmationOpen}
        title={mergeTitle}
        description={mergeDescription}
        tone="warning"
        dismissLabel="Cancel"
        confirmLabel={mergeColorCount === 1 ? "Merge color" : "Merge colors"}
        confirmVariant="primary"
        onDismiss={() => setMergeConfirmationOpen(false)}
        onConfirm={() => {
          if (!canMerge || !mergeTargetColorId) {
            setMergeConfirmationOpen(false);
            return;
          }

          const mergedColorCount = mergeColorCount;
          const affectedCellCount = mergeStitchCount;
          const targetColorName = mergeTargetName;

          onMergeColors(selectedColorIds, mergeTargetColorId);
          setSuccessNotification({
            title:
              mergedColorCount === 1
                ? `Merged 1 color into ${targetColorName}`
                : `Merged ${mergedColorCount} colors into ${targetColorName}`,
            description:
              affectedCellCount === 1
                ? "1 canvas cell was reassigned to the target color."
                : `${affectedCellCount} canvas cells were reassigned to the target color.`,
          });
          exitToolMode();
        }}
      />

      <Modal
        isOpen={deleteConfirmationOpen}
        title={deleteTitle}
        description={deleteDescription}
        tone="fail"
        dismissLabel="Cancel"
        confirmLabel={deleteSelectionCount === 1 ? "Delete color" : "Delete colors"}
        confirmVariant="destructive"
        onDismiss={() => setDeleteConfirmationOpen(false)}
        onConfirm={() => {
          if (!canDelete || selectedColorIds.length === 0) {
            setDeleteConfirmationOpen(false);
            return;
          }

          const removedColorCount = deleteSelectionCount;
          const affectedCellCount = deleteStitchCount;

          onDeleteColors(selectedColorIds);
          setSuccessNotification({
            title:
              removedColorCount === 1
                ? "Deleted 1 color"
                : `Deleted ${removedColorCount} colors`,
            description:
              affectedCellCount === 1
                ? "1 canvas cell was replaced with the closest remaining color."
                : `${affectedCellCount} canvas cells were replaced with the closest remaining colors.`,
          });
          exitToolMode();
        }}
      />
      </div>
    </>
  );
}
