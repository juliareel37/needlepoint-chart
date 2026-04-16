"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PaletteColor } from "@/lib/editor-v2/editor/store";
import type { UsedColorSummary } from "@/lib/editor-v2/editor/selectors";
import { typographyStyles } from "@/app/design-system/typography";
import { Button, ButtonIcon, Modal } from "@/components/design-system";
import {
  ToolbarAnchor,
  ToolbarButton,
  ToolbarPopover,
  ToolbarSwatch,
} from "@/components/design-system/Toolbar";
import { ColorLibrary } from "@/components/editor-v2/features/colors";
import { findClosestColorIdFromCandidates } from "@/lib/editor-v2/editor/color-utils";
import styles from "./EditorV2Shell.module.css";

type UsedColorsToolMode = "idle" | "select";
type UsedColorsActionMode = "none" | "merge";

function UsedColorsPortalPopover({
  anchorRef,
  children,
  preferredDirection = "auto",
  ...props
}: React.ComponentProps<typeof ToolbarPopover> & {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  preferredDirection?: "auto" | "up" | "down";
}) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    direction: "up" | "down";
    maxHeight: number;
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
    const popoverHeight = popoverRef.current?.offsetHeight ?? 0;
    const spaceAbove = Math.max(rect.top - viewportPadding, 0);
    const spaceBelow = Math.max(window.innerHeight - rect.bottom - viewportPadding, 0);
    const direction =
      preferredDirection === "auto"
        ? spaceBelow < popoverHeight && spaceAbove > spaceBelow
          ? "up"
          : "down"
        : preferredDirection;
    const availableSpace = direction === "up" ? spaceAbove : spaceBelow;

    setPosition({
      top: direction === "up" ? rect.top - gap : rect.bottom + gap,
      left: rect.left,
      direction,
      maxHeight: Math.max(availableSpace - gap, 140),
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
        transform: position.direction === "up" ? "translateY(-100%)" : "none",
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
  palette,
  onSwapColor,
  onDeleteColors,
  onMergeColors,
}: {
  usedColors: UsedColorSummary[];
  colorsById: Record<string, PaletteColor>;
  palette: PaletteColor[];
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
  const mergeTargetAnchorRef = useRef<HTMLDivElement | null>(null);
  const swapSourceAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelectedColorIds((current) =>
      current.filter((colorId) => usedColors.some((entry) => entry.colorId === colorId)),
    );
  }, [usedColors]);

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
  const isSelecting = toolMode !== "idle";
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
    <div className={styles.usedColorsBlock}>
      <div className={styles.usedColorsHeaderRow}>
        <p className={styles.usedColorsHeader} style={typographyStyles.h5}>
          Design Colors
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
        ) : (
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
        )}
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
                      <span
                        aria-hidden="true"
                        className={styles.swatch}
                        style={{
                          backgroundColor: colorsById[entry.colorId]?.hex ?? "#ffffff",
                          justifyContent: "left",
                        }}
                      />
                    </button>

                    {!isSelecting && swapSourceColorId === entry.colorId ? (
                      <UsedColorsPortalPopover
                        anchorRef={swapSourceAnchorRef}
                        role="dialog"
                        aria-label={`Replace ${colorsById[entry.colorId]?.name ?? entry.colorId}`}
                        className={styles.usedColorsMergePopover}
                        style={{ whiteSpace: "normal" }}
                      >
                        <ColorLibrary
                          activeColorId={entry.colorId}
                          className={styles.usedColorsMergeLibraryGrid}
                          colors={palette}
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
                </div>
              </li>
            ))}
            </ul>
            {isSelecting && selectedColorIds.length > 0 ? (
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
                        {selectedColorIds.length} selected
                      </span>
                      <Button
                        type="button"
                        variant="ghostV2"
                        size="sm"
                        className={styles.usedColorsClearSelectionButton}
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
                              color={mergeTargetColorId ? (colorsById[mergeTargetColorId]?.hex ?? "#ffffff") : "#ffffff"}
                            />
                          </ToolbarButton>

                          {mergePickerOpen ? (
                            <UsedColorsPortalPopover
                              anchorRef={mergeTargetAnchorRef}
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

          onMergeColors(selectedColorIds, mergeTargetColorId);
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

          onDeleteColors(selectedColorIds);
          exitToolMode();
        }}
      />
    </div>
  );
}
