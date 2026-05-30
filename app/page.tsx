import { redirect } from "next/navigation";
import LandingPageClient from "./LandingPageClient";
import { getAuthSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getAuthSession();

  if (session.userId) {
    redirect("/library");
  }

  return <LandingPageClient />;
}
