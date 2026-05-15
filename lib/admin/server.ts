import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth/server";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getAdminEmails() {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .map(normalizeEmail),
    ),
  );
}

export async function getAdminSessionAccess() {
  const session = await getAuthSession();
  const normalizedEmail = session.email ? normalizeEmail(session.email) : null;
  const isAdmin = normalizedEmail ? getAdminEmails().includes(normalizedEmail) : false;

  return {
    session,
    isAdmin,
    email: normalizedEmail,
  };
}

export async function listWaitlistApplicationsForAdmin() {
  return prisma.waitlistApplication.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      email: true,
      status: true,
      experienceLevel: true,
      currentTools: true,
      freeformResponse: true,
      approvedAt: true,
      approvedBy: true,
      inviteToken: true,
      inviteTokenExpiresAt: true,
      accountCreatedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
