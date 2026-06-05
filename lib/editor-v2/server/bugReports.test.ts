import { describe, expect, it } from "vitest";
import { parseEditorBugReportSubmission } from "./bugReports";

describe("parseEditorBugReportSubmission", () => {
  it("accepts structured JSON answers with optional context", () => {
    const parsed = parseEditorBugReportSubmission(
      {
        formId: "quick-bug-report",
        formVersion: "2026-06-02",
        answers: {
          fields: [
            {
              id: "summary",
              value: "Brush stops painting after undo.",
            },
          ],
        },
        context: {
          panel: "colors",
          activeTool: "paint",
        },
        clientMetadata: {
          viewport: {
            width: 1440,
            height: 900,
          },
        },
      },
      { defaultSource: "editor_v2" },
    );

    expect(parsed.reason).toBeNull();
    expect(parsed.submission).toEqual({
      source: "editor_v2",
      formId: "quick-bug-report",
      formVersion: "2026-06-02",
      editorDesignId: null,
      answers: {
        fields: [
          {
            id: "summary",
            value: "Brush stops painting after undo.",
          },
        ],
      },
      context: {
        panel: "colors",
        activeTool: "paint",
      },
      clientMetadata: {
        viewport: {
          width: 1440,
          height: 900,
        },
      },
    });
  });

  it("rejects primitive answer payloads", () => {
    const parsed = parseEditorBugReportSubmission(
      {
        formId: "quick-bug-report",
        answers: "broken",
      },
      { defaultSource: "editor_v2" },
    );

    expect(parsed).toEqual({
      submission: null,
      reason: "INVALID_ANSWERS",
    });
  });

  it("rejects oversized answer payloads", () => {
    const parsed = parseEditorBugReportSubmission(
      {
        formId: "quick-bug-report",
        answers: {
          notes: "x".repeat(70 * 1024),
        },
      },
      { defaultSource: "editor_v2" },
    );

    expect(parsed).toEqual({
      submission: null,
      reason: "ANSWERS_TOO_LARGE",
    });
  });

  it("fills in the source from the editor endpoint when omitted", () => {
    const parsed = parseEditorBugReportSubmission(
      {
        formId: "quick-bug-report",
        answers: {
          summary: "Selection handles disappear after zooming.",
        },
      },
      { defaultSource: "editor_v2" },
    );

    expect(parsed.reason).toBeNull();
    expect(parsed.submission?.source).toBe("editor_v2");
  });
});
