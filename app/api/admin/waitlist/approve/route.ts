import { NextResponse } from "next/server";
import { getAdminSessionAccess } from "@/lib/admin/server";
import { issueWaitlistInviteToken } from "@/lib/waitlist/server";

function buildInviteUrl(token: string) {
  const appOrigin = process.env.APP_ORIGIN?.trim().replace(/\/$/, "") ?? "";
  const invitePath = `/sign-in/sign-up?token=${encodeURIComponent(token)}&redirect_url=${encodeURIComponent("/library")}`;
  return appOrigin ? `${appOrigin}${invitePath}` : invitePath;
}

export async function POST(req: Request) {
  const { isAdmin, email: adminEmail } = await getAdminSessionAccess();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  try {
    const invite = await issueWaitlistInviteToken({
      email,
      approvedBy: adminEmail,
    });

    return NextResponse.json({
      ok: true,
      application: {
        email: invite.email,
        status: invite.status,
        approvedAt: invite.approvedAt?.toISOString() ?? null,
        inviteToken: invite.inviteToken,
        inviteTokenExpiresAt: invite.inviteTokenExpiresAt?.toISOString() ?? null,
        inviteUrl: invite.inviteToken ? buildInviteUrl(invite.inviteToken) : null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to approve user." },
      { status: 400 },
    );
  }
}
