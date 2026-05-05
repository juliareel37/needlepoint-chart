import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/server";
import { LibraryPageClient } from "./LibraryPageClient";

export const dynamic = "force-dynamic";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const appUserId = await getCurrentUserId();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  if (!appUserId) {
    redirect("/sign-in");
  }

  const requestedView = resolvedSearchParams?.view;
  const initialViewMode = requestedView === "deleted" ? "deleted" : "active";
  const initialNotice =
    resolvedSearchParams?.notice === "deleted-design"
      ? "This design is in Trash. Restore it to open it again."
      : null;

  return (
    <LibraryPageClient
      deferInitialLoad
      initialViewMode={initialViewMode}
      initialNotice={initialNotice}
    />
  );
}
