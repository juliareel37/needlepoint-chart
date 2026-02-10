"use client";

import React from "react";
import { SignInButton } from "@clerk/nextjs";
import ExportPdfButton from "./ExportPdfButton";
import type { Color } from "../../../lib/grid";

type WipStatus = {
  message: string;
  tone: "info" | "success" | "error";
} | null;

type UsedColorEntry = { color: Color; count: number };

type WipCardProps = {
  cardStyle: React.CSSProperties;
  title: string;
  onTitleChange: (value: string) => void;
  isSignedIn: boolean;
  onCapturePendingDraft: () => void;
  onStartNewWip: () => void;
  onLoadWip: () => void;
  onOpenVersionHistory: () => void;
  draftInputRef: React.RefObject<HTMLInputElement | null>;
  onDraftFileSelected: (file: File) => void;
  wipStatus: WipStatus;
  exportCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  usedColors: UsedColorEntry[];
  grid: Uint16Array;
  paletteById: Map<number, Color>;
  symbolMap: Map<number, string>;
  gridW: number;
  gridH: number;
  exportCellSize: number;
};

export function WipCard({
  cardStyle,
  title,
  onTitleChange,
  isSignedIn,
  onCapturePendingDraft,
  onStartNewWip,
  onLoadWip,
  onOpenVersionHistory,
  draftInputRef,
  onDraftFileSelected,
  wipStatus,
  exportCanvasRef,
  usedColors,
  grid,
  paletteById,
  symbolMap,
  gridW,
  gridH,
  exportCellSize,
}: WipCardProps) {
  return (
    <div
      className="app-card"
      style={{
        ...cardStyle,
        display: "grid",
        gap: 8,
        justifyItems: "center",
        textAlign: "center",
      }}
    >
      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        style={{
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid var(--panel-border)",
          width: "100%",
        }}
      />
      <div style={{ display: "grid", gap: 8, width: "100%" }}>
        {!isSignedIn && (
          <SignInButton mode="modal">
            <button
              type="button"
              onClick={onCapturePendingDraft}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid var(--panel-border)",
                background: "var(--card-bg)",
                color: "var(--foreground)",
                cursor: "pointer",
                fontSize: 14,
                width: "100%",
              }}
            >
              Sign in to save
            </button>
          </SignInButton>
        )}
        <button
          onClick={onStartNewWip}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid var(--panel-border)",
            background: "var(--card-bg)",
            color: "var(--foreground)",
            cursor: "pointer",
            fontSize: 14,
            width: "100%",
          }}
        >
          New WIP
        </button>
        <button
          onClick={onLoadWip}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "none",
            background: "var(--muted-bg)",
            color: "var(--foreground)",
            cursor: "pointer",
            fontSize: 14,
            width: "100%",
          }}
        >
          Load WIP
        </button>
        <button
          onClick={onOpenVersionHistory}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid var(--panel-border)",
            background: "var(--card-bg)",
            color: "var(--foreground)",
            cursor: "pointer",
            fontSize: 14,
            width: "100%",
          }}
        >
          Version History
        </button>
        <input
          ref={draftInputRef}
          type="file"
          accept="application/json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            onDraftFileSelected(file);
            e.currentTarget.value = "";
          }}
          style={{ display: "none" }}
        />
        {wipStatus && (
          <div
            aria-live="polite"
            style={{
              fontSize: 12,
              color:
                wipStatus.tone === "error"
                  ? "#b91c1c"
                  : wipStatus.tone === "success"
                    ? "var(--accent-strong)"
                    : "var(--foreground)",
              opacity: 0.8,
            }}
          >
            {wipStatus.message}
          </div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <ExportPdfButton
          title={title}
          canvasRef={exportCanvasRef}
          usedColors={usedColors}
          grid={grid}
          paletteById={paletteById}
          symbolMap={symbolMap}
          width={gridW}
          height={gridH}
          cellSize={exportCellSize}
        />
      </div>
    </div>
  );
}
