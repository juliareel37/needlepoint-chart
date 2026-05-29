import { redirect } from "next/navigation";
import { EditorV2DesignSystemPage } from "@/app/editor-v2/design-system/EditorV2DesignSystemPage";
import { getAdminSessionAccess } from "@/lib/admin/server";

export const dynamic = "force-dynamic";

export default async function AdminDesignSystemPage() {
  const { session, isAdmin } = await getAdminSessionAccess();

  if (!session.userId) {
    redirect("/sign-in?redirect_url=%2Fadmin%2Fdesign-system");
  }

  if (!isAdmin) {
    redirect("/");
  }

  return <EditorV2DesignSystemPage />;
}
