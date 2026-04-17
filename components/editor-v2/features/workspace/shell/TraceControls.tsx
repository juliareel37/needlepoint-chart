"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import {
  Button,
  ButtonIcon,
  Field,
  Modal,
  Notification,
  Slider,
  Toggle,
} from "@/components/design-system";
import type {
  EditorStore,
  TraceBlendMode,
  TraceDocument,
  TraceRepositionOrigin,
} from "@/lib/editor-v2/editor/store";
import {
  createAttachTraceCommand,
  createBeginTraceRepositionCommand,
  createCancelTraceRepositionCommand,
  createCommitTraceRepositionCommand,
  createRemoveTraceCommand,
  createUpdateTraceCommand,
} from "../workspaceCommands";
import styles from "./EditorV2Shell.module.css";

const TRACE_UPLOAD_ERROR_NOTIFICATION_DURATION_MS = 8000;
const MAX_TRACE_IMAGE_DIMENSION_PX = 2048;
const MAX_TRACE_IMAGE_PIXELS = 4_000_000;

interface TraceControlsProps {
  trace: TraceDocument | null;
  dispatch?: EditorStore["dispatch"];
  repositionActive?: boolean;
  repositionOrigin?: TraceRepositionOrigin | null;
}

export function TraceControls({
  trace,
  dispatch,
  repositionActive = false,
  repositionOrigin = null,
}: TraceControlsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const traceUploadSequenceRef = useRef(0);
  const positioningPreviewRef = useRef<{
    assetUrl: string;
    blendMode: TraceBlendMode;
    opacity: number;
    visible: boolean;
    userOverrode: boolean;
  } | null>(null);
  const [opacityTooltipVisible, setOpacityTooltipVisible] = useState(false);
  const [removeConfirmationOpen, setRemoveConfirmationOpen] = useState(false);
  const [traceUploadErrorMessage, setTraceUploadErrorMessage] = useState<string | null>(
    null,
  );
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
    } catch {
      if (sequence !== traceUploadSequenceRef.current) {
        return;
      }

      setTraceUploadStatus("error");
      setTraceUploadErrorMessage(
        "Try signing in again or choose a smaller PNG, JPG, WEBP, or GIF.",
      );
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
    if (!dispatch) {
      return;
    }

    if (!trace) {
      positioningPreviewRef.current = null;
      return;
    }

    if (positioningEnabled) {
      if (positioningPreviewRef.current?.assetUrl !== trace.assetUrl) {
        positioningPreviewRef.current = {
          assetUrl: trace.assetUrl,
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

    if (!previewSnapshot || previewSnapshot.assetUrl !== trace.assetUrl) {
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
      {traceUploadErrorMessage
        ? createPortal(
            <div className={styles.editorNotificationOverlayTop}>
              <div
                className={styles.editorNotificationStack}
                data-auto-dismiss="true"
                style={{ animationDuration: `${TRACE_UPLOAD_ERROR_NOTIFICATION_DURATION_MS}ms` }}
              >
                <Notification
                  tone="destructive"
                  title="Couldn't upload image"
                  description={traceUploadErrorMessage}
                  onDismiss={() => setTraceUploadErrorMessage(null)}
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
                ) : (
                  <>
                    <img
                      src={trace.assetUrl}
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
              variant="ghost"
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

      {trace ? (
        <>
          <div className={styles.traceSectionDivider} aria-hidden="true" />

          <TraceSection title="Positioning">
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
              <Button
                type="button"
                variant="primary"
                disabled={!trace || positioningEnabled}
                onClick={() => dispatch(createBeginTraceRepositionCommand("panel"))}
              >
                <ButtonIcon icon="/icons/lucide/vector_square.svg" />

                Reposition

              </Button>
            )}
          </TraceSection>

          <div className={styles.traceSectionDivider} aria-hidden="true" />

          <TraceSection title="Visibility">
            <Toggle
              aria-label="Show image"
              checked={trace.visible}
              label="Show image"
              onChange={(next) =>
                dispatch(
                  createUpdateTraceCommand(
                    { visible: next },
                    { history: { mode: "skip" } },
                  ),
                )
              }
            />

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
                  <div
                    className={styles.traceSegmentedControl}
                    role="radiogroup"
                    aria-label="Opacity blending mode"
                    aria-disabled={!trace.visible}
                  >
                    <BlendModeButton
                      active={trace.blendMode === "crossfade"}
                      disabled={!trace.visible}
                      label="Crossfade"
                      mode="crossfade"
                      onSelect={(mode) =>
                        dispatch(
                          createUpdateTraceCommand(
                            {
                              blendMode: mode,
                            },
                            { history: { mode: "skip" } },
                          ),
                        )
                      }
                    />
                    <BlendModeButton
                      active={(trace.blendMode ?? "image") === "image"}
                      disabled={!trace.visible}
                      label="Image only"
                      mode="image"
                      onSelect={(mode) =>
                        dispatch(
                          createUpdateTraceCommand(
                            {
                              blendMode: mode,
                            },
                            { history: { mode: "skip" } },
                          ),
                        )
                      }
                    />
                  </div>
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
  assetUrl: string;
  fileName: string;
  byteSize: number;
  mimeType: string;
  imageWidth: number | null;
  imageHeight: number | null;
}> {
  const { upload } = await import("@vercel/blob/client");
  const preparedFile = await prepareTraceUploadFile(file);
  const [uploaded, dimensions] = await Promise.all([
    upload(
      `editor-v2-trace-${Date.now()}-${crypto.randomUUID()}-${preparedFile.file.name}`,
      preparedFile.file,
      {
        access: "public",
        handleUploadUrl: "/api/upload-trace",
      },
    ),
    Promise.resolve(preparedFile.dimensions),
  ]);

  return {
    assetUrl: uploaded.url,
    fileName: preparedFile.file.name,
    byteSize: preparedFile.file.size,
    mimeType: preparedFile.file.type,
    imageWidth: dimensions?.width ?? null,
    imageHeight: dimensions?.height ?? null,
  };
}

async function prepareTraceUploadFile(file: File): Promise<{
  file: File;
  dimensions: { width: number; height: number } | null;
}> {
  const dimensions = await getImageDimensions(file);

  if (
    !dimensions ||
    file.type === "image/gif" ||
    !file.type.startsWith("image/")
  ) {
    return { file, dimensions };
  }

  const scaleByDimension =
    MAX_TRACE_IMAGE_DIMENSION_PX /
    Math.max(dimensions.width, dimensions.height);
  const scaleByPixels = Math.sqrt(
    MAX_TRACE_IMAGE_PIXELS / (dimensions.width * dimensions.height),
  );
  const scale = Math.min(1, scaleByDimension, scaleByPixels);

  if (scale >= 0.999) {
    return { file, dimensions };
  }

  const normalizedFile = await resizeImageFile(file, {
    height: Math.max(1, Math.round(dimensions.height * scale)),
    width: Math.max(1, Math.round(dimensions.width * scale)),
  });

  if (!normalizedFile) {
    return { file, dimensions };
  }

  return {
    file: normalizedFile,
    dimensions: await getImageDimensions(normalizedFile),
  };
}

async function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = src;
  });
}

async function resizeImageFile(
  file: File,
  targetSize: { width: number; height: number },
): Promise<File | null> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const canvas = document.createElement("canvas");
    canvas.width = targetSize.width;
    canvas.height = targetSize.height;

    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }

    // Keep trace uploads bounded on mobile Safari, which is sensitive to
    // multiple full-resolution image decodes/canvas copies at once.
    context.drawImage(image, 0, 0, targetSize.width, targetSize.height);

    const blob = await canvasToBlob(canvas, "image/webp", 0.9);
    canvas.width = 0;
    canvas.height = 0;

    if (!blob) {
      return null;
    }

    return new File(
      [blob],
      replaceFileExtension(file.name, "webp"),
      {
        type: blob.type || "image/webp",
        lastModified: file.lastModified,
      },
    );
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function replaceFileExtension(fileName: string, nextExtension: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex <= 0) {
    return `${fileName}.${nextExtension}`;
  }

  return `${fileName.slice(0, lastDotIndex)}.${nextExtension}`;
}

function getTraceDisplayName(trace: TraceDocument): string {
  if (trace.fileName) {
    return trace.fileName;
  }

  const assetUrl = trace.assetUrl;
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

function BlendModeButton({
  active,
  disabled = false,
  label,
  mode,
  onSelect,
}: {
  active: boolean;
  disabled?: boolean;
  label: string;
  mode: TraceBlendMode;
  onSelect: (mode: TraceBlendMode) => void;
}) {
  const isInertActive = active && !disabled;

  return (
    <Button
      type="button"
      variant="ghost"
      size="md"
      className={styles.traceSegmentedItem}
      style={{ padding: "4px 8px" }}
      disabled={disabled}
      active={active}
      inertWhenActive={isInertActive}
      aria-pressed={active}
      onClick={() => {
        if (!disabled && !isInertActive) {
          onSelect(mode);
        }
      }}
    >
      {label}
    </Button>
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
