import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const { authMiddlewareMock, neonMiddlewareMock } = vi.hoisted(() => ({
  authMiddlewareMock: vi.fn(),
  neonMiddlewareMock: vi.fn(),
}));

vi.mock("@/lib/auth/middleware", () => ({
  authMiddleware: authMiddlewareMock,
}));

vi.mock("@/lib/auth/neon", () => ({
  auth: {
    middleware: () => neonMiddlewareMock,
  },
}));

import proxy from "./proxy";

function createRequest(url: string) {
  return new NextRequest(url);
}

describe("proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMiddlewareMock.mockReturnValue(NextResponse.next());
    neonMiddlewareMock.mockResolvedValue(NextResponse.redirect("http://localhost/sign-in/sign-up"));
  });

  it("delegates OAuth verifier callbacks to Neon Auth middleware", async () => {
    const response = await proxy(
      createRequest(
        "http://localhost/sign-in/sign-up?token=invite_123&neon_auth_session_verifier=verifier_123",
      ),
    );

    expect(neonMiddlewareMock).toHaveBeenCalledOnce();
    expect(authMiddlewareMock).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
  });

  it("uses the app auth middleware for normal requests", async () => {
    const response = await proxy(createRequest("http://localhost/sign-in/sign-up?token=invite_123"));

    expect(authMiddlewareMock).toHaveBeenCalledOnce();
    expect(neonMiddlewareMock).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
  });
});
