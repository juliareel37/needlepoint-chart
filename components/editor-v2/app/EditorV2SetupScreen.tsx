"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import {
  EDITOR_V2_MAX_GRID_SIZE,
  EDITOR_V2_MIN_GRID_SIZE,
} from "@/lib/editor-v2/config";
import type { EditorDocumentState } from "@/lib/editor-v2/editor/store";
import type { SavedEditorV2DocumentRecord } from "./editorV2LocalPersistence";

export interface EditorV2DesignConfigNew {
  kind: "new";
  width: number;
  height: number;
  instanceKey: string;
}

export interface EditorV2DesignConfigLoaded {
  kind: "loaded";
  document: EditorDocumentState;
  instanceKey: string;
}

export type EditorV2DesignConfig =
  | EditorV2DesignConfigNew
  | EditorV2DesignConfigLoaded;

interface EditorV2SetupScreenProps {
  draftHeight: string;
  draftWidth: string;
  onCreateDesign: (config: EditorV2DesignConfigNew) => void;
  onDraftHeightChange: (value: string) => void;
  onDraftWidthChange: (value: string) => void;
  onLoadSavedDesign: (config: EditorV2DesignConfigLoaded) => void;
  savedDocuments: SavedEditorV2DocumentRecord[];
}

export function EditorV2SetupScreen({
  draftHeight,
  draftWidth,
  onCreateDesign,
  onDraftHeightChange,
  onDraftWidthChange,
  onLoadSavedDesign,
  savedDocuments,
}: EditorV2SetupScreenProps) {
  return (
    <main style={pageStyle}>
      <section style={setupCardStyle}>
        <div style={topRowStyle}>
          <Link href="/editor-v2/design-system" style={tempLinkStyle}>
            V2 DS
          </Link>
        </div>

        <p style={eyebrowStyle}>editor-v2 setup</p>
        <h1 style={titleStyle}>Create a new design</h1>
        <p style={bodyStyle}>
          Choose the starting grid size. After creation, grid size is fixed for
          this validation slice.
        </p>

        <label style={fieldStyle}>
          <span>Grid width</span>
          <input
            type="number"
            min={EDITOR_V2_MIN_GRID_SIZE}
            max={EDITOR_V2_MAX_GRID_SIZE}
            value={draftWidth}
            onChange={(event) => onDraftWidthChange(event.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={fieldStyle}>
          <span>Grid height</span>
          <input
            type="number"
            min={EDITOR_V2_MIN_GRID_SIZE}
            max={EDITOR_V2_MAX_GRID_SIZE}
            value={draftHeight}
            onChange={(event) => onDraftHeightChange(event.target.value)}
            style={inputStyle}
          />
        </label>

        <button
          type="button"
          onClick={() => {
            const width = clampGridSize(draftWidth);
            const height = clampGridSize(draftHeight);

            onDraftWidthChange(String(width));
            onDraftHeightChange(String(height));
            onCreateDesign({
              kind: "new",
              width,
              height,
              instanceKey: `design_${width}x${height}_${Date.now()}`,
            });
          }}
          style={buttonStyle}
        >
          Create new design
        </button>

        {savedDocuments.length > 0 ? (
          <div style={savedListStyle}>
            <p style={savedListTitleStyle}>Saved designs</p>
            {savedDocuments.map((record) => (
              <button
                key={record.storageId}
                type="button"
                onClick={() =>
                  onLoadSavedDesign({
                    kind: "loaded",
                    document: record.document,
                    instanceKey: `loaded_${record.storageId}_${Date.now()}`,
                  })
                }
                style={savedItemButtonStyle}
              >
                <strong>{record.document.project.title || "Untitled Design"}</strong>
                <span>
                  {record.document.grid.width} x {record.document.grid.height} grid
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function clampGridSize(value: string): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 8;
  }

  return Math.max(
    EDITOR_V2_MIN_GRID_SIZE,
    Math.min(EDITOR_V2_MAX_GRID_SIZE, Math.floor(parsed)),
  );
}

const pageStyle = {
  minHeight: "100%",
  boxSizing: "border-box",
  display: "grid",
  placeItems: "center",
  padding: "32px",
  background: "#f8fafc",
  color: "#111827",
  fontFamily: "system-ui, sans-serif",
} satisfies CSSProperties;

const setupCardStyle = {
  width: "100%",
  maxWidth: "420px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  padding: "24px",
  borderRadius: "16px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
} satisfies CSSProperties;

const topRowStyle = {
  display: "flex",
  justifyContent: "flex-end",
} satisfies CSSProperties;

const eyebrowStyle = {
  margin: 0,
  fontSize: "12px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#64748b",
} satisfies CSSProperties;

const titleStyle = {
  margin: 0,
  fontSize: "28px",
  lineHeight: 1.1,
} satisfies CSSProperties;

const bodyStyle = {
  margin: 0,
  color: "#475569",
  lineHeight: 1.5,
} satisfies CSSProperties;

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  color: "#334155",
  fontSize: "14px",
} satisfies CSSProperties;

const inputStyle = {
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  fontSize: "16px",
} satisfies CSSProperties;

const buttonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 16px",
  borderRadius: "999px",
  border: "1px solid #111827",
  background: "#111827",
  color: "#ffffff",
  fontWeight: 600,
  cursor: "pointer",
} satisfies CSSProperties;

const savedListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  paddingTop: "8px",
  borderTop: "1px solid #e2e8f0",
} satisfies CSSProperties;

const savedListTitleStyle = {
  margin: 0,
  fontSize: "14px",
  fontWeight: 600,
  color: "#334155",
} satisfies CSSProperties;

const savedItemButtonStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "4px",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#0f172a",
  cursor: "pointer",
} satisfies CSSProperties;

const tempLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "28px",
  padding: "6px 10px",
  borderRadius: "12px",
  color: "#475569",
  textDecoration: "none",
  fontSize: "10px",
  lineHeight: "14px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  background: "transparent",
} satisfies CSSProperties;
