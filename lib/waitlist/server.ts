import { prisma } from "@/lib/db";
import { randomBytes } from "node:crypto";

export interface WaitlistSubmissionInput {
  email: string;
  experienceLevel: string;
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

export function parseWaitlistSubmission(input: unknown): WaitlistSubmissionInput | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const record = input as Record<string, unknown>;

  const honeypot = typeof record.website === "string" ? record.website.trim() : "";
  if (honeypot.length > 0) {
    return null;
  }

  const email = typeof record.email === "string" ? normalizeEmail(record.email) : "";
  const experienceLevel =
    typeof record.experienceLevel === "string"
      ? normalizeText(record.experienceLevel)
      : "";
  const currentTools =
    typeof record.currentTools === "string" ? normalizeText(record.currentTools) : "";
  const freeformResponse =
    typeof record.freeformResponse === "string" ? record.freeformResponse.trim() : "";

  if (!EMAIL_PATTERN.test(email)) {
    return null;
  }

  if (!validateLength(experienceLevel, 120)) {
    return null;
  }

  if (!validateLength(currentTools, 300)) {
    return null;
  }

  if (!validateLength(freeformResponse, 4000)) {
    return null;
  }

  return {
    email,
    experienceLevel,
    currentTools,
    freeformResponse,
  };
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
      data: input,
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
