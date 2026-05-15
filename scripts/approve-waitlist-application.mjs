import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();
const WAITLIST_INVITE_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 14;

function printUsage() {
  console.log(`Usage:
  node scripts/approve-waitlist-application.mjs --email you@example.com [--approved-by "Name"]

Options:
  --email <email>         Waitlist applicant email to approve.
  --approved-by <label>   Optional label stored with the approval.

Environment:
  APP_ORIGIN              Optional origin used to print a full sign-up URL.
`);
}

function parseArgs(argv) {
  const args = {
    email: null,
    approvedBy: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--email") {
      args.email = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg === "--approved-by") {
      args.approvedBy = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!args.email) {
    throw new Error("Missing required --email argument.");
  }

  return args;
}

function normalizeEmail(email) {
  return typeof email === "string" && email.trim() ? email.trim().toLowerCase() : null;
}

function createInviteToken() {
  return randomBytes(24).toString("hex");
}

async function main() {
  const { email, approvedBy } = parseArgs(process.argv.slice(2));
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new Error("A valid email is required.");
  }

  const existing = await prisma.waitlistApplication.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      status: true,
      accountCreatedAt: true,
    },
  });

  if (!existing) {
    throw new Error(`No waitlist application found for ${normalizedEmail}.`);
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + WAITLIST_INVITE_TOKEN_TTL_MS);
  const inviteToken = createInviteToken();
  const updated = await prisma.waitlistApplication.update({
    where: { id: existing.id },
    data: {
      status: "APPROVED",
      approvedAt: now,
      approvedBy: approvedBy?.trim() || null,
      inviteToken,
      inviteTokenExpiresAt: expiresAt,
    },
    select: {
      email: true,
      status: true,
      inviteToken: true,
      inviteTokenExpiresAt: true,
      accountCreatedAt: true,
    },
  });

  const appOrigin = process.env.APP_ORIGIN?.trim().replace(/\/$/, "") || "";
  const invitePath = `/sign-in/sign-up?token=${encodeURIComponent(updated.inviteToken)}&redirect_url=${encodeURIComponent("/library")}`;
  const inviteUrl = appOrigin ? `${appOrigin}${invitePath}` : invitePath;

  console.log(
    JSON.stringify(
      {
        email: updated.email,
        status: updated.status,
        inviteToken: updated.inviteToken,
        inviteTokenExpiresAt: updated.inviteTokenExpiresAt?.toISOString() ?? null,
        accountCreatedAt: updated.accountCreatedAt?.toISOString() ?? null,
        inviteUrl,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
