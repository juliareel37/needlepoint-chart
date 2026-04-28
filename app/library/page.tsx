import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { loadLibraryDesignPage } from "@/lib/library/designs";
import { LibraryPageClient } from "./LibraryPageClient";

export default async function LibraryPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const initialPage = await loadLibraryDesignPage({ userId });

  return (
    <LibraryPageClient
      initialDesigns={initialPage.designs}
      initialHasMore={initialPage.hasMore}
      initialNextOffset={initialPage.nextOffset}
    />
  );
}
