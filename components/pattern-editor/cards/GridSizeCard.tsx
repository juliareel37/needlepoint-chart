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

      <div style={{ display: "grid", gap: 12, width: "100%", ...collapseStyle(gridOpen, 1400) }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "nowrap" }}>
          <button
            type="button"
            onClick={() => setDraftGridMode("stitches")}
            aria-pressed={draftGridMode === "stitches"}
            style={{
              padding: "5px 9px",
              borderRadius: 10,
              border: draftGridMode === "stitches" ? "1px solid var(--accent-strong)" : "none",
              background: draftGridMode === "stitches" ? "var(--accent-wash)" : "var(--muted-bg)",
              color: draftGridMode === "stitches" ? "var(--accent-strong)" : "var(--foreground)",
              cursor: "pointer",
              fontSize: 12,
              flex: "1 1 0",
            }}
          >
            Stitch count
          </button>
          <button
            type="button"
            onClick={() => setDraftGridMode("inches")}
            aria-pressed={draftGridMode === "inches"}
            style={{
              padding: "5px 9px",
              borderRadius: 10,
              border: draftGridMode === "inches" ? "1px solid var(--accent-strong)" : "none",
              background: draftGridMode === "inches" ? "var(--accent-wash)" : "var(--muted-bg)",
              color: draftGridMode === "inches" ? "var(--accent-strong)" : "var(--foreground)",
              cursor: "pointer",
              fontSize: 12,
              flex: "1 1 0",
            }}
          >
            Dimensions
          </button>
        </div>

        {draftGridMode === "stitches" ? (
          <>
            <label style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 14 }}>Width (stitches)</span>
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
              <span style={{ fontSize: 14 }}>Height (stitches)</span>
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
              <span style={{ fontSize: 14 }}>Width (inches)</span>
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
              <span style={{ fontSize: 14 }}>Height (inches)</span>
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
              <span style={{ fontSize: 14 }}>Mesh (stitches/in)</span>
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
        <div style={{ display: "flex", justifyContent: "center", gap: 12, alignItems: "center", marginTop: 4 }}>
          <button
            onClick={onApply}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "none",
              background: "var(--accent)",
              color: "var(--card-bg)",
              cursor: "pointer",
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
