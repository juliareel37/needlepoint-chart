import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateManyMock } = vi.hoisted(() => ({
  updateManyMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    appUser: {
      updateMany: updateManyMock,
    },
  },
}));

import { POST } from "./route";

describe("POST /api/unsubscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateManyMock.mockResolvedValue({ count: 1 });
  });

  it("rejects invalid email addresses", async () => {
    const response = await POST(
      new Request("http://localhost/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Please enter a valid email address." });
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it("unsubscribes matching app profiles by normalized email", async () => {
    const response = await POST(
      new Request("http://localhost/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: " Maker@Example.com " }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(updateManyMock).toHaveBeenCalledWith({
      where: {
        identities: {
          some: { email: "maker@example.com" },
        },
      },
      data: {
        subscribedToPromotions: false,
        promotionsUnsubscribedAt: expect.any(Date),
      },
    });
  });

  it("does not reveal whether an email matched a profile", async () => {
    updateManyMock.mockResolvedValue({ count: 0 });

    const response = await POST(
      new Request("http://localhost/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "unknown@example.com" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
