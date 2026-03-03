"use client";

import React from "react";
import type { Color } from "../../../lib/grid";
import { assetPath } from "../../../lib/assetPath";
import { symbolForColorId } from "../../../lib/symbols";
import { contrastForHex } from "../utils/colorUtils";

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
  remapSourceId: number | null;
  remapTargetId: number | null;
  identifyColorId: number | null;
  showSymbols: boolean;
  symbolMap: Map<number, string>;
  setIdentifyColorId: React.Dispatch<React.SetStateAction<number | null>>;
  setActiveColorId: React.Dispatch<React.SetStateAction<number>>;
  setDeleteSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  setMergeSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  setMergeTargetId: React.Dispatch<React.SetStateAction<number | null>>;
  beginRemap: (id: number) => void;
  previewRemap: (id: number) => void;
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

export function UsedColorsSection({
  cardStyle,
  cardShadow,
  cardShadowCollapsed,
  usedColorsOpen,
  setUsedColorsOpen,
  collapseStyle,
  usedColors,
  usedColorIds,
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
  remapSourceId,
  remapTargetId,
  identifyColorId,
  showSymbols,
  symbolMap,
  setIdentifyColorId,
  setActiveColorId,
  setDeleteSelectedIds,
  setMergeSelectedIds,
  setMergeTargetId,
  beginRemap,
  previewRemap,
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
  const hasPaintedCells = hasAnyPaintedCells;
  return (
    <div className="app-card" style={{ ...cardStyle, boxShadow: usedColorsOpen ? cardShadow : cardShadowCollapsed }}>
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
        <span>Manage colors ({usedColors.length})</span>
        <span style={{ opacity: 0.7, width: 14, textAlign: "center" }}>
          {usedColorsOpen ? "▾" : "▸"}
        </span>
      </button>
      <div style={{ ...collapseStyle(usedColorsOpen, 800) }}>
        <div
          style={{
            display: "grid",
            gap: 6,
            marginBottom: 10,
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid var(--ui-border-subtle)",
            background: "var(--ui-surface-soft)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "grid", gap: 2 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Apply to area</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Limit color changes to a selected region</div>
            </div>
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => {
                if (!hasPaintedCells) return;
                if (filterMode) {
                  clearFilterSelection();
                } else {
                  startFilterSelection();
                }
              }}
              aria-pressed={filterMode}
              aria-disabled={!hasPaintedCells}
              aria-label="Filter canvas"
              data-active={filterMode ? "true" : undefined}
              className="toolbar-button used-colors-filter-button"
              disabled={!hasPaintedCells}
              style={{
                flex: "1 1 auto",
                width: "100%",
                padding: "6px 10px",
                borderRadius: 8,
                cursor: hasPaintedCells ? "pointer" : "not-allowed",
                opacity: hasPaintedCells ? 1 : 0.5,
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
                  src={assetPath("/pic_in_pic.svg")}
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
        </div>
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
            disabled={!hasPaintedCells}
            style={{
              padding: "6px 8px",
              borderRadius: 8,
              flex: "1 1 0",
              width: 0,
              cursor: hasPaintedCells ? "pointer" : "not-allowed",
              display: "flex",
              gap: 4,
              alignItems: "center",
              justifyContent: "center",
              opacity: hasPaintedCells ? 1 : 0.5,
              whiteSpace: "nowrap",
              border: "none",
            }}
          >
            <span
              className="toolbar-icon"
              aria-hidden="true"
              style={{ width: 16, height: 16, display: "grid", placeItems: "center", flexShrink: 0 }}
            >
              <img
                src={assetPath("/swap.svg")}
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
            disabled={!hasPaintedCells}
            style={{
              padding: "6px 8px",
              borderRadius: 8,
              flex: "1 1 0",
              width: 0,
              cursor: hasPaintedCells ? "pointer" : "not-allowed",
              display: "flex",
              gap: 4,
              alignItems: "center",
              justifyContent: "center",
              opacity: hasPaintedCells ? 1 : 0.5,
              whiteSpace: "nowrap",
              border: "none",
            }}
          >
            <span className="toolbar-icon" aria-hidden="true">
              <img
                src={assetPath("/merge.svg")}
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
            disabled={!hasPaintedCells}
            style={{
              padding: "6px 8px",
              borderRadius: 8,
              flex: "1 1 0",
              width: 0,
              cursor: hasPaintedCells ? "pointer" : "not-allowed",
              display: "flex",
              gap: 4,
              alignItems: "center",
              justifyContent: "center",
              opacity: hasPaintedCells ? 1 : 0.5,
              whiteSpace: "nowrap",
              border: "none",
            }}
          >
            <span className="toolbar-icon" aria-hidden="true">
              <img
                src={assetPath("/deselect.svg")}
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
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
          {remapMode
            ? remapSourceId !== null
              ? "Pick replacement color."
              : "Select a used color to replace."
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
            : ""}
        </div>
        {deleteMode && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
            <button
              onClick={() => {
                cancelDelete();
                setDeleteMode(false);
              }}
              style={{
                padding: "2px 6px",
                borderRadius: 999,
                border: "none",
                background: "var(--muted-bg)",
                color: "var(--foreground)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteColors}
              disabled={deleteSelectedIds.length === 0 || usedColors.length - deleteSelectedIds.length < 1}
              style={{
                padding: "2px 8px",
                borderRadius: 999,
                border: "1px solid var(--foreground)",
                background: "var(--foreground)",
                color: "var(--background)",
                cursor:
                  deleteSelectedIds.length === 0 || usedColors.length - deleteSelectedIds.length < 1
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  deleteSelectedIds.length === 0 || usedColors.length - deleteSelectedIds.length < 1 ? 0.5 : 1,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Delete
            </button>
          </div>
        )}
        {mergeMode && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
            <button
              onClick={() => {
                cancelMerge();
                setMergeMode(false);
              }}
              style={{
                padding: "2px 8px",
                borderRadius: 999,
                border: "none",
                background: "var(--muted-bg)",
                color: "var(--foreground)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmMerge}
              disabled={mergeSelectedIds.length < 2 || mergeTargetId === null}
              style={{
                padding: "2px 8px",
                borderRadius: 999,
                border: "1px solid var(--foreground)",
                background: "var(--foreground)",
                color: "var(--background)",
                cursor: mergeSelectedIds.length < 2 || mergeTargetId === null ? "not-allowed" : "pointer",
                opacity: mergeSelectedIds.length < 2 || mergeTargetId === null ? 0.5 : 1,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Merge
            </button>
          </div>
        )}
        {remapMode && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
            <button
              onClick={() => {
                cancelRemap();
                setRemapMode(false);
              }}
              style={{
                padding: "2px 8px",
                borderRadius: 999,
                border: "none",
                background: "var(--muted-bg)",
                color: "var(--foreground)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmRemap}
              disabled={remapSourceId === null || remapTargetId === null}
              style={{
                padding: "2px 8px",
                borderRadius: 999,
                border: "1px solid var(--foreground)",
                background: "var(--foreground)",
                color: "var(--background)",
                cursor: remapSourceId === null || remapTargetId === null ? "not-allowed" : "pointer",
                opacity: remapSourceId === null || remapTargetId === null ? 0.5 : 1,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              OK
            </button>
          </div>
        )}
        <div
          style={{
            display: "grid",
            gap: 8,
            maxHeight: 240,
            overflowY: "auto",
            padding: "8px 6px 6px 6px",
          }}
        >
          {usedColors.map(({ color, count }) => {
              const isIdentifyActive = identifyColorId === color.id;
              const isMergeSelected = mergeSelectedIds.includes(color.id);
              const isMergeTarget = mergeTargetId === color.id;
              const isDeleteSelected = deleteSelectedIds.includes(color.id);
              const mergeSelectionIndex = mergeSelectedIds.indexOf(color.id);
              const isRemapTarget = remapTargetId === color.id;
              const borderStyle =
                mergeMode && isMergeTarget
                  ? "2px solid var(--accent-strong)"
                  : mergeMode && isMergeSelected
                    ? "2px solid var(--accent)"
                    : deleteMode && isDeleteSelected
                      ? "2px solid var(--accent-strong)"
                      : remapSourceId === color.id
                        ? "2px solid var(--foreground)"
                        : remapMode && isRemapTarget
                          ? "2px solid var(--accent-strong)"
                          : isIdentifyActive
                            ? "2px solid var(--accent-strong)"
                            : "1px solid transparent";
              const backgroundStyle =
                mergeMode && isMergeSelected
                  ? "var(--accent-wash)"
                  : deleteMode && isDeleteSelected
                    ? "var(--accent-wash)"
                    : remapMode && isRemapTarget
                      ? "var(--accent-wash)"
                      : "transparent";
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
                if (remapMode) {
                  if (remapSourceId === null) {
                    beginRemap(color.id);
                    return;
                  }
                  if (color.id === remapSourceId) return;
                  previewRemap(color.id);
                  return;
                }
                setActiveColorId(color.id);
              };
              return (
                <div
                  key={color.id}
                  role="button"
                  tabIndex={0}
                  onClick={handleUsedColorClick}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleUsedColorClick();
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 8px",
                    position: "relative",
                    borderRadius: 8,
                    border: borderStyle,
                    background: backgroundStyle,
                    cursor: "pointer",
                    textAlign: "left",
                    minWidth: 0,
                  }}
                  aria-label={`Select ${color.name}`}
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
                      width: 26,
                      height: 26,
                      borderRadius: 5,
                      background: color.hex,
                      display: "block",
                      flexShrink: 0,
                      boxShadow: isMergeTarget
                        ? "0 0 0 3px var(--accent-strong), 0 0 0 6px rgba(191,100,217,0.25), inset 0 0 0 1px rgba(0,0,0,0.2)"
                        : "inset 0 0 0 1px rgba(0,0,0,0.15)",
                      position: "relative",
                      overflow: "visible",
                    }}
                    onClick={(event) => {
                      if (!mergeMode) return;
                      event.stopPropagation();
                      setMergeSelectedIds((prev) => {
                        const next = new Set(prev);
                        if (!next.has(color.id)) {
                          next.add(color.id);
                        }
                        return Array.from(next);
                      });
                      setMergeTargetId((prev) => (prev === color.id ? null : color.id));
                    }}
                    role={mergeMode ? "button" : undefined}
                    aria-label={mergeMode ? `Set ${color.name} as merge target` : undefined}
                    title={mergeMode ? "Set as merge target" : undefined}
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
                        fontSize: 8,
                        fontWeight: 700,
                        display: "grid",
                        placeItems: "center",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                        pointerEvents: "none",
                        transform: "translate(-50%, -50%)",
                        zIndex: 2,
                      }}
                      aria-hidden="true"
                    >
                      {count}
                    </span>
                    {showSymbols && symbolForColorId(color.id, symbolMap) && (
                      <span
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "grid",
                          placeItems: "center",
                          fontSize: 12,
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
                  <span
                    style={{
                      fontSize: 11,
                      lineHeight: 1.2,
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      flex: "1 1 auto",
                      minWidth: 0,
                    }}
                  >
                    {color.code ? `#${color.code} ` : ""}
                    {color.name}
                  </span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIdentifyColorId((prev) => (prev === color.id ? null : color.id));
                    }}
                    aria-label={isIdentifyActive ? `Hide ${color.name}` : `Identify ${color.name}`}
                    title={isIdentifyActive ? "Hide highlight" : "Highlight color"}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      border: isIdentifyActive ? "1px solid var(--accent-strong)" : "1px solid transparent",
                      background: isIdentifyActive ? "var(--accent-soft)" : "transparent",
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={assetPath("/identify.svg")}
                      alt=""
                      aria-hidden="true"
                      width={14}
                      height={14}
                      style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                    />
                  </button>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
