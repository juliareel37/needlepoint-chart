import { createNeonAuth } from "@neondatabase/auth/next/server";
import { prisma } from "@/lib/db";
import { getAccountSettingsContextFromProviderIds, type AccountSettingsContext } from "./account-settings";

const neonAuthBaseUrl = process.env.NEON_AUTH_BASE_URL;
const neonAuthCookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

if (!neonAuthBaseUrl) {
  throw new Error("Missing NEON_AUTH_BASE_URL");
}

if (!neonAuthCookieSecret) {
  throw new Error("Missing NEON_AUTH_COOKIE_SECRET");
}

export const auth = createNeonAuth({
  baseUrl: neonAuthBaseUrl,
  cookies: {
    secret: neonAuthCookieSecret,
  },
});

const NEON_AUTH_PROVIDER = "neon_auth";

export interface AuthSession {
  userId: string | null;
  authUserId: string | null;
  email: string | null;
  name: string | null;
}

interface AuthUserProfile {
  id: string;
  email: string | null;
  name: string | null;
}

function normalizeEmail(email: string | null) {
  return email?.trim().toLowerCase() || null;
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

async function createOrLinkAppUserForAuthUser(authUser: AuthUserProfile): Promise<string> {
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
    const existingIdentity = await prisma.authIdentity.findUnique({
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
    };
  }

  return {
    userId: await createOrLinkAppUserForAuthUser(authUser),
    authUserId: authUser.id,
    email: authUser.email,
    name: authUser.name,
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
