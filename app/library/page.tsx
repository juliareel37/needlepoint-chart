import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { LibraryPageClient } from "./LibraryPageClient";

export default async function LibraryPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <LibraryPageClient deferInitialLoad />;
}
