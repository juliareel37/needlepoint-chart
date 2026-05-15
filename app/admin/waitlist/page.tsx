import { redirect } from "next/navigation";
import { getAdminEmails, getAdminSessionAccess, listWaitlistApplicationsForAdmin } from "@/lib/admin/server";
import { WaitlistAdminPageClient } from "./WaitlistAdminPageClient";

export const dynamic = "force-dynamic";

function buildInviteUrl(token: string | null) {
  if (!token) {
    return null;
  }

  const appOrigin = process.env.APP_ORIGIN?.trim().replace(/\/$/, "") ?? "";
  const invitePath = `/sign-in/sign-up?token=${encodeURIComponent(token)}&redirect_url=${encodeURIComponent("/library")}`;
  return appOrigin ? `${appOrigin}${invitePath}` : invitePath;
}

export default async function WaitlistAdminPage() {
  const { session, isAdmin } = await getAdminSessionAccess();

  if (!session.userId) {
    redirect("/sign-in?redirect_url=%2Fadmin%2Fwaitlist");
  }

  if (!isAdmin) {
    redirect("/");
  }

  const applications = await listWaitlistApplicationsForAdmin();

  return (
    <WaitlistAdminPageClient
      applications={applications.map((application) => ({
        ...application,
        inviteUrl: buildInviteUrl(application.inviteToken),
        approvedAt: application.approvedAt?.toISOString() ?? null,
        inviteTokenExpiresAt: application.inviteTokenExpiresAt?.toISOString() ?? null,
        accountCreatedAt: application.accountCreatedAt?.toISOString() ?? null,
        createdAt: application.createdAt.toISOString(),
        updatedAt: application.updatedAt.toISOString(),
      }))}
      adminEmails={getAdminEmails()}
      currentAdminEmail={session.email}
    />
  );
}
