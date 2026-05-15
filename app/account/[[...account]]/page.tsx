import { redirect } from "next/navigation";
import { AuthAccountPageContent } from "@/components/auth/AuthAccountPageContent";
import { getAuthSession } from "@/lib/auth/server";

const DEFAULT_ACCOUNT_PATHNAME = "settings";
const VALID_ACCOUNT_PATHNAMES = new Set([
  "api-keys",
  "organizations",
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
  const session = await getAuthSession();
  const routeParams = await params;
  const requestedPathname = routeParams.account?.[0];

  if (!session.userId) {
    redirect(
      session.accessState === "pending_approval"
        ? "/?notice=pending-approval"
        : "/sign-in",
    );
  }

  if (requestedPathname === "security") {
    redirect("/account/settings");
  }

  const pathname = normalizeAccountPathname(routeParams.account);

  return <AuthAccountPageContent pathname={pathname} />;
}
