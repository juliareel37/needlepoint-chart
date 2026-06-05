import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  getAdminSessionAccessMock,
  issueWaitlistInviteTokenMock,
  sendWaitlistApprovalEmailMock,
} = vi.hoisted(() => ({
  getAdminSessionAccessMock: vi.fn(),
  issueWaitlistInviteTokenMock: vi.fn(),
  sendWaitlistApprovalEmailMock: vi.fn(),
}));

vi.mock("@/lib/admin/server", () => ({
  getAdminSessionAccess: getAdminSessionAccessMock,
}));

vi.mock("@/lib/waitlist/server", () => ({
  issueWaitlistInviteToken: issueWaitlistInviteTokenMock,
}));

vi.mock("@/lib/email/transactional", () => ({
  sendWaitlistApprovalEmail: sendWaitlistApprovalEmailMock,
}));

import { POST } from "./route";

describe("POST /api/admin/waitlist/approve", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.APP_ORIGIN = "https://wippa.example";
    getAdminSessionAccessMock.mockResolvedValue({
      isAdmin: true,
      email: "admin@example.com",
    });
    issueWaitlistInviteTokenMock.mockResolvedValue({
      email: "maker@example.com",
      status: "APPROVED",
      approvedAt: new Date("2026-06-05T12:00:00.000Z"),
      inviteToken: "invite_123",
      inviteTokenExpiresAt: new Date("2026-06-19T12:00:00.000Z"),
    });
    sendWaitlistApprovalEmailMock.mockResolvedValue({ messageId: "message_1" });
  });

  afterEach(() => {
    delete process.env.APP_ORIGIN;
  });

  it("approves a waitlist application and sends the invite email", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/waitlist/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: " Maker@Example.com " }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(issueWaitlistInviteTokenMock).toHaveBeenCalledWith({
      email: "maker@example.com",
      approvedBy: "admin@example.com",
    });
    expect(sendWaitlistApprovalEmailMock).toHaveBeenCalledWith({
      email: "maker@example.com",
      inviteUrl:
        "https://wippa.example/sign-in/sign-up?token=invite_123&redirect_url=%2Flibrary",
      inviteTokenExpiresAt: new Date("2026-06-19T12:00:00.000Z"),
    });
    expect(body.approvalEmail).toEqual({
      sent: true,
      messageId: "message_1",
    });
    expect(body.application.inviteUrl).toBe(
      "https://wippa.example/sign-in/sign-up?token=invite_123&redirect_url=%2Flibrary",
    );
  });

  it("keeps approval successful when the invite email fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    sendWaitlistApprovalEmailMock.mockRejectedValue(new Error("Brevo unavailable"));

    const response = await POST(
      new Request("http://localhost/api/admin/waitlist/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "maker@example.com" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.approvalEmail).toEqual({
      sent: false,
      error: "Brevo unavailable",
    });

    consoleErrorSpy.mockRestore();
  });

  it("rejects non-admin requests", async () => {
    getAdminSessionAccessMock.mockResolvedValue({
      isAdmin: false,
      email: "maker@example.com",
    });

    const response = await POST(
      new Request("http://localhost/api/admin/waitlist/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "maker@example.com" }),
      }),
    );

    expect(response.status).toBe(403);
    expect(sendWaitlistApprovalEmailMock).not.toHaveBeenCalled();
  });
});
