import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAuthSession();

  return NextResponse.json(
    {
      accessState: session.accessState,
      hasAppAccess: Boolean(session.userId),
      email: session.email,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
