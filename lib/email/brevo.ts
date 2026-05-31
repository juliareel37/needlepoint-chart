const BREVO_TRANSACTIONAL_EMAIL_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export interface BrevoTransactionalTemplateEmailInput {
  to: {
    email: string;
    name?: string | null;
  };
  templateId: number;
}

interface BrevoTransactionalEmailResponse {
  messageId?: string;
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required to send Brevo transactional email.`);
  }

  return value;
}

function createBrevoSender() {
  const name = process.env.BREVO_SENDER_NAME?.trim();

  return {
    email: getRequiredEnv("BREVO_SENDER_EMAIL"),
    ...(name ? { name } : {}),
  };
}

export async function sendBrevoTransactionalTemplateEmail({
  to,
  templateId,
}: BrevoTransactionalTemplateEmailInput): Promise<BrevoTransactionalEmailResponse | null> {
  const toName = to.name?.trim();
  const response = await fetch(BREVO_TRANSACTIONAL_EMAIL_ENDPOINT, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": getRequiredEnv("BREVO_API_KEY"),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: createBrevoSender(),
      to: [
        {
          email: to.email,
          ...(toName ? { name: toName } : {}),
        },
      ],
      templateId,
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text().catch(() => "");
    const details = responseBody ? `: ${responseBody.slice(0, 500)}` : "";
    throw new Error(`Brevo transactional email failed with ${response.status}${details}`);
  }

  return (await response.json().catch(() => null)) as BrevoTransactionalEmailResponse | null;
}
