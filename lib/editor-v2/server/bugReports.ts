import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const MAX_FORM_ID_LENGTH = 120;
const MAX_FORM_VERSION_LENGTH = 60;
const MAX_SOURCE_LENGTH = 60;
const MAX_EDITOR_DESIGN_ID_LENGTH = 191;
const MAX_ANSWERS_BYTES = 64 * 1024;
const MAX_CONTEXT_BYTES = 24 * 1024;
const MAX_CLIENT_METADATA_BYTES = 12 * 1024;
const MAX_TOTAL_BYTES = 96 * 1024;

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type JsonRecord = { [key: string]: JsonValue };

export interface EditorBugReportSubmissionInput {
  source: string;
  formId: string;
  formVersion: string | null;
  editorDesignId: string | null;
  answers: JsonRecord | JsonValue[];
  context: JsonRecord | null;
  clientMetadata: JsonRecord | null;
}

export interface EditorBugReportSubmissionResult {
  report: {
    id: string;
    appUserId: string | null;
    editorDesignId: string | null;
    source: string;
    formId: string;
    formVersion: string | null;
    createdAt: Date;
  };
}

export type EditorBugReportParseFailureReason =
  | "INVALID_BODY"
  | "INVALID_SOURCE"
  | "INVALID_FORM_ID"
  | "INVALID_FORM_VERSION"
  | "INVALID_EDITOR_DESIGN_ID"
  | "INVALID_ANSWERS"
  | "INVALID_CONTEXT"
  | "INVALID_CLIENT_METADATA"
  | "ANSWERS_TOO_LARGE"
  | "CONTEXT_TOO_LARGE"
  | "CLIENT_METADATA_TOO_LARGE"
  | "SUBMISSION_TOO_LARGE";

export interface EditorBugReportParseResult {
  submission: EditorBugReportSubmissionInput | null;
  reason: EditorBugReportParseFailureReason | null;
}

function normalizeShortText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every((entry) => isJsonValue(entry));
  }

  if (!value || typeof value !== "object") {
    return false;
  }

  return Object.values(value as Record<string, unknown>).every((entry) =>
    isJsonValue(entry),
  );
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return (
    Boolean(value) &&
    !Array.isArray(value) &&
    typeof value === "object" &&
    isJsonValue(value)
  );
}

function getSerializedByteLength(value: JsonValue) {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

export function parseEditorBugReportSubmission(
  input: unknown,
  options: { defaultSource?: string } = {},
): EditorBugReportParseResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { submission: null, reason: "INVALID_BODY" };
  }

  const record = input as Record<string, unknown>;
  const source = normalizeShortText(record.source) || options.defaultSource?.trim() || "";
  const formId = normalizeShortText(record.formId);
  const rawFormVersion = normalizeShortText(record.formVersion);
  const rawEditorDesignId = normalizeShortText(record.editorDesignId);
  const answers = record.answers;
  const context = record.context;
  const clientMetadata = record.clientMetadata;
  const parsedAnswers =
    Array.isArray(answers) && isJsonValue(answers)
      ? answers
      : isJsonRecord(answers)
        ? answers
        : null;
  const parsedContext =
    context && isJsonRecord(context) ? context : context === null || typeof context === "undefined" ? null : null;
  const parsedClientMetadata =
    clientMetadata && isJsonRecord(clientMetadata)
      ? clientMetadata
      : clientMetadata === null || typeof clientMetadata === "undefined"
        ? null
        : null;

  if (source.length === 0 || source.length > MAX_SOURCE_LENGTH) {
    return { submission: null, reason: "INVALID_SOURCE" };
  }

  if (formId.length === 0 || formId.length > MAX_FORM_ID_LENGTH) {
    return { submission: null, reason: "INVALID_FORM_ID" };
  }

  if (rawFormVersion.length > MAX_FORM_VERSION_LENGTH) {
    return { submission: null, reason: "INVALID_FORM_VERSION" };
  }

  if (rawEditorDesignId.length > MAX_EDITOR_DESIGN_ID_LENGTH) {
    return { submission: null, reason: "INVALID_EDITOR_DESIGN_ID" };
  }

  if (!parsedAnswers) {
    return { submission: null, reason: "INVALID_ANSWERS" };
  }

  if (typeof context !== "undefined" && context !== null && !isJsonRecord(context)) {
    return { submission: null, reason: "INVALID_CONTEXT" };
  }

  if (
    typeof clientMetadata !== "undefined" &&
    clientMetadata !== null &&
    !isJsonRecord(clientMetadata)
  ) {
    return { submission: null, reason: "INVALID_CLIENT_METADATA" };
  }

  const answersBytes = getSerializedByteLength(parsedAnswers);
  if (answersBytes > MAX_ANSWERS_BYTES) {
    return { submission: null, reason: "ANSWERS_TOO_LARGE" };
  }

  const contextBytes = parsedContext ? getSerializedByteLength(parsedContext) : 0;
  if (contextBytes > MAX_CONTEXT_BYTES) {
    return { submission: null, reason: "CONTEXT_TOO_LARGE" };
  }

  const clientMetadataBytes = parsedClientMetadata
    ? getSerializedByteLength(parsedClientMetadata)
    : 0;
  if (clientMetadataBytes > MAX_CLIENT_METADATA_BYTES) {
    return { submission: null, reason: "CLIENT_METADATA_TOO_LARGE" };
  }

  if (answersBytes + contextBytes + clientMetadataBytes > MAX_TOTAL_BYTES) {
    return { submission: null, reason: "SUBMISSION_TOO_LARGE" };
  }

  return {
    submission: {
      source,
      formId,
      formVersion: rawFormVersion.length > 0 ? rawFormVersion : null,
      editorDesignId: rawEditorDesignId.length > 0 ? rawEditorDesignId : null,
      answers: parsedAnswers,
      context: parsedContext,
      clientMetadata: parsedClientMetadata,
    },
    reason: null,
  };
}

export async function submitEditorBugReport({
  submission,
  appUserId,
}: {
  submission: EditorBugReportSubmissionInput;
  appUserId?: string | null;
}): Promise<EditorBugReportSubmissionResult> {
  if (submission.editorDesignId) {
    if (!appUserId) {
      throw new Error("EDITOR_DESIGN_AUTH_REQUIRED");
    }

    const design = await prisma.editorDesign.findFirst({
      where: {
        id: submission.editorDesignId,
        appUserId,
      },
      select: {
        id: true,
      },
    });

    if (!design) {
      throw new Error("EDITOR_DESIGN_NOT_FOUND");
    }
  }

  const created = await prisma.editorBugReport.create({
    data: {
      appUserId: appUserId ?? null,
      editorDesignId: submission.editorDesignId,
      source: submission.source,
      formId: submission.formId,
      formVersion: submission.formVersion,
      answers: submission.answers as Prisma.InputJsonValue,
      context: submission.context
        ? (submission.context as Prisma.InputJsonValue)
        : Prisma.DbNull,
      clientMetadata: submission.clientMetadata
        ? (submission.clientMetadata as Prisma.InputJsonValue)
        : Prisma.DbNull,
    },
    select: {
      id: true,
      appUserId: true,
      editorDesignId: true,
      source: true,
      formId: true,
      formVersion: true,
      createdAt: true,
    },
  });

  return {
    report: created,
  };
}

export function isEditorBugReportRateLimitDisabled() {
  return process.env.EDITOR_BUG_REPORT_RATE_LIMIT_DISABLED === "true";
}
