import { sendBrevoTransactionalTemplateEmail } from "@/lib/email/brevo";

const WAITLIST_SIGNUP_CONFIRMATION_TEMPLATE_ID = 5;
const DEFAULT_WAITLIST_APPROVAL_TEMPLATE_ID = 6;

function getWaitlistApprovalTemplateId() {
  const raw = process.env.BREVO_WAITLIST_APPROVAL_TEMPLATE_ID?.trim();
  const parsed = raw ? Number(raw) : DEFAULT_WAITLIST_APPROVAL_TEMPLATE_ID;

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("BREVO_WAITLIST_APPROVAL_TEMPLATE_ID must be a positive integer.");
  }

  return parsed;
}

export async function sendWaitlistSignupConfirmationEmail(email: string) {
  return sendBrevoTransactionalTemplateEmail({
    to: { email },
    templateId: WAITLIST_SIGNUP_CONFIRMATION_TEMPLATE_ID,
  });
}

export async function sendWaitlistApprovalEmail({
  email,
  inviteUrl,
  inviteTokenExpiresAt,
}: {
  email: string;
  inviteUrl: string;
  inviteTokenExpiresAt: Date | null;
}) {
  return sendBrevoTransactionalTemplateEmail({
    to: { email },
    templateId: getWaitlistApprovalTemplateId(),
    params: {
      inviteUrl,
      inviteTokenExpiresAt: inviteTokenExpiresAt?.toISOString() ?? null,
    },
  });
}
