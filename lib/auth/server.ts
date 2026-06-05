import { AppThemePreference } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/neon";
import { getAccountSettingsContextFromProviderIds, type AccountSettingsContext } from "./account-settings";
import type { ThemeMode } from "@/lib/theme/themePreference";

export { auth } from "@/lib/auth/neon";

const NEON_AUTH_PROVIDER = "neon_auth";

export interface AuthSession {
  userId: string | null;
  authUserId: string | null;
  email: string | null;
  name: string | null;
  themePreference: ThemeMode | null;
  accessState: "signed_out" | "approved" | "pending_approval";
}

interface AuthUserProfile {
  id: string;
  email: string | null;
  name: string | null;
}

function normalizeEmail(email: string | null) {
  return email?.trim().toLowerCase() || null;
}

function fromPrismaThemePreference(
  themePreference: AppThemePreference | null,
): ThemeMode | null {
  switch (themePreference) {
    case AppThemePreference.DARK:
      return "dark";
    case AppThemePreference.SYSTEM:
      return "system";
    case AppThemePreference.LIGHT:
      return "light";
    default:
      return null;
  }
}

function toPrismaThemePreference(themePreference: ThemeMode): AppThemePreference {
  switch (themePreference) {
    case "dark":
      return AppThemePreference.DARK;
    case "system":
      return AppThemePreference.SYSTEM;
    case "light":
    default:
      return AppThemePreference.LIGHT;
  }
}

async function getCurrentAuthUser(): Promise<AuthUserProfile | null> {
  const { data: session } = await auth.getSession();
  const user = session?.user;

  if (!user?.id) {
    return null;
  }

  return {
    id: user.id,
    email: typeof user.email === "string" ? user.email : null,
    name: typeof user.name === "string" ? user.name : null,
  };
}

async function findExistingAppUserIdForAuthUser(
  authUser: AuthUserProfile,
): Promise<string | null> {
  const existingIdentity = await prisma.authIdentity.findUnique({
    where: {
      provider_providerUserId: {
        provider: NEON_AUTH_PROVIDER,
        providerUserId: authUser.id,
      },
    },
    select: { appUserId: true },
  });

  return existingIdentity?.appUserId ?? null;
}

async function canProvisionAppUserForAuthUser(
  authUser: AuthUserProfile,
): Promise<boolean> {
  const normalizedEmail = normalizeEmail(authUser.email);
  if (!normalizedEmail) {
    return false;
  }

  const waitlistApplication = await prisma.waitlistApplication.findUnique({
    where: { email: normalizedEmail },
    select: {
      status: true,
      accountCreatedAt: true,
    },
  });

  return (
    waitlistApplication?.status === "APPROVED" &&
    waitlistApplication.accountCreatedAt !== null
  );
}

async function createOrLinkAppUserForApprovedAuthUser(
  authUser: AuthUserProfile,
): Promise<string | null> {
  const existingAppUserId = await findExistingAppUserIdForAuthUser(authUser);
  if (existingAppUserId) {
    return existingAppUserId;
  }

  const canProvision = await canProvisionAppUserForAuthUser(authUser);
  if (!canProvision) {
    return null;
  }

  const normalizedEmail = normalizeEmail(authUser.email);
  const emailMatches = normalizedEmail
    ? await prisma.authIdentity.findMany({
        where: { email: normalizedEmail },
        select: { appUserId: true },
        distinct: ["appUserId"],
      })
    : [];

  const matchedAppUserId = emailMatches.length === 1 ? emailMatches[0]?.appUserId ?? null : null;

  try {
    return await prisma.$transaction(async (tx) => {
      const existingIdentity = await tx.authIdentity.findUnique({
        where: {
          provider_providerUserId: {
            provider: NEON_AUTH_PROVIDER,
            providerUserId: authUser.id,
          },
        },
        select: { appUserId: true },
      });

      if (existingIdentity) {
        return existingIdentity.appUserId;
      }

      const appUserId =
        matchedAppUserId ??
        (await tx.appUser.create({
          data: {},
          select: { id: true },
        })).id;

      await tx.authIdentity.create({
        data: {
          appUserId,
          provider: NEON_AUTH_PROVIDER,
          providerUserId: authUser.id,
          email: normalizedEmail,
          displayName: authUser.name,
        },
      });

      return appUserId;
    });
  } catch (error) {
    const existingIdentity = await findExistingAppUserIdForAuthUser(authUser);

    if (existingIdentity) {
      return existingIdentity;
    }

    throw error;
  }
}

export async function getAuthSession(): Promise<AuthSession> {
  const authUser = await getCurrentAuthUser();
  if (!authUser) {
    return {
      userId: null,
      authUserId: null,
      email: null,
      name: null,
      themePreference: null,
      accessState: "signed_out",
    };
  }

  const userId = await createOrLinkAppUserForApprovedAuthUser(authUser);
  if (!userId) {
    return {
      userId: null,
      authUserId: authUser.id,
      email: authUser.email,
      name: authUser.name,
      themePreference: null,
      accessState: "pending_approval",
    };
  }

  const appUser = await prisma.appUser.findUnique({
    where: { id: userId },
    select: { themePreference: true },
  });

  return {
    userId,
    authUserId: authUser.id,
    email: authUser.email,
    name: authUser.name,
    themePreference: fromPrismaThemePreference(appUser?.themePreference ?? null),
    accessState: "approved",
  };
}

export async function getCurrentUserId(): Promise<string | null> {
  return (await getAuthSession()).userId;
}

export async function getAccountSettingsContext(): Promise<AccountSettingsContext | null> {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return null;
  }

  const { data: accounts } = await auth.listAccounts();
  const providerIds = accounts?.map((account) => account.providerId) ?? [];
  return getAccountSettingsContextFromProviderIds(providerIds);
}

export async function getCurrentUserThemePreference(): Promise<ThemeMode | null> {
  return (await getAuthSession()).themePreference;
}

export async function updateCurrentUserThemePreference(
  themePreference: ThemeMode,
): Promise<ThemeMode | null> {
  const authUser = await getCurrentAuthUser();

  if (!authUser) {
    return null;
  }

  const appUserId = await createOrLinkAppUserForApprovedAuthUser(authUser);
  if (!appUserId) {
    return null;
  }

  const updated = await prisma.appUser.update({
    where: { id: appUserId },
    data: {
      themePreference: toPrismaThemePreference(themePreference),
    },
    select: {
      themePreference: true,
    },
  });

  return fromPrismaThemePreference(updated.themePreference);
}
