import { NextResponse } from "next/server";
import { getAdminSessionAccess } from "@/lib/admin/server";
import { sendWaitlistApprovalEmail } from "@/lib/email/transactional";
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
    const inviteUrl = invite.inviteToken ? buildInviteUrl(invite.inviteToken) : null;
    let approvalEmail:
      | { sent: true; messageId: string | null }
      | { sent: false; error: string }
      | null = null;

    if (inviteUrl) {
      const emailLogMetadata = {
        waitlistApplicationEmailDomain: invite.email.split("@").pop() ?? null,
        inviteTokenExpiresAt: invite.inviteTokenExpiresAt?.toISOString() ?? null,
      };

      try {
        console.info("Sending waitlist approval email", emailLogMetadata);
        const emailResult = await sendWaitlistApprovalEmail({
          email: invite.email,
          inviteUrl,
          inviteTokenExpiresAt: invite.inviteTokenExpiresAt,
        });
        approvalEmail = {
          sent: true,
          messageId: emailResult?.messageId ?? null,
        };
        console.info("Sent waitlist approval email", {
          ...emailLogMetadata,
          brevoMessageId: emailResult?.messageId ?? null,
        });
      } catch (emailError) {
        const errorMessage =
          emailError instanceof Error ? emailError.message : "Unable to send approval email.";
        approvalEmail = {
          sent: false,
          error: errorMessage,
        };
        console.error("Failed to send waitlist approval email", emailError);
        console.error("Waitlist approval email failure context", emailLogMetadata);
      }
    }

    return NextResponse.json({
      ok: true,
      approvalEmail,
      application: {
        email: invite.email,
        status: invite.status,
        approvedAt: invite.approvedAt?.toISOString() ?? null,
        inviteToken: invite.inviteToken,
        inviteTokenExpiresAt: invite.inviteTokenExpiresAt?.toISOString() ?? null,
        inviteUrl,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to approve user." },
      { status: 400 },
    );
  }
}
