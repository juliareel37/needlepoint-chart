import { createNeonAuth } from "@neondatabase/auth/next/server";
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

export interface AuthSession {
  userId: string | null;
}

export async function getAuthSession(): Promise<AuthSession> {
  const { data: session } = await auth.getSession();
  return { userId: session?.user?.id ?? null };
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
