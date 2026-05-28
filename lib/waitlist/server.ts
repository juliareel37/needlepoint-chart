import { prisma } from "@/lib/db";
import { isDisposableEmailDomain } from "@/lib/waitlist/disposableEmailDomains";
import { createHash, randomBytes } from "node:crypto";

export interface WaitlistSubmissionInput {
  email: string;
}

export interface WaitlistSurveySubmissionInput {
  email: string;
  experienceLevel: string;
  betaTestingInterest: boolean;
  currentTools: string;
  freeformResponse: string;
}

export interface WaitlistSubmissionResult {
  application: {
    id: string;
    email: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
  created: boolean;
  alreadySubmitted: boolean;
}

export interface WaitlistSubmissionAttemptSnapshot {
  email: string | null;
  normalizedEmail: string | null;
  experienceLevel: string | null;
  currentTools: string | null;
  freeformResponse: string | null;
}

export interface WaitlistSubmissionParseResult {
  submission: WaitlistSubmissionInput | null;
  snapshot: WaitlistSubmissionAttemptSnapshot;
  rejectionReason: string | null;
}

export interface WaitlistSurveySubmissionParseResult {
  submission: WaitlistSurveySubmissionInput | null;
  snapshot: WaitlistSubmissionAttemptSnapshot;
  rejectionReason: string | null;
}

export interface WaitlistSurveySubmissionResult {
  surveyResponse: {
    id: string;
    waitlistApplicationId: string;
    email: string;
    createdAt: Date;
  };
}

export interface WaitlistInviteValidationResult {
  isValid: boolean;
  email: string | null;
  error: string | null;
  token: string | null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WAITLIST_INVITE_TOKEN_BYTES = 24;
const WAITLIST_INVITE_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 14;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeToken(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function validateLength(value: string, maxLength: number) {
  return value.length > 0 && value.length <= maxLength;
}

function validateOptionalLength(value: string, maxLength: number) {
  return value.length <= maxLength;
}

function getEmailDomain(email: string) {
  return email.split("@").pop() ?? "";
}

function createEmptyWaitlistSubmissionSnapshot(): WaitlistSubmissionAttemptSnapshot {
  return {
    email: null,
    normalizedEmail: null,
    experienceLevel: null,
    currentTools: null,
    freeformResponse: null,
  };
}

function hashWaitlistAttemptIp(ip: string) {
  const salt = process.env.WAITLIST_ATTEMPT_IP_HASH_SALT ?? "wippa-waitlist-attempts";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

function parseWaitlistRecord(input: unknown) {
  if (!input || typeof input !== "object") {
    return null;
  }

  const record = input as Record<string, unknown>;
  const rawEmail = typeof record.email === "string" ? record.email.trim() : "";
  const email = normalizeEmail(rawEmail);
  const experienceLevel =
    typeof record.experienceLevel === "string"
      ? normalizeText(record.experienceLevel)
      : "";
  const currentTools =
    typeof record.currentTools === "string" ? normalizeText(record.currentTools) : "";
  const freeformResponse =
    typeof record.freeformResponse === "string" ? record.freeformResponse.trim() : "";
  const betaTestingInterest =
    typeof record.betaTestingInterest === "boolean" ? record.betaTestingInterest : null;
  const honeypot = typeof record.website === "string" ? record.website.trim() : "";

  return {
    email,
    rawEmail,
    experienceLevel,
    betaTestingInterest,
    currentTools,
    freeformResponse,
    honeypot,
    snapshot: {
      email: rawEmail || null,
      normalizedEmail: email || null,
      experienceLevel: experienceLevel || null,
      currentTools: currentTools || null,
      freeformResponse: freeformResponse || null,
    },
  };
}

function validateEmailForWaitlist(email: string) {
  if (!EMAIL_PATTERN.test(email)) {
    return "INVALID_EMAIL";
  }

  if (isDisposableEmailDomain(getEmailDomain(email))) {
    return "DISPOSABLE_EMAIL_DOMAIN";
  }

  return null;
}

export function parseWaitlistSubmissionWithReason(
  input: unknown,
): WaitlistSubmissionParseResult {
  const record = parseWaitlistRecord(input);
  if (!record) {
    return {
      submission: null,
      snapshot: createEmptyWaitlistSubmissionSnapshot(),
      rejectionReason: "INVALID_BODY",
    };
  }

  if (record.honeypot.length > 0) {
    return { submission: null, snapshot: record.snapshot, rejectionReason: "HONEYPOT_FILLED" };
  }

  const emailRejectionReason = validateEmailForWaitlist(record.email);
  if (emailRejectionReason) {
    return { submission: null, snapshot: record.snapshot, rejectionReason: emailRejectionReason };
  }

  return {
    submission: {
      email: record.email,
    },
    snapshot: record.snapshot,
    rejectionReason: null,
  };
}

export function parseWaitlistSurveySubmissionWithReason(
  input: unknown,
): WaitlistSurveySubmissionParseResult {
  const record = parseWaitlistRecord(input);
  if (!record) {
    return {
      submission: null,
      snapshot: createEmptyWaitlistSubmissionSnapshot(),
      rejectionReason: "INVALID_BODY",
    };
  }

  if (record.honeypot.length > 0) {
    return { submission: null, snapshot: record.snapshot, rejectionReason: "HONEYPOT_FILLED" };
  }

  const emailRejectionReason = validateEmailForWaitlist(record.email);
  if (emailRejectionReason) {
    return { submission: null, snapshot: record.snapshot, rejectionReason: emailRejectionReason };
  }

  if (!validateLength(record.experienceLevel, 120)) {
    return { submission: null, snapshot: record.snapshot, rejectionReason: "INVALID_EXPERIENCE_LEVEL" };
  }

  if (record.betaTestingInterest === null) {
    return { submission: null, snapshot: record.snapshot, rejectionReason: "INVALID_BETA_TESTING_INTEREST" };
  }

  if (!validateOptionalLength(record.currentTools, 300)) {
    return { submission: null, snapshot: record.snapshot, rejectionReason: "INVALID_CURRENT_TOOLS" };
  }

  if (!validateOptionalLength(record.freeformResponse, 4000)) {
    return { submission: null, snapshot: record.snapshot, rejectionReason: "INVALID_FREEFORM_RESPONSE" };
  }

  return {
    submission: {
      email: record.email,
      experienceLevel: record.experienceLevel,
      betaTestingInterest: record.betaTestingInterest,
      currentTools: record.currentTools,
      freeformResponse: record.freeformResponse,
    },
    snapshot: record.snapshot,
    rejectionReason: null,
  };
}

export function parseWaitlistSubmission(input: unknown): WaitlistSubmissionInput | null {
  return parseWaitlistSubmissionWithReason(input).submission;
}

export async function recordWaitlistSubmissionAttempt({
  snapshot,
  status,
  rejectionReason = null,
  ip,
  userAgent,
  waitlistApplicationId = null,
}: {
  snapshot: WaitlistSubmissionAttemptSnapshot;
  status: "APPROVED" | "REJECTED" | "DUPLICATE";
  rejectionReason?: string | null;
  ip: string;
  userAgent?: string | null;
  waitlistApplicationId?: string | null;
}) {
  return prisma.waitlistSubmissionAttempt.create({
    data: {
      status,
      rejectionReason,
      email: snapshot.email,
      normalizedEmail: snapshot.normalizedEmail,
      experienceLevel: snapshot.experienceLevel,
      currentTools: snapshot.currentTools,
      freeformResponse: snapshot.freeformResponse,
      ipAddressHash: ip ? hashWaitlistAttemptIp(ip) : null,
      userAgent: userAgent?.trim() || null,
      waitlistApplicationId,
    },
  });
}

export async function submitWaitlistApplication(
  input: WaitlistSubmissionInput,
): Promise<WaitlistSubmissionResult> {
  const existing = await prisma.waitlistApplication.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!existing) {
    const created = await prisma.waitlistApplication.create({
      data: {
        email: input.email,
      },
      select: {
        id: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      application: created,
      created: true,
      alreadySubmitted: false,
    };
  }

  return {
    application: existing,
    created: false,
    alreadySubmitted: true,
  };
}

export async function submitWaitlistSurveyResponse(
  input: WaitlistSurveySubmissionInput,
): Promise<WaitlistSurveySubmissionResult> {
  const application = await prisma.waitlistApplication.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (!application) {
    throw new Error(`No waitlist application found for ${input.email}.`);
  }

  const surveyResponse = await prisma.waitlistSurveyResponse.create({
    data: {
      waitlistApplicationId: application.id,
      email: input.email,
      experienceLevel: input.experienceLevel,
      betaTestingInterest: input.betaTestingInterest,
      currentTools: input.currentTools,
      freeformResponse: input.freeformResponse,
    },
    select: {
      id: true,
      waitlistApplicationId: true,
      email: true,
      createdAt: true,
    },
  });

  return { surveyResponse };
}

export function isWaitlistApplicationApproved(
  status: string,
) {
  return status === "APPROVED";
}

function createWaitlistInviteToken() {
  return randomBytes(WAITLIST_INVITE_TOKEN_BYTES).toString("hex");
}

export async function issueWaitlistInviteToken({
  email,
  approvedBy,
}: {
  email: string;
  approvedBy?: string | null;
}) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  const existing = await prisma.waitlistApplication.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (!existing) {
    throw new Error(`No waitlist application found for ${normalizedEmail}.`);
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + WAITLIST_INVITE_TOKEN_TTL_MS);
  const inviteToken = createWaitlistInviteToken();

  const updated = await prisma.waitlistApplication.update({
    where: { id: existing.id },
    data: {
      status: "APPROVED",
      approvedAt: now,
      approvedBy: approvedBy?.trim() || null,
      inviteToken,
      inviteTokenExpiresAt: expiresAt,
    },
    select: {
      id: true,
      email: true,
      approvedAt: true,
      inviteToken: true,
      inviteTokenExpiresAt: true,
      status: true,
    },
  });

  return updated;
}

export async function validateWaitlistInviteToken(
  token: string | null | undefined,
): Promise<WaitlistInviteValidationResult> {
  const normalizedToken = normalizeToken(token);
  if (!normalizedToken) {
    return {
      isValid: false,
      email: null,
      error: "This invite link is missing a token.",
      token: null,
    };
  }

  const invite = await prisma.waitlistApplication.findUnique({
    where: { inviteToken: normalizedToken },
    select: {
      email: true,
      status: true,
      inviteToken: true,
      inviteTokenExpiresAt: true,
      accountCreatedAt: true,
    },
  });

  if (!invite || !isWaitlistApplicationApproved(invite.status)) {
    return {
      isValid: false,
      email: null,
      error: "This invite link is invalid.",
      token: normalizedToken,
    };
  }

  if (invite.accountCreatedAt) {
    return {
      isValid: false,
      email: invite.email,
      error: "This invite link has already been used.",
      token: normalizedToken,
    };
  }

  if (!invite.inviteTokenExpiresAt || invite.inviteTokenExpiresAt.getTime() < Date.now()) {
    return {
      isValid: false,
      email: invite.email,
      error: "This invite link has expired.",
      token: normalizedToken,
    };
  }

  return {
    isValid: true,
    email: invite.email,
    error: null,
    token: normalizedToken,
  };
}

export async function consumeWaitlistInviteToken({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const validation = await validateWaitlistInviteToken(token);
  if (!validation.isValid || !validation.email) {
    throw new Error(validation.error ?? "This invite link is invalid.");
  }

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || normalizedEmail !== validation.email) {
    throw new Error("This invite link does not match the account email.");
  }

  return prisma.waitlistApplication.update({
    where: { inviteToken: validation.token! },
    data: {
      accountCreatedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      accountCreatedAt: true,
    },
  });
}
