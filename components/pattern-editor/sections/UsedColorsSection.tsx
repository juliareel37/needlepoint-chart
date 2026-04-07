"use client";

import React from "react";
import { createPortal } from "react-dom";
import type { Color } from "../../../lib/grid";
import { assetPath } from "../../../lib/assetPath";
import { symbolForColorId } from "../../../lib/symbols";
import { contrastForHex } from "../utils/colorUtils";
import { organizePaletteByHueAndLightness } from "../utils/paletteSort";

type UsedColorEntry = { color: Color; count: number };
type ActionTargetPickEvent = { mode: "replace" | "merge"; colorId: number; nonce: number };

type UsedColorsSectionProps = {
  cardStyle: React.CSSProperties;
  cardShadow: string;
  cardShadowCollapsed: string;
  embedded?: boolean;
  hideActionToolbar?: boolean;
  hideScopeTabs?: boolean;
  listMaxHeight?: number;
  headerActionLabel?: string;
  onHeaderActionClick?: () => void;
  usedColorsOpen: boolean;
  setUsedColorsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  collapseStyle: (open: boolean, maxHeight?: number) => React.CSSProperties;
  usedColors: UsedColorEntry[];
  usedColorIds: number[];
  palette: Color[];
  hasAnyPaintedCells: boolean;
  remapMode: boolean;
  mergeMode: boolean;
  deleteMode: boolean;
  toggleRemapMode: () => void;
  toggleMergeMode: () => void;
  toggleDeleteMode: () => void;
  filterMode: boolean;
  filterSelecting: boolean;
  hasActiveSelection: boolean;
  startFilterSelection: () => void;
  clearFilterSelection: () => void;
  deleteSelectedIds: number[];
  mergeSelectedIds: number[];
  mergeTargetId: number | null;
  mergePreviewEnabled: boolean;
  remapSourceId: number | null;
  remapTargetId: number | null;
  remapPreviewEnabled: boolean;
  deletePreviewEnabled: boolean;
  identifyColorId: number | null;
  showSymbols: boolean;
  symbolMap: Map<number, string>;
  actionTargetEyedropperMode: null | "replace" | "merge";
  actionTargetPickEvent: ActionTargetPickEvent | null;
  setIdentifyColorId: React.Dispatch<React.SetStateAction<number | null>>;
  setActiveColorId: React.Dispatch<React.SetStateAction<number>>;
  setDeleteSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  setMergeSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  setMergeTargetId: React.Dispatch<React.SetStateAction<number | null>>;
  setMergePreviewEnabled: (enabled: boolean) => void;
  setRemapPreviewEnabled: (enabled: boolean) => void;
  setDeletePreviewEnabled: (enabled: boolean) => void;
  beginRemap: (id: number) => void;
  setRemapPreviewTarget: (id: number) => void;
  clearRemapSource: () => void;
  clearRemapTarget: () => void;
  confirmRemap: () => void;
  replaceColor: (sourceId: number, targetId: number) => void;
  confirmMerge: () => void;
  confirmDeleteColors: () => void;
  cancelRemap: () => void;
  cancelMerge: () => void;
  cancelDelete: () => void;
  setRemapMode: React.Dispatch<React.SetStateAction<boolean>>;
  setMergeMode: React.Dispatch<React.SetStateAction<boolean>>;
  setDeleteMode: React.Dispatch<React.SetStateAction<boolean>>;
  startActionTargetEyedropper: (mode: "replace" | "merge") => void;
  cancelActionTargetEyedropper: () => void;
};

const PANEL_STYLE: React.CSSProperties = {
  display: "grid",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--ui-border-subtle)",
  background: "var(--ui-surface-soft)",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
};

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 0.02,
};

const SECTION_DIVIDER_STYLE: React.CSSProperties = {
  paddingTop: 14,
  borderTop: "1px solid var(--ui-divider)",
};

const FIELD_LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
};

const SUBTEXT_STYLE: React.CSSProperties = {
  fontSize: 11,
  opacity: 0.7,
};

const ACTION_SELECTED_BG = "color-mix(in srgb, var(--accent-soft) 40%, transparent)";
const ACTION_SELECTED_ACCENT = "color-mix(in srgb, var(--accent) 70%, white 30%)";

const ACTION_HINT_PANEL_STYLE: React.CSSProperties = {
  display: "grid",
  gap: 6,
  padding: "10px 12px",
  border: "none",
  background: "transparent",
};

const SUMMARY_BOX_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  minHeight: 42,
  padding: 0,
  borderRadius: 0,
  border: "none",
  background: "transparent",
};

const ACTION_BUTTON_STYLE: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
};

const CANCEL_BUTTON_STYLE: React.CSSProperties = {
  padding: "2px 8px",
  borderRadius: 999,
  border: "none",
  background: "var(--muted-bg)",
  color: "var(--foreground)",
  cursor: "pointer",
  fontSize: 11,
  fontWeight: 600,
};

const EMPTY_STATE_STYLE: React.CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: 6,
  padding: "16px 12px",
  borderRadius: 10,
  background: "var(--ui-surface-faint)",
  color: "var(--foreground)",
  textAlign: "center",
};

const INLINE_REPLACE_COLUMNS = 9;
const POPOVER_INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  padding: "6px 8px",
  borderRadius: 8,
  border: "1px solid transparent",
  background: "var(--muted-bg)",
  color: "var(--foreground)",
  fontSize: 12,
};

function ColorSummary({ color, placeholder }: { color: Color | null; placeholder: string }) {
  if (!color) {
    return <span style={SUBTEXT_STYLE}>{placeholder}</span>;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          background: color.hex,
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
          flexShrink: 0,
        }}
      />
      <span style={{ display: "grid", gap: 1, minWidth: 0, lineHeight: 1.1 }}>
        <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 600 }}>{color.code ?? color.id}</span>
        <span style={{ fontSize: 12, fontWeight: 600, minWidth: 0, overflowWrap: "anywhere" }}>{color.name}</span>
      </span>
    </div>
  );
}

function SelectedColorDetail({ color }: { color: Color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: "1 1 0" }}>
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          background: color.hex,
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
          flexShrink: 0,
        }}
      />
      <span style={{ display: "grid", gap: 1, minWidth: 0, lineHeight: 1.1, flex: "1 1 auto" }}>
        <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 600 }}>{color.code ?? color.id}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            minWidth: 0,
            whiteSpace: "normal",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {color.name}
        </span>
      </span>
    </div>
  );
}

function formatStitchCount(count: number) {
  if (count < 100) return String(count);
  if (count < 1000) return `${Math.round(count / 10) * 10}`;
  if (count < 10000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  if (count < 1000000) return `${Math.round(count / 1000)}k`;
  return `${(count / 1000000).toFixed(1).replace(/\.0$/, "")}m`;
}

function formatDmcLabel(color: Color) {
  return `DMC-${color.code ?? color.id}`;
}

function ToolEmptyState({
  icon,
  title,
  detail,
  plain = false,
  subtleTitle = false,
}: {
  icon?: string;
  title: string;
  detail: string;
  plain?: boolean;
  subtleTitle?: boolean;
}) {
  return (
    <div
      style={
        plain
          ? {
              display: "grid",
              justifyItems: "center",
              gap: 6,
              padding: "16px 12px",
              color: "var(--foreground)",
              textAlign: "center",
            }
          : EMPTY_STATE_STYLE
      }
    >
      {icon ? (
        <img
          src={assetPath(icon)}
          alt=""
          aria-hidden="true"
          width={18}
          height={18}
          style={{ display: "block", filter: "var(--icon-on-bg-filter)", opacity: 0.8 }}
        />
      ) : null}
      <div style={subtleTitle ? { fontSize: 12, opacity: 0.72, fontWeight: 400 } : { fontSize: 13, fontWeight: 700 }}>
        {title}
      </div>
      {detail ? <div style={{ fontSize: 12, opacity: 0.72 }}>{detail}</div> : null}
    </div>
  );
}

function UsedColorsSectionComponent({
  cardStyle,
  cardShadow,
  cardShadowCollapsed,
  embedded = false,
  hideActionToolbar = false,
  hideScopeTabs = false,
  listMaxHeight,
  headerActionLabel,
  onHeaderActionClick,
  usedColorsOpen,
  setUsedColorsOpen,
  collapseStyle,
  usedColors,
  usedColorIds,
  palette,
  hasAnyPaintedCells,
  remapMode,
  mergeMode,
  deleteMode,
  toggleRemapMode,
  toggleMergeMode,
  toggleDeleteMode,
  filterMode,
  filterSelecting,
  hasActiveSelection,
  startFilterSelection,
  clearFilterSelection,
  deleteSelectedIds,
  mergeSelectedIds,
  mergeTargetId,
  mergePreviewEnabled,
  remapSourceId,
  remapTargetId,
  remapPreviewEnabled,
  deletePreviewEnabled,
  identifyColorId,
  showSymbols,
  symbolMap,
  actionTargetEyedropperMode,
  actionTargetPickEvent,
  setIdentifyColorId,
  setActiveColorId,
  setDeleteSelectedIds,
  setMergeSelectedIds,
  setMergeTargetId,
  setMergePreviewEnabled,
  setRemapPreviewEnabled,
  setDeletePreviewEnabled,
  beginRemap,
  setRemapPreviewTarget,
  clearRemapSource,
  clearRemapTarget,
  confirmRemap,
  replaceColor,
  confirmMerge,
  confirmDeleteColors,
  cancelRemap,
  cancelMerge,
  cancelDelete,
  setRemapMode,
  setMergeMode,
  setDeleteMode,
  startActionTargetEyedropper,
  cancelActionTargetEyedropper,
}: UsedColorsSectionProps) {
  const [scopeTab, setScopeTab] = React.useState<"pattern" | "selection">(filterMode ? "selection" : "pattern");
  const [inlineReplaceSourceId, setInlineReplaceSourceId] = React.useState<number | null>(null);
  const [inlineReplaceQuery, setInlineReplaceQuery] = React.useState("");
  const [inlineReplacePaletteSource, setInlineReplacePaletteSource] = React.useState<"all" | "used">("all");
  const [inlineReplaceView, setInlineReplaceView] = React.useState<"grid" | "list">("grid");
  const [inlineShowDmcCodes, setInlineShowDmcCodes] = React.useState(false);
  const [inlineShowStitchCounts, setInlineShowStitchCounts] = React.useState(false);
  const [actionTargetPicker, setActionTargetPicker] = React.useState<null | "replace" | "merge">(null);
  const [actionTargetQuery, setActionTargetQuery] = React.useState("");
  const [actionTargetPaletteSource, setActionTargetPaletteSource] = React.useState<"all" | "used">("used");
  const [actionTargetView, setActionTargetView] = React.useState<"grid" | "list">("list");
  const [actionTargetShowDmcCodes, setActionTargetShowDmcCodes] = React.useState(true);
  const [actionTargetShowStitchCounts, setActionTargetShowStitchCounts] = React.useState(true);
  const inlineReplaceTriggerRefs = React.useRef<Record<number, HTMLButtonElement | null>>({});
  const inlineReplacePopoverRef = React.useRef<HTMLDivElement | null>(null);
  const actionTargetTriggerRefs = React.useRef<Record<"replace" | "merge", HTMLButtonElement | null>>({
    replace: null,
    merge: null,
  });
  const actionTargetPopoverRef = React.useRef<HTMLDivElement | null>(null);
  const actionFooterRef = React.useRef<HTMLDivElement | null>(null);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [inlineReplacePopoverPosition, setInlineReplacePopoverPosition] = React.useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [actionTargetPopoverPosition, setActionTargetPopoverPosition] = React.useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [actionFooterHeight, setActionFooterHeight] = React.useState(0);
  const [embeddedViewportHeight, setEmbeddedViewportHeight] = React.useState<number | null>(null);
  const previousScopeTabRef = React.useRef<"pattern" | "selection" | null>(null);
  const usedColorIdSet = React.useMemo(() => new Set(usedColorIds), [usedColorIds]);
  const usedColorCountMap = React.useMemo(
    () => new Map(usedColors.map((entry) => [entry.color.id, entry.count])),
    [usedColors],
  );
  const inlineAllReplaceColors = React.useMemo(
    () => organizePaletteByHueAndLightness(palette, INLINE_REPLACE_COLUMNS).flat(),
    [palette],
  );
  const inlineUsedReplaceColors = React.useMemo(
    () =>
      palette
        .filter((color) => usedColorIdSet.has(color.id))
        .sort((a, b) => {
          const countDiff = (usedColorCountMap.get(b.id) ?? 0) - (usedColorCountMap.get(a.id) ?? 0);
          if (countDiff !== 0) return countDiff;
          return a.id - b.id;
        }),
    [palette, usedColorCountMap, usedColorIdSet],
  );
  const remapSourceColor = React.useMemo(
    () => usedColors.find((entry) => entry.color.id === remapSourceId)?.color ?? null,
    [remapSourceId, usedColors],
  );
  const remapTargetColor = React.useMemo(() => palette.find((color) => color.id === remapTargetId) ?? null, [
    palette,
    remapTargetId,
  ]);
  const mergeSelectedColors = React.useMemo(
    () => usedColors.filter((entry) => mergeSelectedIds.includes(entry.color.id)),
    [usedColors, mergeSelectedIds],
  );
  const mergeTargetColor = React.useMemo(
    () => palette.find((color) => color.id === mergeTargetId) ?? null,
    [mergeTargetId, palette],
  );
  const replaceReady = remapSourceId !== null && remapTargetId !== null;
  const selectionTabActive = scopeTab === "selection";
  const showSelectionCta = selectionTabActive && !hasActiveSelection;
  const selectionActionsDisabled = selectionTabActive && (!hasActiveSelection || usedColors.length === 0);
  const headerActionDisabled = usedColors.length === 0;
  const embeddedListCapped = embedded && typeof listMaxHeight === "number";

  React.useEffect(() => {
    if (filterMode && scopeTab !== "selection") {
      setScopeTab("selection");
    }
  }, [filterMode, scopeTab]);

  React.useEffect(() => {
    const previousScopeTab = previousScopeTabRef.current;
    previousScopeTabRef.current = scopeTab;
    if (previousScopeTab === null || previousScopeTab === scopeTab) return;

    setInlineReplaceSourceId(null);
    setInlineReplacePopoverPosition(null);
    setInlineReplaceQuery("");
    setInlineReplacePaletteSource("all");
    setActionTargetPicker(null);
    setActionTargetPopoverPosition(null);
    setActionTargetQuery("");
    setActionTargetPaletteSource("used");

    if (remapMode) {
      cancelRemap();
      setRemapMode(false);
    }
    if (mergeMode) {
      cancelMerge();
      setMergeMode(false);
    }
    if (deleteMode) {
      cancelDelete();
      setDeleteMode(false);
    }
  }, [
    scopeTab,
    remapMode,
    mergeMode,
    deleteMode,
    cancelRemap,
    cancelMerge,
    cancelDelete,
    setRemapMode,
    setMergeMode,
    setDeleteMode,
  ]);

  React.useEffect(() => {
    if (inlineReplaceSourceId === null) return;

    const updatePosition = () => {
      const trigger = inlineReplaceTriggerRefs.current[inlineReplaceSourceId];
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const viewportPadding = 12;
      const width = Math.min(360, Math.max(300, rect.width + 272));
      const left = Math.min(Math.max(viewportPadding, rect.left), window.innerWidth - width - viewportPadding);
      const top = rect.bottom + 8;
      setInlineReplacePopoverPosition({ top, left, width });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [inlineReplaceSourceId]);

  React.useEffect(() => {
    if (actionTargetPicker === null) return;

    const updatePosition = () => {
      const trigger = actionTargetTriggerRefs.current[actionTargetPicker];
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const viewportPadding = 12;
      const width = Math.min(300, window.innerWidth - viewportPadding * 2);
      const left = Math.min(Math.max(viewportPadding, rect.left), window.innerWidth - width - viewportPadding);
      const top = Math.max(viewportPadding, rect.top - 8);
      setActionTargetPopoverPosition({ top, left, width });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [actionTargetPicker]);

  React.useEffect(() => {
    if (actionTargetPicker === "replace" && remapSourceId === null) {
      setActionTargetPicker(null);
      setActionTargetPopoverPosition(null);
      setActionTargetQuery("");
      setActionTargetPaletteSource("used");
    }
    if (actionTargetPicker === "merge" && mergeSelectedIds.length < 2) {
      setActionTargetPicker(null);
      setActionTargetPopoverPosition(null);
      setActionTargetQuery("");
      setActionTargetPaletteSource("used");
    }
  }, [actionTargetPicker, mergeSelectedIds.length, remapSourceId]);

  React.useEffect(() => {
    if (!selectionActionsDisabled) return;
    if (remapMode) cancelRemap();
    if (mergeMode) cancelMerge();
    if (deleteMode) cancelDelete();
  }, [selectionActionsDisabled, remapMode, mergeMode, deleteMode, cancelRemap, cancelMerge, cancelDelete]);

  React.useLayoutEffect(() => {
    if (!embedded || embeddedListCapped) {
      setEmbeddedViewportHeight((prev) => (prev === null ? prev : null));
      return;
    }

    const node = rootRef.current;
    if (!node) return;

    let frame = 0;
    const update = () => {
      const container = node.closest(".pattern-sidebar-inner");
      if (!(container instanceof HTMLElement)) return;
      const nodeRect = node.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const next = Math.max(0, Math.floor(containerRect.bottom - nodeRect.top));
      setEmbeddedViewportHeight((prev) => (prev === next ? prev : next));
    };

    update();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(update);
      });
      observer.observe(node);
      const container = node.closest(".pattern-sidebar-inner");
      if (container instanceof HTMLElement) {
        observer.observe(container);
      }
      return () => {
        if (frame) cancelAnimationFrame(frame);
        observer.disconnect();
      };
    }

    window.addEventListener("resize", update);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
    };
  }, [embedded, embeddedListCapped]);

  React.useLayoutEffect(() => {
    const node = actionFooterRef.current;
    if (!node || (!deleteMode && !mergeMode && !remapMode)) {
      setActionFooterHeight((prev) => (prev === 0 ? prev : 0));
      return;
    }

    let frame = 0;
    const update = () => {
      const next = Math.ceil(node.getBoundingClientRect().height);
      setActionFooterHeight((prev) => (prev === next ? prev : next));
    };

    update();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(update);
      });
      observer.observe(node);
      return () => {
        if (frame) cancelAnimationFrame(frame);
        observer.disconnect();
      };
    }

    window.addEventListener("resize", update);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
    };
  }, [
    deleteMode,
    mergeMode,
    remapMode,
    usedColors.length,
    deleteSelectedIds.length,
    mergeSelectedIds.length,
    remapSourceId,
    remapTargetId,
    mergeTargetId,
    deletePreviewEnabled,
    mergePreviewEnabled,
    remapPreviewEnabled,
  ]);

  React.useEffect(() => {
    if (inlineReplaceSourceId === null) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const trigger = inlineReplaceTriggerRefs.current[inlineReplaceSourceId];
      if (inlineReplacePopoverRef.current?.contains(target) || trigger?.contains(target)) return;
      setInlineReplaceSourceId(null);
      setInlineReplacePopoverPosition(null);
      setInlineReplaceQuery("");
      setInlineReplacePaletteSource("all");
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [inlineReplaceSourceId]);

  React.useEffect(() => {
    if (actionTargetPicker === null) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const trigger = actionTargetTriggerRefs.current[actionTargetPicker];
      if (actionTargetPopoverRef.current?.contains(target) || trigger?.contains(target)) return;
      setActionTargetPicker(null);
      setActionTargetPopoverPosition(null);
      setActionTargetQuery("");
      setActionTargetPaletteSource("used");
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [actionTargetPicker]);
  const inlineReplaceOptions = React.useMemo<Color[]>(() => {
    if (inlineReplaceSourceId === null) return [];
    const query = inlineReplaceQuery.trim().toLowerCase();
    const baseColors = inlineReplacePaletteSource === "all" ? inlineAllReplaceColors : inlineUsedReplaceColors;
    return baseColors.filter((color) => {
      if (color.id === inlineReplaceSourceId) return false;
      if (!query) return true;
      const code = (color.code ?? "").toLowerCase();
      return color.name.toLowerCase().includes(query) || code.includes(query) || `#${code}`.includes(query);
    });
  }, [inlineAllReplaceColors, inlineReplacePaletteSource, inlineReplaceQuery, inlineReplaceSourceId, inlineUsedReplaceColors]);
  const actionReplaceOptions = React.useMemo<Color[]>(() => {
    const query = actionTargetQuery.trim().toLowerCase();
    const baseColors = actionTargetPaletteSource === "all" ? inlineAllReplaceColors : inlineUsedReplaceColors;
    return baseColors.filter((color) => {
      if (color.id === remapSourceId) return false;
      if (!query) return true;
      const code = (color.code ?? "").toLowerCase();
      return color.name.toLowerCase().includes(query) || code.includes(query) || `#${code}`.includes(query);
    });
  }, [actionTargetPaletteSource, actionTargetQuery, inlineAllReplaceColors, inlineUsedReplaceColors, remapSourceId]);
  const actionMergeOptions = React.useMemo<Color[]>(() => {
    const query = actionTargetQuery.trim().toLowerCase();
    const baseColors = actionTargetPaletteSource === "all" ? inlineAllReplaceColors : inlineUsedReplaceColors;
    return baseColors.filter((color) => {
      if (!query) return true;
      const code = (color.code ?? "").toLowerCase();
      return color.name.toLowerCase().includes(query) || code.includes(query) || `#${code}`.includes(query);
    });
  }, [actionTargetPaletteSource, actionTargetQuery, inlineAllReplaceColors, inlineUsedReplaceColors]);
  const actionTargetOptions = actionTargetPicker === "merge" ? actionMergeOptions : actionReplaceOptions;

  React.useEffect(() => {
    if (!actionTargetPickEvent) return;
    const frame = window.requestAnimationFrame(() => {
      if (actionTargetPickEvent.mode === "replace") {
        setRemapPreviewTarget(actionTargetPickEvent.colorId);
      } else {
        setMergeTargetId(actionTargetPickEvent.colorId);
        setMergePreviewEnabled(false);
      }
      setActionTargetPicker(actionTargetPickEvent.mode);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [actionTargetPickEvent, setMergePreviewEnabled, setMergeTargetId, setRemapPreviewTarget]);

  function closeInlineReplacePicker() {
    setInlineReplaceSourceId(null);
    setInlineReplacePopoverPosition(null);
    setInlineReplaceQuery("");
    setInlineReplacePaletteSource("all");
  }

  function closeActionTargetPicker() {
    cancelActionTargetEyedropper();
    setActionTargetPicker(null);
    setActionTargetPopoverPosition(null);
    setActionTargetQuery("");
    setActionTargetPaletteSource("used");
  }

  function openActionTargetPicker(mode: "replace" | "merge") {
    if (actionTargetPicker === mode) {
      closeActionTargetPicker();
      return;
    }
    setActionTargetPicker(mode);
    setActionTargetQuery("");
    setActionTargetPaletteSource("used");
    setActionTargetView("list");
  }

  function openInlineReplacePicker(sourceId: number) {
    setInlineReplaceSourceId(sourceId);
    setInlineReplaceQuery("");
    setInlineReplacePaletteSource("all");
  }
  function toggleSharedSourceColor(colorId: number) {
    if (remapMode) {
      if (remapSourceId === colorId) {
        clearRemapSource();
        return;
      }
      beginRemap(colorId);
      return;
    }
    if (mergeMode) {
      setMergeSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(colorId)) {
          next.delete(colorId);
          if (mergeTargetId === colorId) {
            setMergeTargetId(null);
          }
        } else {
          next.add(colorId);
        }
        return Array.from(next);
      });
      setMergePreviewEnabled(false);
      return;
    }
    if (deleteMode) {
      setDeleteSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(colorId)) {
          next.delete(colorId);
        } else {
          next.add(colorId);
        }
        return Array.from(next);
      });
      setDeletePreviewEnabled(false);
    }
  }
  return (
    <div
      ref={rootRef}
      className="app-card"
      style={{
        ...(embedded ? {} : cardStyle),
        boxShadow: embedded ? "none" : usedColorsOpen ? cardShadow : cardShadowCollapsed,
        display: embedded ? "flex" : undefined,
        flexDirection: embedded ? "column" : undefined,
        flex: embedded && !embeddedListCapped ? 1 : undefined,
        minHeight: embedded && !embeddedListCapped ? 0 : undefined,
        height:
          embedded && !embeddedListCapped ? (embeddedViewportHeight ? `${embeddedViewportHeight}px` : "100%") : undefined,
        overflow: "visible",
        zIndex: remapMode ? 8 : undefined,
        paddingBottom: embedded ? 0 : remapMode ? 56 : cardStyle.paddingBottom,
      }}
    >
      {!embedded ? (
        <button
          onClick={() => setUsedColorsOpen((open) => !open)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            border: "none",
            background: "transparent",
            padding: 0,
            marginBottom: usedColorsOpen ? 10 : 0,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 15,
          }}
          type="button"
        >
          <span>Color Actions</span>
          <span style={{ opacity: 0.7, width: 14, textAlign: "center" }}>{usedColorsOpen ? "▾" : "▸"}</span>
        </button>
      ) : null}
      <div
        style={{
          ...(embedded
            ? {
                minHeight: 0,
                opacity: 1,
                transform: "translateY(0)",
                overflow: "visible",
                pointerEvents: "auto",
              }
            : collapseStyle(usedColorsOpen, 800)),
          overflow: "visible",
          display: "grid",
          gridTemplateRows: "auto auto minmax(0, 1fr)",
          gap: 12,
          flex: embedded && !embeddedListCapped ? 1 : undefined,
          minHeight: embedded && !embeddedListCapped ? 0 : undefined,
          height: embedded && !embeddedListCapped ? "100%" : undefined,
        }}
      >
        <div
          style={{
            display: "grid",
            gap: 10,
            marginBottom: 0,
          }}
        >
          {!hideScopeTabs ? (
            <div
              role="tablist"
              aria-label="Color action scope"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: 2,
                borderRadius: 10,
                border: "1px solid var(--ui-border-subtle)",
                background: "var(--ui-surface-soft)",
                opacity: hasAnyPaintedCells ? 1 : 0.5,
              }}
            >
              <button
                type="button"
                role="tab"
                onClick={() => {
                  setScopeTab("pattern");
                  if (!hasAnyPaintedCells || !filterMode) return;
                  clearFilterSelection();
                }}
                aria-selected={scopeTab === "pattern"}
                data-active={scopeTab === "pattern" ? "true" : undefined}
                className="menu-tab-button"
                disabled={!hasAnyPaintedCells}
                style={{
                  padding: "6px 8px",
                  flex: "1 1 0",
                  borderRadius: 8,
                  border: "none",
                  color: "var(--foreground)",
                  cursor: hasAnyPaintedCells ? "pointer" : "not-allowed",
                  fontSize: 11,
                  fontWeight: 600,
                  lineHeight: 1.1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                <span className="toolbar-icon" aria-hidden="true" style={{ width: 16, height: 16, display: "grid", placeItems: "center" }}>
                  <img
                    src={assetPath("/icons/grid.svg")}
                    alt=""
                    aria-hidden="true"
                    width={12}
                    height={12}
                    style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                  />
                </span>
                <span className="toolbar-label" style={{ fontSize: 11, lineHeight: 1.1 }}>
                  Entire Canvas
                </span>
              </button>
              <button
                type="button"
                role="tab"
                onClick={() => {
                  setScopeTab("selection");
                }}
                aria-selected={scopeTab === "selection"}
                data-active={scopeTab === "selection" ? "true" : undefined}
                className="menu-tab-button"
                disabled={!hasAnyPaintedCells}
                style={{
                  padding: "6px 8px",
                  flex: "1 1 0",
                  borderRadius: 8,
                  border: "none",
                  color: "var(--foreground)",
                  cursor: hasAnyPaintedCells ? "pointer" : "not-allowed",
                  fontSize: 11,
                  fontWeight: 600,
                  lineHeight: 1.1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span className="toolbar-label" style={{ fontSize: 11, lineHeight: 1.1 }}>
                  Selection
                </span>
              </button>
            </div>
          ) : null}
          {!hideScopeTabs && showSelectionCta ? (
            <div
              style={{
                display: "grid",
                gap: 8,
                padding: "12px 12px",
                borderRadius: 10,
                background: "var(--ui-surface-faint)",
                justifyItems: "center",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 12, lineHeight: 1.35, color: "var(--foreground)" }}>
                Draw a rectangle on the canvas to select an area.
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => startFilterSelection()}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--ui-border-subtle)",
                    background: filterSelecting ? "var(--accent-soft)" : "var(--card-bg)",
                    color: filterSelecting ? "var(--accent-strong)" : "var(--foreground)",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {filterSelecting ? "Drawing..." : "Draw Selection"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
        {!hideActionToolbar ? (
          <div
            style={{
              display: "grid",
              gap: 10,
              padding: "10px 0",
              borderTop: "1px solid rgba(15, 23, 42, 0.08)",
              borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
            }}
          >
            <div
              className="used-colors-toolbar"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 0,
              }}
            >
            <button
              onClick={toggleRemapMode}
              aria-pressed={remapMode}
              aria-label="Replace colors"
              data-active={remapMode ? "true" : undefined}
              className="toolbar-button"
              disabled={selectionActionsDisabled}
              onMouseEnter={(event) => {
                if (!remapMode && !selectionActionsDisabled) {
                  event.currentTarget.style.background = "var(--ui-hover-soft)";
                }
              }}
              onMouseLeave={(event) => {
                if (!remapMode && !selectionActionsDisabled) {
                  event.currentTarget.style.background = "transparent";
                }
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                flex: "1 1 0",
                width: 0,
                cursor: selectionActionsDisabled ? "not-allowed" : "pointer",
                display: "flex",
                gap: 5,
                alignItems: "center",
                justifyContent: "center",
                minHeight: 34,
                opacity: selectionActionsDisabled ? 0.55 : 1,
                whiteSpace: "nowrap",
                border: remapMode ? "1px solid var(--accent-strong)" : "1px solid transparent",
                background: remapMode ? "var(--accent-soft)" : "transparent",
                color: remapMode ? "var(--accent-strong)" : "var(--foreground)",
                boxShadow: remapMode ? "0 0 0 1px color-mix(in srgb, var(--accent-strong) 14%, transparent)" : "none",
              }}
            >
              <span className="toolbar-icon" aria-hidden="true" style={{ width: 16, height: 16, display: "grid", placeItems: "center" }}>
                <img
                  src={assetPath("/icons/swap.svg")}
                  alt=""
                  aria-hidden="true"
                  width={12}
                  height={12}
                  style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                />
              </span>
              <span className="toolbar-label" style={{ fontSize: 11, lineHeight: 1.1 }}>
                Replace
              </span>
            </button>
            <button
              onClick={toggleMergeMode}
              aria-pressed={mergeMode}
              aria-label="Merge colors"
              data-active={mergeMode ? "true" : undefined}
              className="toolbar-button"
              disabled={selectionActionsDisabled}
              onMouseEnter={(event) => {
                if (!mergeMode && !selectionActionsDisabled) {
                  event.currentTarget.style.background = "var(--ui-hover-soft)";
                }
              }}
              onMouseLeave={(event) => {
                if (!mergeMode && !selectionActionsDisabled) {
                  event.currentTarget.style.background = "transparent";
                }
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                flex: "1 1 0",
                width: 0,
                cursor: selectionActionsDisabled ? "not-allowed" : "pointer",
                display: "flex",
                gap: 5,
                alignItems: "center",
                justifyContent: "center",
                minHeight: 34,
                opacity: selectionActionsDisabled ? 0.55 : 1,
                whiteSpace: "nowrap",
                border: mergeMode ? "1px solid var(--accent-strong)" : "1px solid transparent",
                background: mergeMode ? "var(--accent-soft)" : "transparent",
                color: mergeMode ? "var(--accent-strong)" : "var(--foreground)",
                boxShadow: mergeMode ? "0 0 0 1px color-mix(in srgb, var(--accent-strong) 14%, transparent)" : "none",
              }}
            >
              <span className="toolbar-icon" aria-hidden="true">
                <img
                  src={assetPath("/icons/merge.svg")}
                  alt=""
                  aria-hidden="true"
                  width={12}
                  height={12}
                  style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                />
              </span>
              <span className="toolbar-label" style={{ fontSize: 11, lineHeight: 1.1 }}>
                Merge
              </span>
            </button>
            <button
              onClick={toggleDeleteMode}
              aria-pressed={deleteMode}
              aria-label="Delete colors"
              data-active={deleteMode ? "true" : undefined}
              className="toolbar-button"
              disabled={selectionActionsDisabled}
              onMouseEnter={(event) => {
                if (!deleteMode && !selectionActionsDisabled) {
                  event.currentTarget.style.background = "var(--ui-hover-soft)";
                }
              }}
              onMouseLeave={(event) => {
                if (!deleteMode && !selectionActionsDisabled) {
                  event.currentTarget.style.background = "transparent";
                }
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                flex: "1 1 0",
                width: 0,
                cursor: selectionActionsDisabled ? "not-allowed" : "pointer",
                display: "flex",
                gap: 5,
                alignItems: "center",
                justifyContent: "center",
                minHeight: 34,
                opacity: selectionActionsDisabled ? 0.55 : 1,
                whiteSpace: "nowrap",
                border: deleteMode ? "1px solid var(--accent-strong)" : "1px solid transparent",
                background: deleteMode ? "var(--accent-soft)" : "transparent",
                color: deleteMode ? "var(--accent-strong)" : "var(--foreground)",
                boxShadow: deleteMode ? "0 0 0 1px color-mix(in srgb, var(--accent-strong) 14%, transparent)" : "none",
              }}
            >
              <span className="toolbar-icon" aria-hidden="true">
                <img
                  src={assetPath("/icons/deselect.svg")}
                  alt=""
                  aria-hidden="true"
                  width={12}
                  height={12}
                  style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                />
              </span>
              <span className="toolbar-label" style={{ fontSize: 11, lineHeight: 1.1 }}>
                Delete
              </span>
            </button>
            </div>
          </div>
        ) : null}
        <div
          style={{
            position: "relative",
            minHeight: 0,
            height: "100%",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateRows: "auto minmax(0, 1fr)",
              height: embeddedListCapped ? undefined : "100%",
              minHeight: embeddedListCapped ? undefined : 0,
              gap: 8,
              padding: "2px 0 0",
              background: "transparent",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                border: "none",
                background: "transparent",
                padding: 0,
                marginBottom: 2,
                textAlign: "left",
                flexShrink: 0,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6, minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#000" }}>
                  {selectionTabActive ? "Selection Colors" : "Colors in Design"}
                </span>
                <span style={{ fontSize: 11, opacity: 0.72 }}>
                  {(showSelectionCta ? 0 : usedColors.length)} {(showSelectionCta ? 0 : usedColors.length) === 1 ? "color" : "colors"}
                </span>
              </span>
              {headerActionLabel && onHeaderActionClick ? (
                <button
                  type="button"
                  disabled={headerActionDisabled}
                  onClick={onHeaderActionClick}
                  onMouseEnter={(event) => {
                    if (headerActionDisabled) return;
                    event.currentTarget.style.background = "rgba(15, 23, 42, 0.12)";
                  }}
                  onMouseLeave={(event) => {
                    if (headerActionDisabled) return;
                    event.currentTarget.style.background = "rgba(15, 23, 42, 0.07)";
                  }}
                  style={{
                    border: "none",
                    background: "rgba(15, 23, 42, 0.07)",
                    color: "var(--foreground)",
                    cursor: headerActionDisabled ? "not-allowed" : "pointer",
                    borderRadius: 8,
                    padding: "6px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                    lineHeight: 1.1,
                    flexShrink: 0,
                    opacity: headerActionDisabled ? 0.5 : 1,
                  }}
                >
                  {headerActionLabel}
                </button>
              ) : null}
            </div>
            <div
              style={{
                display: "grid",
                gap: 12,
                flex: 1,
                minHeight: 0,
                maxHeight: typeof listMaxHeight === "number" ? listMaxHeight : undefined,
                alignContent: "start",
                overflowY: "scroll",
                overflowX: "hidden",
                overscrollBehaviorY: "contain",
                scrollbarGutter: "stable",
                paddingRight: 2,
                paddingBottom: deleteMode || mergeMode || remapMode ? actionFooterHeight + 10 : 0,
              }}
            >
              {showSelectionCta || usedColors.length === 0 ? (
                <ToolEmptyState
                  title={selectionTabActive ? "No colors in selection yet" : "No colors in pattern yet"}
                  detail={
                    selectionTabActive
                      ? ""
                      : "Paint some stitches to populate your pattern colors here."
                  }
                  plain={selectionTabActive}
                  subtleTitle={selectionTabActive}
                />
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: 0,
                  }}
                >
                  {usedColors.map(({ color, count }) => {
                  const isActive = identifyColorId === color.id;
                  const symbol = showSymbols ? symbolForColorId(color.id, symbolMap) : "";
                  const isModeSelected = remapMode
                    ? remapSourceId === color.id
                    : mergeMode
                      ? mergeSelectedIds.includes(color.id)
                      : deleteMode
                        ? deleteSelectedIds.includes(color.id)
                        : false;
                  const rowInteractive = remapMode || mergeMode || deleteMode;
                  return (
                    <div
                      key={color.id}
                      onClick={
                        rowInteractive
                          ? () => {
                              toggleSharedSourceColor(color.id);
                            }
                          : undefined
                      }
                      onKeyDown={
                        rowInteractive
                          ? (event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                toggleSharedSourceColor(color.id);
                              }
                            }
                          : undefined
                      }
                      role={rowInteractive ? "button" : undefined}
                      tabIndex={rowInteractive ? 0 : undefined}
                      aria-pressed={rowInteractive ? isModeSelected : undefined}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        minWidth: 0,
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "none",
                        background: isModeSelected ? ACTION_SELECTED_BG : "transparent",
                        boxShadow: isModeSelected ? "inset 0 0 0 1px var(--accent-strong)" : "none",
                        textAlign: "left",
                        cursor: rowInteractive ? "pointer" : "default",
                      }}
                      onMouseEnter={(event) => {
                        if (!isModeSelected) {
                          event.currentTarget.style.background = "var(--ui-surface-soft)";
                        }
                      }}
                      onMouseLeave={(event) => {
                        if (!isModeSelected) {
                          event.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      {mergeMode || deleteMode ? (
                        <span
                          aria-hidden="true"
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 4,
                            border: isModeSelected ? "1px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                            background: isModeSelected ? ACTION_SELECTED_ACCENT : "transparent",
                            color: "#ffffff",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                            fontSize: 11,
                            fontWeight: 800,
                            lineHeight: 1,
                          }}
                        >
                          {isModeSelected ? "✓" : ""}
                        </span>
                      ) : null}
                      {rowInteractive ? (
                        <span
                          style={{
                            position: "relative",
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: color.hex,
                            boxShadow:
                              contrastForHex(color.hex) === "#000000"
                                ? "inset 0 0 0 1px rgba(15,23,42,0.12)"
                                : "none",
                            flexShrink: 0,
                            overflow: "visible",
                          }}
                        >
                          {symbol ? (
                            <span
                              style={{
                                position: "absolute",
                                inset: 0,
                                display: "grid",
                                placeItems: "center",
                                fontSize: 13,
                                fontWeight: 700,
                                color: contrastForHex(color.hex),
                                opacity: 0.85,
                                pointerEvents: "none",
                              }}
                            >
                              {symbol}
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <button
                          type="button"
                          ref={(node) => {
                            inlineReplaceTriggerRefs.current[color.id] = node;
                          }}
                          onClick={() => {
                            if (inlineReplaceSourceId === color.id) {
                              closeInlineReplacePicker();
                              return;
                            }
                            openInlineReplacePicker(color.id);
                          }}
                          aria-pressed={inlineReplaceSourceId === color.id}
                          aria-label={`Replace ${color.name}`}
                          title={`Replace ${color.name}`}
                          style={{
                            position: "relative",
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            border: inlineReplaceSourceId === color.id ? "2px solid var(--accent-strong)" : "none",
                            background: color.hex,
                            boxShadow:
                              inlineReplaceSourceId === color.id
                                ? `0 0 0 2px ${ACTION_SELECTED_BG}`
                                : contrastForHex(color.hex) === "#000000"
                                  ? "inset 0 0 0 1px rgba(15,23,42,0.12)"
                                  : "none",
                            flexShrink: 0,
                            overflow: "visible",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          {symbol ? (
                            <span
                              style={{
                                position: "absolute",
                                inset: 0,
                                display: "grid",
                                placeItems: "center",
                                fontSize: 13,
                                fontWeight: 700,
                                color: contrastForHex(color.hex),
                                opacity: 0.85,
                                pointerEvents: "none",
                              }}
                            >
                              {symbol}
                            </span>
                          ) : null}
                        </button>
                      )}
                      <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: "1 1 auto" }}>
                        <span style={{ display: "grid", gap: 3, minWidth: 0, flex: "1 1 auto", lineHeight: 1.1 }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              minWidth: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {color.name}
                          </span>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "fit-content",
                              maxWidth: "100%",
                              padding: "1px 5px",
                              borderRadius: 999,
                              background: "var(--muted-bg)",
                              color: "var(--foreground)",
                              fontSize: 9,
                              fontWeight: 600,
                              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
                              letterSpacing: 0.02,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatDmcLabel(color)}
                          </span>
                        </span>
                        <span
                          style={{
                            display: "inline-grid",
                            placeItems: "center",
                            minWidth: 16,
                            height: 16,
                            padding: 0,
                            borderRadius: 0,
                            background: "transparent",
                            color: "rgba(15, 23, 42, 0.52)",
                            fontSize: 10,
                            fontWeight: 600,
                            lineHeight: 1,
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {count}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setIdentifyColorId((prev) => (prev === color.id ? null : color.id));
                        }}
                        onKeyDown={(event) => {
                          event.stopPropagation();
                        }}
                        aria-pressed={isActive}
                        aria-label={isActive ? `Hide ${color.name}` : `Highlight ${color.name}`}
                        title={isActive ? `Hide ${color.name}` : `Highlight ${color.name}`}
                        style={{
                          flexShrink: 0,
                          width: 26,
                          height: 26,
                          display: "grid",
                          placeItems: "center",
                          borderRadius: 8,
                          border: isActive ? "1px solid var(--accent-strong)" : "none",
                          background: isActive ? "var(--accent-soft)" : "transparent",
                          cursor: "pointer",
                          padding: 0,
                        }}
                        onMouseEnter={(event) => {
                          if (!isActive) {
                            event.currentTarget.style.background = "var(--ui-hover-soft)";
                          }
                        }}
                        onMouseLeave={(event) => {
                          if (!isActive) {
                            event.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            display: "block",
                            fontSize: 15,
                            lineHeight: 1,
                            color: isActive ? "var(--accent-strong)" : "var(--foreground)",
                            opacity: isActive ? 1 : 0.72,
                          }}
                        >
                          ⌕
                        </span>
                      </button>
                    </div>
                  );
                  })}
                </div>
              )}
            </div>
          </div>
          {deleteMode || mergeMode || remapMode ? (
            <div
              ref={actionFooterRef}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                display: "grid",
                gap: 10,
                zIndex: 2,
                flexShrink: 0,
                paddingTop: 10,
                paddingBottom: 10,
                background: "var(--card-bg)",
                borderTop: "1px solid rgba(15, 23, 42, 0.08)",
              }}
            >
              {deleteMode ? (
                <div style={{ display: "grid", gap: 14 }}>
                  {usedColors.length === 0 ? (
                    <ToolEmptyState
                      icon="/icons/deselect.svg"
                      title="No colors to delete yet"
                      detail="Paint some stitches first, then choose colors to delete here."
                    />
                  ) : deleteSelectedIds.length === 0 ? (
                    <div style={ACTION_HINT_PANEL_STYLE}>
                      <div style={{ ...SUBTEXT_STYLE, fontSize: 12, color: "var(--foreground)", opacity: 1 }}>
                        Select a color to delete.
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "grid", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={FIELD_LABEL_STYLE}>
                            Colors to Delete{" "}
                            {deleteSelectedIds.length > 0 ? (
                              <span style={{ fontWeight: 400 }}>({deleteSelectedIds.length} selected)</span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gap: 14 }}>
                        <button
                          onClick={() => setDeletePreviewEnabled(!deletePreviewEnabled)}
                          disabled={deleteSelectedIds.length === 0 || usedColors.length - deleteSelectedIds.length < 1}
                          style={{
                            ...ACTION_BUTTON_STYLE,
                            width: "100%",
                            border: "none",
                            background: deletePreviewEnabled ? ACTION_SELECTED_BG : "var(--muted-bg)",
                            color: deletePreviewEnabled ? "var(--accent-strong)" : "var(--foreground)",
                            cursor:
                              deleteSelectedIds.length === 0 || usedColors.length - deleteSelectedIds.length < 1
                                ? "not-allowed"
                                : "pointer",
                            opacity:
                              deleteSelectedIds.length === 0 || usedColors.length - deleteSelectedIds.length < 1 ? 0.5 : 1,
                            minHeight: 34,
                          }}
                        >
                          {deletePreviewEnabled ? "Hide Preview" : "Preview"}
                        </button>
                        <div style={{ display: "flex", alignItems: "stretch", gap: 10 }}>
                          <button
                            onClick={cancelDelete}
                            style={{
                              ...ACTION_BUTTON_STYLE,
                              flex: "1 1 0",
                              border: "none",
                              background: "var(--muted-bg)",
                              color: "var(--foreground)",
                              cursor: "pointer",
                              minHeight: 34,
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={confirmDeleteColors}
                            disabled={deleteSelectedIds.length === 0 || usedColors.length - deleteSelectedIds.length < 1}
                            style={{
                              ...ACTION_BUTTON_STYLE,
                              flex: "1 1 0",
                              border: "none",
                              background: "var(--accent)",
                              color: "#ffffff",
                              cursor:
                                deleteSelectedIds.length === 0 || usedColors.length - deleteSelectedIds.length < 1
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                deleteSelectedIds.length === 0 || usedColors.length - deleteSelectedIds.length < 1 ? 0.5 : 1,
                              minHeight: 34,
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : null}

              {mergeMode ? (
                <div style={{ display: "grid", gap: 14 }}>
                  {usedColors.length === 0 ? (
                    <ToolEmptyState
                      icon="/icons/merge.svg"
                      title="No colors to merge yet"
                      detail="Paint some stitches first, then choose colors to merge here."
                    />
                  ) : mergeSelectedIds.length < 2 ? (
                    <div style={ACTION_HINT_PANEL_STYLE}>
                      <div style={{ ...SUBTEXT_STYLE, fontSize: 12, color: "var(--foreground)", opacity: 1 }}>
                        {mergeSelectedIds.length === 0 ? "Select colors to merge." : "Select 1 more color to merge."}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "grid", gap: 10, padding: "4px 0" }}>
                        <div style={{ display: "grid", gap: 10 }}>
                          <div style={FIELD_LABEL_STYLE}>Merge {mergeSelectedIds.length} colors into:</div>
                          <button
                            type="button"
                            ref={(node) => {
                              actionTargetTriggerRefs.current.merge = node;
                            }}
                            onClick={() => openActionTargetPicker("merge")}
                            disabled={mergeSelectedIds.length < 2}
                            aria-haspopup="dialog"
                            aria-expanded={actionTargetPicker === "merge"}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              width: "100%",
                              minWidth: 0,
                              padding: "6px 10px",
                              minHeight: 34,
                              borderRadius: 10,
                              border:
                                actionTargetPicker === "merge"
                                  ? "1px solid var(--accent-strong)"
                                  : "1px solid var(--ui-border-subtle)",
                              background: actionTargetPicker === "merge" ? ACTION_SELECTED_BG : "var(--card-bg)",
                              boxShadow:
                                actionTargetPicker === "merge"
                                  ? "0 0 0 1px color-mix(in srgb, var(--accent-strong) 12%, transparent)"
                                  : "none",
                              cursor: mergeSelectedIds.length < 2 ? "not-allowed" : "pointer",
                              opacity: mergeSelectedIds.length < 2 ? 0.6 : 1,
                              textAlign: "left",
                            }}
                          >
                            {mergeTargetColor ? (
                              <>
                                <span
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 8,
                                    background: mergeTargetColor.hex,
                                    boxShadow:
                                      contrastForHex(mergeTargetColor.hex) === "#000000"
                                        ? "inset 0 0 0 1px rgba(15,23,42,0.12)"
                                        : "none",
                                    flexShrink: 0,
                                  }}
                                />
                                <span style={{ display: "grid", gap: 2, minWidth: 0, flex: "1 1 auto", lineHeight: 1.1 }}>
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 600,
                                      minWidth: 0,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {mergeTargetColor.name}
                                  </span>
                                </span>
                              </>
                            ) : (
                              <span style={SUBTEXT_STYLE}>
                                {mergeSelectedIds.length < 2
                                  ? "Select at least 2 colors above first."
                                  : "Choose the merge target color."}
                              </span>
                            )}
                            <span
                              aria-hidden="true"
                              style={{
                                marginLeft: "auto",
                                color: "var(--foreground)",
                                opacity: 0.45,
                                fontSize: 14,
                                lineHeight: 1,
                                flexShrink: 0,
                              }}
                            >
                              ▾
                            </span>
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "grid", gap: 10 }}>
                        <button
                          onClick={() => setMergePreviewEnabled(!mergePreviewEnabled)}
                          disabled={mergeSelectedIds.length < 2 || mergeTargetId === null}
                          style={{
                            ...ACTION_BUTTON_STYLE,
                            width: "100%",
                            border: "none",
                            background: mergePreviewEnabled ? ACTION_SELECTED_BG : "var(--muted-bg)",
                            color: mergePreviewEnabled ? "var(--accent-strong)" : "var(--foreground)",
                            cursor: mergeSelectedIds.length < 2 || mergeTargetId === null ? "not-allowed" : "pointer",
                            opacity: mergeSelectedIds.length < 2 || mergeTargetId === null ? 0.5 : 1,
                            minHeight: 34,
                          }}
                        >
                          {mergePreviewEnabled ? "Hide Preview" : "Preview"}
                        </button>
                        <div style={{ display: "flex", alignItems: "stretch", gap: 10 }}>
                          <button
                            onClick={cancelMerge}
                            style={{
                              ...ACTION_BUTTON_STYLE,
                              flex: "1 1 0",
                              border: "none",
                              background: "var(--muted-bg)",
                              color: "var(--foreground)",
                              cursor: "pointer",
                              minHeight: 34,
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={confirmMerge}
                            disabled={mergeSelectedIds.length < 2 || mergeTargetId === null}
                            style={{
                              ...ACTION_BUTTON_STYLE,
                              flex: "1 1 0",
                              border: "none",
                              background: "var(--accent)",
                              color: "#ffffff",
                              cursor: mergeSelectedIds.length < 2 || mergeTargetId === null ? "not-allowed" : "pointer",
                              opacity: mergeSelectedIds.length < 2 || mergeTargetId === null ? 0.5 : 1,
                              minHeight: 34,
                            }}
                          >
                            Merge
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : null}

              {remapMode ? (
                <div style={{ display: "grid", gap: 14 }}>
                  {usedColors.length === 0 ? (
                    <ToolEmptyState
                      icon="/icons/swap.svg"
                      title="No colors to replace yet"
                      detail="Paint some stitches first, then choose colors to replace here."
                    />
                  ) : remapSourceId === null ? (
                    <div style={ACTION_HINT_PANEL_STYLE}>
                      <div style={{ ...SUBTEXT_STYLE, fontSize: 12, color: "var(--foreground)", opacity: 1 }}>
                        Select a color to replace.
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "grid", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexWrap: "wrap" }}>
                          <div style={FIELD_LABEL_STYLE}>Replace</div>
                          {remapSourceColor ? (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                minWidth: 0,
                                maxWidth: "100%",
                                padding: "8px 10px",
                                borderRadius: 10,
                                background: "var(--card-bg)",
                                border: "none",
                              }}
                            >
                              <span
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 8,
                                  background: remapSourceColor.hex,
                                  boxShadow:
                                    contrastForHex(remapSourceColor.hex) === "#000000"
                                      ? "inset 0 0 0 1px rgba(15,23,42,0.12)"
                                      : "none",
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  minWidth: 0,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {remapSourceColor.name}
                              </span>
                            </div>
                          ) : (
                            <div style={SUBTEXT_STYLE}>Select the source color from Colors in Pattern above.</div>
                          )}
                        </div>

                        <div style={{ display: "grid", gap: 10 }}>
                          <button
                            type="button"
                            ref={(node) => {
                              actionTargetTriggerRefs.current.replace = node;
                            }}
                            onClick={() => openActionTargetPicker("replace")}
                            disabled={remapSourceId === null}
                            aria-haspopup="dialog"
                            aria-expanded={actionTargetPicker === "replace"}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              width: "100%",
                              minWidth: 0,
                              padding: "6px 10px",
                              minHeight: 34,
                              borderRadius: 10,
                              border:
                                actionTargetPicker === "replace"
                                  ? "1px solid var(--accent-strong)"
                                  : "1px solid var(--ui-border-subtle)",
                              background: actionTargetPicker === "replace" ? ACTION_SELECTED_BG : "var(--card-bg)",
                              boxShadow:
                                actionTargetPicker === "replace"
                                  ? "0 0 0 1px color-mix(in srgb, var(--accent-strong) 12%, transparent)"
                                  : "none",
                              cursor: remapSourceId === null ? "not-allowed" : "pointer",
                              opacity: remapSourceId === null ? 0.6 : 1,
                              textAlign: "left",
                            }}
                          >
                            {remapTargetColor ? (
                              <>
                                <span
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 8,
                                    background: remapTargetColor.hex,
                                    boxShadow:
                                      contrastForHex(remapTargetColor.hex) === "#000000"
                                        ? "inset 0 0 0 1px rgba(15,23,42,0.12)"
                                        : "none",
                                    flexShrink: 0,
                                  }}
                                />
                                <span style={{ display: "grid", gap: 2, minWidth: 0, flex: "1 1 auto", lineHeight: 1.1 }}>
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 600,
                                      minWidth: 0,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {remapTargetColor.name}
                                  </span>
                                </span>
                              </>
                            ) : (
                              <span style={SUBTEXT_STYLE}>
                                {remapSourceId === null ? "Select a source color first." : "Choose the replacement color."}
                              </span>
                            )}
                            <span
                              aria-hidden="true"
                              style={{
                                marginLeft: "auto",
                                color: "var(--foreground)",
                                opacity: 0.45,
                                fontSize: 14,
                                lineHeight: 1,
                                flexShrink: 0,
                              }}
                            >
                              ▾
                            </span>
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gap: 10,
                        }}
                      >
                        <button
                          onClick={() => setRemapPreviewEnabled(!remapPreviewEnabled)}
                          disabled={!replaceReady}
                          style={{
                            ...ACTION_BUTTON_STYLE,
                            width: "100%",
                            border: "none",
                            background: remapPreviewEnabled ? ACTION_SELECTED_BG : "var(--muted-bg)",
                            color: remapPreviewEnabled ? "var(--accent-strong)" : "var(--foreground)",
                            cursor: !replaceReady ? "not-allowed" : "pointer",
                            opacity: !replaceReady ? 0.5 : 1,
                            minHeight: 34,
                          }}
                        >
                          {remapPreviewEnabled ? "Hide Preview" : "Preview"}
                        </button>
                        <div style={{ display: "flex", alignItems: "stretch", gap: 10 }}>
                          <button
                            onClick={cancelRemap}
                            style={{
                              ...ACTION_BUTTON_STYLE,
                              flex: "1 1 0",
                              border: "none",
                              background: "var(--muted-bg)",
                              color: "var(--foreground)",
                              cursor: "pointer",
                              minHeight: 34,
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={confirmRemap}
                            disabled={!replaceReady}
                            style={{
                              ...ACTION_BUTTON_STYLE,
                              flex: "1 1 0",
                              border: "none",
                              background: "var(--accent)",
                              color: "#ffffff",
                              cursor: !replaceReady ? "not-allowed" : "pointer",
                              opacity: !replaceReady ? 0.5 : 1,
                              minHeight: 34,
                            }}
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      {actionTargetPicker !== null && actionTargetPopoverPosition && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={actionTargetPopoverRef}
              style={{
                position: "fixed",
                top: actionTargetPopoverPosition.top,
                left: actionTargetPopoverPosition.left,
                transform: "translateY(-100%)",
                width: actionTargetPopoverPosition.width,
                maxWidth: "calc(100vw - 24px)",
                zIndex: 220,
                display: "grid",
                gap: 10,
                minWidth: 0,
                padding: 10,
                borderRadius: 12,
                border: "1px solid var(--ui-border-subtle)",
                background: "var(--card-bg)",
                boxShadow: "0 14px 32px rgba(15,23,42,0.16)",
              }}
            >
              <div
                role="tablist"
                aria-label={actionTargetPicker === "replace" ? "Replacement color source" : "Merge target source"}
                style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 8, alignItems: "center" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: 2,
                    borderRadius: 10,
                    border: "1px solid var(--ui-border-subtle)",
                    background: "var(--ui-surface-soft)",
                  }}
                >
                  {[
                    { id: "used" as const, label: "Used" },
                    { id: "all" as const, label: "All" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      role="tab"
                      onClick={() => setActionTargetPaletteSource(option.id)}
                      aria-selected={actionTargetPaletteSource === option.id}
                      data-active={actionTargetPaletteSource === option.id ? "true" : undefined}
                      className="menu-tab-button"
                      style={{
                        padding: "6px 10px",
                        flex: "1 1 0",
                        borderRadius: 8,
                        border: "none",
                        color: "var(--foreground)",
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <input
                  value={actionTargetQuery}
                  onChange={(event) => setActionTargetQuery(event.target.value)}
                  placeholder="Search name or #DMC"
                  style={POPOVER_INPUT_STYLE}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!actionTargetPicker) return;
                    if (actionTargetEyedropperMode === actionTargetPicker) {
                      cancelActionTargetEyedropper();
                      return;
                    }
                    startActionTargetEyedropper(actionTargetPicker);
                  }}
                  aria-pressed={actionTargetPicker !== null && actionTargetEyedropperMode === actionTargetPicker}
                  aria-label="Pick target color from canvas"
                  title="Pick target color from canvas"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    border:
                      actionTargetPicker !== null && actionTargetEyedropperMode === actionTargetPicker
                        ? "1px solid var(--accent-strong)"
                        : "none",
                    background:
                      actionTargetPicker !== null && actionTargetEyedropperMode === actionTargetPicker
                        ? ACTION_SELECTED_BG
                        : "transparent",
                    color: "var(--foreground)",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    padding: 0,
                    flexShrink: 0,
                    transition: "background 140ms ease",
                  }}
                  onMouseEnter={(event) => {
                    if (!(actionTargetPicker !== null && actionTargetEyedropperMode === actionTargetPicker)) {
                      event.currentTarget.style.background = "var(--ui-hover-soft)";
                    }
                  }}
                  onMouseLeave={(event) => {
                    if (!(actionTargetPicker !== null && actionTargetEyedropperMode === actionTargetPicker)) {
                      event.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <img
                    src={assetPath("/icons/dropper.svg")}
                    alt=""
                    aria-hidden="true"
                    width={14}
                    height={14}
                    style={{
                      display: "block",
                      filter:
                        actionTargetPicker !== null && actionTargetEyedropperMode === actionTargetPicker
                          ? "var(--icon-on-accent-soft-filter, var(--icon-on-bg-filter))"
                          : "var(--icon-on-bg-filter)",
                      opacity: actionTargetPicker !== null && actionTargetEyedropperMode === actionTargetPicker ? 1 : 0.82,
                    }}
                  />
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "nowrap", minWidth: 0 }}>
                {[
                  {
                    label: "Used Stitch Counts",
                    checked: actionTargetShowStitchCounts,
                    onChange: () => setActionTargetShowStitchCounts((prev) => !prev),
                  },
                  {
                    label: "DMC Codes",
                    checked: actionTargetShowDmcCodes,
                    onChange: () => setActionTargetShowDmcCodes((prev) => !prev),
                  },
                ].map((option) => (
                  <label
                    key={option.label}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      cursor: "pointer",
                      userSelect: "none",
                      minWidth: 0,
                    }}
                  >
                    <span style={{ fontSize: 9, fontWeight: 600, color: "var(--foreground)", lineHeight: 1.2, whiteSpace: "nowrap" }}>
                      {option.label}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={option.checked}
                      onClick={option.onChange}
                      style={{
                        width: 28,
                        height: 16,
                        borderRadius: 999,
                        border: "none",
                        background: option.checked ? "var(--accent)" : "var(--ui-border-subtle)",
                        cursor: "pointer",
                        padding: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: option.checked ? "flex-end" : "flex-start",
                        transition: "background 140ms ease",
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          background: "#ffffff",
                          boxShadow: "0 1px 2px rgba(15,23,42,0.2)",
                        }}
                      />
                    </button>
                  </label>
                ))}
                <button
                  type="button"
                  onClick={() => setActionTargetView((prev) => (prev === "grid" ? "list" : "grid"))}
                  aria-label={actionTargetView === "grid" ? "Switch to list view" : "Switch to grid view"}
                  title={actionTargetView === "grid" ? "Switch to list view" : "Switch to grid view"}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    color: "var(--foreground)",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    padding: 0,
                    flexShrink: 0,
                    marginLeft: "auto",
                    transition: "background 140ms ease",
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = "var(--ui-hover-soft)";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = "transparent";
                  }}
                >
                  <img
                    src={assetPath(actionTargetView === "grid" ? "/icons/list.svg" : "/icons/grid_view.svg")}
                    alt=""
                    aria-hidden="true"
                    width={14}
                    height={14}
                    style={{ display: "block", opacity: 0.82 }}
                  />
                </button>
              </div>
              <div
                style={{
                  display: "grid",
                  gap: 6,
                  width: "100%",
                  minWidth: 0,
                  maxHeight: 220,
                  overflowY: "auto",
                  overflowX: "hidden",
                  overscrollBehavior: "contain",
                  WebkitOverflowScrolling: "touch",
                  scrollbarGutter: "stable",
                  overflowAnchor: "none",
                  paddingTop: 4,
                  paddingRight: 2,
                }}
              >
                {actionTargetOptions.length === 0 ? (
                  <div style={SUBTEXT_STYLE}>No colors match the current filter.</div>
                ) : actionTargetView === "grid" ? (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      columnGap: 6,
                      rowGap: 10,
                      width: "100%",
                      minWidth: 0,
                      paddingLeft: 6,
                    }}
                  >
                    {actionTargetOptions.map((color) => {
                      const stitchCount = usedColorCountMap.get(color.id);
                      const isActive = actionTargetPicker === "replace" ? remapTargetId === color.id : mergeTargetId === color.id;
                      return (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => {
                            if (actionTargetPicker === "replace") {
                              if (isActive) {
                                clearRemapTarget();
                              } else {
                                setRemapPreviewTarget(color.id);
                              }
                            } else {
                              setMergeTargetId((prev) => (prev === color.id ? null : color.id));
                              setMergePreviewEnabled(false);
                            }
                            closeActionTargetPicker();
                          }}
                          aria-pressed={isActive}
                          aria-label={actionTargetPicker === "replace" ? `Replace with ${color.name}` : `Merge into ${color.name}`}
                          title={`${color.name} (${color.code ?? color.hex})`}
                          style={{
                            width: 28,
                            flex: "0 0 auto",
                            cursor: "pointer",
                            display: "grid",
                            gap: actionTargetShowDmcCodes ? 3 : 0,
                            justifyItems: "center",
                            padding: 0,
                            border: "none",
                            background: "transparent",
                          }}
                        >
                          <span
                            style={{
                              position: "relative",
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: color.hex,
                              boxShadow: isActive
                                ? `0 0 0 2px ${ACTION_SELECTED_BG}, inset 0 0 0 2px var(--accent-strong)`
                                : contrastForHex(color.hex) === "#000000"
                                  ? "inset 0 0 0 1px rgba(15,23,42,0.12)"
                                  : "none",
                            }}
                          >
                            {actionTargetShowStitchCounts && stitchCount ? (
                              <span
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  minWidth: 14,
                                  height: 14,
                                  padding: "0 3px",
                                  borderRadius: 999,
                                  background: "#ffffff",
                                  color: "rgba(15,23,42,0.9)",
                                  fontSize: 7,
                                  fontWeight: 700,
                                  display: "grid",
                                  placeItems: "center",
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                                  pointerEvents: "none",
                                  transform: "translate(-35%, -35%)",
                                  zIndex: 2,
                                }}
                              >
                                {formatStitchCount(stitchCount)}
                              </span>
                            ) : null}
                          </span>
                          {actionTargetShowDmcCodes ? (
                            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--foreground)", lineHeight: 1.1, whiteSpace: "nowrap" }}>
                              {color.code ?? color.id}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 4 }}>
                    {actionTargetOptions.map((color) => {
                      const stitchCount = usedColorCountMap.get(color.id);
                      const isActive = actionTargetPicker === "replace" ? remapTargetId === color.id : mergeTargetId === color.id;
                      return (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => {
                            if (actionTargetPicker === "replace") {
                              if (isActive) {
                                clearRemapTarget();
                              } else {
                                setRemapPreviewTarget(color.id);
                              }
                            } else {
                              setMergeTargetId((prev) => (prev === color.id ? null : color.id));
                              setMergePreviewEnabled(false);
                            }
                            closeActionTargetPicker();
                          }}
                          aria-pressed={isActive}
                          aria-label={actionTargetPicker === "replace" ? `Replace with ${color.name}` : `Merge into ${color.name}`}
                          title={`${color.name} (${color.code ?? color.hex})`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            width: "100%",
                            minWidth: 0,
                            padding: "6px 8px",
                            borderRadius: 10,
                            border: "none",
                            background: isActive ? ACTION_SELECTED_BG : "transparent",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                          onMouseEnter={(event) => {
                            if (!isActive) {
                              event.currentTarget.style.background = "var(--ui-hover-soft)";
                            }
                          }}
                          onMouseLeave={(event) => {
                            if (!isActive) {
                              event.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          <span
                            style={{
                              position: "relative",
                              width: 24,
                              height: 24,
                              borderRadius: 8,
                              background: color.hex,
                              boxShadow:
                                contrastForHex(color.hex) === "#000000"
                                  ? "inset 0 0 0 1px rgba(15,23,42,0.12)"
                                  : "none",
                              flexShrink: 0,
                            }}
                          >
                            {actionTargetShowStitchCounts && stitchCount ? (
                              <span
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  minWidth: 14,
                                  height: 14,
                                  padding: "0 3px",
                                  borderRadius: 999,
                                  background: "#ffffff",
                                  color: "rgba(15,23,42,0.9)",
                                  fontSize: 7,
                                  fontWeight: 700,
                                  display: "grid",
                                  placeItems: "center",
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                                  pointerEvents: "none",
                                  transform: "translate(-35%, -35%)",
                                  zIndex: 2,
                                }}
                              >
                                {formatStitchCount(stitchCount)}
                              </span>
                            ) : null}
                          </span>
                          <span style={{ display: "grid", gap: 2, minWidth: 0, flex: "1 1 auto", lineHeight: 1.1 }}>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                minWidth: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {color.name}
                            </span>
                          </span>
                          {actionTargetShowDmcCodes ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "fit-content",
                                maxWidth: "100%",
                                padding: "1px 5px",
                                borderRadius: 999,
                                background: "var(--muted-bg)",
                                color: "var(--foreground)",
                                fontSize: 9,
                                fontWeight: 600,
                                fontFamily:
                                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
                                letterSpacing: 0.02,
                                whiteSpace: "nowrap",
                                flexShrink: 0,
                              }}
                            >
                              {formatDmcLabel(color)}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
      {inlineReplaceSourceId !== null && inlineReplacePopoverPosition && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={inlineReplacePopoverRef}
              style={{
                position: "fixed",
                top: inlineReplacePopoverPosition.top,
                left: inlineReplacePopoverPosition.left,
                width: inlineReplacePopoverPosition.width,
                maxWidth: "calc(100vw - 24px)",
                zIndex: 210,
                display: "grid",
                gap: 10,
                minWidth: 0,
                padding: 10,
                borderRadius: 12,
                border: "1px solid var(--ui-border-subtle)",
                background: "var(--card-bg)",
                boxShadow: "0 14px 32px rgba(15,23,42,0.16)",
              }}
            >
              <div
                role="tablist"
                aria-label="Replacement color source"
                style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 8, alignItems: "center" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: 2,
                    borderRadius: 10,
                    border: "1px solid var(--ui-border-subtle)",
                    background: "var(--ui-surface-soft)",
                  }}
                >
                  {[
                    { id: "all" as const, label: "All" },
                    { id: "used" as const, label: "Used" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      role="tab"
                      onClick={() => setInlineReplacePaletteSource(option.id)}
                      aria-selected={inlineReplacePaletteSource === option.id}
                      data-active={inlineReplacePaletteSource === option.id ? "true" : undefined}
                      className="menu-tab-button"
                      style={{
                        padding: "6px 10px",
                        flex: "1 1 0",
                        borderRadius: 8,
                        border: "none",
                        color: "var(--foreground)",
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <input
                value={inlineReplaceQuery}
                onChange={(event) => setInlineReplaceQuery(event.target.value)}
                placeholder="Search name or #DMC"
                style={POPOVER_INPUT_STYLE}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "nowrap", minWidth: 0 }}>
                {[
                  {
                    label: "Used Stitch Counts",
                    checked: inlineShowStitchCounts,
                    onChange: () => setInlineShowStitchCounts((prev) => !prev),
                  },
                  {
                    label: "DMC Codes",
                    checked: inlineShowDmcCodes,
                    onChange: () => setInlineShowDmcCodes((prev) => !prev),
                  },
                ].map((option) => (
                  <label
                    key={option.label}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      cursor: "pointer",
                      userSelect: "none",
                      minWidth: 0,
                    }}
                  >
                    <span style={{ fontSize: 9, fontWeight: 600, color: "var(--foreground)", lineHeight: 1.2, whiteSpace: "nowrap" }}>
                      {option.label}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={option.checked}
                      onClick={option.onChange}
                      style={{
                        width: 28,
                        height: 16,
                        borderRadius: 999,
                        border: "none",
                        background: option.checked ? "var(--accent)" : "var(--ui-border-subtle)",
                        cursor: "pointer",
                        padding: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: option.checked ? "flex-end" : "flex-start",
                        transition: "background 140ms ease",
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          background: "#ffffff",
                          boxShadow: "0 1px 2px rgba(15,23,42,0.2)",
                        }}
                      />
                    </button>
                  </label>
                ))}
                <button
                  type="button"
                  onClick={() => setInlineReplaceView((prev) => (prev === "grid" ? "list" : "grid"))}
                  aria-label={inlineReplaceView === "grid" ? "Switch to list view" : "Switch to grid view"}
                  title={inlineReplaceView === "grid" ? "Switch to list view" : "Switch to grid view"}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    color: "var(--foreground)",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    padding: 0,
                    flexShrink: 0,
                    marginLeft: "auto",
                    transition: "background 140ms ease",
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = "var(--ui-hover-soft)";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = "transparent";
                  }}
                >
                  <img
                    src={assetPath(inlineReplaceView === "grid" ? "/icons/list.svg" : "/icons/grid_view.svg")}
                    alt=""
                    aria-hidden="true"
                    width={14}
                    height={14}
                    style={{ display: "block", opacity: 0.82 }}
                  />
                </button>
              </div>
              <div
                style={{
                  display: "grid",
                  gap: 6,
                  width: "100%",
                  minWidth: 0,
                  maxHeight: 220,
                  overflowY: "auto",
                  overflowX: "hidden",
                  overscrollBehavior: "contain",
                  WebkitOverflowScrolling: "touch",
                  scrollbarGutter: "stable",
                  overflowAnchor: "none",
                  paddingTop: 4,
                  paddingRight: 2,
                }}
              >
                {inlineReplaceOptions.length === 0 ? (
                  <div style={SUBTEXT_STYLE}>No colors match the current filter.</div>
                ) : inlineReplaceView === "grid" ? (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      columnGap: 6,
                      rowGap: 10,
                      width: "100%",
                      minWidth: 0,
                      paddingLeft: 6,
                    }}
                  >
                    {inlineReplaceOptions.map((color) => {
                      const stitchCount = usedColorCountMap.get(color.id);
                      return (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => {
                            if (inlineReplaceSourceId === null) return;
                            replaceColor(inlineReplaceSourceId, color.id);
                            closeInlineReplacePicker();
                          }}
                          aria-label={`Replace with ${color.name}`}
                          title={`${color.name} (${color.code ?? color.hex})`}
                          style={{
                            width: 28,
                            flex: "0 0 auto",
                            cursor: "pointer",
                            display: "grid",
                            gap: inlineShowDmcCodes ? 3 : 0,
                            justifyItems: "center",
                            padding: 0,
                            border: "none",
                            background: "transparent",
                          }}
                        >
                          <span
                            style={{
                              position: "relative",
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: color.hex,
                              boxShadow:
                                contrastForHex(color.hex) === "#000000"
                                  ? "inset 0 0 0 1px rgba(15,23,42,0.12)"
                                  : "none",
                            }}
                          >
                            {inlineShowStitchCounts && stitchCount ? (
                              <span
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  minWidth: 14,
                                  height: 14,
                                  padding: "0 3px",
                                  borderRadius: 999,
                                  background: "#ffffff",
                                  color: "rgba(15,23,42,0.9)",
                                  fontSize: 7,
                                  fontWeight: 700,
                                  display: "grid",
                                  placeItems: "center",
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                                  pointerEvents: "none",
                                  transform: "translate(-35%, -35%)",
                                  zIndex: 2,
                                }}
                              >
                                {formatStitchCount(stitchCount)}
                              </span>
                            ) : null}
                          </span>
                          {inlineShowDmcCodes ? (
                            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--foreground)", lineHeight: 1.1, whiteSpace: "nowrap" }}>
                              {color.code ?? color.id}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 4 }}>
                    {inlineReplaceOptions.map((color) => {
                      const stitchCount = usedColorCountMap.get(color.id);
                      return (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => {
                            if (inlineReplaceSourceId === null) return;
                            replaceColor(inlineReplaceSourceId, color.id);
                            closeInlineReplacePicker();
                          }}
                          aria-label={`Replace with ${color.name}`}
                          title={`${color.name} (${color.code ?? color.hex})`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            width: "100%",
                            minWidth: 0,
                            padding: "6px 8px",
                            borderRadius: 10,
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.background = "var(--ui-hover-soft)";
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.background = "transparent";
                          }}
                        >
                          <span
                            style={{
                              position: "relative",
                              width: 24,
                              height: 24,
                              borderRadius: 8,
                              background: color.hex,
                              boxShadow:
                                contrastForHex(color.hex) === "#000000"
                                  ? "inset 0 0 0 1px rgba(15,23,42,0.12)"
                                  : "none",
                              flexShrink: 0,
                            }}
                          >
                            {inlineShowStitchCounts && stitchCount ? (
                              <span
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  minWidth: 14,
                                  height: 14,
                                  padding: "0 3px",
                                  borderRadius: 999,
                                  background: "#ffffff",
                                  color: "rgba(15,23,42,0.9)",
                                  fontSize: 7,
                                  fontWeight: 700,
                                  display: "grid",
                                  placeItems: "center",
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                                  pointerEvents: "none",
                                  transform: "translate(-35%, -35%)",
                                  zIndex: 2,
                                }}
                              >
                                {formatStitchCount(stitchCount)}
                              </span>
                            ) : null}
                          </span>
                          <span style={{ display: "grid", gap: 2, minWidth: 0, flex: "1 1 auto", lineHeight: 1.1 }}>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                minWidth: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {color.name}
                            </span>
                          </span>
                          {inlineShowDmcCodes ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "fit-content",
                                maxWidth: "100%",
                                padding: "1px 5px",
                                borderRadius: 999,
                                background: "var(--muted-bg)",
                                color: "var(--foreground)",
                                fontSize: 9,
                                fontWeight: 600,
                                fontFamily:
                                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
                                letterSpacing: 0.02,
                                whiteSpace: "nowrap",
                                flexShrink: 0,
                              }}
                            >
                              {formatDmcLabel(color)}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function areUsedColorsSectionPropsEqual(prev: UsedColorsSectionProps, next: UsedColorsSectionProps) {
  return (
    prev.cardShadow === next.cardShadow &&
    prev.cardShadowCollapsed === next.cardShadowCollapsed &&
    prev.embedded === next.embedded &&
    prev.hideActionToolbar === next.hideActionToolbar &&
    prev.hideScopeTabs === next.hideScopeTabs &&
    prev.listMaxHeight === next.listMaxHeight &&
    prev.headerActionLabel === next.headerActionLabel &&
    prev.onHeaderActionClick === next.onHeaderActionClick &&
    prev.usedColorsOpen === next.usedColorsOpen &&
    prev.usedColors === next.usedColors &&
    prev.usedColorIds === next.usedColorIds &&
    prev.palette === next.palette &&
    prev.hasAnyPaintedCells === next.hasAnyPaintedCells &&
    prev.remapMode === next.remapMode &&
    prev.mergeMode === next.mergeMode &&
    prev.deleteMode === next.deleteMode &&
    prev.filterMode === next.filterMode &&
    prev.filterSelecting === next.filterSelecting &&
    prev.deleteSelectedIds === next.deleteSelectedIds &&
    prev.mergeSelectedIds === next.mergeSelectedIds &&
    prev.mergeTargetId === next.mergeTargetId &&
    prev.mergePreviewEnabled === next.mergePreviewEnabled &&
    prev.remapSourceId === next.remapSourceId &&
    prev.remapTargetId === next.remapTargetId &&
    prev.remapPreviewEnabled === next.remapPreviewEnabled &&
    prev.deletePreviewEnabled === next.deletePreviewEnabled &&
    prev.identifyColorId === next.identifyColorId &&
    prev.showSymbols === next.showSymbols &&
    prev.symbolMap === next.symbolMap &&
    prev.actionTargetEyedropperMode === next.actionTargetEyedropperMode &&
    prev.actionTargetPickEvent === next.actionTargetPickEvent
  );
}

export const UsedColorsSection = React.memo(UsedColorsSectionComponent, areUsedColorsSectionPropsEqual);
