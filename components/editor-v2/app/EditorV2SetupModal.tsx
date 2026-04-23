"use client";

import { SignInButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import {
  Button,
  ButtonIcon,
  Field,
  FieldInput,
  Notification,
  SegmentedControl,
  SingleSelectDropdown,
} from "@/components/design-system";
import {
  EDITOR_V2_MAX_GRID_SIZE,
  EDITOR_V2_MIN_GRID_SIZE,
} from "@/lib/editor-v2/config";
import type { EditorDocumentState } from "@/lib/editor-v2/editor/store";
import type { SavedEditorV2DocumentRecord } from "./editorV2ServerPersistence";
import styles from "./EditorV2SetupModal.module.css";

const LARGE_GRID_PRESETS = [
  { label: "120 x 120", width: 120, height: 120 },
  { label: "160 x 160", width: 160, height: 160 },
  { label: "200 x 200", width: 200, height: 200 },
  { label: "240 x 240", width: 240, height: 240 },
  { label: "300 x 300", width: 300, height: 300 },
  { label: "400 x 400", width: 400, height: 400 },
] as const;
const INCH_SIZE_PRESETS = [
  { label: '6" x 10"', width: 6, height: 10 },
  { label: '8" x 8"', width: 8, height: 8 },
  { label: '7" x 9"', width: 7, height: 9 },
  { label: '9" x 9"', width: 9, height: 9 },
  { label: '11" x 7"', width: 11, height: 7 },
] as const;
const CELLS_PER_INCH_PRESETS = [10, 13, 18] as const;

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
  hasSavedDesignAccess: boolean;
  onDismissSavedDocumentsError: () => void;
  onDismissSetupError: () => void;
  onClose: () => void;
  onCreateDesign: (config: EditorV2DesignConfigNew) => void;
  onDraftHeightChange: (value: string) => void;
  onDraftHeightInchesChange: (value: string) => void;
  onDraftMeshCountChange: (value: string) => void;
  onDraftSizingModeChange: (value: "stitches" | "inches") => void;
  onDraftWidthChange: (value: string) => void;
  onDraftWidthInchesChange: (value: string) => void;
  onLoadSavedDesign: (storageId: string) => void;
  savedDocuments: SavedEditorV2DocumentRecord[];
  savedDocumentsLoading: boolean;
  savedDocumentsErrorMessage: string | null;
  selectedStorageId: string;
  setSelectedStorageId: (value: string) => void;
  setupErrorMessage: string | null;
}

export function EditorV2SetupModal({
  canClose,
  draftHeight,
  draftHeightInches,
  draftMeshCount,
  draftSizingMode,
  draftWidth,
  draftWidthInches,
  hasSavedDesignAccess,
  onDismissSavedDocumentsError,
  onDismissSetupError,
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
  savedDocumentsLoading,
  savedDocumentsErrorMessage,
  selectedStorageId,
  setSelectedStorageId,
  setupErrorMessage,
}: EditorV2SetupModalProps) {
  const [useTopDropdownPlacement, setUseTopDropdownPlacement] = useState(false);
  const [useCustomMeshCount, setUseCustomMeshCount] = useState(
    () => getCellsPerInchPreset(draftMeshCount) === null,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 799px)");

    const updatePlacement = () => {
      setUseTopDropdownPlacement(mediaQuery.matches);
    };

    updatePlacement();
    mediaQuery.addEventListener("change", updatePlacement);

    return () => mediaQuery.removeEventListener("change", updatePlacement);
  }, []);

  const inchSizing = resolveInchSizing({
    widthInches: draftWidthInches,
    heightInches: draftHeightInches,
    meshCount: draftMeshCount,
  });
  const selectedCellsPerInchPreset = getCellsPerInchPreset(draftMeshCount);
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
              <h2 className={styles.sectionTitle} style={typographyStyles.h4}>
                New design
              </h2>
            </div>

            <Field 
            // label="Sizing mode"
            >
              <SegmentedControl
                ariaLabel="Sizing mode"
                stackOnSmallScreens
                value={draftSizingMode}
                onChange={onDraftSizingModeChange}
                options={[
                  { label: "Canvas Size + Mesh", value: "inches" },
                  { label: "Grid Size", value: "stitches" },
                ]}
              />
            </Field>

            {draftSizingMode === "stitches" ? (
              <>
                <div className={styles.fieldGrid}>
                  <Field label="Length">
                    <FieldInput
                      type="number"
                      min={EDITOR_V2_MIN_GRID_SIZE}
                      max={EDITOR_V2_MAX_GRID_SIZE}
                      value={draftWidth}
                      onChange={(event) => onDraftWidthChange(event.target.value)}
                    />
                  </Field>
                  <Field label="Height">
                    <FieldInput
                      type="number"
                      min={EDITOR_V2_MIN_GRID_SIZE}
                      max={EDITOR_V2_MAX_GRID_SIZE}
                      value={draftHeight}
                      onChange={(event) => onDraftHeightChange(event.target.value)}
                    />
                  </Field>
                </div>

                <div className={styles.presetBlock}>
                  <p className={styles.presetLabel} style={typographyStyles.p2}>
                    Quick presets
                  </p>
                  <div className={styles.presetGrid}>
                    {LARGE_GRID_PRESETS.map((preset) => (
                      <Button
                        key={preset.label}
                        type="button"
                        variant="secondary"
                        size="sm"
                        className={styles.presetButton}
                        onClick={() => {
                          onDraftWidthChange(String(preset.width));
                          onDraftHeightChange(String(preset.height));
                        }}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>

              <div className={styles.presetBlock}>
              <section className={styles.inchesSection}>

               <h2 style={typographyStyles.h5}>
                 Dimensions
              </h2>
                  {/* <p className={styles.presetLabel} style={typographyStyles.p2}>
                    Canvas size
                  </p> */}
                  <div className={styles.fieldGrid}>
                    <Field label="Length (inches)">
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

                  <div className={styles.helperRow}>
                    <p className={styles.subtleLabel} style={typographyStyles.s}>
                      Quick presets
                    </p>
                    <div className={styles.inlineOptionGrid}>
                      {INCH_SIZE_PRESETS.map((preset) => {
                        return (
                          <Button
                            key={preset.label}
                            type="button"
                            variant="secondary"
                            size="sm"
                            className={styles.compactPresetButton}
                            onClick={() => {
                              onDraftWidthInchesChange(String(preset.width));
                              onDraftHeightInchesChange(String(preset.height));
                            }}
                          >
                            {preset.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
              </section>
              <section className={styles.inchesSection}>
               <h2 style={typographyStyles.h5}>
                Canvas Mesh
              </h2>
                  {/* <div className={styles.presetBlock} > */}

                    <p className={styles.presetLabel} style={typographyStyles.p2}>
                      The number of holes per inch of your canvas.
                    </p>
                    <div 
                    className={styles.inlineOptionGrid}
                    >
                      {CELLS_PER_INCH_PRESETS.map((preset) => {
                        const active =
                          !useCustomMeshCount &&
                          selectedCellsPerInchPreset === preset;

                        return (
                          <Button
                            key={preset}
                            type="button"
                            variant="secondary"
                            size="md"
                            className={styles.compactPresetButton}
                            active={active}
                            inertWhenActive={active}
                            aria-pressed={active}
                            onClick={() => {
                              setUseCustomMeshCount(false);
                              onDraftMeshCountChange(String(preset));
                            }}
                          >
                            {preset + " mesh"} 
                          </Button>
                        );
                      })}
                      {useCustomMeshCount ? (
                        <FieldInput
                          aria-label="Custom cells per inch"
                          type="number"
                          min="0"
                          step="any"
                          className={styles.customMeshCountInput}
                          value={draftMeshCount}
                          onChange={(event) => {
                            setUseCustomMeshCount(true);
                            onDraftMeshCountChange(event.target.value);
                          }}
                        />
                      ) : (
                        <Button
                          type="button"
                          variant="ghostV2"
                          size="md"
                          className={styles.compactPresetButton}
                          onClick={() => {
                            setUseCustomMeshCount(true);
                          }}
                        >
                          Custom
                        </Button>
                      )}
                    </div>
                  {/* </div> */}
                  </section>


                {inchSizing.error ? (
                  <Notification
                    tone="destructive"
                    title="Check your dimensions"
                    description={inchSizing.error}
                    layout="compact"
                  />
                ) : (
                  <p className={styles.helper} style={typographyStyles.p2}>
                    Total canvas size: {inchSizing.width} x {inchSizing.height} cells
                  </p>
                )}

                                </div>

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
                Create new design
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

            {savedDocumentsErrorMessage ? (
              <Notification
                tone="destructive"
                title="Couldn't load your saved designs"
                description={savedDocumentsErrorMessage}
                layout="compact"
                onDismiss={onDismissSavedDocumentsError}
              />
            ) : null}

            {setupErrorMessage ? (
              <Notification
                tone="destructive"
                title="Couldn't open saved design"
                description={setupErrorMessage}
                layout="compact"
                onDismiss={onDismissSetupError}
              />
            ) : null}

            {hasSavedDesignAccess ? (
              <>
                <p className={styles.helper} style={typographyStyles.p2}>
                  Choose a design
                </p>
                <SingleSelectDropdown
                  ariaLabel="Saved designs"
                  emptyLabel={
                    savedDocumentsLoading ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span className="loading-spinner" aria-hidden="true" />
                        Loading saved designs...
                      </span>
                    ) : "No saved designs"
                  }
                  getItemLabel={formatSavedDesignLabel}
                  getItemValue={(record) => record.storageId}
                  items={savedDocuments}
                  menuPlacement={useTopDropdownPlacement ? "top-start" : "bottom-start"}
                  onValueChange={setSelectedStorageId}
                  placeholder={savedDocumentsLoading ? "Loading saved designs..." : "Load saved design"}
                  value={selectedStorageId}
                  wrapperStyle={{ width: "100%" }}
                  triggerStyle={{ width: "100%" }}
                />

                <div className={styles.actions}>
                  <Button
                    type="button"
                    variant="primary"
                    disabled={savedDocumentsLoading || !selectedStorageId}
                    onClick={() => {
                      if (!selectedStorageId) {
                        return;
                      }

                      onLoadSavedDesign(selectedStorageId);
                    }}
                  >
                    Load design
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className={styles.helper} style={typographyStyles.p2}>
                  Sign in to access your saved designs.
                </p>

                <div className={styles.actions}>
                  <SignInButton mode="modal">
                    <Button type="button" variant="primary">
                      Sign in
                    </Button>
                  </SignInButton>
                </div>
              </>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

function formatSavedDesignLabel(record: SavedEditorV2DocumentRecord): string {
  return `${record.title || "Untitled Design"} (${record.gridWidth}x${record.gridHeight})`;
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

function getCellsPerInchPreset(value: string): (typeof CELLS_PER_INCH_PRESETS)[number] | null {
  const parsed = parsePositiveDecimal(value);

  if (parsed === null) {
    return null;
  }

  return CELLS_PER_INCH_PRESETS.find((preset) => preset === parsed) ?? null;
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
