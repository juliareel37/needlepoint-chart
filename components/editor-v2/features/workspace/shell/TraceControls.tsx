"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { assetPath } from "@/lib/assetPath";
import { typographyStyles } from "@/app/design-system/typography";
import { Button, Field, Slider, Toggle } from "@/components/design-system";
import type {
  EditorStore,
  TraceBlendMode,
  TraceDocument,
} from "@/lib/editor-v2/editor/store";
import {
  createAttachTraceCommand,
  createRemoveTraceCommand,
  createUpdateTraceCommand,
} from "../workspaceCommands";
import styles from "./EditorV2Shell.module.css";

interface TraceControlsProps {
  trace: TraceDocument | null;
  dispatch?: EditorStore["dispatch"];
}

export function TraceControls({ trace, dispatch }: TraceControlsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const positioningPreviewRef = useRef<{
    assetUrl: string;
    blendMode: TraceBlendMode;
    opacity: number;
    visible: boolean;
    userOverrode: boolean;
  } | null>(null);
  const [opacityTooltipVisible, setOpacityTooltipVisible] = useState(false);
  const positioningEnabled = trace ? !trace.locked : false;

  const handleTraceFileSelect = async (file: File) => {
    if (!dispatch) return;

    const assetUrl = await readFileAsDataUrl(file);
    dispatch(createAttachTraceCommand(assetUrl));
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
          <img
            src={assetPath("/icons/upload.svg")}
            alt=""
            aria-hidden="true"
            width={18}
            height={18}
            style={{ display: "block", filter: "var(--icon-on-bg-filter)" }}
          />
          <span style={typographyStyles.p2}>Choose a file or drag &amp; drop.</span>
          <span style={{ ...typographyStyles.p2, opacity: 0.75 }}>PNG, JPG, WEBP, or GIF up to 10 MB.</span>
          <Button
            type="button"
            variant="ghostV2"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Browse file
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          Replace trace
        </Button>
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

      {trace ? (
        <>
          <div className={styles.sidebarSubsection}>
            <div className={styles.panelRow}>
              <Button
                type="button"
                onClick={() =>
                  dispatch(
                    createUpdateTraceCommand({
                      offsetX: 0,
                      offsetY: 0,
                      scale: 1,
                    }),
                  )
                }
              >
                Reset trace
              </Button>
              <Button
                type="button"
                variant="ghostV2"
                onClick={() => dispatch(createRemoveTraceCommand())}
              >
                Remove trace
              </Button>
            </div>
          </div>

          <TraceSection
            title="Positioning"
            tone="neutral"
          >
            <Button
              type="button"
              variant={positioningEnabled ? "primary" : "secondary"}
              disabled={!trace}
              onClick={() => {
                if (!trace || !dispatch) return;
                dispatch(
                  createUpdateTraceCommand(
                    { locked: positioningEnabled },
                    { history: { mode: "skip" } },
                  ),
                );
              }}
            >
              {positioningEnabled ? "Reposition: On" : "Enable Reposition"}
            </Button>
          </TraceSection>

          <TraceSection
            title="Visibility"
            tone="neutral"
          >
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
          No trace image attached.
        </p>
      )}
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Failed to read trace image"));
    };

    reader.onerror = () =>
      reject(reader.error ?? new Error("Failed to read trace image"));
    reader.readAsDataURL(file);
  });
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
  tone,
}: {
  children: ReactNode;
  hint?: string;
  title: string;
  tone: "brand" | "neutral";
}) {
  return (
    <section
      className={[
        styles.traceSection,
        tone === "brand" ? styles.traceSectionBrand : styles.traceSectionNeutral,
      ]
        .filter(Boolean)
        .join(" ")}
    >
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
