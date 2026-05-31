import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : null;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: unknown } | null;
  const email = normalizeEmail(body?.email);

  if (!email) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  await prisma.appUser.updateMany({
    where: {
      identities: {
        some: { email },
      },
    },
    data: {
      subscribedToPromotions: false,
      promotionsUnsubscribedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
