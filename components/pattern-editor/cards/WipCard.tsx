"use client";

import React from "react";
import { SignInButton } from "@clerk/nextjs";
import type { Color } from "../../../lib/grid";
import { assetPath } from "../../../lib/assetPath";

type UsedColorEntry = { color: Color; count: number };

type WipCardProps = {
  cardStyle: React.CSSProperties;
  cardShadow: string;
  cardShadowCollapsed: string;
  wipOpen: boolean;
  setWipOpen: React.Dispatch<React.SetStateAction<boolean>>;
  collapseStyle: (open: boolean, maxHeight?: number) => React.CSSProperties;
  title: string;
  onTitleChange: (value: string) => void;
  isSignedIn: boolean;
  onCapturePendingDraft: () => void;
  onStartNewWip: () => void;
  onLoadWip: () => void;
  onOpenVersionHistory: () => void;
  draftInputRef: React.RefObject<HTMLInputElement | null>;
  onDraftFileSelected: (file: File) => void;
  usedColors: UsedColorEntry[];
  grid: Uint16Array;
  paletteById: Map<number, Color>;
  symbolMap: Map<number, string>;
  gridW: number;
  gridH: number;
};

export function WipCard({
  cardStyle,
  cardShadow,
  cardShadowCollapsed,
  wipOpen,
  setWipOpen,
  collapseStyle,
  title,
  onTitleChange,
  isSignedIn,
  onCapturePendingDraft,
  onStartNewWip,
  onLoadWip,
  onOpenVersionHistory,
  draftInputRef,
  onDraftFileSelected,
  usedColors,
  grid,
  paletteById,
  symbolMap,
  gridW,
  gridH,
}: WipCardProps) {
  return (
    <div
      className="app-card"
      style={{
        ...cardStyle,
        boxShadow: wipOpen ? cardShadow : cardShadowCollapsed,
        display: "grid",
        gap: 8,
        justifyItems: "center",
        textAlign: "center",
      }}
    >
      <button
        onClick={() => setWipOpen((open) => !open)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          border: "none",
          background: "transparent",
          padding: 0,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 15,
        }}
        type="button"
      >
        <span>File</span>
        <span style={{ opacity: 0.7 }}>{wipOpen ? "▾" : "▸"}</span>
      </button>
      <div style={{ display: "grid", gap: 8, width: "100%", ...collapseStyle(wipOpen, 900) }}>
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
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  justifyContent: "center",
                }}
              >
                <img
                  src={assetPath("/icons/save.svg")}
                  alt=""
                  aria-hidden="true"
                  width={16}
                  height={16}
                  style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
                />
                Sign in to save
              </button>
            </SignInButton>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={onStartNewWip}
              style={{
                padding: "6px 8px",
                borderRadius: 8,
                border: "none",
                background: "var(--muted-bg)",
                color: "var(--foreground)",
                cursor: "pointer",
                display: "grid",
                gap: 4,
                justifyItems: "center",
                minWidth: 80,
                transition: "transform 120ms ease, box-shadow 120ms ease",
              }}
            >
              <img
                src={assetPath("/icons/draft_add.svg")}
                alt=""
                aria-hidden="true"
                width={20}
                height={20}
                style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
              />
              <span style={{ fontSize: 11, opacity: 0.75 }}>New WIP</span>
            </button>
            <button
              onClick={onLoadWip}
              style={{
                padding: "6px 8px",
                borderRadius: 8,
                border: "none",
                background: "var(--muted-bg)",
                color: "var(--foreground)",
                cursor: "pointer",
                display: "grid",
                gap: 4,
                justifyItems: "center",
                minWidth: 80,
                transition: "transform 120ms ease, box-shadow 120ms ease",
              }}
            >
              <img
                src={assetPath("/icons/unarchive.svg")}
                alt=""
                aria-hidden="true"
                width={20}
                height={20}
                style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
              />
              <span style={{ fontSize: 11, opacity: 0.75 }}>Load WIP</span>
            </button>
          </div>
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
        </div>
      </div>
    </div>
  );
}
