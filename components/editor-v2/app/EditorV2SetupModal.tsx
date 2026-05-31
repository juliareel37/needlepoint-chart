"use client";

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
import { createLocalProjectId } from "@/lib/editor-v2/editor/store/createNewDesignState";
import type { EditorDocumentState } from "@/lib/editor-v2/editor/store";
import type { SavedEditorV2DocumentRecord } from "./editorV2ServerPersistence";
import styles from "./EditorV2SetupModal.module.css";

const LARGE_GRID_PRESETS = [
  { label: "60 x 100", width: 60, height: 100 },
  { label: "80 x 80", width: 80, height: 80 },
  { label: "110 x 70", width: 110, height: 70 },
  { label: "130 x 160", width: 130, height: 160 },
  { label: "144 x 144", width: 144, height: 144 },
  { label: "200 x 130", width: 200, height: 130 },

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
  draftId: string;
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
  activeColorId?: string | null;
  storageId: string;
  instanceKey: string;
}

export type EditorV2DesignConfig =
  | EditorV2DesignConfigNew
  | EditorV2DesignConfigLoaded;

interface EditorV2SetupModalProps {
  canClose: boolean;
  creatingDesign: boolean;
  draftHeight: string;
  draftHeightInches: string;
  draftMeshCount: string;
  draftSizingMode: "stitches" | "inches";
  draftWidth: string;
  draftWidthInches: string;
  hasSavedDesignAccess: boolean;
  mode: "full" | "new-only";
  hasMoreSavedDocuments: boolean;
  onDismissSavedDocumentsError: () => void;
  onDismissSetupError: () => void;
  onOpenSavedDocuments: () => Promise<void> | void;
  onLoadMoreSavedDocuments: () => Promise<void> | void;
  onSignIn: () => void;
  onClearLocalBrowserData: () => Promise<void> | void;
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
  savedDocumentsLoadingMore: boolean;
  savedDocumentsErrorMessage: string | null;
  selectedStorageId: string;
  setSelectedStorageId: (value: string) => void;
  setupErrorMessage: string | null;
}

export function EditorV2SetupModal({
  canClose,
  creatingDesign,
  draftHeight,
  draftHeightInches,
  draftMeshCount,
  draftSizingMode,
  draftWidth,
  draftWidthInches,
  hasSavedDesignAccess,
  mode,
  hasMoreSavedDocuments,
  onDismissSavedDocumentsError,
  onDismissSetupError,
  onOpenSavedDocuments,
  onLoadMoreSavedDocuments,
  onSignIn,
  onClearLocalBrowserData,
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
  savedDocumentsLoadingMore,
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
  const stitchSizing = resolveStitchSizing({
    width: draftWidth,
    height: draftHeight,
  });
  const selectedCellsPerInchPreset = getCellsPerInchPreset(draftMeshCount);
  const showSavedDesignSection = mode === "full";
  const compactMode = !showSavedDesignSection;
  const estimatedCanvasWidth = inchSizing.width ?? 0;
  const estimatedCanvasHeight = inchSizing.height ?? 0;
  const estimatedStitchCount = getEstimatedStitchCount(draftWidth, draftHeight);
  const createDisabled = creatingDesign || (
    draftSizingMode === "inches"
      ? !inchSizing.canCreate
      : !stitchSizing.canCreate
  );

  return (
    <div
      className={[styles.modal, compactMode ? styles.modalCompact : null]
        .filter(Boolean)
        .join(" ")}
      onClick={(event) => event.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-v2-setup-title"
    >
      <section
        className={[styles.card, compactMode ? styles.cardCompact : null]
          .filter(Boolean)
          .join(" ")}
      >
        {showSavedDesignSection ? (
          <div className={styles.header}>
            <div className={styles.titleBlock}>
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
        ) : null}

        <div
          className={[styles.content, compactMode ? styles.contentCompact : null]
            .filter(Boolean)
            .join(" ")}
        >
          <section
            className={[styles.section, compactMode ? styles.sectionStandalone : null]
              .filter(Boolean)
              .join(" ")}
          >
            <div
              className={[styles.sectionHeader, compactMode ? styles.sectionHeaderStandalone : null]
                .filter(Boolean)
                .join(" ")}
            >
              <h1
                id="editor-v2-setup-title"
                className={styles.sectionTitle}
                style={typographyStyles.h4}
              >
                Create New Design
              </h1>
              {compactMode && canClose ? (
                <Button type="button" variant="ghostV2" onClick={onClose}>
                  <ButtonIcon
                    icon="/icons/lucide/x.svg"
                    className={styles.sidebarCloseIcon}
                  />
                </Button>
              ) : null}
            </div>
            {/* {compactMode ? (
              <p className={styles.intro} style={typographyStyles.p2}>
                Create a fresh canvas to start a new design.
              </p>
            ) : null} */}

            <Field 
            // label="Sizing mode"
            >
              <SegmentedControl
                ariaLabel="Sizing mode"
                className={styles.sizingModeControl}
                itemClassName={styles.sizingModeControlItem}
                stackOnSmallScreens
                value={draftSizingMode}
                onChange={onDraftSizingModeChange}
                options={[
                  {
                    label: (
                      <span className={styles.sizingModeLabel}>
                        <ButtonIcon
                          icon="/icons/lucide/ruler.svg"
                          className={styles.sizingModeIcon}
                        />
                        By Physical Size
                      </span>
                    ),
                    value: "inches",
                  },
                  {
                    label: (
                      <span className={styles.sizingModeLabel}>
                        <ButtonIcon
                          icon="/icons/lucide/grid-2x2.svg"
                          className={styles.sizingModeIcon}
                        />
                        By Stitches
                      </span>
                    ),
                    value: "stitches",
                  },
                ]}
              />
            </Field>

            {draftSizingMode === "stitches" ? (
              <div className={styles.sizingTabBody}>
                <div className={styles.quickPresetGroup}>
                  <p className={styles.subtleLabel} style={typographyStyles.s}>
                    Quick presets
                  </p>
                  <div className={styles.presetGrid}>
                    {LARGE_GRID_PRESETS.map((preset) => (
                      <Button
                        key={preset.label}
                        type="button"
                        variant="outlined"
                        size="sm"
                        className={styles.quickPresetButton}
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

                <div className={styles.fieldGrid}>
                  <Field
                    label={
                      <span className={stitchSizing.widthError ? styles.strongFieldLabelError : styles.strongFieldLabel}>
                        Length
                      </span>
                    }
                    hint={
                      stitchSizing.widthError ? (
                        <span className={styles.fieldError}>
                          {stitchSizing.widthError}
                        </span>
                      ) : null
                    }
                  >
                    <FieldInput
                      type="number"
                      min={EDITOR_V2_MIN_GRID_SIZE}
                      max={EDITOR_V2_MAX_GRID_SIZE}
                      aria-invalid={stitchSizing.widthError ? "true" : undefined}
                      className={stitchSizing.widthError ? styles.invalidInput : undefined}
                      suffix="stitches"
                      value={draftWidth}
                      onChange={(event) => onDraftWidthChange(event.target.value)}
                    />
                  </Field>
                  <Field
                    label={
                      <span className={stitchSizing.heightError ? styles.strongFieldLabelError : styles.strongFieldLabel}>
                        Height
                      </span>
                    }
                    hint={
                      stitchSizing.heightError ? (
                        <span className={styles.fieldError}>
                          {stitchSizing.heightError}
                        </span>
                      ) : null
                    }
                  >
                    <FieldInput
                      type="number"
                      min={EDITOR_V2_MIN_GRID_SIZE}
                      max={EDITOR_V2_MAX_GRID_SIZE}
                      aria-invalid={stitchSizing.heightError ? "true" : undefined}
                      className={stitchSizing.heightError ? styles.invalidInput : undefined}
                      suffix="stitches"
                      value={draftHeight}
                      onChange={(event) => onDraftHeightChange(event.target.value)}
                    />
                  </Field>
                </div>

                {stitchSizing.alert ? (
                  <Notification
                    tone="destructive"
                    title={stitchSizing.alertTitle}
                    description={stitchSizing.alert}
                    layout="compact"
                  />
                ) : (
                  <div className={styles.canvasEstimateCard}>
                    <span
                      className={styles.canvasEstimateIcon}
                      aria-hidden="true"
                    />
                    <div className={styles.canvasEstimateContent}>
                      <p
                        className={styles.canvasEstimateLabel}
                        style={typographyStyles.p1}
                      >
                        Canvas size
                      </p>
                      <p
                        className={styles.canvasEstimateValue}
                        style={{ ...typographyStyles.h5, fontWeight: 600 }}
                      >
                        {formatStitchCount(estimatedStitchCount)} stitches
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.sizingTabBody}>
                <div className={styles.quickPresetGroup}>
                  <p className={styles.subtleLabel} style={typographyStyles.s}>
                    Quick presets
                  </p>
                  <div className={styles.presetGrid}>
                    {INCH_SIZE_PRESETS.map((preset) => (
                      <Button
                        key={preset.label}
                        type="button"
                        variant="outlined"
                        size="sm"
                        className={styles.quickPresetButton}
                        onClick={() => {
                          onDraftWidthInchesChange(String(preset.width));
                          onDraftHeightInchesChange(String(preset.height));
                        }}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className={styles.fieldGrid}>
                  <Field label={<span className={styles.strongFieldLabel}>Length</span>}>
                    <FieldInput
                      type="number"
                      min="0"
                      step="any"
                      suffix="inches"
                      value={draftWidthInches}
                      onChange={(event) =>
                        onDraftWidthInchesChange(event.target.value)
                      }
                    />
                  </Field>
                  <Field label={<span className={styles.strongFieldLabel}>Height</span>}>
                    <FieldInput
                      type="number"
                      min="0"
                      step="any"
                      suffix="inches"
                      value={draftHeightInches}
                      onChange={(event) =>
                        onDraftHeightInchesChange(event.target.value)
                      }
                    />
                  </Field>
                </div>

                <section className={styles.meshSection}>
                  <h2
                    className={styles.strongFieldLabel}
                    style={{ ...typographyStyles.p2, fontWeight: 600 }}
                  >
                    Canvas mesh
                  </h2>
                  <div className={styles.inlineOptionGrid}>
                    {CELLS_PER_INCH_PRESETS.map((preset) => {
                      const active =
                        !useCustomMeshCount
                        &&
                        selectedCellsPerInchPreset === preset
                        ;

                      return (
                        <Button
                          key={preset}
                          type="button"
                          variant="outlined"
                          size="md"
                          className={styles.meshPresetButton}
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
                        className={styles.meshPresetButton}
                        onClick={() => {
                          setUseCustomMeshCount(true);
                        }}
                      >
                        Custom
                      </Button>
                    )}
                  </div>
                </section>

                {inchSizing.error ? (
                  <Notification
                    tone="destructive"
                    title={inchSizing.errorTitle}
                    description={inchSizing.error}
                    layout="compact"
                  />
                ) : (
                  <div className={styles.canvasEstimateCard}>
                    <span
                      className={styles.canvasEstimateIcon}
                      aria-hidden="true"
                    />
                    <div className={styles.canvasEstimateContent}>
                      <p
                        className={styles.canvasEstimateLabel}
                        style={typographyStyles.p1}
                      >
                        Canvas size
                      </p>
                      <p
                        className={styles.canvasEstimateValue}
                        style={{ ...typographyStyles.h5, fontWeight: 600 }}
                      >
                        {estimatedCanvasWidth} x {estimatedCanvasHeight} grid ={" "}
                        {formatStitchCount(estimatedCanvasWidth * estimatedCanvasHeight)} stitches
                      </p>
                    </div>
                  </div>
                )}
              </div>
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
                      draftId: createLocalProjectId(),
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

                  if (stitchSizing.widthError || stitchSizing.heightError) {
                    return;
                  }

                  const width = clampGridSize(draftWidth);
                  const height = clampGridSize(draftHeight);

                  onDraftWidthChange(String(width));
                  onDraftHeightChange(String(height));
                  onCreateDesign({
                    kind: "new",
                    draftId: createLocalProjectId(),
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
                {creatingDesign ? "Creating design..." : "Create design"}
              </Button>
            </div>
          </section>

          {showSavedDesignSection ? (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle} style={typographyStyles.h4}>
                  Open saved design
                </h2>
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
                            minWidth: "100%",
                          }}
                        >
                          <span className="loading-spinner" aria-hidden="true" />
                          Loading saved designs...
                        </span>
                      ) : "No saved designs"
                    }
                    menuMaxHeight={220}
                    getItemLabel={formatSavedDesignLabel}
                    getItemValue={(record) => record.storageId}
                    items={savedDocuments}
                    menuPlacement={useTopDropdownPlacement ? "top-start" : "bottom-start"}
                    onOpenChange={(open) => {
                      if (open) {
                        void onOpenSavedDocuments();
                      }
                    }}
                    onReachEnd={() => {
                      if (hasMoreSavedDocuments) {
                        void onLoadMoreSavedDocuments();
                      }
                    }}
                    onValueChange={setSelectedStorageId}
                    menuFooter={
                      savedDocumentsLoadingMore ? (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 10,
                            minWidth: "100%",
                            padding: "8px 12px",
                          }}
                        >
                          <span className="loading-spinner" aria-hidden="true" />
                          Loading more designs...
                        </div>
                      ) : null
                    }
                    placeholder={savedDocumentsLoading ? "Loading saved designs..." : "Load saved design"}
                    value={selectedStorageId}
                    menuWidth="100%"
                    menuMaxWidth="100%"
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
                    <Button type="button" variant="primary" onClick={onSignIn}>
                      Sign in
                    </Button>
                  </div>
                </>
              )}
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function formatSavedDesignLabel(record: SavedEditorV2DocumentRecord): string {
  return `${record.title || "Untitled Design"} (${record.gridWidth}x${record.gridHeight})`;
}

function formatStitchCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function getEstimatedStitchCount(width: string, height: string): number {
  const parsedWidth = parsePositiveDecimal(width) ?? 0;
  const parsedHeight = parsePositiveDecimal(height) ?? 0;

  return Math.floor(parsedWidth) * Math.floor(parsedHeight);
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

function resolveStitchSizing({
  width,
  height,
}: {
  width: string;
  height: string;
}): {
  canCreate: boolean;
  alertTitle: string | null;
  alert: string | null;
  widthError: string | null;
  heightError: string | null;
} {
  const parsedWidth = parseRequiredPositiveNumber(width);
  const parsedHeight = parseRequiredPositiveNumber(height);
  const hasEmptyField =
    parsedWidth.kind === "empty" || parsedHeight.kind === "empty";
  const hasInvalidField =
    parsedWidth.kind === "invalid" || parsedHeight.kind === "invalid";
  const widthError = getStitchSizeMaxError(width);
  const heightError = getStitchSizeMaxError(height);

  return {
    canCreate: !hasEmptyField && !hasInvalidField && widthError === null && heightError === null,
    alertTitle: hasInvalidField ? "Check your grid size" : null,
    alert: hasInvalidField
      ? "Enter values greater than 0 for length and height."
      : null,
    widthError,
    heightError,
  };
}

function getStitchSizeMaxError(value: string): string | null {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= EDITOR_V2_MAX_GRID_SIZE) {
    return null;
  }

  return `Max ${EDITOR_V2_MAX_GRID_SIZE} cells.`;
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

function parseRequiredPositiveNumber(value: string):
  | { kind: "empty" }
  | { kind: "invalid" }
  | { kind: "valid"; value: number } {
  if (value.trim().length === 0) {
    return { kind: "empty" };
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { kind: "invalid" };
  }

  return { kind: "valid", value: parsed };
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
      errorTitle: string;
      error: string;
      canCreate: false;
      width: null;
      height: null;
      widthInches: null;
      heightInches: null;
      meshCount: null;
    }
  | {
      errorTitle: null;
      error: null;
      canCreate: false;
      width: null;
      height: null;
      widthInches: null;
      heightInches: null;
      meshCount: null;
    }
  | {
      errorTitle: null;
      error: null;
      canCreate: true;
      width: number;
      height: number;
      widthInches: number;
      heightInches: number;
      meshCount: number;
    } {
  const parsedWidthInches = parseRequiredPositiveNumber(widthInches);
  const parsedHeightInches = parseRequiredPositiveNumber(heightInches);
  const parsedMeshCount = parseRequiredPositiveNumber(meshCount);

  if (
    parsedWidthInches.kind === "empty" ||
    parsedHeightInches.kind === "empty" ||
    parsedMeshCount.kind === "empty"
  ) {
    return {
      errorTitle: null,
      error: null,
      canCreate: false,
      width: null,
      height: null,
      widthInches: null,
      heightInches: null,
      meshCount: null,
    };
  }

  if (
    parsedWidthInches.kind === "invalid" ||
    parsedHeightInches.kind === "invalid" ||
    parsedMeshCount.kind === "invalid"
  ) {
    return {
      errorTitle: "Check your dimensions",
      error: "Enter values greater than 0 for width, height, and cells per inch.",
      canCreate: false,
      width: null,
      height: null,
      widthInches: null,
      heightInches: null,
      meshCount: null,
    };
  }

  const widthInchesValue = parsedWidthInches.value;
  const heightInchesValue = parsedHeightInches.value;
  const meshCountValue = parsedMeshCount.value;

  const widthCellCount = widthInchesValue * meshCountValue;
  const heightCellCount = heightInchesValue * meshCountValue;
  const widthExceeded = widthCellCount > EDITOR_V2_MAX_GRID_SIZE;
  const heightExceeded = heightCellCount > EDITOR_V2_MAX_GRID_SIZE;

  if (widthExceeded || heightExceeded) {
    return {
      errorTitle: getInchSizeMaxErrorTitle(widthExceeded, heightExceeded),
      error: `Maximum canvas size is ${EDITOR_V2_MAX_GRID_SIZE} x ${EDITOR_V2_MAX_GRID_SIZE} cells. Please input ${getInchSizeMaxSuggestion(
        widthExceeded,
        heightExceeded,
      )} or choose a lower mesh count.`,
      canCreate: false,
      width: null,
      height: null,
      widthInches: null,
      heightInches: null,
      meshCount: null,
    };
  }

  const width = clampGridSize(String(widthCellCount));
  const height = clampGridSize(String(heightCellCount));

  return {
    errorTitle: null,
    error: null,
    canCreate: true,
    width,
    height,
    widthInches: widthInchesValue,
    heightInches: heightInchesValue,
    meshCount: meshCountValue,
  };
}

function getInchSizeMaxErrorTitle(widthExceeded: boolean, heightExceeded: boolean): string {
  if (widthExceeded && heightExceeded) {
    return "Max length and height exceeded";
  }

  return widthExceeded ? "Max length exceeded" : "Max height exceeded";
}

function getInchSizeMaxSuggestion(widthExceeded: boolean, heightExceeded: boolean): string {
  if (widthExceeded && heightExceeded) {
    return "a smaller length and height";
  }

  return widthExceeded ? "a smaller length" : "a smaller height";
}
