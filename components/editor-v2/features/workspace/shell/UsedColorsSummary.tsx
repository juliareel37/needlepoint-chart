"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { getColorLibraryPaletteSections } from "@/lib/editor-v2/editor/color-library";
import type { CustomPalette, PaletteColor } from "@/lib/editor-v2/editor/store";
import type { UsedColorSummary } from "@/lib/editor-v2/editor/selectors";
import { typographyStyles } from "@/app/design-system/typography";
import {
  Button,
  ButtonIcon,
  Checkbox,
  Modal,
  Notification,
  SegmentedControl,
  SingleSelectDropdown,
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

function formatColorCodeLabel(color: PaletteColor) {
  return color.brand === "dmc" ? `DMC ${color.code}` : color.code;
}

type UsedColorsToolMode = "idle" | "select";
type UsedColorsActionMode = "none" | "merge" | "delete";
type UsedColorsSortMode = "usage" | "usage-ascending" | "color";
type UsedColorsScopeMode = "full-canvas" | "selection";
type UsedColorsSuccessNotification = {
  title: string;
  description: string;
};

type ColorSortFamily =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "purple"
  | "neutral";

type UsedColorSortMetadata = {
  family: ColorSortFamily;
  hue: number;
  saturation: number;
  lightness: number;
  lightnessBucket: number;
};

const COLOR_SORT_FAMILY_ORDER: ColorSortFamily[] = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "neutral",
];

const COLOR_SORT_FAMILY_RANK = Object.fromEntries(
  COLOR_SORT_FAMILY_ORDER.map((family, index) => [family, index]),
) as Record<ColorSortFamily, number>;

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = hexToRgb(hex);

  if (!rgb) {
    return null;
  }

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  const l = (max + min) / 2;
  let s = 0;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    switch (max) {
      case r:
        h = 60 * (((g - b) / delta) % 6);
        break;
      case g:
        h = 60 * ((b - r) / delta + 2);
        break;
      case b:
        h = 60 * ((r - g) / delta + 4);
        break;
    }
  }

  if (h < 0) {
    h += 360;
  }

  return { h, s, l };
}

function getColorSortFamily(hue: number, saturation: number): ColorSortFamily {
  if (saturation < 0.12) {
    return "neutral";
  }

  if (hue >= 345 || hue < 20) {
    return "red";
  }
  if (hue < 50) {
    return "orange";
  }
  if (hue < 75) {
    return "yellow";
  }
  if (hue < 165) {
    return "green";
  }
  if (hue < 200) {
    return "teal";
  }
  if (hue < 255) {
    return "blue";
  }
  return "purple";
}

function getLightnessBucket(lightness: number): number {
  if (lightness < 0.18) {
    return 0;
  }
  if (lightness < 0.32) {
    return 1;
  }
  if (lightness < 0.5) {
    return 2;
  }
  if (lightness < 0.68) {
    return 3;
  }
  if (lightness < 0.84) {
    return 4;
  }
  return 5;
}

function comparePaletteCodes(a: string, b: string): number {
  const aNum = Number(a);
  const bNum = Number(b);
  const aIsNum = Number.isFinite(aNum);
  const bIsNum = Number.isFinite(bNum);

  if (aIsNum && bIsNum) {
    return aNum - bNum;
  }

  return a.localeCompare(b);
}

function getUsedColorSortMetadata(color: PaletteColor | undefined): UsedColorSortMetadata {
  const hsl = color ? hexToHsl(color.hex) : null;

  if (!hsl) {
    return {
      family: "neutral",
      hue: 0,
      saturation: 0,
      lightness: 0,
      lightnessBucket: 0,
    };
  }

  return {
    family: getColorSortFamily(hsl.h, hsl.s),
    hue: hsl.h,
    saturation: hsl.s,
    lightness: hsl.l,
    lightnessBucket: getLightnessBucket(hsl.l),
  };
}

function sortUsedColorsForDisplay(
  usedColors: UsedColorSummary[],
  colorsById: Record<string, PaletteColor>,
  sortMode: UsedColorsSortMode,
): UsedColorSummary[] {
  const baseSorted = [...usedColors].sort((left, right) => {
    if (left.count !== right.count) {
      return right.count - left.count;
    }

    const leftColor = colorsById[left.colorId];
    const rightColor = colorsById[right.colorId];

    return comparePaletteCodes(leftColor?.code ?? left.colorId, rightColor?.code ?? right.colorId);
  });

  if (sortMode === "usage") {
    return baseSorted;
  }

  if (sortMode === "usage-ascending") {
    return [...baseSorted].sort((left, right) => {
      if (left.count !== right.count) {
        return left.count - right.count;
      }

      const leftColor = colorsById[left.colorId];
      const rightColor = colorsById[right.colorId];

      return comparePaletteCodes(leftColor?.code ?? left.colorId, rightColor?.code ?? right.colorId);
    });
  }

  const metadataByColorId = new Map<string, UsedColorSortMetadata>();
  const familyTotals = new Map<ColorSortFamily, number>();

  for (const entry of baseSorted) {
    const metadata = getUsedColorSortMetadata(colorsById[entry.colorId]);
    metadataByColorId.set(entry.colorId, metadata);
    familyTotals.set(
      metadata.family,
      (familyTotals.get(metadata.family) ?? 0) + entry.count,
    );
  }

  return [...baseSorted].sort((left, right) => {
    const leftColor = colorsById[left.colorId];
    const rightColor = colorsById[right.colorId];
    const leftMetadata = metadataByColorId.get(left.colorId) ?? getUsedColorSortMetadata(leftColor);
    const rightMetadata =
      metadataByColorId.get(right.colorId) ?? getUsedColorSortMetadata(rightColor);
    const leftFamilyTotal = familyTotals.get(leftMetadata.family) ?? 0;
    const rightFamilyTotal = familyTotals.get(rightMetadata.family) ?? 0;

    if (leftFamilyTotal !== rightFamilyTotal) {
      return rightFamilyTotal - leftFamilyTotal;
    }

    if (leftMetadata.family !== rightMetadata.family) {
      return (
        COLOR_SORT_FAMILY_RANK[leftMetadata.family] -
        COLOR_SORT_FAMILY_RANK[rightMetadata.family]
      );
    }

    if (leftMetadata.lightnessBucket !== rightMetadata.lightnessBucket) {
      return leftMetadata.lightnessBucket - rightMetadata.lightnessBucket;
    }

    if (leftMetadata.family === "neutral") {
      if (leftMetadata.lightness !== rightMetadata.lightness) {
        return leftMetadata.lightness - rightMetadata.lightness;
      }
    } else if (leftMetadata.hue !== rightMetadata.hue) {
      return leftMetadata.hue - rightMetadata.hue;
    }

    if (leftMetadata.saturation !== rightMetadata.saturation) {
      return rightMetadata.saturation - leftMetadata.saturation;
    }

    if (leftMetadata.lightness !== rightMetadata.lightness) {
      return leftMetadata.lightness - rightMetadata.lightness;
    }

    if (left.count !== right.count) {
      return right.count - left.count;
    }

    return comparePaletteCodes(leftColor?.code ?? left.colorId, rightColor?.code ?? right.colorId);
  });
}

function UsedColorsPortalPopover({
  anchorRef,
  children,
  horizontalAlign = "start",
  onRequestClose,
  preferredDirection = "auto",
  ...props
}: React.ComponentProps<typeof ToolbarPopover> & {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  horizontalAlign?: "start" | "center" | "end";
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
      align: horizontalAlign,
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
    const top =
      direction === "up"
        ? Math.max(viewportPadding, rect.top - gap - popoverHeight)
        : rect.bottom + gap;

    setPosition({
      top,
      left: horizontalPosition.left,
      right: horizontalPosition.right,
      direction,
      maxHeight: Math.max(availableSpace - gap, 140),
      transform: horizontalPosition.transform,
    });
  }, [anchorRef, horizontalAlign, preferredDirection]);

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

  if (!mounted) {
    return null;
  }

  return createPortal(
    <ToolbarPopover
      {...props}
      ref={popoverRef}
      style={{
        ...props.style,
        position: "fixed",
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        right: position?.right ?? "auto",
        zIndex: "var(--z-editor-popover)",
        transform: position?.transform ?? "none",
        maxWidth: `calc(100vw - ${TOOLBAR_POPOVER_VIEWPORT_PADDING * 2}px)`,
        ["--used-colors-popover-max-height" as string]: `${position?.maxHeight ?? 220}px`,
        visibility: position ? "visible" : "hidden",
      }}
    >
      {children}
    </ToolbarPopover>,
    document.body,
  );
}

export function UsedColorsSummary({
  activeColorId,
  usedColors,
  colorsById,
  customPalettesById,
  highlightedColorId,
  isBottomPanelCanvasFocusActive,
  isBottomPanelLayout,
  palette,
  onActiveColorChange,
  onEnterBottomPanelCanvasFocus,
  onExitBottomPanelCanvasFocus,
  onHighlightColorChange,
  onScopeModeChange,
  showSymbols,
  selectionControlActive,
  selectionPromptVisible,
  selectionScopeActive,
  symbolAssignments,
  onSwapColor,
  onDeleteColors,
  onMergeColors,
}: {
  activeColorId: string | null;
  usedColors: UsedColorSummary[];
  colorsById: Record<string, PaletteColor>;
  customPalettesById: Record<string, CustomPalette>;
  highlightedColorId: string | null;
  isBottomPanelCanvasFocusActive: boolean;
  isBottomPanelLayout: boolean;
  palette: PaletteColor[];
  onActiveColorChange: (colorId: string) => void;
  onEnterBottomPanelCanvasFocus: () => void;
  onExitBottomPanelCanvasFocus: () => void;
  onHighlightColorChange: (colorId: string | null) => void;
  onScopeModeChange: (mode: UsedColorsScopeMode) => void;
  showSymbols: boolean;
  selectionControlActive: boolean;
  selectionPromptVisible: boolean;
  selectionScopeActive: boolean;
  symbolAssignments: Record<string, string>;
  onSwapColor: (fromColorId: string, toColorId: string) => void;
  onDeleteColors: (colorIds: string[]) => void;
  onMergeColors: (fromColorIds: string[], toColorId: string) => void;
}) {
  const [toolMode, setToolMode] = useState<UsedColorsToolMode>("idle");
  const [actionMode, setActionMode] = useState<UsedColorsActionMode>("none");
  const [sortMode, setSortMode] = useState<UsedColorsSortMode>("usage");
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
  const usedColorRowElementsRef = useRef(new Map<string, HTMLLIElement>());
  const highlightColorChangeRef = useRef(onHighlightColorChange);
  const exitBottomPanelCanvasFocusRef = useRef(onExitBottomPanelCanvasFocus);
  const featuredColorIds = usedColors.map((entry) => entry.colorId);
  const paletteSections = useMemo(
    () => getColorLibraryPaletteSections(palette, customPalettesById),
    [customPalettesById, palette],
  );
  const isSelecting = toolMode !== "idle";
  const scopeMode: UsedColorsScopeMode = selectionControlActive ? "selection" : "full-canvas";
  const scopeOptions = useMemo(
    () =>
      [
        { value: "full-canvas", label: "All" },
        {
          value: "selection",
          label: (
            <span className={styles.usedColorsScopeLabel}>
              <span>Selection</span>
              {selectionControlActive ? (
                <span className={styles.usedColorsScopeCancelIcon} aria-hidden="true">
                  <span className={styles.usedColorsScopeCancelGlyph} />
                </span>
              ) : null}
            </span>
          ),
        },
      ] satisfies Array<{ value: UsedColorsScopeMode; label: ReactNode }>,
    [selectionControlActive],
  );
  const sortOptions = useMemo(
    () => [
      { value: "usage", label: "Usage (high to low)" },
      { value: "usage-ascending", label: "Usage (low to high)" },
      { value: "color", label: "Color similarity" },
    ] satisfies Array<{ value: UsedColorsSortMode; label: string }>,
    [],
  );
  const displayedUsedColors = useMemo(
    () => sortUsedColorsForDisplay(usedColors, colorsById, sortMode),
    [colorsById, sortMode, usedColors],
  );
  const deactivateHighlight = useCallback((options?: { blurTrigger?: boolean }) => {
    if (!highlightedColorId) {
      return;
    }

    onHighlightColorChange(null);

    if (isBottomPanelLayout && isBottomPanelCanvasFocusActive) {
      onExitBottomPanelCanvasFocus();
    }

    if (options?.blurTrigger) {
      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLElement &&
        activeElement.closest(`.${styles.usedColorsHighlightButton}`)
      ) {
        activeElement.blur();
      }
    }
  }, [
    highlightedColorId,
    isBottomPanelCanvasFocusActive,
    isBottomPanelLayout,
    onExitBottomPanelCanvasFocus,
    onHighlightColorChange,
  ]);

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
    if (!highlightedColorId) {
      return;
    }

    function handleWindowKeyDown(event: KeyboardEvent) {
      const target = event.target;
      const editableTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      if (event.key !== "Escape" || editableTarget) {
        return;
      }

      event.preventDefault();
      deactivateHighlight({ blurTrigger: true });
    }

    window.addEventListener("keydown", handleWindowKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleWindowKeyDown, { capture: true });
  }, [deactivateHighlight, highlightedColorId]);

  useEffect(() => {
    highlightColorChangeRef.current = onHighlightColorChange;
    exitBottomPanelCanvasFocusRef.current = onExitBottomPanelCanvasFocus;
  }, [onExitBottomPanelCanvasFocus, onHighlightColorChange]);

  useEffect(
    () => () => {
      highlightColorChangeRef.current(null);
      exitBottomPanelCanvasFocusRef.current();
    },
    [],
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
    if (
      !isBottomPanelLayout ||
      !isBottomPanelCanvasFocusActive ||
      !highlightedColorId
    ) {
      return;
    }

    let firstFrameId = 0;
    let secondFrameId = 0;

    firstFrameId = window.requestAnimationFrame(() => {
      secondFrameId = window.requestAnimationFrame(() => {
        const rowElement = usedColorRowElementsRef.current.get(highlightedColorId);
        rowElement?.scrollIntoView({
          block: "start",
          inline: "nearest",
          behavior: "auto",
        });
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrameId);
      window.cancelAnimationFrame(secondFrameId);
    };
  }, [
    highlightedColorId,
    isBottomPanelCanvasFocusActive,
    isBottomPanelLayout,
  ]);

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
    () => selectedUsedColors[0]?.colorId ?? null,
    [selectedUsedColors],
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
  const mergeSourceColorIds = mergeTargetColorId
    ? selectedColorIds.filter((colorId) => colorId !== mergeTargetColorId)
    : [];
  const canMerge =
    actionMode === "merge" &&
    mergeTargetColorId !== null &&
    mergeSourceColorIds.length > 0;
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
  const mergeTargetColor = mergeTargetColorId ? colorsById[mergeTargetColorId] : null;
  const mergeTargetLabel = mergeTargetColor?.name ?? mergeTargetColorId ?? "Choose target color";
  const mergeTargetCode = mergeTargetColor ? formatColorCodeLabel(mergeTargetColor) : null;
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

  useEffect(() => {
    if (actionMode === "merge") {
      if (mergeTargetColorId && colorsById[mergeTargetColorId]) {
        return;
      }

      setMergeTargetColorId(defaultMergeTargetColorId);
      return;
    }

    setMergePickerOpen(false);
    setMergeTargetColorId(null);
  }, [actionMode, colorsById, defaultMergeTargetColorId, mergeTargetColorId]);

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

  const enterToolMode = (nextActionMode: UsedColorsActionMode = "none") => {
    deactivateHighlight({ blurTrigger: true });
    setToolMode("select");
    setActionMode(nextActionMode);
    setSelectedColorIds([]);
    setMergeTargetColorId(nextActionMode === "merge" ? defaultMergeTargetColorId : null);
    setMergePickerOpen(false);
    setSwapSourceColorId(null);
  };

  const activateActionMode = (nextActionMode: Extract<UsedColorsActionMode, "merge" | "delete">) => {
    if (!isSelecting) {
      enterToolMode(nextActionMode);
      return;
    }

    if (actionMode === nextActionMode) {
      exitToolMode();
      return;
    }

    setActionMode(nextActionMode);
    setDeleteConfirmationOpen(false);
    setMergeConfirmationOpen(false);

    if (nextActionMode === "merge") {
      setMergeTargetColorId((current) =>
        current && colorsById[current] ? current : defaultMergeTargetColorId,
      );
      return;
    }

    setMergePickerOpen(false);
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
      <div className={styles.usedColorsStickyControls}>
        <SegmentedControl
          ariaLabel="Colors used scope"
          className={styles.usedColorsScopeControl}
          itemClassName={styles.usedColorsScopeControlItem}
          value={scopeMode}
          options={scopeOptions}
          onChange={onScopeModeChange}
          onActiveClick={(value) => {
            if (value === "selection") {
              onScopeModeChange("full-canvas");
            }
          }}
        />
        {!selectionPromptVisible && usedColors.length > 0 ? (
          <div className={styles.usedColorsActionRow}>
            <Button
              type="button"
              variant="ghostV2"
              size="sm"
              active={actionMode === "merge"}
              className={styles.usedColorsActionToggle}
              onClick={() => activateActionMode("merge")}
            >
              <ButtonIcon icon="/icons/lucide/merge.svg" />
              <span className={styles.usedColorsActionLabel}>
                <span>Merge</span>
              </span>
            </Button>
            <Button
              type="button"
              variant="ghostV2"
              size="sm"
              active={actionMode === "delete"}
              className={styles.usedColorsActionToggle}
              onClick={() => activateActionMode("delete")}
            >
              <ButtonIcon icon="/icons/lucide/trash.svg" />
              <span className={styles.usedColorsActionLabel}>
                <span>Delete</span>
              </span>
            </Button>
            <SingleSelectDropdown
              ariaLabel="Sort design colors"
              items={sortOptions}
              value={sortMode}
              placeholder="Sort"
              getItemLabel={(item) => item.label}
              getItemValue={(item) => item.value}
              onValueChange={(value) => setSortMode(value as UsedColorsSortMode)}
              showChevron={false}
              triggerVariant="selection"
              triggerClassName={styles.usedColorsSortButton}
              triggerLabel={<ButtonIcon icon="/icons/lucide/sort.svg" />}
              wrapperClassName={styles.usedColorsSortTriggerWrap}
              menuPlacement="bottom-end"
              menuPortalToViewport
              menuWidth={200}
              minWidth={32}
            />
          </div>
        ) : null}
      </div>
      {selectionPromptVisible ? (
        <span className={styles.emptyMessage} style={typographyStyles.p2}>
          Drag a selection on the canvas to edit colors.
        </span>
      ) : (
        <>
          {usedColors.length === 0 ? (
            <span className={styles.emptyMessage} style={typographyStyles.p2}>
              No colors used yet.
            </span>
          ) : (
            <div className={styles.usedColorsListFrame}>
              <div className={styles.usedColorsListCard}>
                <ul
                  className={styles.usedColorsList}
                  data-selection-mode={isSelecting ? "true" : "false"}
                  data-selection-overlay={
                    isSelecting && selectedColorIds.length > 0 ? "true" : "false"
                  }
                >
            {displayedUsedColors.map((entry) => (
              (() => {
                const isActiveColor = !isSelecting && activeColorId === entry.colorId;
                const rowColor = colorsById[entry.colorId];
                const rowColorName = rowColor?.name ?? entry.colorId;
                const rowColorCode = rowColor ? formatColorCodeLabel(rowColor) : entry.colorId;

                return (
              <li
                key={entry.colorId}
                ref={(element) => {
                  if (element) {
                    usedColorRowElementsRef.current.set(entry.colorId, element);
                    return;
                  }

                  usedColorRowElementsRef.current.delete(entry.colorId);
                }}
                className={styles.usedColorsRow}
                data-active-color={isActiveColor ? "true" : "false"}
                data-selectable={isSelecting ? "true" : "false"}
                data-selected={selectedColorIdSet.has(entry.colorId) ? "true" : "false"}
              >
                <div
                  className={styles.usedColorsItem}
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
                          ? `${rowColorName} color`
                          : `Replace ${rowColorName}`
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
                        const swatchSymbol = showSymbols
                          ? symbolAssignments[entry.colorId]
                          : null;

                        return (
                      <span
                        aria-hidden="true"
                        className={styles.swatch}
                        style={{
                          backgroundColor: swatchColor,
                        }}
                      >
                        {swatchSymbol ? (
                          <span
                            className={styles.usedColorSwatchSymbol}
                            style={{ color: getSwatchIconColor(swatchColor) }}
                          >
                            {swatchSymbol}
                          </span>
                        ) : null}
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
                        aria-label={`Replace ${rowColorName}`}
                        className={styles.usedColorsMergePopover}
                        style={{ whiteSpace: "normal" }}
                      >
                        <ColorLibrary
                          activeColorId={entry.colorId}
                          className={styles.usedColorsMergeLibraryGrid}
                          colors={palette}
                          defaultView="all"
                          featuredColorIds={featuredColorIds}
                          paletteSections={paletteSections}
                          showFeaturedSymbols={showSymbols}
                          symbolAssignments={symbolAssignments}
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
                    data-active={isActiveColor ? "true" : "false"}
                    data-selectable={isSelecting ? "true" : "false"}
                    data-selected={selectedColorIdSet.has(entry.colorId) ? "true" : "false"}
                    style={typographyStyles.p2}
                    onClick={(event) => {
                      if (isSelecting) {
                        event.stopPropagation();
                        toggleColorSelection(entry.colorId);
                        return;
                      }

                      onActiveColorChange(entry.colorId);
                    }}
                    aria-label={
                      isSelecting
                        ? `Select ${rowColorName}`
                        : `Set ${rowColorName} as active color`
                    }
                    aria-pressed={
                      isSelecting
                        ? selectedColorIdSet.has(entry.colorId)
                        : isActiveColor
                    }
                  >
                    <span className={styles.usedColorsItemText}>
                      <span className={styles.usedColorsItemName}>{rowColorName}</span>
                      <span className={styles.usedColorsItemCode}>{rowColorCode}</span>
                    </span>
                    <span
                      className={[
                        styles.sidebarColorPreviewCountBadge,
                        styles.usedColorsItemCountBadge,
                      ].join(" ")}
                    >
                      {entry.count}
                    </span>
                  </button>
                </div>

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
                      const nextHighlightedColorId =
                        highlightedColorId === entry.colorId ? null : entry.colorId;

                      if (nextHighlightedColorId) {
                        onHighlightColorChange(nextHighlightedColorId);

                        if (!isBottomPanelLayout) {
                          return;
                        }

                        onEnterBottomPanelCanvasFocus();
                        return;
                      }

                      deactivateHighlight();
                    }}
                    onKeyDown={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <ButtonIcon icon="/icons/lucide/search.svg" />
                  </button>
                ) : null}
              </li>
                );
              })()
            ))}
            </ul>
            {isSelecting ? (
              <div className={styles.usedColorsSelectionBar}>
                <div className={styles.usedColorsSelectionBarTop}>
                  {actionMode === "merge" ? (
                    <div className={styles.usedColorsMergeControls}>
                      {selectedColorIds.length === 0 ? (
                        <p className={styles.usedColorsSelectionPrompt} style={typographyStyles.p2}>
                          Select colors to merge
                        </p>
                      ) : (
                        <>
                          <div className={styles.usedColorsSelectionSummary}>
                            <span
                              className={styles.usedColorsSelectionCount}
                              style={typographyStyles.p2}
                            >
                              Merge {selectedColorIds.length} colors into:
                            </span>
                          </div>
                          <div
                            ref={mergeTargetAnchorRef}
                            className={styles.usedColorsMergeActionGroup}
                          >
                            <ToolbarAnchor
                              className={styles.usedColorsMergeTriggerWrap}
                            >
                              <ToolbarButton
                                type="button"
                                swatch
                                active={mergePickerOpen}
                                aria-pressed={mergePickerOpen}
                                className={[
                                  styles.libraryPopoverSwatchTrigger,
                                  styles.usedColorsMergeTargetTrigger,
                                ].join(" ")}
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
                                {showSymbols && mergeTargetColorId && symbolAssignments[mergeTargetColorId] ? (
                                  <span
                                    aria-hidden="true"
                                    className={styles.libraryPopoverSwatchSymbol}
                                    style={{
                                      color: getSwatchIconColor(
                                        colorsById[mergeTargetColorId]?.hex ?? "#ffffff",
                                      ),
                                    }}
                                  >
                                    {symbolAssignments[mergeTargetColorId]}
                                  </span>
                                ) : null}
                                <span className={styles.usedColorsMergeTargetText}>
                                  <span className={styles.usedColorsMergeTargetName}>
                                    {mergeTargetLabel}
                                  </span>
                                  {mergeTargetCode ? (
                                    <span className={styles.usedColorsMergeTargetCode}>
                                      {mergeTargetCode}
                                    </span>
                                  ) : null}
                                </span>
                              </ToolbarButton>

                              {mergePickerOpen ? (
                                <UsedColorsPortalPopover
                                  anchorRef={mergeTargetAnchorRef}
                                  horizontalAlign="center"
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
                                    defaultView="all"
                                    featuredColorIds={featuredColorIds}
                                    paletteSections={paletteSections}
                                    showFeaturedSymbols={showSymbols}
                                    symbolAssignments={symbolAssignments}
                                    onColorSelect={(colorId) => {
                                      setMergeTargetColorId(colorId);
                                      setMergePickerOpen(false);
                                    }}
                                  />
                                </UsedColorsPortalPopover>
                              ) : null}
                            </ToolbarAnchor>
                          </div>
                          <div className={styles.usedColorsSelectionButtonRow}>
                            <Button
                              type="button"
                              variant="secondary"
                              size="md"
                              className={styles.usedColorsSelectionCancelButton}
                              onClick={(event) => {
                                event.stopPropagation();
                                exitToolMode();
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              variant="primary"
                              size="md"
                              className={styles.usedColorsMergeConfirmButton}
                              disabled={!canMerge}
                              onClick={() => {
                                if (!canMerge || !mergeTargetColorId) {
                                  return;
                                }
                                setMergeConfirmationOpen(true);
                              }}
                            >
                              Merge
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : actionMode === "delete" ? (
                    <>
                      <div className={styles.usedColorsSelectionSummary}>
                        <span
                          className={styles.usedColorsSelectionCount}
                          style={typographyStyles.p2}
                        >
                          {selectedColorIds.length > 0
                            ? `${selectedColorIds.length} selected`
                            : "0 selected"}
                        </span>
                      </div>
                      <div className={styles.usedColorsSelectionButtonRow}>
                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          className={styles.usedColorsSelectionCancelButton}
                          onClick={(event) => {
                            event.stopPropagation();
                            exitToolMode();
                          }}
                        >
                          Cancel
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
                          Delete
                        </Button>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={mergeConfirmationOpen}
        title={mergeTitle}
        description={mergeDescription}
        tone="warning"
        dismissLabel="Cancel"
        confirmLabel={mergeColorCount === 1 ? "Merge colors" : "Merge colors"}
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
