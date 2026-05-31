import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findUniqueMock,
  createMock,
  updateMock,
  attemptCreateMock,
  checkRateLimitMock,
  getClientIpFromRequestMock,
  validateEmailMxRecordsMock,
  sendWaitlistSignupConfirmationEmailMock,
} = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  createMock: vi.fn(),
  updateMock: vi.fn(),
  attemptCreateMock: vi.fn(),
  checkRateLimitMock: vi.fn(),
  getClientIpFromRequestMock: vi.fn(),
  validateEmailMxRecordsMock: vi.fn(),
  sendWaitlistSignupConfirmationEmailMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    waitlistApplication: {
      findUnique: findUniqueMock,
      create: createMock,
      update: updateMock,
    },
    waitlistSubmissionAttempt: {
      create: attemptCreateMock,
    },
  },
}));

vi.mock("@/lib/rate-limit/server", () => ({
  checkRateLimit: checkRateLimitMock,
  getClientIpFromRequest: getClientIpFromRequestMock,
}));

vi.mock("@/lib/waitlist/emailDns", () => ({
  validateEmailMxRecords: validateEmailMxRecordsMock,
}));

vi.mock("@/lib/email/transactional", () => ({
  sendWaitlistSignupConfirmationEmail: sendWaitlistSignupConfirmationEmailMock,
}));

import { POST } from "./route";

describe("POST /api/waitlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.WAITLIST_RATE_LIMIT_DISABLED;
    getClientIpFromRequestMock.mockReturnValue("203.0.113.10");
    checkRateLimitMock.mockResolvedValue({
      limited: false,
      limit: 5,
      remaining: 4,
      resetAt: new Date("2026-05-13T13:00:00.000Z"),
    });
    validateEmailMxRecordsMock.mockResolvedValue(true);
    attemptCreateMock.mockResolvedValue({ id: "attempt_1" });
    sendWaitlistSignupConfirmationEmailMock.mockResolvedValue({ messageId: "message_1" });
  });

  it("rejects invalid submissions", async () => {
    const response = await POST(
      new Request("http://localhost/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "not-an-email",
          experienceLevel: "",
          currentTools: "",
          freeformResponse: "",
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(sendWaitlistSignupConfirmationEmailMock).not.toHaveBeenCalled();
    expect(attemptCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        normalizedEmail: "not-an-email",
        rejectionReason: "INVALID_EMAIL",
        status: "REJECTED",
      }),
    });
  });

  it("rejects submissions with a filled honeypot field", async () => {
    const response = await POST(
      new Request("http://localhost/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "maker@example.com",
          experienceLevel: "Yes, regularly",
          currentTools: "Illustrator and graph paper",
          freeformResponse: "I want to design original canvases more quickly.",
          website: "https://spam.example",
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(sendWaitlistSignupConfirmationEmailMock).not.toHaveBeenCalled();
    expect(attemptCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        normalizedEmail: "maker@example.com",
        rejectionReason: "HONEYPOT_FILLED",
        status: "REJECTED",
      }),
    });
  });

  it("rejects submissions from disposable email domains", async () => {
    const response = await POST(
      new Request("http://localhost/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "maker@mailinator.com",
          experienceLevel: "Yes, regularly",
          currentTools: "Illustrator and graph paper",
          freeformResponse: "I want to design original canvases more quickly.",
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(sendWaitlistSignupConfirmationEmailMock).not.toHaveBeenCalled();
    expect(attemptCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        normalizedEmail: "maker@mailinator.com",
        rejectionReason: "DISPOSABLE_EMAIL_DOMAIN",
        status: "REJECTED",
      }),
    });
  });

  it("rejects submissions from disposable email subdomains", async () => {
    const response = await POST(
      new Request("http://localhost/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "maker@inbox.mailinator.com",
          experienceLevel: "Yes, regularly",
          currentTools: "Illustrator and graph paper",
          freeformResponse: "I want to design original canvases more quickly.",
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(sendWaitlistSignupConfirmationEmailMock).not.toHaveBeenCalled();
  });

  it("rejects submissions after an IP rate limit is reached", async () => {
    checkRateLimitMock.mockResolvedValueOnce({
      limited: true,
      limit: 5,
      remaining: 0,
      resetAt: new Date("2026-05-13T13:00:00.000Z"),
    });
    checkRateLimitMock.mockResolvedValueOnce({
      limited: false,
      limit: 20,
      remaining: 19,
      resetAt: new Date("2026-05-14T12:00:00.000Z"),
    });

    const response = await POST(
      new Request("http://localhost/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "maker@example.com",
          experienceLevel: "Yes, regularly",
          currentTools: "Illustrator and graph paper",
          freeformResponse: "I want to design original canvases more quickly.",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body).toEqual({
      error: "Too many waitlist submissions. Please try again later.",
    });
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(sendWaitlistSignupConfirmationEmailMock).not.toHaveBeenCalled();
    expect(attemptCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        normalizedEmail: "maker@example.com",
        rejectionReason: "RATE_LIMITED_HOURLY_IP",
        status: "REJECTED",
      }),
    });
  });

  it("skips IP rate limits when WAITLIST_RATE_LIMIT_DISABLED is true", async () => {
    process.env.WAITLIST_RATE_LIMIT_DISABLED = "true";
    findUniqueMock.mockResolvedValue(null);
    createMock.mockResolvedValue({
      id: "wait_1",
      email: "maker@example.com",
      status: "PENDING",
      createdAt: new Date("2026-05-13T12:00:00.000Z"),
      updatedAt: new Date("2026-05-13T12:00:00.000Z"),
    });

    const response = await POST(
      new Request("http://localhost/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "maker@example.com",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(checkRateLimitMock).not.toHaveBeenCalled();
  });

  it("rejects submissions when the email domain has no MX records", async () => {
    validateEmailMxRecordsMock.mockResolvedValue(false);

    const response = await POST(
      new Request("http://localhost/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "maker@invalid.example",
          experienceLevel: "Yes, regularly",
          currentTools: "Illustrator and graph paper",
          freeformResponse: "I want to design original canvases more quickly.",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Please use an email address with a valid mail domain.",
    });
    expect(validateEmailMxRecordsMock).toHaveBeenCalledWith("maker@invalid.example");
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(sendWaitlistSignupConfirmationEmailMock).not.toHaveBeenCalled();
    expect(attemptCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        normalizedEmail: "maker@invalid.example",
        rejectionReason: "INVALID_EMAIL_MX",
        status: "REJECTED",
      }),
    });
  });

  it("creates a new waitlist application", async () => {
    findUniqueMock.mockResolvedValue(null);
    createMock.mockResolvedValue({
      id: "wait_1",
      email: "maker@example.com",
      status: "PENDING",
      createdAt: new Date("2026-05-13T12:00:00.000Z"),
      updatedAt: new Date("2026-05-13T12:00:00.000Z"),
    });

    const response = await POST(
      new Request("http://localhost/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: " Maker@Example.com ",
          experienceLevel: "Yes, regularly",
          currentTools: "Illustrator and graph paper",
          freeformResponse: "I want to design original canvases more quickly.",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { email: "maker@example.com" },
      select: {
        id: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(createMock).toHaveBeenCalledWith({
      data: {
        email: "maker@example.com",
      },
      select: {
        id: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(attemptCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        normalizedEmail: "maker@example.com",
        rejectionReason: null,
        status: "APPROVED",
        waitlistApplicationId: "wait_1",
      }),
    });
    expect(sendWaitlistSignupConfirmationEmailMock).toHaveBeenCalledWith("maker@example.com");
    expect(body).toEqual({
      ok: true,
      created: true,
      alreadySubmitted: false,
      application: {
        id: "wait_1",
        email: "maker@example.com",
        status: "PENDING",
      },
    });
  });

  it("returns an already-submitted response for repeat email submissions", async () => {
    findUniqueMock.mockResolvedValue({
      id: "wait_1",
      email: "maker@example.com",
      status: "PENDING",
      createdAt: new Date("2026-05-13T12:00:00.000Z"),
      updatedAt: new Date("2026-05-13T12:00:00.000Z"),
    });

    const response = await POST(
      new Request("http://localhost/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "maker@example.com",
          experienceLevel: "Sometimes",
          currentTools: "Photoshop",
          freeformResponse: "I want a cleaner pattern design workflow.",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateMock).not.toHaveBeenCalled();
    expect(sendWaitlistSignupConfirmationEmailMock).not.toHaveBeenCalled();
    expect(attemptCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        normalizedEmail: "maker@example.com",
        rejectionReason: "DUPLICATE_EMAIL",
        status: "DUPLICATE",
        waitlistApplicationId: "wait_1",
      }),
    });
    expect(body).toEqual({
      ok: true,
      created: false,
      alreadySubmitted: true,
      application: {
        id: "wait_1",
        email: "maker@example.com",
        status: "PENDING",
      },
    });
  });

  it("keeps the waitlist signup successful if the confirmation email fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    findUniqueMock.mockResolvedValue(null);
    createMock.mockResolvedValue({
      id: "wait_1",
      email: "maker@example.com",
      status: "PENDING",
      createdAt: new Date("2026-05-13T12:00:00.000Z"),
      updatedAt: new Date("2026-05-13T12:00:00.000Z"),
    });
    sendWaitlistSignupConfirmationEmailMock.mockRejectedValue(new Error("Brevo unavailable"));

    const response = await POST(
      new Request("http://localhost/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "maker@example.com",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({
      ok: true,
      created: true,
      alreadySubmitted: false,
      application: {
        id: "wait_1",
        email: "maker@example.com",
        status: "PENDING",
      },
    });
    expect(sendWaitlistSignupConfirmationEmailMock).toHaveBeenCalledWith("maker@example.com");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to send waitlist signup confirmation email",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });
});
