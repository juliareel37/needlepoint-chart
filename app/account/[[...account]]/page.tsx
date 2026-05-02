import { AuthAccountPageContent } from "@/components/auth/AuthAccountPageContent";

const DEFAULT_ACCOUNT_PATHNAME = "settings";
const VALID_ACCOUNT_PATHNAMES = new Set([
  "api-keys",
  "organizations",
  "security",
  "settings",
  "teams",
]);

function normalizeAccountPathname(value: string[] | undefined): string {
  const pathname = value?.[0] ?? DEFAULT_ACCOUNT_PATHNAME;
  return VALID_ACCOUNT_PATHNAMES.has(pathname) ? pathname : DEFAULT_ACCOUNT_PATHNAME;
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{
    account?: string[];
  }>;
}) {
  const routeParams = await params;
  const pathname = normalizeAccountPathname(routeParams.account);

  return <AuthAccountPageContent pathname={pathname} />;
}
