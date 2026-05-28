import { beforeEach, describe, expect, it, vi } from "vitest";

const { consumeWaitlistInviteTokenMock } = vi.hoisted(() => ({
  consumeWaitlistInviteTokenMock: vi.fn(),
}));

vi.mock("@/lib/waitlist/server", () => ({
  consumeWaitlistInviteToken: consumeWaitlistInviteTokenMock,
}));

import { POST } from "./route";

describe("POST /api/waitlist/invite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects missing token or email", async () => {
    const response = await POST(
      new Request("http://localhost/api/waitlist/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "abc" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(consumeWaitlistInviteTokenMock).not.toHaveBeenCalled();
  });

  it("redeems a valid invite", async () => {
    consumeWaitlistInviteTokenMock.mockResolvedValue({
      id: "wait_1",
      email: "maker@example.com",
      accountCreatedAt: new Date("2026-05-14T12:00:00.000Z"),
    });

    const response = await POST(
      new Request("http://localhost/api/waitlist/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "invite_token_123",
          email: "maker@example.com",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(consumeWaitlistInviteTokenMock).toHaveBeenCalledWith({
      token: "invite_token_123",
      email: "maker@example.com",
    });
    expect(body).toEqual({
      ok: true,
      application: {
        id: "wait_1",
        email: "maker@example.com",
        accountCreatedAt: "2026-05-14T12:00:00.000Z",
      },
    });
  });

  it("returns a conflict when the invite cannot be redeemed", async () => {
    consumeWaitlistInviteTokenMock.mockRejectedValue(
      new Error("This invite link has already been used."),
    );

    const response = await POST(
      new Request("http://localhost/api/waitlist/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "invite_token_123",
          email: "maker@example.com",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      error: "This invite link has already been used.",
    });
  });
});
