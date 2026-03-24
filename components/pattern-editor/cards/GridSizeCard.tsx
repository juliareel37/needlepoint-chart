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
  const fieldRowColumns = "minmax(84px, 1fr) minmax(160px, 1.25fr)";

  const fieldRowStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: fieldRowColumns,
    gap: 10,
    alignItems: "center",
  };

  const fieldLabelStyle: React.CSSProperties = {
    fontSize: 12,
  };

  const fieldInputStyle: React.CSSProperties = {
    width: "100%",
    padding: 6,
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.2)",
    fontSize: 12,
    boxSizing: "border-box",
  };

  const unitInputWrapperStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    width: "100%",
    minWidth: 0,
    padding: "0 8px",
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.2)",
    background: "#ffffff",
    boxSizing: "border-box",
  };

  const unitInputStyle: React.CSSProperties = {
    width: "100%",
    minWidth: 0,
    padding: "6px 0",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 12,
    textAlign: "left",
  };

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
          fontWeight: 700,
          fontSize: 15,
        }}
        type="button"
      >
        <span>Canvas Size</span>
        <span style={{ opacity: 0.7, width: 14, textAlign: "center" }}>{gridOpen ? "▾" : "▸"}</span>
      </button>

      <div style={{ display: "grid", gap: 10, width: "100%", ...collapseStyle(gridOpen, 1400) }}>
        <div style={{ display: "grid", gridTemplateColumns: fieldRowColumns, gap: 10, alignItems: "center" }}>
          <span style={fieldLabelStyle}>Unit</span>
          <div
            role="tablist"
            aria-label="Canvas size mode"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              alignItems: "center",
              gap: 4,
              width: "100%",
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
                width: "100%",
                borderRadius: 8,
                border: "none",
                color: "var(--foreground)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Stitches
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
                width: "100%",
                borderRadius: 8,
                border: "none",
                color: "var(--foreground)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Inches
            </button>
          </div>
        </div>

        {draftGridMode === "stitches" ? (
          <>
            <label style={fieldRowStyle}>
              <span style={fieldLabelStyle}>Width</span>
              <span style={unitInputWrapperStyle}>
                <input
                  type="number"
                  min={1}
                  value={draftGridW}
                  onChange={(e) => setDraftGridW(parseInt(e.target.value || "1", 10))}
                  style={unitInputStyle}
                />
                <span style={{ fontSize: 12, opacity: 0.72, flexShrink: 0 }}>stitches</span>
              </span>
            </label>
            <label style={fieldRowStyle}>
              <span style={fieldLabelStyle}>Height</span>
              <span style={unitInputWrapperStyle}>
                <input
                  type="number"
                  min={1}
                  value={draftGridH}
                  onChange={(e) => setDraftGridH(parseInt(e.target.value || "1", 10))}
                  style={unitInputStyle}
                />
                <span style={{ fontSize: 12, opacity: 0.72, flexShrink: 0 }}>stitches</span>
              </span>
            </label>
          </>
        ) : (
          <>
            <label style={fieldRowStyle}>
              <span style={fieldLabelStyle}>Width</span>
              <span style={unitInputWrapperStyle}>
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={draftWidthIn}
                  onChange={(e) => setDraftWidthIn(parseFloat(e.target.value || "0"))}
                  style={unitInputStyle}
                />
                <span style={{ fontSize: 12, opacity: 0.72, flexShrink: 0 }}>inches</span>
              </span>
            </label>
            <label style={fieldRowStyle}>
              <span style={fieldLabelStyle}>Height</span>
              <span style={unitInputWrapperStyle}>
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={draftHeightIn}
                  onChange={(e) => setDraftHeightIn(parseFloat(e.target.value || "0"))}
                  style={unitInputStyle}
                />
                <span style={{ fontSize: 12, opacity: 0.72, flexShrink: 0 }}>inches</span>
              </span>
            </label>
            <label style={fieldRowStyle}>
              <span style={fieldLabelStyle}>Mesh</span>
              <span style={unitInputWrapperStyle}>
                <input
                  type="number"
                  min={1}
                  value={draftMeshCount}
                  onChange={(e) => setDraftMeshCount(parseInt(e.target.value || "1", 10))}
                  style={unitInputStyle}
                />
                <span style={{ fontSize: 12, opacity: 0.72, flexShrink: 0 }}>stitch/in</span>
              </span>
            </label>
          </>
        )}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, alignItems: "center", marginTop: 4, width: "100%" }}>
          <button
            onClick={onApply}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px 10px",
              height: 34,
              minHeight: 34,
              boxSizing: "border-box",
              borderRadius: 8,
              border: "1px solid var(--ui-border-subtle)",
              background: "var(--accent)",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1,
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
