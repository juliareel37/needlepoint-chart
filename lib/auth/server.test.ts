import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getSessionMock,
  listAccountsMock,
  authIdentityFindUniqueMock,
  authIdentityFindManyMock,
  authIdentityCreateMock,
  appUserCreateMock,
  appUserFindUniqueMock,
  appUserUpdateMock,
  waitlistFindUniqueMock,
  transactionMock,
} = vi.hoisted(() => ({
  env: (() => {
    process.env.NEON_AUTH_BASE_URL = "https://auth.example.com";
    process.env.NEON_AUTH_COOKIE_SECRET = "test-secret";
    return true;
  })(),
  getSessionMock: vi.fn(),
  listAccountsMock: vi.fn(),
  authIdentityFindUniqueMock: vi.fn(),
  authIdentityFindManyMock: vi.fn(),
  authIdentityCreateMock: vi.fn(),
  appUserCreateMock: vi.fn(),
  appUserFindUniqueMock: vi.fn(),
  appUserUpdateMock: vi.fn(),
  waitlistFindUniqueMock: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock("@neondatabase/auth/next/server", () => ({
  createNeonAuth: () => ({
    getSession: getSessionMock,
    listAccounts: listAccountsMock,
  }),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: transactionMock,
    authIdentity: {
      findUnique: authIdentityFindUniqueMock,
      findMany: authIdentityFindManyMock,
      create: authIdentityCreateMock,
    },
    appUser: {
      findUnique: appUserFindUniqueMock,
      create: appUserCreateMock,
      update: appUserUpdateMock,
    },
    waitlistApplication: {
      findUnique: waitlistFindUniqueMock,
    },
  },
}));

import {
  getAuthSession,
  updateCurrentUserThemePreference,
} from "./server";

describe("lib/auth/server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ data: null });
    listAccountsMock.mockResolvedValue({ data: [] });
    authIdentityFindUniqueMock.mockResolvedValue(null);
    authIdentityFindManyMock.mockResolvedValue([]);
    authIdentityCreateMock.mockResolvedValue({ id: "auth_1" });
    appUserCreateMock.mockResolvedValue({ id: "app_1" });
    appUserFindUniqueMock.mockResolvedValue({ themePreference: null });
    appUserUpdateMock.mockResolvedValue({ themePreference: "DARK" });
    waitlistFindUniqueMock.mockResolvedValue(null);
    transactionMock.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        authIdentity: {
          findUnique: authIdentityFindUniqueMock,
          create: authIdentityCreateMock,
        },
        appUser: {
          create: appUserCreateMock,
        },
      }),
    );
  });

  it("returns a signed-out access state without a session", async () => {
    const session = await getAuthSession();

    expect(session).toEqual({
      userId: null,
      authUserId: null,
      email: null,
      name: null,
      themePreference: null,
      accessState: "signed_out",
    });
  });

  it("keeps unapproved signed-in users out of app provisioning", async () => {
    getSessionMock.mockResolvedValue({
      data: {
        user: {
          id: "neon_user_1",
          email: "maker@example.com",
          name: "Maker",
        },
      },
    });
    waitlistFindUniqueMock.mockResolvedValue({
      status: "PENDING",
      accountCreatedAt: null,
    });

    const session = await getAuthSession();

    expect(session).toEqual({
      userId: null,
      authUserId: "neon_user_1",
      email: "maker@example.com",
      name: "Maker",
      themePreference: null,
      accessState: "pending_approval",
    });
    expect(appUserCreateMock).not.toHaveBeenCalled();
    expect(authIdentityCreateMock).not.toHaveBeenCalled();
  });

  it("provisions an app user for approved invite-based accounts", async () => {
    getSessionMock.mockResolvedValue({
      data: {
        user: {
          id: "neon_user_1",
          email: "maker@example.com",
          name: "Maker",
        },
      },
    });
    waitlistFindUniqueMock.mockResolvedValue({
      status: "APPROVED",
      accountCreatedAt: new Date("2026-05-14T12:00:00.000Z"),
    });

    const session = await getAuthSession();

    expect(authIdentityFindManyMock).toHaveBeenCalledWith({
      where: { email: "maker@example.com" },
      select: { appUserId: true },
      distinct: ["appUserId"],
    });
    expect(appUserCreateMock).toHaveBeenCalled();
    expect(authIdentityCreateMock).toHaveBeenCalledWith({
      data: {
        appUserId: "app_1",
        provider: "neon_auth",
        providerUserId: "neon_user_1",
        email: "maker@example.com",
        displayName: "Maker",
      },
    });
    expect(session).toEqual({
      userId: "app_1",
      authUserId: "neon_user_1",
      email: "maker@example.com",
      name: "Maker",
      themePreference: null,
      accessState: "approved",
    });
  });

  it("still allows already-linked users without a waitlist record", async () => {
    getSessionMock.mockResolvedValue({
      data: {
        user: {
          id: "neon_existing_1",
          email: "legacy@example.com",
          name: "Legacy User",
        },
      },
    });
    authIdentityFindUniqueMock.mockResolvedValue({ appUserId: "app_existing" });
    appUserFindUniqueMock.mockResolvedValue({ themePreference: "LIGHT" });

    const session = await getAuthSession();

    expect(waitlistFindUniqueMock).not.toHaveBeenCalled();
    expect(session.userId).toBe("app_existing");
    expect(session.accessState).toBe("approved");
    expect(appUserCreateMock).not.toHaveBeenCalled();
  });

  it("refuses theme updates for unapproved sessions", async () => {
    getSessionMock.mockResolvedValue({
      data: {
        user: {
          id: "neon_user_1",
          email: "maker@example.com",
          name: "Maker",
        },
      },
    });
    waitlistFindUniqueMock.mockResolvedValue({
      status: "PENDING",
      accountCreatedAt: null,
    });

    const result = await updateCurrentUserThemePreference("dark");

    expect(result).toBeNull();
    expect(appUserUpdateMock).not.toHaveBeenCalled();
  });
});
