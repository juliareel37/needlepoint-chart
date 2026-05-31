import { redirect } from "next/navigation";
import LandingPageClient from "@/app/LandingPageClient";
import { getAdminSessionAccess } from "@/lib/admin/server";

export const dynamic = "force-dynamic";

export default async function AdminLandingPage() {
  const { session, isAdmin } = await getAdminSessionAccess();

  if (!session.userId) {
    redirect("/sign-in?redirect_url=%2Fadmin%2Flanding");
  }

  if (!isAdmin) {
    redirect("/");
  }

  return <LandingPageClient allowAuthenticatedPreview />;
}
