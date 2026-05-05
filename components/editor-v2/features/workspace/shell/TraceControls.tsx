"use client";

import type { ReactNode } from "react";
import { upload } from "@vercel/blob/client";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import {
  Button,
  ButtonIcon,
  CheckboxField,
  Field,
  Modal,
  Notification,
  SegmentedControl,
  Slider,
} from "@/components/design-system";
import type {
  EditorStore,
  GridDocument,
  PaletteColor,
  TraceBlendMode,
  TraceDocument,
  TraceRepositionOrigin,
} from "@/lib/editor-v2/editor/store";
import type { GridWorldMetrics } from "@/lib/editor-v2/editor/viewport";
import {
  convertTraceImageToPattern,
  loadTraceImage,
} from "@/lib/editor-v2/editor/trace/convertTraceImageToPattern";
import {
  createFullTraceCrop,
  getNormalizedTraceCrop,
  type TraceCropRect,
} from "@/lib/editor-v2/editor/trace/crop";
import {
  createApplyTraceConversionCommand,
  createAttachTraceCommand,
  createBeginTraceRepositionCommand,
  createCancelTraceRepositionCommand,
  createCommitTraceRepositionCommand,
  createRemoveTraceCommand,
  createUpdateTraceCommand,
} from "../workspaceCommands";
import {
  shouldShowOverwriteWarning,
  suppressOverwriteWarningForOneDay,
} from "./conversionOverwriteWarning";
import styles from "./EditorV2Shell.module.css";

const TRACE_UPLOAD_ERROR_NOTIFICATION_DURATION_MS = 8000;

interface TraceControlsProps {
  grid: GridDocument;
  gridMetrics: GridWorldMetrics;
  palette: PaletteColor[];
  trace: TraceDocument | null;
  dispatch?: EditorStore["dispatch"];
  onPreviewCropChange?: (crop: TraceCropRect | null) => void;
  repositionActive?: boolean;
  repositionOrigin?: TraceRepositionOrigin | null;
}

export function TraceControls({
  grid,
  gridMetrics,
  palette,
  trace,
  dispatch,
  onPreviewCropChange,
  repositionActive = false,
  repositionOrigin = null,
}: TraceControlsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const traceUploadSequenceRef = useRef(0);
  const positioningPreviewRef = useRef<{
    previewUrl: string;
    blendMode: TraceBlendMode;
    opacity: number;
    visible: boolean;
    userOverrode: boolean;
  } | null>(null);
  const [opacityTooltipVisible, setOpacityTooltipVisible] = useState(false);
  const [convertMaxColors, setConvertMaxColors] = useState(20);
  const [convertSmoothing, setConvertSmoothing] = useState(0.25);
  const [convertingImage, setConvertingImage] = useState(false);
  const [convertErrorMessage, setConvertErrorMessage] = useState<string | null>(null);
  const [pendingConversion, setPendingConversion] = useState<{
    replacements: Array<{ index: number; value: string | null }>;
    extractedColorIds: string[];
  } | null>(null);
  const [overwriteCount, setOverwriteCount] = useState(0);
  const [skipWarningForOneDay, setSkipWarningForOneDay] = useState(false);
  const [removeConfirmationOpen, setRemoveConfirmationOpen] = useState(false);
  const [traceUploadErrorMessage, setTraceUploadErrorMessage] = useState<string | null>(
    null,
  );
  const [cropEditing, setCropEditing] = useState(false);
  const [cropSnapshot, setCropSnapshot] = useState<TraceCropRect | null>(null);
  const [cropDraft, setCropDraft] = useState<TraceCropRect | null>(null);
  const [traceUploadStatus, setTraceUploadStatus] = useState<
    "idle" | "uploading" | "error"
  >("idle");
  const positioningEnabled = Boolean(trace && repositionActive);
  const preservePositioningSectionLayout =
    repositionOrigin === "upload" || repositionOrigin === "replace";
  const traceFileName = trace ? getTraceDisplayName(trace) : null;
  const traceFileNameParts = traceFileName
    ? splitFileNameForDisplay(traceFileName)
    : null;
  const canConvert = Boolean(trace && !repositionActive && !cropEditing);
  const conversionSmoothingPercent = Math.round(convertSmoothing * 100);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const normalizedTraceCrop = trace ? getNormalizedTraceCrop(trace) : null;
  const traceImageWidth =
    trace?.imageWidth ??
    normalizedTraceCrop?.cropWidth ??
    cropDraft?.cropWidth ??
    1;
  const traceImageHeight =
    trace?.imageHeight ??
    normalizedTraceCrop?.cropHeight ??
    cropDraft?.cropHeight ??
    1;

  const handleTraceFileSelect = async (file: File) => {
    if (!dispatch) return;

    const sequence = traceUploadSequenceRef.current + 1;
    traceUploadSequenceRef.current = sequence;
    setTraceUploadStatus("uploading");
    setTraceUploadErrorMessage(null);

    try {
      const uploadedTrace = await uploadTraceFile(file);

      if (sequence !== traceUploadSequenceRef.current) {
        return;
      }

      dispatch(
        createAttachTraceCommand({
          ...uploadedTrace,
          origin: trace ? "replace" : "upload",
        }),
      );
      setTraceUploadStatus("idle");
    } catch (error) {
      if (sequence !== traceUploadSequenceRef.current) {
        return;
      }

      setTraceUploadStatus("error");
      setTraceUploadErrorMessage(
        getErrorMessage(
          error,
          "Try signing in again or choose a smaller PNG, JPG, WEBP, or GIF.",
        ),
      );
    }
  };

  const applyConversion = (
    conversion: NonNullable<typeof pendingConversion>,
  ) => {
    if (!dispatch) {
      return;
    }

    dispatch(
      createApplyTraceConversionCommand({
        replacements: conversion.replacements,
        extractedColorIds: conversion.extractedColorIds,
        activeColorId: conversion.extractedColorIds[0] ?? null,
      }),
    );
  };

  const handleConvertToPattern = async () => {
    if (!dispatch || !trace || convertingImage) {
      return;
    }

    setConvertingImage(true);
    setConvertErrorMessage(null);

    try {
      const traceImage = await loadTraceImage(trace.previewUrl);
      const result = convertTraceImageToPattern({
        traceImage,
        trace,
        metrics: gridMetrics,
        palette,
        maxColors: convertMaxColors,
        smoothing: convertSmoothing,
        sampleCanvas: sampleCanvasRef.current,
      });

      if (!result) {
        throw new Error("The image couldn't be converted with the current settings.");
      }

      sampleCanvasRef.current = result.sampleCanvas;

      const replacements: Array<{ index: number; value: string | null }> = [];
      let nextOverwriteCount = 0;

      for (const index of result.coveredCellIndexes) {
        const nextValue = result.cells[index] ?? null;
        const previousValue = grid.cells[index] ?? null;

        if (previousValue !== null && previousValue !== nextValue) {
          nextOverwriteCount += 1;
        }

        if (nextValue !== previousValue) {
          replacements.push({ index, value: nextValue });
        }
      }

      const conversion = {
        replacements,
        extractedColorIds: result.usedColorIds,
      };

      if (nextOverwriteCount > 0 && shouldShowOverwriteWarning()) {
        setOverwriteCount(nextOverwriteCount);
        setPendingConversion(conversion);
        return;
      }

      applyConversion(conversion);
    } catch (error) {
      setConvertErrorMessage(
        getErrorMessage(
          error,
          "Try a different smoothing value or re-upload the image.",
        ),
      );
    } finally {
      setConvertingImage(false);
    }
  };

  useEffect(() => {
    if (!opacityTooltipVisible) {
      return;
    }

    function handlePointerUp() {
      setOpacityTooltipVisible(false);
    }

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [opacityTooltipVisible]);

  useEffect(() => {
    if (!traceUploadErrorMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setTraceUploadErrorMessage(null);
    }, TRACE_UPLOAD_ERROR_NOTIFICATION_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [traceUploadErrorMessage]);

  useEffect(() => {
    if (!convertErrorMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setConvertErrorMessage(null);
    }, TRACE_UPLOAD_ERROR_NOTIFICATION_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [convertErrorMessage]);

  useEffect(() => {
    setPendingConversion(null);
    setOverwriteCount(0);
    setSkipWarningForOneDay(false);
    setCropEditing(false);
    setCropSnapshot(null);
    setCropDraft(null);
    onPreviewCropChange?.(null);
  }, [onPreviewCropChange, trace?.previewUrl]);

  useEffect(() => {
    if (!trace || cropEditing) {
      return;
    }

    setCropDraft(getNormalizedTraceCrop(trace, traceImageWidth, traceImageHeight));
  }, [cropEditing, trace, traceImageHeight, traceImageWidth]);

  useEffect(() => {
    if (!dispatch) {
      return;
    }

    if (!trace) {
      positioningPreviewRef.current = null;
      return;
    }

    if (positioningEnabled) {
      if (positioningPreviewRef.current?.previewUrl !== trace.previewUrl) {
        positioningPreviewRef.current = {
          previewUrl: trace.previewUrl,
          blendMode: trace.blendMode,
          opacity: trace.opacity,
          visible: trace.visible,
          userOverrode: false,
        };
      }

      const previewSnapshot = positioningPreviewRef.current;
      const isAutoPreviewState =
        trace.visible &&
        trace.blendMode === "crossfade" &&
        Math.abs(trace.opacity - 0.95) <= 0.0001;

      if (previewSnapshot && !isAutoPreviewState) {
        const differsFromOriginal =
          trace.visible !== previewSnapshot.visible ||
          trace.blendMode !== previewSnapshot.blendMode ||
          Math.abs(trace.opacity - previewSnapshot.opacity) > 0.0001;

        if (differsFromOriginal) {
          previewSnapshot.userOverrode = true;
        }
      }

      if (!previewSnapshot?.userOverrode && !isAutoPreviewState) {
        dispatch(
          createUpdateTraceCommand(
            {
              visible: true,
              blendMode: "crossfade",
              opacity: 0.95,
            },
            {
              history: { mode: "skip" },
              source: "system",
            },
          ),
        );
      }

      return;
    }

    const previewSnapshot = positioningPreviewRef.current;

    if (!previewSnapshot || previewSnapshot.previewUrl !== trace.previewUrl) {
      positioningPreviewRef.current = null;
      return;
    }

    positioningPreviewRef.current = null;

    if (previewSnapshot.userOverrode) {
      return;
    }

    if (
      trace.visible === previewSnapshot.visible &&
      trace.blendMode === previewSnapshot.blendMode &&
      Math.abs(trace.opacity - previewSnapshot.opacity) <= 0.0001
    ) {
      return;
    }

    dispatch(
      createUpdateTraceCommand(
        {
          visible: previewSnapshot.visible,
          blendMode: previewSnapshot.blendMode,
          opacity: previewSnapshot.opacity,
        },
        {
          history: { mode: "skip" },
          source: "system",
        },
      ),
    );
  }, [dispatch, positioningEnabled, trace]);

  if (!dispatch) {
    return trace ? (
      <p className={styles.emptyMessage} style={typographyStyles.p2}>
        Trace attached. Controls available in the active editor shell.
      </p>
    ) : (
      <p className={styles.emptyMessage} style={typographyStyles.p2}>
        No trace image attached.
      </p>
    );
  }

  return (
    <>
      {traceUploadErrorMessage || convertErrorMessage
        ? createPortal(
            <div className={styles.editorNotificationOverlayTop}>
              <div
                className={styles.editorNotificationStack}
                data-auto-dismiss="true"
                style={{ animationDuration: `${TRACE_UPLOAD_ERROR_NOTIFICATION_DURATION_MS}ms` }}
              >
                <Notification
                  tone="destructive"
                  title={traceUploadErrorMessage ? "Couldn't upload image" : "Couldn't convert image"}
                  description={traceUploadErrorMessage ?? convertErrorMessage ?? ""}
                  onDismiss={() => {
                    setTraceUploadErrorMessage(null);
                    setConvertErrorMessage(null);
                  }}
                />
              </div>
            </div>,
            document.body,
          )
        : null}

      <div className={styles.panelStack}>
      {!trace ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files?.[0];
            if (!file) return;
            handleTraceFileSelect(file);
          }}
          style={{
            display: "grid",
            placeItems: "center",
            gap: 6,
            padding: "14px 12px",
            borderRadius: 12,
            border: "none",
            background: "transparent",
            textAlign: "center",
          }}
        >
          <ButtonIcon
            icon="/icons/upload.svg"
            aria-hidden="true"
            style={{ width: 18, height: 18 }}
          />
          <span style={typographyStyles.p2}>Choose a file or drag &amp; drop.</span>
          <span style={{ ...typographyStyles.p2, opacity: 0.75 , paddingBottom: 10}}>PNG, JPG, WEBP, or GIF up to 10 MB.</span>
          <Button
            type="button"
            variant="primary"
            size="md"
            className={styles.pendingActionButton}
            disabled={traceUploadStatus === "uploading"}
            onClick={() => fileInputRef.current?.click()}
          >
            {traceUploadStatus === "uploading" ? (
              <>
                <span className={styles.saveButtonSpinner} aria-hidden="true" />
                Uploading...
              </>
            ) : (
              "Browse file"
            )}
          </Button>
        </div>
      ) : (
        <TraceSection title="Uploaded File">
          <div className={styles.traceAttachmentSummary}>
            <button
              type="button"
              className={styles.traceAttachmentButton}
              disabled={traceUploadStatus === "uploading"}
              aria-label={
                traceUploadStatus === "uploading"
                  ? "Uploading replacement trace image"
                  : "Replace trace image"
              }
              title={
                traceUploadStatus === "uploading"
                  ? "Uploading replacement..."
                  : "Replace image"
              }
              onClick={() => fileInputRef.current?.click()}
            >
              <span className={styles.traceAttachmentThumbFrame}>
                {traceUploadStatus === "uploading" ? (
                  <span className={styles.saveButtonSpinner} aria-hidden="true" />
                ) : positioningEnabled ? (
                  <span
                    aria-hidden="true"
                    className={styles.traceAttachmentThumbOverlay}
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--surface-subtle, rgba(148, 163, 184, 0.14))",
                      opacity: 1,
                    }}
                  >
                    <ButtonIcon icon="/icons/lucide/image.svg" />
                  </span>
                ) : (
                  <>
                    <img
                      src={trace.thumbnailUrl}
                      alt={traceFileName ? `Trace image ${traceFileName}` : "Trace image"}
                      className={styles.traceAttachmentThumb}
                    />
                    <span className={styles.traceAttachmentThumbOverlay} aria-hidden="true">
                      <ButtonIcon icon="/icons/lucide/swap.svg" />
                    </span>
                  </>
                )}
              </span>
              <span className={styles.traceAttachmentMeta}>
                <span
                  className={styles.traceAttachmentLabel}
                  style={typographyStyles.s}
                >
                  {null}
                </span>
                <span
                  className={styles.traceAttachmentName}
                  style={typographyStyles.p2}
                  title={
                    traceUploadStatus === "uploading"
                      ? "Loading image..."
                      : traceFileName ?? undefined
                  }
                >
                  {traceUploadStatus === "uploading"
                    ? "Loading image..."
                    : traceFileNameParts
                      ? (
                        <>
                          <span className={styles.traceAttachmentNameBase}>
                            {traceFileNameParts.baseName}
                          </span>
                          {traceFileNameParts.extension ? (
                            <span className={styles.traceAttachmentNameExtension}>
                              {traceFileNameParts.extension}
                            </span>
                          ) : null}
                        </>
                      )
                      : null}
                </span>
              </span>
            </button>
            <Button
              type="button"
              variant="ghostV2"
              className={styles.traceAttachmentRemoveButton}
              aria-label="Remove trace image"
              title="Remove image"
              onClick={() => setRemoveConfirmationOpen(true)}
            >
              <ButtonIcon icon="/icons/lucide/trash.svg" />
            </Button>
          </div>
        </TraceSection>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) {
            handleTraceFileSelect(file);
          }
          event.target.value = "";
        }}
        style={{ display: "none" }}
      />

      <Modal
        isOpen={removeConfirmationOpen}
        title="Remove image?"
        description="Your image will be removed from the design. This does not affect your painted cells."
        tone="fail"
        dismissLabel="Cancel"
        confirmLabel="Remove image"
        confirmVariant="destructive"
        onDismiss={() => setRemoveConfirmationOpen(false)}
        onConfirm={() => {
          setRemoveConfirmationOpen(false);
          dispatch(createRemoveTraceCommand());
        }}
      />

      <Modal
        isOpen={pendingConversion !== null}
        title="Overwrite current pattern?"
        description={(
          <div style={{ display: "grid", gap: 12 }}>
            <span className={styles.overwriteWarningDescriptionText}>
              {`Converting this image will overwrite ${overwriteCount} painted ${
                overwriteCount === 1 ? "cell" : "cells"
              }.`}
            </span>
            <CheckboxField
              checked={skipWarningForOneDay}
              onChange={(event) => setSkipWarningForOneDay(event.currentTarget.checked)}
            >
              Don&apos;t show again today
            </CheckboxField>
          </div>
        )}
        tone="warning"
        dismissLabel="Cancel"
        confirmLabel="Convert"
        onDismiss={() => {
          setPendingConversion(null);
          setOverwriteCount(0);
          setSkipWarningForOneDay(false);
        }}
        onConfirm={() => {
          if (skipWarningForOneDay) {
            suppressOverwriteWarningForOneDay();
          }
          if (pendingConversion) {
            applyConversion(pendingConversion);
          }
          setPendingConversion(null);
          setOverwriteCount(0);
          setSkipWarningForOneDay(false);
        }}
      />

      {trace ? (
        <>
          {/* <div className={styles.traceSectionDivider} aria-hidden="true" /> */}


        

          <div className={styles.traceSectionDivider} aria-hidden="true" />

          <TraceSection title="Settings">

          {/* <TraceSection  */}
          {/* // title="Positioning" */}
          {/* > */}
            {positioningEnabled && !preservePositioningSectionLayout ? (
              <div className={styles.panelRow}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => dispatch(createCancelTraceRepositionCommand())}
                   style={{ width: "47%"}}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => dispatch(createCommitTraceRepositionCommand())}
                   style={{ width: "47%"}}
                >
                  Done
                </Button>
              </div>
            ) : (
              <>
                <Field>
                  <div className={styles.traceInlineFieldRow}>
                    <span
                      className={styles.traceInlineFieldLabel}
                      style={typographyStyles.p2}
                    >
                      Position
                    </span>
                    <div className={styles.traceInlineActionControl}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={!trace || positioningEnabled || cropEditing}
                        onClick={() => dispatch(createBeginTraceRepositionCommand("panel"))}
                      >
                        <ButtonIcon icon="/icons/lucide/vector_square.svg" />
                        Reposition
                      </Button>
                    </div>
                  </div>
                </Field>

                <Field>
                  <div className={styles.traceInlineFieldRow}>
                    <span
                      className={styles.traceInlineFieldLabel}
                      style={typographyStyles.p2}
                    >
                      Crop
                    </span>
                    <div className={styles.traceInlineActionControl}>
                      <Button
                        type="button"
                        variant={cropEditing ? "primary" : "secondary"}
                        size="sm"
                        disabled={!trace || positioningEnabled}
                        onClick={() => {
                          if (!trace || cropEditing) {
                            return;
                          }

                          const nextCrop = getNormalizedTraceCrop(
                            trace,
                            traceImageWidth,
                            traceImageHeight,
                          );
                          setCropSnapshot(nextCrop);
                          setCropDraft(nextCrop);
                          setCropEditing(true);
                          onPreviewCropChange?.(nextCrop);
                        }}
                      >
                        <ButtonIcon icon="/icons/lucide/crop.svg" />
                        {cropEditing ? "Cropping" : "Crop"}
                      </Button>
                    </div>
                  </div>
                </Field>

                {cropEditing && cropDraft ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    <p
                      className={styles.emptyMessage}
                      style={{ ...typographyStyles.p2, opacity: 0.8 }}
                    >
                      {`Showing ${Math.round(cropDraft.cropWidth)} x ${Math.round(
                        cropDraft.cropHeight,
                      )} px from the original image.`}
                    </p>

                    <Field>
                      <div className={styles.traceInlineFieldRow}>
                        <span
                          className={styles.traceInlineFieldLabel}
                          style={typographyStyles.p2}
                        >
                          Left
                        </span>
                        <div className={styles.traceSliderControl}>
                          <div className={styles.traceSliderRow}>
                            <Slider
                              className={styles.traceSliderFullWidth}
                              min="0"
                              max={String(Math.max(0, traceImageWidth - cropDraft.cropWidth))}
                              step="1"
                              value={cropDraft.cropX}
                              aria-label="Crop left offset"
                              onChange={(event) =>
                                previewCropDraft(
                                  {
                                    cropX: Number(event.target.value),
                                  },
                                  cropDraft,
                                  traceImageWidth,
                                  traceImageHeight,
                                  setCropDraft,
                                  onPreviewCropChange,
                                )
                              }
                            />
                            <span className={styles.traceSliderValue}>
                              {Math.round(cropDraft.cropX)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Field>

                    <Field>
                      <div className={styles.traceInlineFieldRow}>
                        <span
                          className={styles.traceInlineFieldLabel}
                          style={typographyStyles.p2}
                        >
                          Top
                        </span>
                        <div className={styles.traceSliderControl}>
                          <div className={styles.traceSliderRow}>
                            <Slider
                              className={styles.traceSliderFullWidth}
                              min="0"
                              max={String(Math.max(0, traceImageHeight - cropDraft.cropHeight))}
                              step="1"
                              value={cropDraft.cropY}
                              aria-label="Crop top offset"
                              onChange={(event) =>
                                previewCropDraft(
                                  {
                                    cropY: Number(event.target.value),
                                  },
                                  cropDraft,
                                  traceImageWidth,
                                  traceImageHeight,
                                  setCropDraft,
                                  onPreviewCropChange,
                                )
                              }
                            />
                            <span className={styles.traceSliderValue}>
                              {Math.round(cropDraft.cropY)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Field>

                    <Field>
                      <div className={styles.traceInlineFieldRow}>
                        <span
                          className={styles.traceInlineFieldLabel}
                          style={typographyStyles.p2}
                        >
                          Width
                        </span>
                        <div className={styles.traceSliderControl}>
                          <div className={styles.traceSliderRow}>
                            <Slider
                              className={styles.traceSliderFullWidth}
                              min="1"
                              max={String(Math.max(1, traceImageWidth - cropDraft.cropX))}
                              step="1"
                              value={cropDraft.cropWidth}
                              aria-label="Crop width"
                              onChange={(event) =>
                                previewCropDraft(
                                  {
                                    cropWidth: Number(event.target.value),
                                  },
                                  cropDraft,
                                  traceImageWidth,
                                  traceImageHeight,
                                  setCropDraft,
                                  onPreviewCropChange,
                                )
                              }
                            />
                            <span className={styles.traceSliderValue}>
                              {Math.round(cropDraft.cropWidth)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Field>

                    <Field>
                      <div className={styles.traceInlineFieldRow}>
                        <span
                          className={styles.traceInlineFieldLabel}
                          style={typographyStyles.p2}
                        >
                          Height
                        </span>
                        <div className={styles.traceSliderControl}>
                          <div className={styles.traceSliderRow}>
                            <Slider
                              className={styles.traceSliderFullWidth}
                              min="1"
                              max={String(Math.max(1, traceImageHeight - cropDraft.cropY))}
                              step="1"
                              value={cropDraft.cropHeight}
                              aria-label="Crop height"
                              onChange={(event) =>
                                previewCropDraft(
                                  {
                                    cropHeight: Number(event.target.value),
                                  },
                                  cropDraft,
                                  traceImageWidth,
                                  traceImageHeight,
                                  setCropDraft,
                                  onPreviewCropChange,
                                )
                              }
                            />
                            <span className={styles.traceSliderValue}>
                              {Math.round(cropDraft.cropHeight)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Field>

                    <div className={styles.panelRow}>
                      <Button
                        type="button"
                        variant="ghostV2"
                        size="sm"
                        onClick={() => {
                          const fullCrop = createFullTraceCrop(
                            trace.imageWidth ?? traceImageWidth,
                            trace.imageHeight ?? traceImageHeight,
                          );
                          previewCropDraft(
                            fullCrop,
                            cropDraft,
                            traceImageWidth,
                            traceImageHeight,
                            setCropDraft,
                            onPreviewCropChange,
                          );
                        }}
                      >
                        Reset
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (!cropSnapshot) {
                            setCropEditing(false);
                            setCropDraft(null);
                            onPreviewCropChange?.(null);
                            return;
                          }
                          setCropDraft(cropSnapshot);
                          setCropSnapshot(null);
                          setCropEditing(false);
                          onPreviewCropChange?.(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          if (!cropSnapshot || !cropDraft) {
                            setCropEditing(false);
                            setCropSnapshot(null);
                            onPreviewCropChange?.(null);
                            return;
                          }

                          if (areCropRectsEqual(cropSnapshot, cropDraft)) {
                            setCropEditing(false);
                            setCropSnapshot(null);
                            onPreviewCropChange?.(null);
                            return;
                          }
                          dispatch(
                            createUpdateTraceCommand(cropDraft, {
                              history: { mode: "push", label: "Crop Trace" },
                              source: "toolbar",
                            }),
                          );
                          setCropSnapshot(null);
                          setCropEditing(false);
                          onPreviewCropChange?.(null);
                        }}
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          {/* </TraceSection> */}



            <Field>
              <div className={styles.traceInlineFieldRow}>
                <span
                  className={styles.traceInlineFieldLabel}
                  style={typographyStyles.p2}
                >
                  Image
                </span>
                <SegmentedControl
                  ariaLabel="Image visibility"
                  value={trace.visible ? "show" : "hide"}
                  onChange={(next) =>
                    dispatch(
                      createUpdateTraceCommand(
                        { visible: next === "show" },
                        { history: { mode: "skip" } },
                      ),
                    )
                  }
                  options={[
                    { label: "Show", value: "show" },
                    { label: "Hide", value: "hide" },
                  ]}
                />
              </div>
            </Field>

            <div
              className={styles.traceOpacityControls}
              data-disabled={trace.visible ? "false" : "true"}
            >
              <Field>
                <div className={styles.traceInlineFieldRow}>
                  <span
                    className={styles.traceInlineFieldLabel}
                    style={typographyStyles.p2}
                  >
                    Blending
                  </span>
                  <SegmentedControl
                    ariaLabel="Opacity blending mode"
                    disabled={!trace.visible}
                    value={trace.blendMode ?? "image"}
                    onChange={(mode) =>
                      dispatch(
                        createUpdateTraceCommand(
                          {
                            blendMode: mode,
                          },
                          { history: { mode: "skip" } },
                        ),
                      )
                    }
                    options={[
                      { label: "Crossfade", value: "crossfade" },
                      { label: "Image only", value: "image" },
                    ]}
                  />
                </div>
              </Field>

              <Field>
                <div className={styles.traceInlineFieldRow}>
                  <span
                    className={styles.traceInlineFieldLabel}
                    style={typographyStyles.p2}
                  >
                    Opacity
                  </span>
                  <div className={styles.traceSliderControl}>
                    <div className={styles.traceSliderTooltipWrap}>
                      <div
                        className={[
                          styles.traceSliderTooltip,
                          opacityTooltipVisible && trace.visible
                            ? styles.traceSliderTooltipVisible
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        aria-hidden="true"
                        style={{ left: `${trace.opacity * 100}%` }}
                      >
                        {Math.round(trace.opacity * 100)}%
                      </div>
                      <Slider
                        className={styles.traceSliderFullWidth}
                        min="0"
                        max="1"
                        step="0.05"
                        value={trace.opacity}
                        disabled={!trace.visible}
                        aria-label="Image opacity"
                        onPointerDown={() => setOpacityTooltipVisible(true)}
                        onBlur={() => setOpacityTooltipVisible(false)}
                        onChange={(event) =>
                          dispatch(
                            createUpdateTraceCommand(
                              {
                                opacity: Number(event.target.value),
                              },
                              { history: { mode: "skip" } },
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </Field>
            </div>
          </TraceSection>
            <div className={styles.traceSectionDivider} aria-hidden="true" />

          <TraceSection
            title="Convert to Pattern"
            // hint="Sample the image onto the stitch grid using your thread palette."
          >
            <Field>
              <div className={styles.traceInlineFieldRow}>
                <span
                  className={styles.traceInlineFieldLabel}
                  style={typographyStyles.p2}
                >
                  Max colors
                </span>
                <div className={styles.traceSliderControl}>
                  <div className={styles.traceSliderRow}>
                    <Slider
                      className={styles.traceSliderFullWidth}
                      min="2"
                      max="32"
                      step="1"
                      value={convertMaxColors}
                      disabled={!canConvert || convertingImage}
                      aria-label="Maximum thread colors"
                      onChange={(event) =>
                        setConvertMaxColors(
                          Math.max(2, Math.min(32, Number(event.target.value) || 2)),
                        )
                      }
                    />
                    <span className={styles.traceSliderValue}>{convertMaxColors}</span>
                  </div>
                </div>
              </div>
            </Field>

            <Field>
              <div className={styles.traceInlineFieldRow}>
                <span
                  className={styles.traceInlineFieldLabel}
                  style={typographyStyles.p2}
                >
                  Smoothing
                </span>
                <div className={styles.traceSliderControl}>
                  <div className={styles.traceSliderRow}>
                    <Slider
                      className={styles.traceSliderFullWidth}
                      min="0"
                      max="1"
                      step="0.01"
                      value={convertSmoothing}
                      disabled={!canConvert || convertingImage}
                      aria-label="Image smoothing"
                      onChange={(event) =>
                        setConvertSmoothing(
                          Math.max(0, Math.min(1, Number(event.target.value) || 0)),
                        )
                      }
                    />
                    <span className={styles.traceSliderValue}>
                      {conversionSmoothingPercent}%
                    </span>
                  </div>
                </div>
              </div>
            </Field>

            <Button
              type="button"
              variant="primary"
              disabled={!canConvert || convertingImage}
              onClick={handleConvertToPattern}
            >
              {convertingImage ? (
                <>
                  <span className={styles.saveButtonSpinner} aria-hidden="true" />
                  Converting...
                </>
              ) : (
                "Convert image"
              )}
            </Button>
          </TraceSection>
        </>
      ) : (
        <p className={styles.emptyMessage} style={typographyStyles.p2}>
          {/* No trace image attached. */}
        </p>
      )}
      </div>
    </>
  );
}

async function uploadTraceFile(file: File): Promise<{
  previewUrl: string;
  thumbnailUrl: string;
  originalUrl: string;
  fileName: string;
  byteSize: number;
  mimeType: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
}> {
  const pathname = createTraceUploadPath(file);
  const uploadedOriginal = await upload(pathname, file, {
    access: "public",
    contentType: file.type || undefined,
    handleUploadUrl: "/api/upload-trace",
  });

  const response = await fetch("/api/upload-trace/complete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type || null,
      originalPathname: uploadedOriginal.pathname,
      originalUrl: uploadedOriginal.url,
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text().catch(() => "");
    const detail = getUploadErrorDetail(responseBody);
    throw new Error(
      detail
        ? `Trace upload failed (${response.status}): ${detail}`
        : `Trace upload failed with status ${response.status}`,
    );
  }

  const uploaded = (await response.json()) as {
    previewUrl: string;
    thumbnailUrl: string;
    originalUrl: string;
    fileName: string;
    byteSize: number;
    mimeType: string | null;
    imageWidth: number | null;
    imageHeight: number | null;
  };

  return {
    previewUrl: uploaded.previewUrl,
    thumbnailUrl: uploaded.thumbnailUrl,
    originalUrl: uploaded.originalUrl,
    fileName: uploaded.fileName,
    byteSize: uploaded.byteSize,
    mimeType: uploaded.mimeType,
    imageWidth: uploaded.imageWidth,
    imageHeight: uploaded.imageHeight,
  };
}

function createTraceUploadPath(file: File): string {
  const extension = getUploadFileExtension(file.name, file.type);
  const uploadId = `editor-v2-trace-${Date.now()}-${crypto.randomUUID()}`;
  return `${uploadId}/original.${extension}`;
}

function getUploadFileExtension(fileName: string, mimeType: string): string {
  const sanitized = fileName.trim().toLowerCase();
  const lastDotIndex = sanitized.lastIndexOf(".");

  if (lastDotIndex > 0 && lastDotIndex < sanitized.length - 1) {
    return sanitized.slice(lastDotIndex + 1).replace(/[^a-z0-9]/g, "") || "bin";
  }

  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";

  return "bin";
}

function getUploadErrorDetail(responseBody: string): string | null {
  const trimmed = responseBody.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as { error?: unknown; message?: unknown };
    if (typeof parsed.error === "string" && parsed.error.trim()) {
      return parsed.error.trim();
    }

    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message.trim();
    }
  } catch {
    // Ignore JSON parse failures and fall back to plain text below.
  }

  return trimmed;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function getTraceDisplayName(trace: TraceDocument): string {
  if (trace.fileName) {
    return trace.fileName;
  }

  const assetUrl = trace.originalUrl;
  const fallbackName = "Trace image";

  try {
    const url = new URL(assetUrl);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const rawName = pathSegments[pathSegments.length - 1];

    if (!rawName) {
      return fallbackName;
    }

    const decodedName = decodeURIComponent(rawName);
    const match = decodedName.match(
      /^editor-v2-trace-\d+-[0-9a-f-]+-(.+)$/i,
    );

    return match?.[1] || decodedName;
  } catch {
    return fallbackName;
  }
}

function splitFileNameForDisplay(fileName: string): {
  baseName: string;
  extension: string;
} {
  const trimmedFileName = fileName.trim();
  const lastDotIndex = trimmedFileName.lastIndexOf(".");

  if (lastDotIndex <= 0 || lastDotIndex === trimmedFileName.length - 1) {
    return {
      baseName: trimmedFileName,
      extension: "",
    };
  }

  return {
    baseName: trimmedFileName.slice(0, lastDotIndex),
    extension: trimmedFileName.slice(lastDotIndex),
  };
}

function previewCropDraft(
  nextChanges: Partial<TraceCropRect>,
  currentDraft: TraceCropRect,
  imageWidth: number,
  imageHeight: number,
  setCropDraft: (draft: TraceCropRect) => void,
  onPreviewCropChange?: (crop: TraceCropRect | null) => void,
) {
  const nextDraft = getNormalizedTraceCrop(
    {
      ...currentDraft,
      ...nextChanges,
      imageWidth,
      imageHeight,
    },
    imageWidth,
    imageHeight,
  );

  setCropDraft(nextDraft);
  onPreviewCropChange?.(nextDraft);
}

function areCropRectsEqual(left: TraceCropRect, right: TraceCropRect): boolean {
  return (
    left.cropX === right.cropX &&
    left.cropY === right.cropY &&
    left.cropWidth === right.cropWidth &&
    left.cropHeight === right.cropHeight
  );
}

function TraceSection({
  children,
  hint,
  title,
}: {
  children: ReactNode;
  hint?: string;
  title: string;
}) {
  return (
    <section className={styles.traceSection}>
      <div className={styles.traceSectionHeader}>
        <h3 className={styles.traceSectionTitle} style={typographyStyles.h5}>
          {title}
        </h3>
        {hint ? (
          <p className={styles.traceSectionHint} style={typographyStyles.s}>
            {hint}
          </p>
        ) : null}
      </div>
      <div className={styles.traceSectionBody}>{children}</div>
    </section>
  );
}
