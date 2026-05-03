import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/server";
import { LibraryPageClient } from "./LibraryPageClient";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const appUserId = await getCurrentUserId();

  if (!appUserId) {
    redirect("/sign-in");
  }

  return <LibraryPageClient deferInitialLoad />;
}
