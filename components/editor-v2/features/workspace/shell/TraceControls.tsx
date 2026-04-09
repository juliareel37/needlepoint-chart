"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import {
  Button,
  Field,
  Slider,
  Toggle,
} from "@/components/design-system";
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
      <Button
        type="button"
        variant={trace ? "secondary" : "primary"}
        onClick={() => fileInputRef.current?.click()}
      >
        {trace ? "Replace trace" : "Add trace"}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={async (event) => {
          const file = event.target.files?.[0];

          if (!file) {
            return;
          }

          const assetUrl = await readFileAsDataUrl(file);
          dispatch(createAttachTraceCommand(assetUrl));
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
            <Field label="Offset X">
              <SliderReadoutRow value={`${trace.offsetX}px`}>
                <Slider
                  className={styles.traceSliderFullWidth}
                  min="-240"
                  max="240"
                  step="8"
                  value={trace.offsetX}
                  onChange={(event) =>
                    dispatch(
                      createUpdateTraceCommand({
                        offsetX: Number(event.target.value),
                      }),
                    )
                  }
                />
              </SliderReadoutRow>
            </Field>

            <Field label="Offset Y">
              <SliderReadoutRow value={`${trace.offsetY}px`}>
                <Slider
                  className={styles.traceSliderFullWidth}
                  min="-240"
                  max="240"
                  step="8"
                  value={trace.offsetY}
                  onChange={(event) =>
                    dispatch(
                      createUpdateTraceCommand({
                        offsetY: Number(event.target.value),
                      }),
                    )
                  }
                />
              </SliderReadoutRow>
            </Field>

            <Field label="Scale">
              <SliderReadoutRow value={`${trace.scale.toFixed(2)}x`}>
                <Slider
                  className={styles.traceSliderFullWidth}
                  min="0.5"
                  max="2"
                  step="0.05"
                  value={trace.scale}
                  onChange={(event) =>
                    dispatch(
                      createUpdateTraceCommand({
                        scale: Number(event.target.value),
                      }),
                    )
                  }
                />
              </SliderReadoutRow>
            </Field>
          </TraceSection>

          <TraceSection
            title="Opacity"
            tone="brand"
          >
            <Toggle
              aria-label="Show trace"
              checked={trace.visible}
              label="Show trace"
              onChange={(next) =>
                dispatch(
                  createUpdateTraceCommand({ visible: next }),
                )
              }
            />

            <div
              className={styles.traceOpacityControls}
              data-disabled={trace.visible ? "false" : "true"}
            >
              <Field label="Opacity blending">
                <div
                  className={styles.traceSegmentedControl}
                  role="radiogroup"
                  aria-label="Opacity blending mode"
                  aria-disabled={!trace.visible}
                >
                  <BlendModeButton
                    active={(trace.blendMode ?? "image") === "image"}
                    disabled={!trace.visible}
                    label="Image only"
                    mode="image"
                    onSelect={(mode) =>
                      dispatch(
                        createUpdateTraceCommand({
                          blendMode: mode,
                        }),
                      )
                    }
                  />
                  <BlendModeButton
                    active={trace.blendMode === "crossfade"}
                    disabled={!trace.visible}
                    label="Crossfade"
                    mode="crossfade"
                    onSelect={(mode) =>
                      dispatch(
                        createUpdateTraceCommand({
                          blendMode: mode,
                        }),
                      )
                    }
                  />
                </div>
              </Field>

              <Field label="Image opacity">
                <SliderReadoutRow value={`${Math.round(trace.opacity * 100)}%`}>
                  <Slider
                    className={styles.traceSliderFullWidth}
                    min="0"
                    max="1"
                    step="0.05"
                    value={trace.opacity}
                    disabled={!trace.visible}
                    onChange={(event) =>
                      dispatch(
                        createUpdateTraceCommand({
                          opacity: Number(event.target.value),
                        }),
                      )
                    }
                  />
                </SliderReadoutRow>
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
    <button
      type="button"
      className={styles.traceSegmentedItem}
      data-active={active ? "true" : "false"}
      data-inert-active={isInertActive ? "true" : "false"}
      disabled={disabled}
      aria-pressed={active}
      onClick={() => {
        if (!disabled && !isInertActive) {
          onSelect(mode);
        }
      }}
    >
      {label}
    </button>
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

function SliderReadoutRow({
  children,
  value,
}: {
  children: ReactNode;
  value: string;
}) {
  return (
    <div className={styles.traceSliderRow}>
      <div className={styles.traceSliderControl}>{children}</div>
      <span className={styles.traceSliderValue} style={typographyStyles.p2}>
        {value}
      </span>
    </div>
  );
}
