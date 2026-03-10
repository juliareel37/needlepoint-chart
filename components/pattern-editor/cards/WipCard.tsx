"use client";

import React, { useEffect, useRef, useState } from "react";
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
  lastAutosaveAt: Date | null;
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
  lastAutosaveAt,
  usedColors,
  grid,
  paletteById,
  symbolMap,
  gridW,
  gridH,
}: WipCardProps) {
  const [autosaveMenuOpen, setAutosaveMenuOpen] = useState(false);
  const autosaveMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!autosaveMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!autosaveMenuRef.current) return;
      if (autosaveMenuRef.current.contains(event.target as Node)) return;
      setAutosaveMenuOpen(false);
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [autosaveMenuOpen]);

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
          fontWeight: 600,
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
          {isSignedIn && (
            <div
              style={{
                fontSize: 11,
                opacity: 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                justifyContent: "center",
                position: "relative",
              }}
            >
              <img
                src={assetPath("/icons/cloud_done.svg")}
                alt=""
                aria-hidden="true"
                width={14}
                height={14}
                style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
              />
              <span>
                Autosaved{" "}
                {lastAutosaveAt
                  ? `at ${lastAutosaveAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
                  : "enabled"}
              </span>
              <div ref={autosaveMenuRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  aria-label="Version history"
                  onClick={() => setAutosaveMenuOpen((open) => !open)}
                  className="autosave-ellipsis"
                  style={{
                    padding: "2px 8px",
                    borderRadius: 999,
                    border: "1px solid var(--ui-border-subtle)",
                    background: "var(--ui-surface-soft)",
                    cursor: "pointer",
                    fontSize: 11,
                    lineHeight: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 28,
                    minHeight: 20,
                  }}
                >
                  ⋯
                </button>
                {autosaveMenuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      bottom: "100%",
                      marginBottom: 6,
                      background: "#ffffff",
                      border: "1px solid var(--ui-border-subtle)",
                      borderRadius: 10,
                      padding: 8,
                      boxShadow: "0 8px 18px var(--ui-border)",
                      zIndex: 5,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setAutosaveMenuOpen(false);
                        onOpenVersionHistory();
                      }}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid var(--ui-border-subtle)",
                        background: "#ffffff",
                        color: "var(--foreground)",
                        cursor: "pointer",
                        fontSize: 12,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Version History
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
