import { redirect } from "next/navigation";
import { EditorV2Page } from "@/components/editor-v2/app/EditorV2Page";
import { getAuthSession } from "@/lib/auth/server";

export default async function Page() {
  const session = await getAuthSession();

  if (!session.userId) {
    redirect(
      session.accessState === "pending_approval"
        ? "/?notice=pending-approval"
        : "/",
    );
  }

  return <EditorV2Page routeMode="entry" routeStorageId={null} />;
}
