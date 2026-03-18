"use client";

import React from "react";
import type { Color } from "../../../lib/grid";
import { assetPath } from "../../../lib/assetPath";
import { DMC_PALETTE_BANDS } from "../../../lib/dmcPaletteBands";
import { symbolForColorId } from "../../../lib/symbols";
import { contrastForHex } from "../utils/colorUtils";
import { organizePaletteByHueAndLightness } from "../utils/paletteSort";

type UsedColorEntry = { color: Color; count: number };

type UsedColorsSectionProps = {
  cardStyle: React.CSSProperties;
  cardShadow: string;
  cardShadowCollapsed: string;
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
  confirmMerge: () => void;
  confirmDeleteColors: () => void;
  cancelRemap: () => void;
  cancelMerge: () => void;
  cancelDelete: () => void;
  setRemapMode: React.Dispatch<React.SetStateAction<boolean>>;
  setMergeMode: React.Dispatch<React.SetStateAction<boolean>>;
  setDeleteMode: React.Dispatch<React.SetStateAction<boolean>>;
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

const SUBTEXT_STYLE: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
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

const LIST_STYLE: React.CSSProperties = {
  display: "grid",
  gap: 8,
  maxHeight: 240,
  overflowY: "auto",
  padding: "8px 6px 6px",
};

const SWATCH_GRID_STYLE: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 10,
};

const REPLACE_GRID_COLUMNS = 5;

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
            fontWeight: 600,
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

function chunkColors(colors: Color[], columns: number) {
  const rows: Color[][] = [];
  for (let i = 0; i < colors.length; i += columns) {
    rows.push(colors.slice(i, i + columns));
  }
  return rows;
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

export function UsedColorsSection({
  cardStyle,
  cardShadow,
  cardShadowCollapsed,
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
  confirmMerge,
  confirmDeleteColors,
  cancelRemap,
  cancelMerge,
  cancelDelete,
  setRemapMode,
  setMergeMode,
  setDeleteMode,
}: UsedColorsSectionProps) {
  const showUsedColorsSection = false;
  const [usedColorsListOpen, setUsedColorsListOpen] = React.useState(true);
  const [replacePickerSource, setReplacePickerSource] = React.useState<"all" | "used">("used");
  const [replacePickerQuery, setReplacePickerQuery] = React.useState("");
  const [replaceAllFamily, setReplaceAllFamily] = React.useState("All");
  const usedColorIdSet = React.useMemo(() => new Set(usedColorIds), [usedColorIds]);
  const replaceBandById = React.useMemo(() => {
    const next = new Map<number, string>();
    DMC_PALETTE_BANDS.forEach((band) => {
      band.rows.forEach((row) => {
        row.forEach((id) => next.set(id, band.key));
      });
    });
    return next;
  }, []);
  const replaceFamilySwatches: Record<string, string> = React.useMemo(
    () => ({
      red: "#d62b5b",
      orange: "#f27842",
      yellow: "#ffd24d",
      green: "#4caf50",
      blue: "#3b82f6",
      violet: "#8b5cf6",
      neutrals: "#9ca3af",
    }),
    [],
  );
  const replaceFamilies = React.useMemo(() => ["All", ...DMC_PALETTE_BANDS.map((band) => band.key)], []);
  const usedColorCountMap = React.useMemo(
    () => new Map(usedColors.map((entry) => [entry.color.id, entry.count])),
    [usedColors],
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
  const replaceReady = remapSourceId !== null && remapTargetId !== null;
  const replaceTargetRows = React.useMemo(() => {
    const query = replacePickerQuery.trim().toLowerCase();
    const filtered = palette.filter((color) => {
      if (color.id === remapSourceId) return false;
      if (replacePickerSource === "used" && !usedColorIdSet.has(color.id)) return false;
      if (replacePickerSource === "all" && replaceAllFamily !== "All" && replaceBandById.get(color.id) !== replaceAllFamily) {
        return false;
      }
      if (!query) return true;
      const code = (color.code ?? "").toLowerCase();
      return color.name.toLowerCase().includes(query) || code.includes(query) || `#${code}`.includes(query);
    });
    if (replacePickerSource === "all") {
      return organizePaletteByHueAndLightness(filtered, REPLACE_GRID_COLUMNS);
    }
    const ordered = [...filtered].sort((a, b) => {
      const countDiff = (usedColorCountMap.get(b.id) ?? 0) - (usedColorCountMap.get(a.id) ?? 0);
      if (countDiff !== 0) return countDiff;
      return a.id - b.id;
    });
    return chunkColors(ordered, REPLACE_GRID_COLUMNS);
  }, [palette, remapSourceId, replacePickerQuery, replacePickerSource, replaceAllFamily, replaceBandById, usedColorIdSet, usedColorCountMap]);
  const modeMessage = remapMode
    ? remapSourceId === null
      ? "Choose the source color to replace."
      : remapTargetId === null
        ? "Choose a replacement color."
        : remapPreviewEnabled
          ? "Preview is on."
          : "Ready to preview or apply."
    : mergeMode
      ? mergeSelectedIds.length < 2
        ? "Select at least 2 colors."
        : mergeTargetId
          ? "Ready to merge."
          : "Pick a target color."
      : deleteMode
        ? deleteSelectedIds.length === 0
          ? "Select colors to delete."
          : usedColors.length - deleteSelectedIds.length < 1
            ? "Keep at least one color."
            : "Ready to delete."
        : "";

  const renderUsedColorGrid = () => (
    <div
      style={{
        ...LIST_STYLE,
        borderRadius: 0,
        border: "none",
        background: "transparent",
        padding: "8px 8px 12px",
        maxHeight: 200,
      }}
    >
      {usedColors.map(({ color, count }) => {
        const isIdentifyActive = identifyColorId === color.id;
        const isMergeSelected = mergeSelectedIds.includes(color.id);
        const isMergeTarget = mergeTargetId === color.id;
        const isDeleteSelected = deleteSelectedIds.includes(color.id);
        const mergeSelectionIndex = mergeSelectedIds.indexOf(color.id);

        const borderStyle =
          mergeMode && isMergeTarget
            ? "2px solid var(--accent-strong)"
            : mergeMode && isMergeSelected
              ? "2px solid var(--accent)"
              : deleteMode && isDeleteSelected
                ? "2px solid var(--accent-strong)"
                : isIdentifyActive
                  ? "2px solid var(--accent-strong)"
                  : "1px solid var(--ui-border-strong)";

        const boxShadow =
          mergeMode && isMergeTarget
            ? "0 0 0 2px var(--accent-soft)"
            : isIdentifyActive
              ? "0 0 0 2px var(--accent-soft)"
              : "none";

        const handleUsedColorClick = () => {
          if (deleteMode) {
            setDeleteSelectedIds((prev) => {
              const next = new Set(prev);
              if (next.has(color.id)) {
                next.delete(color.id);
              } else {
                next.add(color.id);
              }
              return Array.from(next);
            });
            return;
          }

          if (mergeMode) {
            setMergeSelectedIds((prev) => {
              const next = new Set(prev);
              if (next.has(color.id)) {
                if (mergeTargetId === color.id) {
                  setMergeTargetId(null);
                }
                next.delete(color.id);
              } else {
                next.add(color.id);
                setMergeTargetId(color.id);
              }
              return Array.from(next);
            });
            return;
          }

          setIdentifyColorId((prev) => (prev === color.id ? null : color.id));
        };

        return (
          <button
            key={color.id}
            type="button"
            onClick={handleUsedColorClick}
            aria-pressed={isIdentifyActive || isMergeSelected || isDeleteSelected}
            aria-label={isIdentifyActive ? `Hide ${color.name}` : `Highlight ${color.name}`}
            title={`${count} stitches`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              minWidth: 0,
              padding: "8px 10px",
              borderRadius: 10,
              border: borderStyle,
              background: isIdentifyActive || isMergeSelected || isDeleteSelected ? "var(--ui-hover-soft)" : "var(--card-bg)",
              boxShadow,
              cursor: "pointer",
              textAlign: "left",
            }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 4,
                            border: isSelected ? "1px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                            background: isSelected ? "var(--accent)" : "var(--card-bg)",
                            color: "#ffffff",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                            fontSize: 11,
                            fontWeight: 800,
                            lineHeight: 1,
                          }}
                        >
                          {isSelected ? "✓" : ""}
                        </span>
                        <span
                          style={{
                            position: "relative",
                width: 28,
                height: 28,
                borderRadius: 8,
                background: color.hex,
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
                flexShrink: 0,
                overflow: "visible",
              }}
            >
              {mergeMode && isMergeSelected && (
                <span
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    minWidth: 18,
                    height: 18,
                    padding: "0 4px",
                    borderRadius: 999,
                    background: "var(--accent-strong)",
                    color: "#ffffff",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    pointerEvents: "none",
                  }}
                >
                  {mergeSelectionIndex + 1}
                </span>
              )}
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
                aria-hidden="true"
              >
                {formatStitchCount(count)}
              </span>
              {showSymbols && symbolForColorId(color.id, symbolMap) && (
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
                  {symbolForColorId(color.id, symbolMap)}
                </span>
              )}
            </span>
            <span style={{ display: "grid", gap: 2, minWidth: 0, flex: "1 1 auto", lineHeight: 1.1 }}>
              <span style={{ fontSize: 10, opacity: 0.72, fontWeight: 700 }}>{formatDmcLabel(color)}</span>
              <span style={{ fontSize: 12, fontWeight: 600, minWidth: 0, overflowWrap: "anywhere" }}>{color.name}</span>
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div
      className="app-card"
      style={{
        ...cardStyle,
        boxShadow: usedColorsOpen ? cardShadow : cardShadowCollapsed,
        overflow: "visible",
        zIndex: remapMode ? 8 : undefined,
        paddingBottom: remapMode ? 56 : cardStyle.paddingBottom,
      }}
    >
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
          fontSize: 14,
        }}
        type="button"
      >
        <span>Manage Colors</span>
        <span style={{ opacity: 0.7, width: 14, textAlign: "center" }}>{usedColorsOpen ? "▾" : "▸"}</span>
      </button>
      <div style={{ ...collapseStyle(usedColorsOpen, 800), overflow: "visible" }}>
        <div style={{ ...PANEL_STYLE, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={LABEL_STYLE}>Apply To:</div>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 999,
                border: filterMode ? "1px solid var(--ui-border)" : "1px solid var(--ui-border-subtle)",
                background: filterMode ? "var(--ui-hover-soft)" : "var(--card-bg)",
                fontSize: 10,
                fontWeight: 600,
                color: filterMode ? "var(--accent-strong)" : "var(--foreground)",
                whiteSpace: "nowrap",
              }}
            >
              {filterMode ? "Selected area" : "Entire canvas"}
            </span>
          </div>
          <button
            onClick={() => {
              if (!hasAnyPaintedCells) return;
              if (filterMode) {
                clearFilterSelection();
              } else {
                startFilterSelection();
              }
            }}
            aria-pressed={filterMode}
            aria-disabled={!hasAnyPaintedCells}
            aria-label="Filter canvas"
            data-active={filterMode ? "true" : undefined}
            className="toolbar-button used-colors-filter-button"
            disabled={!hasAnyPaintedCells}
            style={{
              width: "100%",
              padding: "6px 10px",
              borderRadius: 8,
              cursor: hasAnyPaintedCells ? "pointer" : "not-allowed",
              opacity: hasAnyPaintedCells ? 1 : 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontSize: 12,
              fontWeight: 600,
              background: filterMode ? "var(--card-bg)" : "var(--muted-bg)",
              border: "1px solid var(--ui-border-subtle)",
              boxShadow: filterMode ? "0 2px 6px var(--ui-border-subtle)" : "none",
            }}
          >
            <span className="toolbar-icon" aria-hidden="true" style={{ marginRight: 2 }}>
              <img
                src={assetPath("/icons/pic_in_pic.svg")}
                alt=""
                aria-hidden="true"
                width={16}
                height={16}
                style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
              />
            </span>
            {filterMode ? "Clear selection" : "Select area"}
          </button>
        </div>

        {showUsedColorsSection ? (
          <div
            style={{
              display: "grid",
              gap: 0,
              marginBottom: 10,
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid var(--ui-border-subtle)",
              background: "var(--ui-surface-soft)",
            }}
          >
            <button
              type="button"
              onClick={() => setUsedColorsListOpen((open) => !open)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                border: "none",
                background: "transparent",
                padding: 0,
                marginBottom: usedColorsListOpen ? 6 : 0,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={LABEL_STYLE}>Used Colors ({usedColors.length})</span>
              <span style={{ opacity: 0.7, width: 14, textAlign: "center", fontSize: 12 }}>
                {usedColorsListOpen ? "▾" : "▸"}
              </span>
            </button>
            <div style={{ ...collapseStyle(usedColorsListOpen, 420) }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>
                Select a color to highlight it on the canvas.
              </div>
              {renderUsedColorGrid()}
            </div>
          </div>
        ) : null}

        <div
          className="used-colors-toolbar"
          role="tablist"
          aria-label="Manage colors tools"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: 4,
            borderRadius: 10,
            border: "1px solid var(--ui-border-subtle)",
            background: "var(--ui-surface-soft)",
            marginBottom: 6,
          }}
        >
          <button
            onClick={toggleRemapMode}
            aria-pressed={remapMode}
            aria-label="Replace colors"
            data-active={remapMode ? "true" : undefined}
            className="toolbar-button menu-tab-button"
            disabled={!hasAnyPaintedCells}
            style={{
              padding: "6px 8px",
              borderRadius: 8,
              flex: "1 1 0",
              width: 0,
              cursor: hasAnyPaintedCells ? "pointer" : "not-allowed",
              display: "flex",
              gap: 4,
              alignItems: "center",
              justifyContent: "center",
              opacity: hasAnyPaintedCells ? 1 : 0.5,
              whiteSpace: "nowrap",
              border: "none",
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
            className="toolbar-button menu-tab-button"
            disabled={!hasAnyPaintedCells}
            style={{
              padding: "6px 8px",
              borderRadius: 8,
              flex: "1 1 0",
              width: 0,
              cursor: hasAnyPaintedCells ? "pointer" : "not-allowed",
              display: "flex",
              gap: 4,
              alignItems: "center",
              justifyContent: "center",
              opacity: hasAnyPaintedCells ? 1 : 0.5,
              whiteSpace: "nowrap",
              border: "none",
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
            className="toolbar-button menu-tab-button"
            disabled={!hasAnyPaintedCells}
            style={{
              padding: "6px 8px",
              borderRadius: 8,
              flex: "1 1 0",
              width: 0,
              cursor: hasAnyPaintedCells ? "pointer" : "not-allowed",
              display: "flex",
              gap: 4,
              alignItems: "center",
              justifyContent: "center",
              opacity: hasAnyPaintedCells ? 1 : 0.5,
              whiteSpace: "nowrap",
              border: "none",
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

        {!remapMode && !mergeMode && !deleteMode && modeMessage ? (
          <div style={{ ...SUBTEXT_STYLE, marginBottom: 8 }}>{modeMessage}</div>
        ) : null}

        {deleteMode ? (
          <div
            style={{
              display: "grid",
              gap: 10,
              marginTop: 8,
              position: "relative",
              overflow: "visible",
              zIndex: 12,
            }}
          >
            <div
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid rgba(180, 83, 9, 0.22)",
                background: "rgba(245, 158, 11, 0.10)",
                color: "var(--foreground)",
                fontSize: 12,
                lineHeight: 1.35,
              }}
            >
              When you delete a color, all stitches of that color will be automatically replaced with the most
              similar color in your pattern.
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={LABEL_STYLE}>
                    Colors to Delete{" "}
                    {deleteSelectedIds.length > 0 ? <span style={{ fontWeight: 400 }}>({deleteSelectedIds.length} selected)</span> : null}
                  </div>
                  {deleteSelectedIds.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteSelectedIds([]);
                        setDeletePreviewEnabled(false);
                      }}
                      style={CANCEL_BUTTON_STYLE}
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                <div
                  style={{
                    display: "grid",
                    gap: 6,
                    maxHeight: 220,
                    overflowY: "auto",
                    padding: 8,
                    borderRadius: 12,
                    border: "1px solid var(--ui-border-subtle)",
                    background: "var(--card-bg)",
                  }}
                >
                  {usedColors.map(({ color, count }) => {
                    const isSelected = deleteSelectedIds.includes(color.id);
                    return (
                      <div
                        key={color.id}
                        onClick={() => {
                          setDeleteSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(color.id)) {
                              next.delete(color.id);
                            } else {
                              next.add(color.id);
                            }
                            return Array.from(next);
                          });
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setDeleteSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(color.id)) {
                                next.delete(color.id);
                              } else {
                                next.add(color.id);
                              }
                              return Array.from(next);
                            });
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        aria-label={`Delete ${color.name}`}
                        title={`${color.code ? `#${color.code} ` : ""}${color.name}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          width: "100%",
                          minWidth: 0,
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: isSelected ? "2px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                          background: isSelected ? "var(--ui-hover-soft)" : "var(--card-bg)",
                          boxShadow: isSelected ? "0 0 0 2px var(--accent-soft)" : "none",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 4,
                            border: isSelected ? "1px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                            background: isSelected ? "var(--accent)" : "var(--card-bg)",
                            color: "#ffffff",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                            fontSize: 11,
                            fontWeight: 800,
                            lineHeight: 1,
                          }}
                        >
                          {isSelected ? "✓" : ""}
                        </span>
                        <span
                          style={{
                            position: "relative",
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: color.hex,
                            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
                            flexShrink: 0,
                            overflow: "visible",
                          }}
                        >
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
                            aria-hidden="true"
                          >
                            {formatStitchCount(count)}
                          </span>
                        </span>
                        <span style={{ display: "grid", gap: 2, minWidth: 0, flex: "1 1 auto", lineHeight: 1.1 }}>
                          <span style={{ fontSize: 10, opacity: 0.72, fontWeight: 700 }}>{color.code ?? color.id}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, minWidth: 0, overflowWrap: "anywhere" }}>{color.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setIdentifyColorId((prev) => (prev === color.id ? null : color.id));
                          }}
                          aria-pressed={identifyColorId === color.id}
                          aria-label={identifyColorId === color.id ? `Hide ${color.name}` : `Highlight ${color.name}`}
                          title={identifyColorId === color.id ? `Hide ${color.name}` : `Highlight ${color.name}`}
                          style={{
                            flexShrink: 0,
                            width: 26,
                            height: 26,
                            display: "grid",
                            placeItems: "center",
                            borderRadius: 8,
                            border: identifyColorId === color.id ? "1px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                            background: identifyColorId === color.id ? "var(--accent-soft)" : "var(--muted-bg)",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          <img
                            src={assetPath("/icons/identify.svg")}
                            alt=""
                            aria-hidden="true"
                            width={14}
                            height={14}
                            style={{
                              display: "block",
                              filter: identifyColorId === color.id ? "var(--icon-on-accent-soft-filter, var(--icon-on-bg-filter))" : "var(--icon-on-bg-filter)",
                              opacity: identifyColorId === color.id ? 1 : 0.72,
                            }}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "stretch", gap: 10 }}>
                <button
                  onClick={() => setDeletePreviewEnabled(!deletePreviewEnabled)}
                  disabled={deleteSelectedIds.length === 0 || usedColors.length - deleteSelectedIds.length < 1}
                  style={{
                    ...ACTION_BUTTON_STYLE,
                    flex: "1 1 0",
                    border: deletePreviewEnabled ? "1px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                    background: deletePreviewEnabled ? "var(--accent-soft)" : "var(--muted-bg)",
                    color: deletePreviewEnabled ? "var(--accent-strong)" : "var(--foreground)",
                    cursor:
                      deleteSelectedIds.length === 0 || usedColors.length - deleteSelectedIds.length < 1
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      deleteSelectedIds.length === 0 || usedColors.length - deleteSelectedIds.length < 1 ? 0.5 : 1,
                    minHeight: 38,
                  }}
                >
                  {deletePreviewEnabled ? "Hide Preview" : "Preview"}
                </button>
                <button
                  onClick={confirmDeleteColors}
                  disabled={deleteSelectedIds.length === 0 || usedColors.length - deleteSelectedIds.length < 1}
                  style={{
                    ...ACTION_BUTTON_STYLE,
                    flex: "1 1 0",
                    border: "1px solid var(--ui-border-subtle)",
                    background: "var(--accent)",
                    color: "#ffffff",
                    cursor:
                      deleteSelectedIds.length === 0 || usedColors.length - deleteSelectedIds.length < 1
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      deleteSelectedIds.length === 0 || usedColors.length - deleteSelectedIds.length < 1 ? 0.5 : 1,
                    minHeight: 38,
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {mergeMode ? (
          <div
            style={{
              display: "grid",
              gap: 10,
              marginTop: 8,
              position: "relative",
              overflow: "visible",
              zIndex: 12,
            }}
          >
            <div style={SUBTEXT_STYLE}>Combine multiple colors into one color across your pattern.</div>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={LABEL_STYLE}>
                    Colors to Merge{" "}
                    {mergeSelectedIds.length > 0 ? <span style={{ fontWeight: 400 }}>({mergeSelectedIds.length} selected)</span> : null}
                  </div>
                  {mergeSelectedIds.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMergeSelectedIds([]);
                        setMergeTargetId(null);
                        setMergePreviewEnabled(false);
                      }}
                      style={CANCEL_BUTTON_STYLE}
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                <div
                  style={{
                    display: "grid",
                    gap: 6,
                    maxHeight: 220,
                    overflowY: "auto",
                    padding: 8,
                    borderRadius: 12,
                    border: "1px solid var(--ui-border-subtle)",
                    background: "var(--card-bg)",
                  }}
                >
                  {usedColors.map(({ color, count }) => {
                    const isSelected = mergeSelectedIds.includes(color.id);
                    return (
                      <div
                        key={color.id}
                        onClick={() => {
                          setMergeSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(color.id)) {
                              next.delete(color.id);
                              if (mergeTargetId === color.id) {
                                setMergeTargetId(null);
                              }
                            } else {
                              next.add(color.id);
                            }
                            return Array.from(next);
                          });
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setMergeSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(color.id)) {
                                next.delete(color.id);
                                if (mergeTargetId === color.id) {
                                  setMergeTargetId(null);
                                }
                              } else {
                                next.add(color.id);
                              }
                              return Array.from(next);
                            });
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        aria-label={`Merge ${color.name}`}
                        title={`${color.code ? `#${color.code} ` : ""}${color.name}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          width: "100%",
                          minWidth: 0,
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: isSelected ? "2px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                          background: isSelected ? "var(--ui-hover-soft)" : "var(--card-bg)",
                          boxShadow: isSelected ? "0 0 0 2px var(--accent-soft)" : "none",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 4,
                            border: isSelected ? "1px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                            background: isSelected ? "var(--accent)" : "var(--card-bg)",
                            color: "#ffffff",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                            fontSize: 11,
                            fontWeight: 800,
                            lineHeight: 1,
                          }}
                        >
                          {isSelected ? "✓" : ""}
                        </span>
                        <span
                          style={{
                            position: "relative",
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: color.hex,
                            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
                            flexShrink: 0,
                            overflow: "visible",
                          }}
                        >
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
                            aria-hidden="true"
                          >
                            {formatStitchCount(count)}
                          </span>
                        </span>
                        <span style={{ display: "grid", gap: 2, minWidth: 0, flex: "1 1 auto", lineHeight: 1.1 }}>
                          <span style={{ fontSize: 10, opacity: 0.72, fontWeight: 700 }}>{color.code ?? color.id}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, minWidth: 0, overflowWrap: "anywhere" }}>{color.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setIdentifyColorId((prev) => (prev === color.id ? null : color.id));
                          }}
                          aria-pressed={identifyColorId === color.id}
                          aria-label={identifyColorId === color.id ? `Hide ${color.name}` : `Highlight ${color.name}`}
                          title={identifyColorId === color.id ? `Hide ${color.name}` : `Highlight ${color.name}`}
                          style={{
                            flexShrink: 0,
                            width: 26,
                            height: 26,
                            display: "grid",
                            placeItems: "center",
                            borderRadius: 8,
                            border: identifyColorId === color.id ? "1px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                            background: identifyColorId === color.id ? "var(--accent-soft)" : "var(--muted-bg)",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          <img
                            src={assetPath("/icons/identify.svg")}
                            alt=""
                            aria-hidden="true"
                            width={14}
                            height={14}
                            style={{
                              display: "block",
                              filter: identifyColorId === color.id ? "var(--icon-on-accent-soft-filter, var(--icon-on-bg-filter))" : "var(--icon-on-bg-filter)",
                              opacity: identifyColorId === color.id ? 1 : 0.72,
                            }}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                aria-hidden="true"
                style={{
                  display: "grid",
                  placeItems: "center",
                  margin: "-2px 0 -4px",
                  color: "var(--foreground)",
                  opacity: 0.45,
                  lineHeight: 1,
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700 }}>→</span>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={LABEL_STYLE}>Merge Into</div>
                <div
                  style={{
                    display: "grid",
                    gap: 6,
                    maxHeight: 220,
                    overflowY: "auto",
                    padding: 8,
                    borderRadius: 12,
                    border: "1px solid var(--ui-border-subtle)",
                    background: "var(--card-bg)",
                    opacity: mergeSelectedIds.length < 2 ? 0.6 : 1,
                  }}
                >
                  {mergeSelectedColors.length < 2 ? (
                    <div style={SUBTEXT_STYLE}>Select at least 2 colors above first.</div>
                  ) : (
                    mergeSelectedColors.map(({ color, count }) => {
                      const isTarget = mergeTargetId === color.id;
                      return (
                        <div
                          key={color.id}
                          onClick={() => setMergeTargetId((prev) => (prev === color.id ? null : color.id))}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setMergeTargetId((prev) => (prev === color.id ? null : color.id));
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isTarget}
                          aria-label={`Merge into ${color.name}`}
                          title={`${color.code ? `#${color.code} ` : ""}${color.name}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            width: "100%",
                            minWidth: 0,
                            padding: "8px 10px",
                            borderRadius: 10,
                            border: isTarget ? "2px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                            background: isTarget ? "var(--ui-hover-soft)" : "var(--card-bg)",
                            boxShadow: isTarget ? "0 0 0 2px var(--accent-soft)" : "none",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <span
                            style={{
                              position: "relative",
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: color.hex,
                              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
                              flexShrink: 0,
                              overflow: "visible",
                            }}
                          >
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
                              aria-hidden="true"
                            >
                              {formatStitchCount(count)}
                            </span>
                          </span>
                          <span style={{ display: "grid", gap: 2, minWidth: 0, flex: "1 1 auto", lineHeight: 1.1 }}>
                            <span style={{ fontSize: 10, opacity: 0.72, fontWeight: 700 }}>{color.code ?? color.id}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, minWidth: 0, overflowWrap: "anywhere" }}>{color.name}</span>
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "stretch", gap: 10 }}>
                <button
                  onClick={() => setMergePreviewEnabled(!mergePreviewEnabled)}
                  disabled={mergeSelectedIds.length < 2 || mergeTargetId === null}
                  style={{
                    ...ACTION_BUTTON_STYLE,
                    flex: "1 1 0",
                    border: mergePreviewEnabled ? "1px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                    background: mergePreviewEnabled ? "var(--accent-soft)" : "var(--muted-bg)",
                    color: mergePreviewEnabled ? "var(--accent-strong)" : "var(--foreground)",
                    cursor: mergeSelectedIds.length < 2 || mergeTargetId === null ? "not-allowed" : "pointer",
                    opacity: mergeSelectedIds.length < 2 || mergeTargetId === null ? 0.5 : 1,
                    minHeight: 38,
                  }}
                >
                  {mergePreviewEnabled ? "Hide Preview" : "Preview"}
                </button>
                <button
                  onClick={confirmMerge}
                  disabled={mergeSelectedIds.length < 2 || mergeTargetId === null}
                  style={{
                    ...ACTION_BUTTON_STYLE,
                    flex: "1 1 0",
                    border: "1px solid var(--ui-border-subtle)",
                    background: "var(--accent)",
                    color: "#ffffff",
                    cursor: mergeSelectedIds.length < 2 || mergeTargetId === null ? "not-allowed" : "pointer",
                    opacity: mergeSelectedIds.length < 2 || mergeTargetId === null ? 0.5 : 1,
                    minHeight: 38,
                  }}
                >
                  Merge
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {remapMode ? (
          <div
            style={{
              display: "grid",
              gap: 10,
              marginTop: 8,
              marginBottom: 28,
              paddingBottom: 24,
              position: "relative",
              overflow: "visible",
              zIndex: 12,
            }}
          >
            <div style={SUBTEXT_STYLE}>Swap all cells of one color for another throughout your pattern.</div>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <div style={LABEL_STYLE}>Color to Replace</div>
                <div
                  style={{
                    display: "grid",
                    gap: 6,
                    maxHeight: 220,
                    overflowY: "auto",
                    padding: 8,
                    borderRadius: 12,
                    border: "1px solid var(--ui-border-subtle)",
                    background: "var(--card-bg)",
                  }}
                >
                  {usedColors.map(({ color, count }) => {
                    const isActive = remapSourceId === color.id;
                    return (
                      <div
                        key={color.id}
                        onClick={() => {
                          if (isActive) {
                            clearRemapSource();
                            return;
                          }
                          beginRemap(color.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            if (isActive) {
                              clearRemapSource();
                              return;
                            }
                            beginRemap(color.id);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isActive}
                        aria-label={`Replace ${color.name}`}
                        title={`${color.code ? `#${color.code} ` : ""}${color.name}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          width: "100%",
                          minWidth: 0,
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: isActive ? "2px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                          background: isActive ? "var(--ui-hover-soft)" : "var(--card-bg)",
                          boxShadow: isActive ? "0 0 0 2px var(--accent-soft)" : "none",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                          <span
                            style={{
                              position: "relative",
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: color.hex,
                              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
                              flexShrink: 0,
                              overflow: "visible",
                            }}
                          >
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
                              aria-hidden="true"
                            >
                              {formatStitchCount(count)}
                            </span>
                          </span>
                        <span style={{ display: "grid", gap: 2, minWidth: 0, flex: "1 1 auto", lineHeight: 1.1 }}>
                          <span style={{ fontSize: 10, opacity: 0.72, fontWeight: 700 }}>{color.code ?? color.id}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, minWidth: 0, overflowWrap: "anywhere" }}>{color.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setIdentifyColorId((prev) => (prev === color.id ? null : color.id));
                          }}
                          aria-pressed={identifyColorId === color.id}
                          aria-label={identifyColorId === color.id ? `Hide ${color.name}` : `Highlight ${color.name}`}
                          title={identifyColorId === color.id ? `Hide ${color.name}` : `Highlight ${color.name}`}
                          style={{
                            flexShrink: 0,
                            width: 26,
                            height: 26,
                            display: "grid",
                            placeItems: "center",
                            borderRadius: 8,
                            border: identifyColorId === color.id ? "1px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                            background: identifyColorId === color.id ? "var(--accent-soft)" : "var(--muted-bg)",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          <img
                            src={assetPath("/icons/identify.svg")}
                            alt=""
                            aria-hidden="true"
                            width={14}
                            height={14}
                            style={{
                              display: "block",
                              filter: identifyColorId === color.id ? "var(--icon-on-accent-soft-filter, var(--icon-on-bg-filter))" : "var(--icon-on-bg-filter)",
                              opacity: identifyColorId === color.id ? 1 : 0.72,
                            }}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                aria-hidden="true"
                style={{
                  display: "grid",
                  placeItems: "center",
                  margin: "-2px 0 -4px",
                  color: "var(--foreground)",
                  opacity: 0.45,
                  lineHeight: 1,
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700 }}>→</span>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={LABEL_STYLE}>Replace With</div>
                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    padding: 8,
                    borderRadius: 12,
                    border: "1px solid var(--ui-border-subtle)",
                    background: "var(--card-bg)",
                    opacity: remapSourceId === null ? 0.6 : 1,
                  }}
                >
                  <div
                    role="tablist"
                    aria-label="Replacement color source"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: 1,
                      borderRadius: 10,
                      border: "1px solid var(--ui-border-subtle)",
                      background: "var(--card-bg)",
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
                        onClick={() => setReplacePickerSource(option.id)}
                        aria-selected={replacePickerSource === option.id}
                        data-active={replacePickerSource === option.id ? "true" : undefined}
                        className="menu-tab-button"
                        style={{
                          padding: "4px 8px",
                          flex: "1 1 0",
                          borderRadius: 7,
                          border: "none",
                          color: "var(--foreground)",
                          cursor: "pointer",
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {replacePickerSource === "all" ? (
                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", minWidth: 0 }}>
                        {replaceFamilies.map((family) => {
                          if (family === "All") {
                            const isActive = replaceAllFamily === "All";
                            return (
                              <button
                                key={family}
                                type="button"
                                onClick={() => setReplaceAllFamily("All")}
                                aria-pressed={isActive}
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: 999,
                                  border: isActive ? "1px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                                  background: isActive ? "var(--accent-soft)" : "var(--muted-bg)",
                                  color: isActive ? "var(--accent-strong)" : "var(--foreground)",
                                  cursor: "pointer",
                                  fontSize: 10,
                                  fontWeight: 600,
                                }}
                              >
                                All
                              </button>
                            );
                          }

                          const isActive = replaceAllFamily === family;
                          return (
                            <button
                              key={family}
                              type="button"
                              onClick={() => setReplaceAllFamily(isActive ? "All" : family)}
                              aria-pressed={isActive}
                              aria-label={`Filter ${family}`}
                              title={family}
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: 6,
                                background: replaceFamilySwatches[family] ?? "#9ca3af",
                                border: isActive ? "2px solid var(--accent-strong)" : "1px solid var(--ui-border-strong)",
                                boxShadow: isActive ? "0 0 0 2px var(--accent-soft)" : "none",
                                cursor: "pointer",
                                flexShrink: 0,
                              }}
                            />
                          );
                        })}
                      </div>
                      <input
                        value={replacePickerQuery}
                        onChange={(event) => setReplacePickerQuery(event.target.value)}
                        placeholder="Search name or #DMC"
                        style={{
                          width: "100%",
                          minWidth: 0,
                          boxSizing: "border-box",
                          padding: "6px 8px",
                          borderRadius: 8,
                          border: "1px solid var(--panel-border)",
                          background: "var(--card-bg)",
                          color: "var(--foreground)",
                          fontSize: 12,
                        }}
                      />
                    </div>
                  ) : null}
                  <div
                    style={{
                      display: "grid",
                      gap: 6,
                      maxHeight: 220,
                      overflowY: "auto",
                      padding: 0,
                    }}
                  >
                    {remapSourceId === null ? (
                      <div style={SUBTEXT_STYLE}>Select a source color first.</div>
                    ) : replaceTargetRows.length > 0 ? (
                      replacePickerSource === "all" ? (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${REPLACE_GRID_COLUMNS}, minmax(0, 1fr))`,
                            gap: 8,
                            padding: 2,
                          }}
                        >
                          {replaceTargetRows.flat().map((color) => {
                            const isActive = remapTargetId === color.id;
                            const count = usedColorCountMap.get(color.id) ?? 0;
                            return (
                          <div
                            key={color.id}
                            onClick={() => {
                              if (isActive) {
                                clearRemapTarget();
                                return;
                              }
                              setRemapPreviewTarget(color.id);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                if (isActive) {
                                  clearRemapTarget();
                                  return;
                                }
                                setRemapPreviewTarget(color.id);
                              }
                            }}
                                role="button"
                                tabIndex={0}
                                aria-pressed={isActive}
                                aria-label={`Replace with ${color.name}`}
                                title={`${color.code ? `#${color.code} ` : ""}${color.name}`}
                                style={{
                                  display: "grid",
                                  gap: 4,
                                  justifyItems: "center",
                                  minWidth: 0,
                                  cursor: "pointer",
                                }}
                              >
                                <span
                                  style={{
                                    position: "relative",
                                    aspectRatio: "1 / 1",
                                    width: "100%",
                                    minWidth: 0,
                                    borderRadius: 8,
                                    border: isActive ? "2px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                                    background: color.hex,
                                    boxShadow: isActive ? "0 0 0 2px var(--accent-soft)" : "inset 0 0 0 1px rgba(0,0,0,0.15)",
                                    overflow: "visible",
                                  }}
                                >
                                  {count > 0 ? (
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
                                      aria-hidden="true"
                                    >
                                      {formatStitchCount(count)}
                                    </span>
                                  ) : null}
                                </span>
                                <span style={{ fontSize: 10, opacity: 0.72, fontWeight: 700, textAlign: "center" }}>
                                  {color.code ?? color.id}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        replaceTargetRows.flat().map((color) => {
                          const isActive = remapTargetId === color.id;
                          const count = usedColorCountMap.get(color.id) ?? 0;
                          return (
                            <div
                              key={color.id}
                              onClick={() => {
                                if (isActive) {
                                  clearRemapTarget();
                                  return;
                                }
                                setRemapPreviewTarget(color.id);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  if (isActive) {
                                    clearRemapTarget();
                                    return;
                                  }
                                  setRemapPreviewTarget(color.id);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              aria-pressed={isActive}
                              aria-label={`Replace with ${color.name}`}
                              title={`${color.code ? `#${color.code} ` : ""}${color.name}`}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                width: "100%",
                                minWidth: 0,
                                padding: "8px 10px",
                                borderRadius: 10,
                                border: isActive ? "2px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                                background: isActive ? "var(--ui-hover-soft)" : "var(--card-bg)",
                                boxShadow: isActive ? "0 0 0 2px var(--accent-soft)" : "none",
                                cursor: "pointer",
                                textAlign: "left",
                              }}
                            >
                              <span
                                style={{
                                  position: "relative",
                                  width: 28,
                                  height: 28,
                                  borderRadius: 8,
                                  background: color.hex,
                                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
                                  flexShrink: 0,
                                  overflow: "visible",
                                }}
                              >
                                {count > 0 ? (
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
                                    aria-hidden="true"
                                  >
                                    {formatStitchCount(count)}
                                  </span>
                                ) : null}
                              </span>
                              <span style={{ display: "grid", gap: 2, minWidth: 0, flex: "1 1 auto", lineHeight: 1.1 }}>
                                <span style={{ fontSize: 10, opacity: 0.72, fontWeight: 700 }}>{color.code ?? color.id}</span>
                                <span style={{ fontSize: 12, fontWeight: 600, minWidth: 0, overflowWrap: "anywhere" }}>{color.name}</span>
                              </span>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setIdentifyColorId((prev) => (prev === color.id ? null : color.id));
                                }}
                                aria-pressed={identifyColorId === color.id}
                                aria-label={identifyColorId === color.id ? `Hide ${color.name}` : `Highlight ${color.name}`}
                                title={identifyColorId === color.id ? `Hide ${color.name}` : `Highlight ${color.name}`}
                                style={{
                                  flexShrink: 0,
                                  width: 26,
                                  height: 26,
                                  display: "grid",
                                  placeItems: "center",
                                  borderRadius: 8,
                                  border: identifyColorId === color.id ? "1px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                                  background: identifyColorId === color.id ? "var(--accent-soft)" : "var(--muted-bg)",
                                  cursor: "pointer",
                                  padding: 0,
                                }}
                              >
                                <img
                                  src={assetPath("/icons/identify.svg")}
                                  alt=""
                                  aria-hidden="true"
                                  width={14}
                                  height={14}
                                  style={{
                                    display: "block",
                                    filter: identifyColorId === color.id ? "var(--icon-on-accent-soft-filter, var(--icon-on-bg-filter))" : "var(--icon-on-bg-filter)",
                                    opacity: identifyColorId === color.id ? 1 : 0.72,
                                  }}
                                />
                              </button>
                            </div>
                          );
                        })
                      )
                    ) : (
                      <div style={SUBTEXT_STYLE}>No colors match the current filter.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "stretch", gap: 10 }}>
                <button
                  onClick={() => setRemapPreviewEnabled(!remapPreviewEnabled)}
                  disabled={!replaceReady}
                  style={{
                    ...ACTION_BUTTON_STYLE,
                    flex: "1 1 0",
                    border: remapPreviewEnabled ? "1px solid var(--accent-strong)" : "1px solid var(--ui-border-subtle)",
                    background: remapPreviewEnabled ? "var(--accent-soft)" : "var(--muted-bg)",
                    color: remapPreviewEnabled ? "var(--accent-strong)" : "var(--foreground)",
                    cursor: !replaceReady ? "not-allowed" : "pointer",
                    opacity: !replaceReady ? 0.5 : 1,
                    minHeight: 38,
                  }}
                >
                  {remapPreviewEnabled ? "Hide Preview" : "Preview"}
                </button>
                <button
                  onClick={confirmRemap}
                  disabled={!replaceReady}
                  style={{
                    ...ACTION_BUTTON_STYLE,
                    flex: "1 1 0",
                    border: "1px solid var(--ui-border-subtle)",
                    background: "var(--accent)",
                    color: "#ffffff",
                    cursor: !replaceReady ? "not-allowed" : "pointer",
                    opacity: !replaceReady ? 0.5 : 1,
                    minHeight: 38,
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
