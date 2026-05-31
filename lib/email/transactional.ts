import { sendBrevoTransactionalTemplateEmail } from "@/lib/email/brevo";

const WAITLIST_SIGNUP_CONFIRMATION_TEMPLATE_ID = 5;

export async function sendWaitlistSignupConfirmationEmail(email: string) {
  return sendBrevoTransactionalTemplateEmail({
    to: { email },
    templateId: WAITLIST_SIGNUP_CONFIRMATION_TEMPLATE_ID,
  });
}
