"use client";

import { upload } from "@vercel/blob/client";
import { useEffect, useMemo, useRef, useState } from "react";
import { typographyStyles } from "@/app/design-system/typography";
import {
  Button,
  ButtonIcon,
  Field,
  Modal,
} from "@/components/design-system";
import type { ActiveTool, EditorSidebarSection } from "@/lib/editor-v2/editor/store";
import { submitEditorV2BugReport } from "@/components/editor-v2/app/editorV2ServerPersistence";
import styles from "./EditorV2Shell.module.css";

type BugReportCategory = "bug" | "ux" | "feature" | "other";

type ScreenshotDraft = {
  file: File;
  id: string;
  previewUrl: string;
};

interface UploadedScreenshot {
  fileName: string;
  mimeType: string | null;
  sizeBytes: number;
  url: string;
}

interface EditorBugReportModalProps {
  activeSidebarSection: EditorSidebarSection;
  activeTool: ActiveTool;
  currentStorageId: string | null;
  gridHeight: number;
  gridWidth: number;
  hasSavedDesignAccess: boolean;
  isOpen: boolean;
  previewMode: boolean;
  projectTitle: string;
  traceAttached: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

const BUG_REPORT_CATEGORY_OPTIONS = [
  {
    label: "Bug",
    hint: "Something broke or didn’t behave the way you expected.",
    value: "bug",
  },
  {
    label: "Confusing UX",
    hint: "The workflow worked, but it felt unclear or harder than it should.",
    value: "ux",
  },
  {
    label: "Missing feature",
    hint: "You wanted to do something the editor doesn’t support yet.",
    value: "feature",
  },
  {
    label: "General suggestion",
    hint: "Anything else you want to share, suggest, or point out.",
    value: "other",
  },
] as const;

const BUG_REPORT_FORM_ID = "editor-quick-report";
const BUG_REPORT_FORM_VERSION = "2026-06-02";
const MAX_SCREENSHOT_COUNT = 4;
const MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024;

function RequiredMark() {
  return (
    <span aria-hidden="true" className={styles.bugReportRequiredMark}>
      *
    </span>
  );
}

export function EditorBugReportModal({
  activeSidebarSection,
  activeTool,
  currentStorageId,
  gridHeight,
  gridWidth,
  hasSavedDesignAccess,
  isOpen,
  previewMode,
  projectTitle,
  traceAttached,
  onClose,
  onSubmitted,
}: EditorBugReportModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const screenshotsRef = useRef<ScreenshotDraft[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [category, setCategory] = useState<BugReportCategory | null>(null);
  const [bugExpected, setBugExpected] = useState("");
  const [bugWrong, setBugWrong] = useState("");
  const [uxConfusing, setUxConfusing] = useState("");
  const [uxEasier, setUxEasier] = useState("");
  const [featureMissing, setFeatureMissing] = useState("");
  const [featureImportance, setFeatureImportance] = useState("3");
  const [otherShare, setOtherShare] = useState("");
  const [screenshots, setScreenshots] = useState<ScreenshotDraft[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    screenshotsRef.current = screenshots;
  }, [screenshots]);

  useEffect(() => {
    return () => {
      revokeScreenshotPreviews(screenshotsRef.current);
    };
  }, []);

  const isSubmitDisabled = useMemo(() => {
    if (submitting) {
      return true;
    }

    if (!category) {
      return true;
    }

    switch (category) {
      case "bug":
        return bugExpected.trim().length === 0 || bugWrong.trim().length === 0;
      case "ux":
        return uxConfusing.trim().length === 0 || uxEasier.trim().length === 0;
      case "feature":
        return featureMissing.trim().length === 0 || featureImportance.trim().length === 0;
      case "other":
        return otherShare.trim().length === 0;
      default:
        return true;
    }
  }, [
    bugExpected,
    bugWrong,
    category,
    featureImportance,
    featureMissing,
    otherShare,
    submitting,
    uxConfusing,
    uxEasier,
  ]);
  const canAdvanceToStepTwo = category !== null;

  async function handleSubmit() {
    if (isSubmitDisabled) {
      return;
    }

    if (!category) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const uploadedScreenshots = await Promise.all(
        screenshots.map((screenshot) => uploadBugReportScreenshot(screenshot.file)),
      );

      await submitEditorV2BugReport({
        formId: BUG_REPORT_FORM_ID,
        formVersion: BUG_REPORT_FORM_VERSION,
        editorDesignId: currentStorageId,
        answers: buildAnswersPayload({
          bugExpected,
          bugWrong,
          category,
          featureImportance,
          featureMissing,
          otherShare,
          screenshots: uploadedScreenshots,
          uxConfusing,
          uxEasier,
        }),
        context: {
          activeSidebarSection,
          activeTool,
          gridHeight,
          gridWidth,
          hasSavedDesignAccess,
          previewMode,
          projectTitle,
          traceAttached,
        },
        clientMetadata: {
          language: window.navigator.language,
          path: window.location.pathname,
          screen: {
            pixelRatio: window.devicePixelRatio,
            viewportHeight: window.innerHeight,
            viewportWidth: window.innerWidth,
          },
          submittedAt: new Date().toISOString(),
          userAgent: window.navigator.userAgent,
        },
      });

      resetForm();
      onSubmitted();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Couldn’t send your report right now.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setStep(1);
    setCategory(null);
    setBugExpected("");
    setBugWrong("");
    setUxConfusing("");
    setUxEasier("");
    setFeatureMissing("");
    setFeatureImportance("3");
    setOtherShare("");
    setSubmitError(null);
    setScreenshots((current) => {
      revokeScreenshotPreviews(current);
      return [];
    });
  }

  function handleClose() {
    if (!submitting) {
      resetForm();
    }
    setSubmitError(null);
    onClose();
  }

  function handleScreenshotInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (nextFiles.length === 0) {
      return;
    }

    setSubmitError(null);
    setScreenshots((current) => {
      const availableSlots = Math.max(0, MAX_SCREENSHOT_COUNT - current.length);

      if (availableSlots === 0) {
        setSubmitError(`You can attach up to ${MAX_SCREENSHOT_COUNT} screenshots.`);
        return current;
      }

      const acceptedFiles: ScreenshotDraft[] = [];
      for (const file of nextFiles.slice(0, availableSlots)) {
        if (!file.type.startsWith("image/")) {
          setSubmitError("Screenshots must be image files.");
          continue;
        }

        if (file.size > MAX_SCREENSHOT_BYTES) {
          setSubmitError("Each screenshot must be 10 MB or smaller.");
          continue;
        }

        acceptedFiles.push({
          file,
          id: crypto.randomUUID(),
          previewUrl: URL.createObjectURL(file),
        });
      }

      return [...current, ...acceptedFiles];
    });
  }

  function handleRemoveScreenshot(screenshotId: string) {
    setScreenshots((current) => {
      const next = current.filter((screenshot) => screenshot.id !== screenshotId);
      const removed = current.find((screenshot) => screenshot.id === screenshotId);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return next;
    });
  }

  function handleConfirm() {
    if (step === 1) {
      if (!canAdvanceToStepTwo) {
        return;
      }

      setStep(2);
      return;
    }

    void handleSubmit();
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleScreenshotInputChange}
        style={{ display: "none" }}
      />
      <Modal
        isOpen={isOpen}
        title={
          step === 1 ? (
            "Beta Feedback Form"
          ) : (
            <Button
              type="button"
              variant="ghostV2"
              size="sm"
              className={styles.bugReportBackButton}
              onClick={() => setStep(1)}
            >
              <ButtonIcon icon="/icons/lucide/arrow-left.svg" />
              <span style={typographyStyles.p2}>Back</span>
            </Button>
          )
        }
        description={
          <div className={styles.bugReportModalBody}>
            {step === 1 ? (
              <div className={styles.bugReportStepPage}>
                <fieldset className={styles.bugReportRadioField}>
                  <legend className={styles.bugReportRadioLegend} style={typographyStyles.h5}>
                    What would you like to tell us about?<RequiredMark />
                  </legend>
                  <div className={styles.bugReportRadioOptions}>
                    {BUG_REPORT_CATEGORY_OPTIONS.map((option) => (
                      <label key={option.value} className={styles.bugReportRadioOption}>
                        <input
                          type="radio"
                          name="bugReportCategory"
                          value={option.value}
                          checked={category === option.value}
                          onChange={() => setCategory(option.value)}
                        />
                        <span className={styles.bugReportRadioCopy}>
                          <span
                            className={styles.bugReportRadioTitle}
                            style={typographyStyles.p2Medium}
                          >
                            {option.label}
                          </span>
                          <span
                            className={styles.bugReportRadioHint}
                            style={typographyStyles.s}
                          >
                            {option.hint}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className={styles.bugReportStepActions}>
                  <Button
                    type="button"
                    variant="ghostV2"
                    size="md"
                    iconOnly
                    className={styles.bugReportNextButton}
                    onClick={() => setStep(2)}
                    disabled={!canAdvanceToStepTwo}
                    aria-label="Continue to report details"
                  >
                    <ButtonIcon icon="/icons/lucide/arrow-right.svg" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {category === "bug" ? (
                  <>
                    <Field
                      label={
                        <span className={styles.bugReportQuestionLabel} style={typographyStyles.h5}>
                          What were you trying to do or expecting to happen?<RequiredMark />
                        </span>
                      }
                    >
                      <textarea
                        className={styles.bugReportTextarea}
                        rows={3}
                        value={bugExpected}
                        onChange={(event) => setBugExpected(event.currentTarget.value)}
                      />
                    </Field>
                    <Field
                      label={
                        <span className={styles.bugReportQuestionLabel} style={typographyStyles.h5}>
                          What went wrong?<RequiredMark />
                        </span>
                      }
                    >
                      <textarea
                        className={styles.bugReportTextarea}
                        rows={3}
                        value={bugWrong}
                        onChange={(event) => setBugWrong(event.currentTarget.value)}
                      />
                    </Field>
                    <ScreenshotField
                      label="Anything to show us?"
                      screenshots={screenshots}
                      onAdd={() => fileInputRef.current?.click()}
                      onRemove={handleRemoveScreenshot}
                    />
                  </>
                ) : null}

                {category === "ux" ? (
                  <>
                    <Field
                      label={
                        <span className={styles.bugReportQuestionLabel} style={typographyStyles.h5}>
                          What felt confusing or harder than expected?<RequiredMark />
                        </span>
                      }
                    >
                      <textarea
                        className={styles.bugReportTextarea}
                        rows={3}
                        value={uxConfusing}
                        onChange={(event) => setUxConfusing(event.currentTarget.value)}
                      />
                    </Field>
                    <Field
                      label={
                        <span className={styles.bugReportQuestionLabel} style={typographyStyles.h5}>
                          What would have made it easier?<RequiredMark />
                        </span>
                      }
                    >
                      <textarea
                        className={styles.bugReportTextarea}
                        rows={3}
                        value={uxEasier}
                        onChange={(event) => setUxEasier(event.currentTarget.value)}
                      />
                    </Field>
                    <ScreenshotField
                      label="Anything to show us?"
                      screenshots={screenshots}
                      onAdd={() => fileInputRef.current?.click()}
                      onRemove={handleRemoveScreenshot}
                    />
                  </>
                ) : null}

                {category === "feature" ? (
                  <>
                    <Field
                      label={
                        <span className={styles.bugReportQuestionLabel} style={typographyStyles.h5}>
                          What did you want to do but couldn’t?<RequiredMark />
                        </span>
                      }
                    >
                      <textarea
                        className={styles.bugReportTextarea}
                        rows={3}
                        value={featureMissing}
                        onChange={(event) => setFeatureMissing(event.currentTarget.value)}
                      />
                    </Field>
                    <div className={styles.bugReportStandaloneField}>
                      <div
                        className={styles.bugReportQuestionLabel}
                        style={typographyStyles.h5}
                      >
                        How important is this to you?<RequiredMark />
                      </div>
                      <div className={styles.bugReportScaleField}>
                        <div
                          className={styles.bugReportScaleRow}
                          role="radiogroup"
                          aria-label="Feature importance"
                        >
                          {[1, 2, 3, 4, 5].map((value) => {
                            const stringValue = String(value);
                            const active = featureImportance === stringValue;

                            return (
                              <button
                                key={value}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                className={styles.bugReportScaleButton}
                                data-active={active ? "true" : "false"}
                                onClick={() => setFeatureImportance(stringValue)}
                              >
                                <span
                                  className={styles.bugReportScaleButtonValue}
                                  style={typographyStyles.p2Medium}
                                >
                                  {value}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <div className={styles.bugReportScaleLabels} style={typographyStyles.s}>
                          <span>Nice to have</span>
                          <span>Essential</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}

                {category === "other" ? (
                  <>
                    <Field
                      label={
                        <span className={styles.bugReportQuestionLabel} style={typographyStyles.h5}>
                          What would you like to share with us?<RequiredMark />
                        </span>
                      }
                    >
                      <textarea
                        className={[styles.bugReportTextarea, styles.bugReportTextareaLarge].join(
                          " ",
                        )}
                        rows={5}
                        value={otherShare}
                        onChange={(event) => setOtherShare(event.currentTarget.value)}
                      />
                    </Field>
                    <ScreenshotField
                      label="Anything to show us?"
                      screenshots={screenshots}
                      onAdd={() => fileInputRef.current?.click()}
                      onRemove={handleRemoveScreenshot}
                    />
                  </>
                ) : null}

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => void handleSubmit()}
                  disabled={isSubmitDisabled}
                  className={styles.bugReportSubmitButton}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              </>
            )}

            {submitError ? (
              <p className={styles.bugReportError} style={typographyStyles.p2}>
                {submitError}
              </p>
            ) : null}
          </div>
        }
        dismissLabel="Close"
        confirmLabel="Submit"
        onDismiss={handleClose}
        onConfirm={handleConfirm}
        dismissDisabled={submitting}
        showCloseButton
        size="wide"
        hideActions
      />
    </>
  );
}

function ScreenshotField({
  label,
  screenshots,
  onAdd,
  onRemove,
}: {
  label: string;
  screenshots: ScreenshotDraft[];
  onAdd: () => void;
  onRemove: (screenshotId: string) => void;
}) {
  return (
    <Field
      label={<span className={styles.bugReportQuestionLabel} style={typographyStyles.h5}>{label}</span>}
      hint={`Optional. Up to ${MAX_SCREENSHOT_COUNT} images.`}
    >
      <div className={styles.bugReportScreenshotSection}>
        <Button type="button" variant="secondary" size="md" onClick={onAdd}>
          <ButtonIcon icon="/icons/lucide/image.svg" className={styles.saveButtonIcon} />
          Add screenshots
        </Button>
        {screenshots.length > 0 ? (
          <div className={styles.bugReportScreenshotGrid}>
            {screenshots.map((screenshot) => (
              <div key={screenshot.id} className={styles.bugReportScreenshotCard}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={screenshot.file.name}
                  className={styles.bugReportScreenshotPreview}
                  src={screenshot.previewUrl}
                />
                <div className={styles.bugReportScreenshotMeta}>
                  <span
                    className={styles.bugReportScreenshotName}
                    style={typographyStyles.p2}
                    title={screenshot.file.name}
                  >
                    {screenshot.file.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghostV2"
                    size="sm"
                    iconOnly
                    aria-label={`Remove ${screenshot.file.name}`}
                    onClick={() => onRemove(screenshot.id)}
                  >
                    <ButtonIcon icon="/icons/lucide/x.svg" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Field>
  );
}

function buildAnswersPayload(input: {
  bugExpected: string;
  bugWrong: string;
  category: BugReportCategory;
  featureImportance: string;
  featureMissing: string;
  otherShare: string;
  screenshots: UploadedScreenshot[];
  uxConfusing: string;
  uxEasier: string;
}) {
  const responses =
    input.category === "bug"
      ? [
          {
            id: "expected_outcome",
            prompt: "What were you trying to do or expecting to happen?",
            value: input.bugExpected.trim(),
          },
          {
            id: "actual_issue",
            prompt: "What went wrong?",
            value: input.bugWrong.trim(),
          },
        ]
      : input.category === "ux"
        ? [
            {
              id: "confusing_experience",
              prompt: "What felt confusing or harder than expected?",
              value: input.uxConfusing.trim(),
            },
            {
              id: "easier_approach",
              prompt: "What would have made it easier?",
              value: input.uxEasier.trim(),
            },
          ]
        : input.category === "feature"
          ? [
              {
                id: "missing_capability",
                prompt: "What did you want to do but couldn’t?",
                value: input.featureMissing.trim(),
              },
              {
                id: "importance",
                prompt: "How important is this to you?",
                value: Number(input.featureImportance),
              },
            ]
          : [
              {
                id: "general_feedback",
                prompt: "What would you like to share with us?",
                value: input.otherShare.trim(),
              },
            ];

  return {
    category: {
      label:
        input.category === "bug"
          ? "Bug"
          : input.category === "ux"
            ? "Confusing UX"
            : input.category === "feature"
              ? "Missing feature"
              : "General suggestion",
      value: input.category,
    },
    responses,
    screenshots: input.screenshots,
  };
}

function revokeScreenshotPreviews(screenshots: ScreenshotDraft[]) {
  for (const screenshot of screenshots) {
    URL.revokeObjectURL(screenshot.previewUrl);
  }
}

async function uploadBugReportScreenshot(file: File): Promise<UploadedScreenshot> {
  const extension = getUploadFileExtension(file.name, file.type);
  const pathname = `editor-v2-bug-report-${Date.now()}-${crypto.randomUUID()}/screenshot.${extension}`;
  const uploaded = await upload(pathname, file, {
    access: "public",
    contentType: file.type || undefined,
    handleUploadUrl: "/api/editor-v2/bug-reports/upload",
  });

  return {
    fileName: file.name,
    mimeType: file.type || null,
    sizeBytes: file.size,
    url: uploaded.url,
  };
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
