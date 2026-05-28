import { redirect } from "next/navigation";
import { getAdminSessionAccess } from "@/lib/admin/server";
import { GraphicsAdminPageClient } from "./GraphicsAdminPageClient";

export const dynamic = "force-dynamic";

export default async function GraphicsAdminPage() {
  const { session, isAdmin } = await getAdminSessionAccess();

  if (!session.userId) {
    redirect("/sign-in?redirect_url=%2Fadmin%2Fgraphics");
  }

  if (!isAdmin) {
    redirect("/");
  }

  return <GraphicsAdminPageClient currentAdminEmail={session.email} />;
}
