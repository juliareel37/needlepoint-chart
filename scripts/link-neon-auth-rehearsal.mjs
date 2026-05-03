import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const NEON_AUTH_PROVIDER = "neon_auth";

function printUsage() {
  console.log(`Usage:
  node scripts/link-neon-auth-rehearsal.mjs --config ./path/to/mapping.json [--apply]

Options:
  --config <path>  Path to a JSON file describing legacy -> Neon user links.
  --apply          Persist changes. Without this flag, the script runs in dry-run mode.

Mapping file format:
  [
    {
      "label": "Heavy test user",
      "legacyUserId": "user_39AQDIl4W7Nu99TMjuW3ZUWxwYU",
      "neonEmail": "dev1@example.com"
    },
    {
      "label": "UUID legacy user",
      "legacyUserId": "0f19f35e-444f-44bf-b550-b276c0908123",
      "neonUserId": "2d6ac6d6-...."
    }
  ]
`);
}

function parseArgs(argv) {
  const args = { apply: false, configPath: null };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--apply") {
      args.apply = true;
      continue;
    }

    if (arg === "--config") {
      args.configPath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!args.configPath) {
    throw new Error("Missing required --config argument.");
  }

  return args;
}

function normalizeEmail(email) {
  return typeof email === "string" && email.trim() ? email.trim().toLowerCase() : null;
}

async function loadMapping(configPath) {
  const absolutePath = path.resolve(configPath);
  const raw = await fs.readFile(absolutePath, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("Mapping file must contain a JSON array.");
  }

  return { absolutePath, entries: parsed };
}

async function findLegacyIdentity(entry) {
  const legacyUserId =
    typeof entry.legacyUserId === "string" && entry.legacyUserId.trim()
      ? entry.legacyUserId.trim()
      : null;

  if (!legacyUserId) {
    throw new Error("Each mapping entry requires legacyUserId.");
  }

  const identity = await prisma.authIdentity.findFirst({
    where: {
      provider: "legacy_editor_design_user_id",
      providerUserId: legacyUserId,
    },
    select: {
      appUserId: true,
      providerUserId: true,
    },
  });

  if (!identity) {
    throw new Error(`No legacy AuthIdentity found for ${legacyUserId}.`);
  }

  return identity;
}

async function findNeonUser(entry) {
  const neonUserId =
    typeof entry.neonUserId === "string" && entry.neonUserId.trim()
      ? entry.neonUserId.trim()
      : null;
  const neonEmail = normalizeEmail(entry.neonEmail);

  if (!neonUserId && !neonEmail) {
    throw new Error("Each mapping entry requires neonUserId or neonEmail.");
  }

  if (neonUserId) {
    const rows = await prisma.$queryRawUnsafe(
      `select id::text as id, email, name
       from neon_auth."user"
       where id::text = $1
       limit 1`,
      neonUserId,
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error(`No Neon Auth user found for id ${neonUserId}.`);
    }

    return rows[0];
  }

  const rows = await prisma.$queryRawUnsafe(
    `select id::text as id, email, name
     from neon_auth."user"
     where lower(email) = $1
     order by "createdAt" desc
     limit 2`,
    neonEmail,
  );

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`No Neon Auth user found for email ${neonEmail}.`);
  }

  if (rows.length > 1) {
    throw new Error(`Multiple Neon Auth users found for email ${neonEmail}. Use neonUserId instead.`);
  }

  return rows[0];
}

async function upsertNeonIdentity({ appUserId, neonUser }) {
  const existing = await prisma.authIdentity.findUnique({
    where: {
      provider_providerUserId: {
        provider: NEON_AUTH_PROVIDER,
        providerUserId: neonUser.id,
      },
    },
    select: {
      id: true,
      appUserId: true,
    },
  });

  if (existing) {
    if (existing.appUserId !== appUserId) {
      throw new Error(
        `Neon Auth user ${neonUser.id} is already linked to ${existing.appUserId}, not ${appUserId}.`,
      );
    }

    await prisma.authIdentity.update({
      where: { id: existing.id },
      data: {
        email: normalizeEmail(neonUser.email),
        displayName: typeof neonUser.name === "string" ? neonUser.name : null,
      },
    });

    return { mode: "updated", authIdentityId: existing.id };
  }

  const created = await prisma.authIdentity.create({
    data: {
      appUserId,
      provider: NEON_AUTH_PROVIDER,
      providerUserId: neonUser.id,
      email: normalizeEmail(neonUser.email),
      displayName: typeof neonUser.name === "string" ? neonUser.name : null,
    },
    select: { id: true },
  });

  return { mode: "created", authIdentityId: created.id };
}

async function main() {
  const { apply, configPath } = parseArgs(process.argv.slice(2));
  const { absolutePath, entries } = await loadMapping(configPath);

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        mappingFile: absolutePath,
        entries: entries.length,
      },
      null,
      2,
    ),
  );

  const results = [];
  for (const [index, entry] of entries.entries()) {
    const label =
      typeof entry.label === "string" && entry.label.trim() ? entry.label.trim() : `entry_${index + 1}`;
    const legacyIdentity = await findLegacyIdentity(entry);
    const neonUser = await findNeonUser(entry);

    const result = {
      label,
      legacyUserId: legacyIdentity.providerUserId,
      appUserId: legacyIdentity.appUserId,
      neonUserId: neonUser.id,
      neonEmail: normalizeEmail(neonUser.email),
      neonName: typeof neonUser.name === "string" ? neonUser.name : null,
      action: "would_link",
    };

    if (apply) {
      const writeResult = await upsertNeonIdentity({
        appUserId: legacyIdentity.appUserId,
        neonUser,
      });
      result.action = writeResult.mode;
      result.authIdentityId = writeResult.authIdentityId;
    }

    results.push(result);
  }

  console.log(JSON.stringify({ results }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
