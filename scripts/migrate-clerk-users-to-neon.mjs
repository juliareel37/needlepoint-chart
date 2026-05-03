import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { createAuthClient } from "@neondatabase/auth";

const prisma = new PrismaClient();

const LEGACY_DESIGN_PROVIDER = "legacy_editor_design_user_id";
const LEGACY_CLERK_PROVIDER = "legacy_clerk_user_id";
const NEON_AUTH_PROVIDER = "neon_auth";
const authBaseUrl = process.env.NEON_AUTH_BASE_URL;

function printUsage() {
  console.log(`Usage:
  node scripts/migrate-clerk-users-to-neon.mjs --csv ./path/to/clerk-export.csv [options]

Options:
  --csv <path>              Path to Clerk CSV export.
  --apply                   Persist DB links. Without this flag, the script is dry-run only.
  --create-missing-users    Create Neon users for emails not already present in neon_auth."user".
  --default-password <pw>   Password to use when creating missing Neon users.
  --password-map <path>     JSON file mapping legacyUserId or email to a plain-text password.

Examples:
  node scripts/migrate-clerk-users-to-neon.mjs --csv ./scripts/clerk_export_dev.csv
  node scripts/migrate-clerk-users-to-neon.mjs --csv ./scripts/clerk_export_dev.csv --apply
  node scripts/migrate-clerk-users-to-neon.mjs --csv ./scripts/clerk_export_dev.csv --apply --create-missing-users --password-map ./scripts/neon-passwords.json

Notes:
  - This script is built for the current Better Auth-based Neon Auth architecture.
  - It links users by primary email and legacy Clerk ID.
  - It does not import bcrypt password hashes, because the current Neon Auth SDK/admin surface in this repo exposes plain-password user creation, not hashed-password import.
`);
}

function parseArgs(argv) {
  const args = {
    apply: false,
    createMissingUsers: false,
    csvPath: null,
    defaultPassword: null,
    passwordMapPath: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--apply") {
      args.apply = true;
      continue;
    }

    if (arg === "--create-missing-users") {
      args.createMissingUsers = true;
      continue;
    }

    if (arg === "--csv") {
      args.csvPath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg === "--default-password") {
      args.defaultPassword = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg === "--password-map") {
      args.passwordMapPath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!args.csvPath) {
    throw new Error("Missing required --csv argument.");
  }

  if (args.createMissingUsers && !authBaseUrl) {
    throw new Error("NEON_AUTH_BASE_URL is required when using --create-missing-users.");
  }

  return args;
}

function normalizeEmail(email) {
  return typeof email === "string" && email.trim() ? email.trim().toLowerCase() : null;
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const nextChar = line[index + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseCsv(content) {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

async function loadCsv(csvPath) {
  const absolutePath = path.resolve(csvPath);
  const content = await fs.readFile(absolutePath, "utf8");
  return {
    absolutePath,
    rows: parseCsv(content),
  };
}

async function loadPasswordMap(passwordMapPath) {
  if (!passwordMapPath) {
    return {};
  }

  const absolutePath = path.resolve(passwordMapPath);
  const raw = await fs.readFile(absolutePath, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Password map must be a JSON object keyed by legacy user id or email.");
  }

  return parsed;
}

function buildDisplayName(record) {
  const first = typeof record.first_name === "string" ? record.first_name.trim() : "";
  const last = typeof record.last_name === "string" ? record.last_name.trim() : "";
  const combined = [first, last].filter(Boolean).join(" ").trim();

  if (combined) {
    return combined;
  }

  if (typeof record.username === "string" && record.username.trim()) {
    return record.username.trim();
  }

  return null;
}

function getPasswordForRecord({ legacyUserId, email, passwordMap, defaultPassword }) {
  const byLegacyId =
    typeof passwordMap[legacyUserId] === "string" && passwordMap[legacyUserId].trim()
      ? passwordMap[legacyUserId].trim()
      : null;
  if (byLegacyId) {
    return byLegacyId;
  }

  const byEmail =
    email && typeof passwordMap[email] === "string" && passwordMap[email].trim()
      ? passwordMap[email].trim()
      : null;
  if (byEmail) {
    return byEmail;
  }

  return defaultPassword?.trim() || null;
}

async function findAuthIdentityByLegacyId(legacyUserId) {
  return prisma.authIdentity.findFirst({
    where: {
      providerUserId: legacyUserId,
      provider: {
        in: [LEGACY_CLERK_PROVIDER, LEGACY_DESIGN_PROVIDER],
      },
    },
    select: {
      id: true,
      appUserId: true,
      provider: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

async function ensureLegacyClerkIdentity({ legacyUserId, email, displayName, apply }) {
  const existing = await findAuthIdentityByLegacyId(legacyUserId);

  if (existing) {
    const hasClerkIdentity =
      existing.provider === LEGACY_CLERK_PROVIDER
        ? true
        : Boolean(
            await prisma.authIdentity.findFirst({
              where: {
                provider: LEGACY_CLERK_PROVIDER,
                providerUserId: legacyUserId,
              },
              select: { id: true },
            }),
          );

    if (apply && !hasClerkIdentity) {
      await prisma.authIdentity.create({
        data: {
          appUserId: existing.appUserId,
          provider: LEGACY_CLERK_PROVIDER,
          providerUserId: legacyUserId,
          email,
          displayName,
        },
      });
    }

    return {
      appUserId: existing.appUserId,
      action: hasClerkIdentity ? "existing_app_user" : "added_legacy_clerk_identity",
    };
  }

  if (!apply) {
    return {
      appUserId: null,
      action: "would_create_app_user",
    };
  }

  const created = await prisma.$transaction(async (tx) => {
    const appUser = await tx.appUser.create({
      data: {},
      select: { id: true },
    });

    await tx.authIdentity.create({
      data: {
        appUserId: appUser.id,
        provider: LEGACY_CLERK_PROVIDER,
        providerUserId: legacyUserId,
        email,
        displayName,
      },
    });

    return appUser;
  });

  return {
    appUserId: created.id,
    action: "created_app_user",
  };
}

async function findNeonUserByEmail(email) {
  if (!email) {
    return null;
  }

  const rows = await prisma.$queryRawUnsafe(
    `select id::text as id, email, name
     from neon_auth."user"
     where lower(email) = $1
     order by "createdAt" desc
     limit 2`,
    email,
  );

  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  if (rows.length > 1) {
    throw new Error(`Multiple Neon Auth users already exist for email ${email}.`);
  }

  return rows[0];
}

async function createMissingNeonUser({ email, displayName, password }) {
  const authClient = createAuthClient(authBaseUrl);
  const result = await authClient.signUp.email({
    email,
    password,
    name: displayName ?? email,
  });

  if (result.error) {
    throw new Error(`Failed to create Neon user for ${email}: ${result.error.message}`);
  }

  return findNeonUserByEmail(email);
}

async function ensureNeonAuthIdentity({ appUserId, neonUser, email, displayName, apply }) {
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

  if (!apply) {
    if (!existing) {
      return { action: "would_link_neon_identity" };
    }

    if (existing.appUserId !== appUserId) {
      throw new Error(
        `Neon user ${neonUser.id} (${email}) is already linked to ${existing.appUserId}, not ${appUserId}.`,
      );
    }

    return { action: "already_linked_neon_identity" };
  }

  if (existing) {
    if (existing.appUserId !== appUserId) {
      throw new Error(
        `Neon user ${neonUser.id} (${email}) is already linked to ${existing.appUserId}, not ${appUserId}.`,
      );
    }

    await prisma.authIdentity.update({
      where: { id: existing.id },
      data: {
        email,
        displayName,
      },
    });

    return { action: "updated_neon_identity" };
  }

  await prisma.authIdentity.create({
    data: {
      appUserId,
      provider: NEON_AUTH_PROVIDER,
      providerUserId: neonUser.id,
      email,
      displayName,
    },
  });

  return { action: "created_neon_identity" };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { absolutePath, rows } = await loadCsv(args.csvPath);
  const passwordMap = await loadPasswordMap(args.passwordMapPath);

  console.log(
    JSON.stringify(
      {
        mode: args.apply ? "apply" : "dry-run",
        csv: absolutePath,
        users: rows.length,
        createMissingUsers: args.createMissingUsers,
      },
      null,
      2,
    ),
  );

  const results = [];
  for (const record of rows) {
    const legacyUserId = typeof record.id === "string" ? record.id.trim() : "";
    const email = normalizeEmail(record.primary_email_address);
    const displayName = buildDisplayName(record);

    if (!legacyUserId) {
      throw new Error("Encountered Clerk CSV row without id.");
    }

    const legacyResult = await ensureLegacyClerkIdentity({
      legacyUserId,
      email,
      displayName,
      apply: args.apply,
    });

    let neonUser = await findNeonUserByEmail(email);
    let neonUserAction = neonUser ? "found_existing_neon_user" : "missing_neon_user";

    if (!neonUser && args.createMissingUsers) {
      const password = getPasswordForRecord({
        legacyUserId,
        email,
        passwordMap,
        defaultPassword: args.defaultPassword,
      });

      if (!password) {
        throw new Error(
          `No plain password available to create Neon user for ${email}. Provide --default-password or --password-map.`,
        );
      }

      if (args.apply) {
        neonUser = await createMissingNeonUser({
          email,
          displayName,
          password,
        });
        neonUserAction = "created_neon_user";
      } else {
        neonUserAction = "would_create_neon_user";
      }
    }

    let neonIdentityAction = null;
    if (neonUser && legacyResult.appUserId) {
      const identityResult = await ensureNeonAuthIdentity({
        appUserId: legacyResult.appUserId,
        neonUser,
        email,
        displayName,
        apply: args.apply,
      });
      neonIdentityAction = identityResult.action;
    }

    results.push({
      legacyUserId,
      email,
      displayName,
      passwordHasher: record.password_hasher || null,
      hasPasswordDigest: Boolean(record.password_digest && record.password_digest.trim()),
      appUserId: legacyResult.appUserId,
      appUserAction: legacyResult.action,
      neonUserId: neonUser?.id ?? null,
      neonUserAction,
      neonIdentityAction,
    });
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
