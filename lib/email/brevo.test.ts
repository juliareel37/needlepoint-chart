import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendBrevoTransactionalTemplateEmail } from "@/lib/email/brevo";

describe("sendBrevoTransactionalTemplateEmail", () => {
  beforeEach(() => {
    process.env.BREVO_API_KEY = "brevo-api-key";
    process.env.BREVO_SENDER_EMAIL = "hello@example.com";
    process.env.BREVO_SENDER_NAME = "Wippa";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.BREVO_API_KEY;
    delete process.env.BREVO_SENDER_EMAIL;
    delete process.env.BREVO_SENDER_NAME;
  });

  it("sends a transactional template email through Brevo", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ messageId: "message_1" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendBrevoTransactionalTemplateEmail({
      to: { email: "maker@example.com" },
      templateId: 5,
    });

    expect(result).toEqual({ messageId: "message_1" });
    expect(fetchMock).toHaveBeenCalledWith("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": "brevo-api-key",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          email: "hello@example.com",
          name: "Wippa",
        },
        to: [
          {
            email: "maker@example.com",
          },
        ],
        templateId: 5,
      }),
    });
  });

  it("includes transactional template params when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ messageId: "message_2" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await sendBrevoTransactionalTemplateEmail({
      to: { email: "maker@example.com" },
      templateId: 6,
      params: {
        inviteUrl: "https://wippa.example/sign-in/sign-up?token=invite_123",
        inviteTokenExpiresAt: "2026-06-19T12:00:00.000Z",
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.brevo.com/v3/smtp/email",
      expect.objectContaining({
        body: JSON.stringify({
          sender: {
            email: "hello@example.com",
            name: "Wippa",
          },
          to: [
            {
              email: "maker@example.com",
            },
          ],
          templateId: 6,
          params: {
            inviteUrl: "https://wippa.example/sign-in/sign-up?token=invite_123",
            inviteTokenExpiresAt: "2026-06-19T12:00:00.000Z",
          },
        }),
      }),
    );
  });

  it("throws when Brevo rejects the request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: vi.fn().mockResolvedValue("{\"message\":\"invalid api key\"}"),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      sendBrevoTransactionalTemplateEmail({
        to: { email: "maker@example.com" },
        templateId: 5,
      }),
    ).rejects.toThrow("Brevo transactional email failed with 401");
  });
});
