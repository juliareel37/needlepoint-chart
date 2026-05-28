import { NextResponse } from "next/server";
import { consumeWaitlistInviteToken } from "@/lib/waitlist/server";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { token?: unknown; email?: unknown }
    | null;
  const token = typeof body?.token === "string" ? body.token : null;
  const email = typeof body?.email === "string" ? body.email : null;

  if (!token || !email) {
    return NextResponse.json(
      { error: "Invite token and email are required." },
      { status: 400 },
    );
  }

  try {
    const consumed = await consumeWaitlistInviteToken({ token, email });
    return NextResponse.json({
      ok: true,
      application: {
        id: consumed.id,
        email: consumed.email,
        accountCreatedAt: consumed.accountCreatedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to redeem invite.",
      },
      { status: 409 },
    );
  }
}
