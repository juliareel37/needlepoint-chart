"use client";

import React from "react";

type GridSizeCardProps = {
  cardStyle: React.CSSProperties;
  cardShadow: string;
  cardShadowCollapsed: string;
  gridOpen: boolean;
  setGridOpen: React.Dispatch<React.SetStateAction<boolean>>;
  collapseStyle: (open: boolean, maxHeight?: number) => React.CSSProperties;
  draftGridMode: "stitches" | "inches";
  setDraftGridMode: React.Dispatch<React.SetStateAction<"stitches" | "inches">>;
  draftGridW: number;
  setDraftGridW: React.Dispatch<React.SetStateAction<number>>;
  draftGridH: number;
  setDraftGridH: React.Dispatch<React.SetStateAction<number>>;
  draftWidthIn: number;
  setDraftWidthIn: React.Dispatch<React.SetStateAction<number>>;
  draftHeightIn: number;
  setDraftHeightIn: React.Dispatch<React.SetStateAction<number>>;
  draftMeshCount: number;
  setDraftMeshCount: React.Dispatch<React.SetStateAction<number>>;
  onApply: () => void;
};

export function GridSizeCard({
  cardStyle,
  cardShadow,
  cardShadowCollapsed,
  gridOpen,
  setGridOpen,
  collapseStyle,
  draftGridMode,
  setDraftGridMode,
  draftGridW,
  setDraftGridW,
  draftGridH,
  setDraftGridH,
  draftWidthIn,
  setDraftWidthIn,
  draftHeightIn,
  setDraftHeightIn,
  draftMeshCount,
  setDraftMeshCount,
  onApply,
}: GridSizeCardProps) {
  return (
    <div
      className="app-card"
      style={{
        ...cardStyle,
        boxShadow: gridOpen ? cardShadow : cardShadowCollapsed,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <button
        onClick={() => setGridOpen((open) => !open)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          border: "none",
          background: "transparent",
          padding: 0,
          marginBottom: gridOpen ? 10 : 0,
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 14,
        }}
        type="button"
      >
        <span>Canvas Size</span>
        <span style={{ opacity: 0.7, width: 14, textAlign: "center" }}>{gridOpen ? "▾" : "▸"}</span>
      </button>

      <div style={{ display: "grid", gap: 10, width: "100%", ...collapseStyle(gridOpen, 1400) }}>
        <div
          role="tablist"
          aria-label="Canvas size mode"
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
          <button
            type="button"
            role="tab"
            onClick={() => setDraftGridMode("stitches")}
            aria-pressed={draftGridMode === "stitches"}
            aria-selected={draftGridMode === "stitches"}
            data-active={draftGridMode === "stitches" ? "true" : undefined}
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
            Stitch count
          </button>
          <button
            type="button"
            role="tab"
            onClick={() => setDraftGridMode("inches")}
            aria-pressed={draftGridMode === "inches"}
            aria-selected={draftGridMode === "inches"}
            data-active={draftGridMode === "inches" ? "true" : undefined}
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
            Dimensions
          </button>
        </div>

        {draftGridMode === "stitches" ? (
          <>
            <label style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 12 }}>Width (stitches)</span>
              <input
                type="number"
                min={1}
                value={draftGridW}
                onChange={(e) => setDraftGridW(parseInt(e.target.value || "1", 10))}
                style={{
                  width: 72,
                  padding: 6,
                  borderRadius: 8,
                  border: "1px solid rgba(0,0,0,0.2)",
                  fontSize: 14,
                }}
              />
            </label>
            <label style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 12 }}>Height (stitches)</span>
              <input
                type="number"
                min={1}
                value={draftGridH}
                onChange={(e) => setDraftGridH(parseInt(e.target.value || "1", 10))}
                style={{
                  width: 72,
                  padding: 6,
                  borderRadius: 8,
                  border: "1px solid rgba(0,0,0,0.2)",
                  fontSize: 14,
                }}
              />
            </label>
          </>
        ) : (
          <>
            <label style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 12 }}>Width (inches)</span>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={draftWidthIn}
                onChange={(e) => setDraftWidthIn(parseFloat(e.target.value || "0"))}
                style={{
                  width: 72,
                  padding: 6,
                  borderRadius: 8,
                  border: "1px solid rgba(0,0,0,0.2)",
                  fontSize: 14,
                }}
              />
            </label>
            <label style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 12 }}>Height (inches)</span>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={draftHeightIn}
                onChange={(e) => setDraftHeightIn(parseFloat(e.target.value || "0"))}
                style={{
                  width: 72,
                  padding: 6,
                  borderRadius: 8,
                  border: "1px solid rgba(0,0,0,0.2)",
                  fontSize: 14,
                }}
              />
            </label>
            <label style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 12 }}>Mesh (stitches/in)</span>
              <input
                type="number"
                min={1}
                value={draftMeshCount}
                onChange={(e) => setDraftMeshCount(parseInt(e.target.value || "1", 10))}
                style={{
                  width: 72,
                  padding: 6,
                  borderRadius: 8,
                  border: "1px solid rgba(0,0,0,0.2)",
                  fontSize: 14,
                }}
              />
            </label>
          </>
        )}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, alignItems: "center", marginTop: 4, width: "100%" }}>
          <button
            onClick={onApply}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "4px 8px",
              borderRadius: 8,
              border: "1px solid var(--ui-border-subtle)",
              background: "var(--card-bg)",
              color: "var(--foreground)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              width: "100%",
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
