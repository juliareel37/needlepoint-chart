import { AuthSignInPageContent } from "@/components/auth/AuthSignInPageContent";

const DEFAULT_REDIRECT_URL = "/";

function normalizeRedirectUrl(value: string | string[] | undefined): string {
  if (typeof value !== "string" || value.length === 0) {
    return DEFAULT_REDIRECT_URL;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_REDIRECT_URL;
  }

  return value;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    redirect_url?: string | string[];
  }>;
}) {
  const { redirect_url: redirectUrlParam } = await searchParams;
  const redirectUrl = normalizeRedirectUrl(redirectUrlParam);

  return <AuthSignInPageContent redirectUrl={redirectUrl} />;
}
