"use client";

import { typographyStyles } from "@/app/design-system/typography";
import {
  Button,
  ButtonIcon,
  Field,
  FieldInput,
  SingleSelectDropdown,
} from "@/components/design-system";
import {
  EDITOR_V2_MAX_GRID_SIZE,
  EDITOR_V2_MIN_GRID_SIZE,
} from "@/lib/editor-v2/config";
import type { EditorDocumentState } from "@/lib/editor-v2/editor/store";
import type { SavedEditorV2DocumentRecord } from "./editorV2LocalPersistence";
import styles from "./EditorV2SetupModal.module.css";

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

interface EditorV2SetupModalProps {
  canClose: boolean;
  draftHeight: string;
  draftHeightInches: string;
  draftMeshCount: string;
  draftSizingMode: "stitches" | "inches";
  draftWidth: string;
  draftWidthInches: string;
  onClose: () => void;
  onCreateDesign: (config: EditorV2DesignConfigNew) => void;
  onDraftHeightChange: (value: string) => void;
  onDraftHeightInchesChange: (value: string) => void;
  onDraftMeshCountChange: (value: string) => void;
  onDraftSizingModeChange: (value: "stitches" | "inches") => void;
  onDraftWidthChange: (value: string) => void;
  onDraftWidthInchesChange: (value: string) => void;
  onLoadSavedDesign: (config: EditorV2DesignConfigLoaded) => void;
  savedDocuments: SavedEditorV2DocumentRecord[];
  selectedStorageId: string;
  setSelectedStorageId: (value: string) => void;
}

export function EditorV2SetupModal({
  canClose,
  draftHeight,
  draftHeightInches,
  draftMeshCount,
  draftSizingMode,
  draftWidth,
  draftWidthInches,
  onClose,
  onCreateDesign,
  onDraftHeightChange,
  onDraftHeightInchesChange,
  onDraftMeshCountChange,
  onDraftSizingModeChange,
  onDraftWidthChange,
  onDraftWidthInchesChange,
  onLoadSavedDesign,
  savedDocuments,
  selectedStorageId,
  setSelectedStorageId,
}: EditorV2SetupModalProps) {
  const inchSizing = resolveInchSizing({
    widthInches: draftWidthInches,
    heightInches: draftHeightInches,
    meshCount: draftMeshCount,
  });
  const createDisabled =
    draftSizingMode === "inches" && inchSizing.error !== null;

  return (
    <div
      className={styles.modal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-v2-setup-title"
    >
      <section className={styles.card}>
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            {/* <p className={styles.eyebrow} style={typographyStyles.p2}>
              editor-v2
            </p> */}
            <h1
              id="editor-v2-setup-title"
              className={styles.title}
              style={typographyStyles.h3}
            >
              Start a design
            </h1>
            <p className={styles.intro} style={typographyStyles.p2}>
              Create a fresh canvas or jump back into a saved design.
            </p>
          </div>
          {canClose ? (
            <Button type="button" variant="ghostV2" onClick={onClose}>
              
              <ButtonIcon
              icon="/icons/lucide/x.svg"
              className={styles.sidebarCloseIcon}
            />
            </Button>
            
          ) : null}
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle} style={typographyStyles.h5}>
                New design
              </h2>
              {/* <p className={styles.sectionHint} style={typographyStyles.p2}>
                Pick a sizing mode, then set the starting dimensions.
              </p> */}
            </div>

            <Field 
            label="Sizing mode"
            >
              <div
                className={styles.segmentedControl}
                role="radiogroup"
                aria-label="Sizing mode"
              >
                <SizingModeButton
                  active={draftSizingMode === "stitches"}
                  label="Grid cells"
                  onClick={() => onDraftSizingModeChange("stitches")}
                />
                <SizingModeButton
                  active={draftSizingMode === "inches"}
                  label="Inches + CPI"
                  onClick={() => onDraftSizingModeChange("inches")}
                />
              </div>
            </Field>

            {draftSizingMode === "stitches" ? (
              <div className={styles.fieldGrid}>
                <Field label="Grid width">
                  <FieldInput
                    type="number"
                    min={EDITOR_V2_MIN_GRID_SIZE}
                    max={EDITOR_V2_MAX_GRID_SIZE}
                    value={draftWidth}
                    onChange={(event) => onDraftWidthChange(event.target.value)}
                  />
                </Field>
                <Field label="Grid height">
                  <FieldInput
                    type="number"
                    min={EDITOR_V2_MIN_GRID_SIZE}
                    max={EDITOR_V2_MAX_GRID_SIZE}
                    value={draftHeight}
                    onChange={(event) => onDraftHeightChange(event.target.value)}
                  />
                </Field>
              </div>
            ) : (
              <>
                <div className={styles.fieldGrid}>
                  <Field label="Width (inches)">
                    <FieldInput
                      type="number"
                      min="0"
                      step="any"
                      value={draftWidthInches}
                      onChange={(event) =>
                        onDraftWidthInchesChange(event.target.value)
                      }
                    />
                  </Field>
                  <Field label="Height (inches)">
                    <FieldInput
                      type="number"
                      min="0"
                      step="any"
                      value={draftHeightInches}
                      onChange={(event) =>
                        onDraftHeightInchesChange(event.target.value)
                      }
                    />
                  </Field>
                </div>

                <Field label="Cells per inch">
                  <FieldInput
                    type="number"
                    min="0"
                    step="any"
                    value={draftMeshCount}
                    onChange={(event) => onDraftMeshCountChange(event.target.value)}
                  />
                </Field>

                {inchSizing.error ? (
                  <p className={styles.validation} style={typographyStyles.p2}>
                    {inchSizing.error}
                  </p>
                ) : (
                  <p className={styles.helper} style={typographyStyles.p2}>
                    Grid size: {inchSizing.width} x {inchSizing.height} cells
                  </p>
                )}
              </>
            )}

            <div className={styles.actions}>
              <Button
                type="button"
                variant="primary"
                disabled={createDisabled}
                onClick={() => {
                  if (draftSizingMode === "inches") {
                    if (inchSizing.error) {
                      return;
                    }

                    onDraftWidthChange(String(inchSizing.width));
                    onDraftHeightChange(String(inchSizing.height));
                    onDraftWidthInchesChange(
                      normalizeDecimalInput(draftWidthInches),
                    );
                    onDraftHeightInchesChange(
                      normalizeDecimalInput(draftHeightInches),
                    );
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
              >
                Create New
              </Button>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle} style={typographyStyles.h5}>
                Open saved design
              </h2>
              {/* <p className={styles.sectionHint} style={typographyStyles.p2}>
                Load a saved project from this browser.
              </p> */}
            </div>

            <SingleSelectDropdown
              ariaLabel="Saved designs"
              emptyLabel="No saved designs"
              getItemLabel={formatSavedDesignLabel}
              getItemValue={(record) => record.storageId}
              items={savedDocuments}
              label="Choose a design"
              onValueChange={setSelectedStorageId}
              placeholder="Load saved design"
              value={selectedStorageId}
              wrapperStyle={{ width: "100%" }}
              triggerStyle={{ width: "100%" }}
            />

            <div className={styles.actions}>
              <Button
                type="button"
                variant="primary"
                disabled={!selectedStorageId}
                onClick={() => {
                  const selectedRecord = savedDocuments.find(
                    (record) => record.storageId === selectedStorageId,
                  );
                  if (!selectedRecord) {
                    return;
                  }

                  onLoadSavedDesign({
                    kind: "loaded",
                    document: selectedRecord.document,
                    storageId: selectedRecord.storageId,
                    instanceKey: `loaded_${selectedRecord.storageId}_${Date.now()}`,
                  });
                }}
              >
              Load Design
              </Button>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function SizingModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="md"
      className={styles.segmentedItem}
      active={active}
      inertWhenActive={active}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

function formatSavedDesignLabel(record: SavedEditorV2DocumentRecord): string {
  const title = record.document.project.title || "Untitled Design";
  const { width, height } = record.document.grid;
  return `${title} (${width}x${height})`;
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

  if (
    parsedWidthInches === null ||
    parsedHeightInches === null ||
    parsedMeshCount === null
  ) {
    return {
      error: "Enter positive values for width, height, and cells per inch.",
      width: null,
      height: null,
      widthInches: null,
      heightInches: null,
      meshCount: null,
    };
  }

  const width = clampGridSize(String(parsedWidthInches * parsedMeshCount));
  const height = clampGridSize(String(parsedHeightInches * parsedMeshCount));

  return {
    error: null,
    width,
    height,
    widthInches: parsedWidthInches,
    heightInches: parsedHeightInches,
    meshCount: parsedMeshCount,
  };
}
