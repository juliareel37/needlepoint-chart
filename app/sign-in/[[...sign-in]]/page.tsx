import { AuthSignInPageContent } from "@/components/auth/AuthSignInPageContent";

const DEFAULT_REDIRECT_URL = "/";
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
  }>;
}) {
  const routeParams = await params;
  const { redirect_url: redirectUrlParam } = await searchParams;
  const pathname = normalizeAuthPathname(routeParams["sign-in"]);
  const redirectUrl = normalizeRedirectUrl(redirectUrlParam);

  return <AuthSignInPageContent pathname={pathname} redirectUrl={redirectUrl} />;
}
