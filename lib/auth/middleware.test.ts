import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { authMiddleware } from "./middleware";

function createRequest(url: string, cookies: Record<string, string> = {}) {
  const headers = new Headers();
  const cookieHeader = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  return new NextRequest(url, { headers });
}

describe("authMiddleware", () => {
  it("redirects public sign-up without an invite token", () => {
    const response = authMiddleware(
      createRequest("http://localhost/sign-in/sign-up?redirect_url=%2Flibrary"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/?notice=invite-required",
    );
  });

  it("allows invite-based sign-up links through", () => {
    const response = authMiddleware(
      createRequest("http://localhost/sign-in/sign-up?token=invite_123"),
    );

    expect(response.status).toBe(200);
  });

  it("redirects unauthenticated protected pages to landing", () => {
    const response = authMiddleware(createRequest("http://localhost/editor"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/");
  });

  it("redirects unauthenticated account pages to sign-in", () => {
    const response = authMiddleware(createRequest("http://localhost/account/settings"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/sign-in?redirect_url=%2Faccount%2Fsettings",
    );
  });

  it("redirects unauthenticated admin pages to sign-in", () => {
    const response = authMiddleware(createRequest("http://localhost/admin/waitlist"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/sign-in?redirect_url=%2Fadmin%2Fwaitlist",
    );
  });

  it("returns 401 for unauthenticated protected editor APIs", async () => {
    const response = authMiddleware(createRequest("http://localhost/api/editor-v2/designs"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("allows protected routes through when a Neon session cookie is present", () => {
    const response = authMiddleware(
      createRequest("http://localhost/library", {
        "__Secure-neon-auth.session_token": "token_123",
      }),
    );

    expect(response.status).toBe(200);
  });
});
