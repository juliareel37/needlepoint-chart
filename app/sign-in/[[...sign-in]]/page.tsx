import { AuthSignInPageContent } from "@/components/auth/AuthSignInPageContent";
import { validateWaitlistInviteToken } from "@/lib/waitlist/server";

const DEFAULT_REDIRECT_URL = "/library";
const DEFAULT_AUTH_PATHNAME = "sign-in";
const VALID_AUTH_PATHNAMES = new Set([
  "accept-invitation",
  "callback",
  "email-otp",
  "forgot-password",
  "magic-link",
  "recover-account",
  "reset-password",
  "sign-in",
  "sign-out",
  "sign-up",
  "two-factor",
]);

function normalizeRedirectUrl(value: string | string[] | undefined): string {
  if (typeof value !== "string" || value.length === 0) {
    return DEFAULT_REDIRECT_URL;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_REDIRECT_URL;
  }

  if (value === "/") {
    return DEFAULT_REDIRECT_URL;
  }

  return value;
}

function normalizeAuthPathname(value: string[] | undefined): string {
  const pathname = value?.[0] ?? DEFAULT_AUTH_PATHNAME;
  return VALID_AUTH_PATHNAMES.has(pathname) ? pathname : DEFAULT_AUTH_PATHNAME;
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{
    "sign-in"?: string[];
  }>;
  searchParams: Promise<{
    redirect_url?: string | string[];
    token?: string | string[];
  }>;
}) {
  const routeParams = await params;
  const { redirect_url: redirectUrlParam, token: tokenParam } = await searchParams;
  const pathname = normalizeAuthPathname(routeParams["sign-in"]);
  const redirectUrl = normalizeRedirectUrl(redirectUrlParam);
  const token = typeof tokenParam === "string" ? tokenParam : undefined;
  const signUpInvite =
    pathname === "sign-up"
      ? await validateWaitlistInviteToken(token)
      : null;

  return (
    <AuthSignInPageContent
      pathname={pathname}
      redirectUrl={redirectUrl}
      signUpInvite={signUpInvite}
    />
  );
}
