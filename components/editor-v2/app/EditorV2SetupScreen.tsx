"use client";

import type { CSSProperties } from "react";
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
  sizingMode: "stitches" | "inches";
  meshCount: number | null;
  widthInches: number | null;
  heightInches: number | null;
  instanceKey: string;
}

export interface EditorV2DesignConfigLoaded {
  kind: "loaded";
  document: EditorDocumentState;
  storageId: string;
  instanceKey: string;
}

export type EditorV2DesignConfig =
  | EditorV2DesignConfigNew
  | EditorV2DesignConfigLoaded;

interface EditorV2SetupScreenProps {
  draftHeight: string;
  draftHeightInches: string;
  draftMeshCount: string;
  draftSizingMode: "stitches" | "inches";
  draftWidth: string;
  draftWidthInches: string;
  onCreateDesign: (config: EditorV2DesignConfigNew) => void;
  onDraftHeightChange: (value: string) => void;
  onDraftHeightInchesChange: (value: string) => void;
  onDraftMeshCountChange: (value: string) => void;
  onDraftSizingModeChange: (value: "stitches" | "inches") => void;
  onDraftWidthChange: (value: string) => void;
  onDraftWidthInchesChange: (value: string) => void;
  onLoadSavedDesign: (config: EditorV2DesignConfigLoaded) => void;
  savedDocuments: SavedEditorV2DocumentRecord[];
}

export function EditorV2SetupScreen({
  draftHeight,
  draftHeightInches,
  draftMeshCount,
  draftSizingMode,
  draftWidth,
  draftWidthInches,
  onCreateDesign,
  onDraftHeightChange,
  onDraftHeightInchesChange,
  onDraftMeshCountChange,
  onDraftSizingModeChange,
  onDraftWidthChange,
  onDraftWidthInchesChange,
  onLoadSavedDesign,
  savedDocuments,
}: EditorV2SetupScreenProps) {
  const inchSizing = resolveInchSizing({
    widthInches: draftWidthInches,
    heightInches: draftHeightInches,
    meshCount: draftMeshCount,
  });
  const createDisabled = draftSizingMode === "inches" && inchSizing.error !== null;

  return (
    <main style={pageStyle}>
      <section style={setupCardStyle}>
        <p style={eyebrowStyle}>editor-v2 setup</p>
        <h1 style={titleStyle}>Create a new design</h1>
        <p style={bodyStyle}>
          Choose the starting grid size. After creation, grid size is fixed for
          this validation slice.
        </p>

        <label style={fieldStyle}>
          <span>Sizing mode</span>
          <select
            value={draftSizingMode}
            onChange={(event) =>
              onDraftSizingModeChange(
                event.target.value === "inches" ? "inches" : "stitches",
              )
            }
            style={inputStyle}
          >
            <option value="stitches">Grid cells</option>
            <option value="inches">Inches + cells per inch</option>
          </select>
        </label>

        {draftSizingMode === "stitches" ? (
          <>
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
          </>
        ) : (
          <>
            <label style={fieldStyle}>
              <span>Width (inches)</span>
              <input
                type="number"
                min="0"
                step="any"
                value={draftWidthInches}
                onChange={(event) => onDraftWidthInchesChange(event.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span>Height (inches)</span>
              <input
                type="number"
                min="0"
                step="any"
                value={draftHeightInches}
                onChange={(event) => onDraftHeightInchesChange(event.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span>Cells per inch</span>
              <input
                type="number"
                min="0"
                step="any"
                value={draftMeshCount}
                onChange={(event) => onDraftMeshCountChange(event.target.value)}
                style={inputStyle}
              />
            </label>

            {inchSizing.error ? (
              <p style={validationStyle}>{inchSizing.error}</p>
            ) : (
              <p style={helperStyle}>
                Grid size: {inchSizing.width} x {inchSizing.height} cells
              </p>
            )}
          </>
        )}

        <button
          type="button"
          disabled={createDisabled}
          onClick={() => {
            if (draftSizingMode === "inches") {
              if (inchSizing.error) {
                return;
              }

              onDraftWidthChange(String(inchSizing.width));
              onDraftHeightChange(String(inchSizing.height));
              onDraftWidthInchesChange(normalizeDecimalInput(draftWidthInches));
              onDraftHeightInchesChange(normalizeDecimalInput(draftHeightInches));
              onDraftMeshCountChange(normalizeDecimalInput(draftMeshCount));
              onCreateDesign({
                kind: "new",
                width: inchSizing.width!,
                height: inchSizing.height!,
                sizingMode: "inches",
                meshCount: inchSizing.meshCount,
                widthInches: inchSizing.widthInches,
                heightInches: inchSizing.heightInches,
                instanceKey: `design_${inchSizing.width!}x${inchSizing.height!}_${Date.now()}`,
              });
              return;
            }

            const width = clampGridSize(draftWidth);
            const height = clampGridSize(draftHeight);

            onDraftWidthChange(String(width));
            onDraftHeightChange(String(height));
            onCreateDesign({
              kind: "new",
              width,
              height,
              sizingMode: "stitches",
              meshCount: null,
              widthInches: null,
              heightInches: null,
              instanceKey: `design_${width}x${height}_${Date.now()}`,
            });
          }}
          style={{
            ...buttonStyle,
            ...(createDisabled ? disabledButtonStyle : null),
          }}
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
                    storageId: record.storageId,
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

function parsePositiveDecimal(value: string): number | null {
  if (value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function normalizeDecimalInput(value: string): string {
  const parsed = parsePositiveDecimal(value);
  return parsed === null ? value : String(parsed);
}

function resolveInchSizing({
  widthInches,
  heightInches,
  meshCount,
}: {
  widthInches: string;
  heightInches: string;
  meshCount: string;
}):
  | {
      error: string;
      width: null;
      height: null;
      widthInches: null;
      heightInches: null;
      meshCount: null;
    }
  | {
      error: null;
      width: number;
      height: number;
      widthInches: number;
      heightInches: number;
      meshCount: number;
    } {
  const parsedWidthInches = parsePositiveDecimal(widthInches);
  const parsedHeightInches = parsePositiveDecimal(heightInches);
  const parsedMeshCount = parsePositiveDecimal(meshCount);

  if (parsedWidthInches === null || parsedHeightInches === null || parsedMeshCount === null) {
    return {
      error: "Enter positive values for width, height, and cells per inch.",
      width: null,
      height: null,
      widthInches: null,
      heightInches: null,
      meshCount: null,
    };
  }

  const width = Math.round(parsedWidthInches * parsedMeshCount);
  const height = Math.round(parsedHeightInches * parsedMeshCount);

  if (
    width < EDITOR_V2_MIN_GRID_SIZE ||
    width > EDITOR_V2_MAX_GRID_SIZE ||
    height < EDITOR_V2_MIN_GRID_SIZE ||
    height > EDITOR_V2_MAX_GRID_SIZE
  ) {
    return {
      error: `Calculated grid must be between ${EDITOR_V2_MIN_GRID_SIZE} and ${EDITOR_V2_MAX_GRID_SIZE} cells in each dimension.`,
      width: null,
      height: null,
      widthInches: null,
      heightInches: null,
      meshCount: null,
    };
  }

  return {
    error: null,
    width,
    height,
    widthInches: parsedWidthInches,
    heightInches: parsedHeightInches,
    meshCount: parsedMeshCount,
  };
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

const disabledButtonStyle = {
  opacity: 0.6,
  cursor: "not-allowed",
} satisfies CSSProperties;

const helperStyle = {
  margin: 0,
  fontSize: "14px",
  color: "#475569",
} satisfies CSSProperties;

const validationStyle = {
  margin: 0,
  fontSize: "14px",
  color: "#b91c1c",
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
