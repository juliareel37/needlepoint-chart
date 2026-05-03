import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LEGACY_DESIGN_PROVIDER = "legacy_editor_design_user_id";
const LEGACY_CLERK_PROVIDER = "legacy_clerk_user_id";
const NEON_AUTH_PROVIDER = "neon_auth";

async function countNeonAuthUsers() {
  const rows = await prisma.$queryRawUnsafe(`select count(*)::int as count from neon_auth."user"`);
  return Array.isArray(rows) && rows[0] ? rows[0].count : 0;
}

async function listLegacyUsersMissingNeonIdentity(limit = 20) {
  const rows = await prisma.$queryRawUnsafe(
    `
      select
        legacy."appUserId" as "appUserId",
        legacy."provider" as "legacyProvider",
        legacy."providerUserId" as "legacyUserId",
        legacy.email as email,
        legacy."displayName" as "displayName"
      from "AuthIdentity" legacy
      left join "AuthIdentity" neon
        on neon."appUserId" = legacy."appUserId"
       and neon.provider = $1
      where legacy.provider in ($2, $3)
        and neon.id is null
      order by legacy."createdAt" asc
      limit $4
    `,
    NEON_AUTH_PROVIDER,
    LEGACY_DESIGN_PROVIDER,
    LEGACY_CLERK_PROVIDER,
    limit,
  );

  return Array.isArray(rows) ? rows : [];
}

async function countLegacyUsersMissingNeonIdentity() {
  const rows = await prisma.$queryRawUnsafe(
    `
      select count(*)::int as count
      from (
        select distinct legacy."appUserId"
        from "AuthIdentity" legacy
        left join "AuthIdentity" neon
          on neon."appUserId" = legacy."appUserId"
         and neon.provider = $1
        where legacy.provider in ($2, $3)
          and neon.id is null
      ) missing
    `,
    NEON_AUTH_PROVIDER,
    LEGACY_DESIGN_PROVIDER,
    LEGACY_CLERK_PROVIDER,
  );

  return Array.isArray(rows) && rows[0] ? rows[0].count : 0;
}

async function main() {
  const [
    appUsers,
    editorDesigns,
    editorDesignsMissingAppUserId,
    legacyDesignIdentities,
    legacyClerkIdentities,
    neonAuthIdentities,
    neonAuthUsers,
    legacyUsersMissingNeonIdentity,
    legacyUsersMissingNeonIdentitySample,
  ] = await Promise.all([
    prisma.appUser.count(),
    prisma.editorDesign.count(),
    prisma.editorDesign.count({ where: { appUserId: null } }),
    prisma.authIdentity.count({ where: { provider: LEGACY_DESIGN_PROVIDER } }),
    prisma.authIdentity.count({ where: { provider: LEGACY_CLERK_PROVIDER } }),
    prisma.authIdentity.count({ where: { provider: NEON_AUTH_PROVIDER } }),
    countNeonAuthUsers(),
    countLegacyUsersMissingNeonIdentity(),
    listLegacyUsersMissingNeonIdentity(),
  ]);

  console.log(
    JSON.stringify(
      {
        summary: {
          appUsers,
          editorDesigns,
          editorDesignsMissingAppUserId,
          legacyDesignIdentities,
          legacyClerkIdentities,
          neonAuthIdentities,
          neonAuthUsers,
          legacyUsersMissingNeonIdentity,
        },
        samples: {
          legacyUsersMissingNeonIdentity: legacyUsersMissingNeonIdentitySample,
        },
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
