# Production App User + Neon Auth Rollout

This runbook mirrors the dev migration flow for production:

1. Apply the Prisma schema migration that introduces `AppUser` and `AuthIdentity`.
2. Backfill legacy Clerk users into `AuthIdentity`.
3. Link each `AppUser` to the matching Neon Auth user.
4. Verify there are no legacy-only users left before switching traffic.

## Prerequisites

- Production `DATABASE_URL`
- Production `DIRECT_URL`
- Production `NEON_AUTH_BASE_URL`
- Production `NEON_AUTH_COOKIE_SECRET`
- A Clerk user export CSV
- A safe way to provide plain-text passwords only if you need to create missing Neon users

Before running `node`, `npm`, or `tsc` commands in this repo, load Homebrew's shell env:

```bash
eval "$(/opt/homebrew/bin/brew shellenv zsh)"
```

## 1. Capture a preflight audit

Run the audit before making changes so you know the starting state:

```bash
node scripts/audit-app-user-migration.mjs
```

Key things to watch:

- `editorDesignsMissingAppUserId` should be `0` after the Prisma migration is applied.
- `legacyUsersMissingNeonIdentity` is the remaining backlog to link.
- `samples.legacyUsersMissingNeonIdentity` gives you the first few unresolved users.

## 2. Apply the production Prisma migration

Deploy all pending Prisma migrations:

```bash
npm run db:migrate:deploy
```

Then confirm status:

```bash
npm run db:migrate:status
```

The migration that matters for this rollout is:

- `20260503130500_add_app_users`

That migration:

- creates `AppUser`
- creates `AuthIdentity`
- backfills `AppUser` from existing `EditorDesign.userId`
- adds `legacy_editor_design_user_id` identities
- populates `EditorDesign.appUserId`

## 3. Dry-run the Clerk to Neon migration

Start with a dry-run against the production Clerk export:

```bash
npm run auth:migrate-clerk-users -- --csv ./path/to/prod-clerk-export.csv
```

Review the JSON output:

- `appUserAction`
- `neonUserAction`
- `neonIdentityAction`

Expected outcomes:

- Existing editor-design owners should usually resolve to `existing_app_user`.
- Existing Neon users should usually resolve to `found_existing_neon_user`.
- Users still missing a Neon link should show `would_link_neon_identity`.

## 4. Apply the Clerk identity backfill

If the dry-run looks clean, persist the links:

```bash
npm run auth:migrate-clerk-users -- --csv ./path/to/prod-clerk-export.csv --apply
```

This creates or updates:

- `legacy_clerk_user_id` identities for migrated Clerk users
- `neon_auth` identities when a matching Neon Auth user already exists for the same email

## 5. Handle users who do not exist in Neon Auth yet

If the dry-run reports `missing_neon_user`, you have two choices:

- Pre-create those users in Neon Auth outside this script, then rerun the migration.
- Let the script create them during apply.

If you want the script to create them, provide either a default password or a password map:

```bash
npm run auth:migrate-clerk-users -- --csv ./path/to/prod-clerk-export.csv --apply --create-missing-users --password-map ./path/to/neon-passwords.json
```

Or:

```bash
npm run auth:migrate-clerk-users -- --csv ./path/to/prod-clerk-export.csv --apply --create-missing-users --default-password 'temporary-password'
```

Notes:

- The script cannot import Clerk password hashes directly.
- A password map can be keyed by legacy Clerk user id or email.
- For production, a per-user password map is safer than one shared default password.

## 6. Link any exceptions manually

If a user must be linked to a specific Neon Auth account that does not match by email, use the mapping script:

```bash
npm run auth:link-neon-rehearsal -- --config ./path/to/mapping.json
```

Then apply it:

```bash
npm run auth:link-neon-rehearsal -- --config ./path/to/mapping.json --apply
```

Mapping format:

```json
[
  {
    "label": "Example user",
    "legacyUserId": "user_123",
    "neonEmail": "person@example.com"
  }
]
```

Use `neonUserId` instead of `neonEmail` if the email is ambiguous.

## 7. Re-run the audit

After the backfill, rerun:

```bash
node scripts/audit-app-user-migration.mjs
```

For a clean rollout, aim for:

- `editorDesignsMissingAppUserId = 0`
- `legacyUsersMissingNeonIdentity = 0`

If `legacyUsersMissingNeonIdentity` is still non-zero, use the sample output to finish the remaining links before rollout.

## 8. Deploy the app with Neon Auth env vars

Before sending production traffic to the new auth flow, verify the deployment has:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEON_AUTH_BASE_URL`
- `NEON_AUTH_COOKIE_SECRET`

The server auth code in [lib/auth/server.ts](/Users/juliareel/Code/needlepoint-chart/lib/auth/server.ts:1) requires both Neon Auth env vars at startup.

## Recommended order of operations

1. Run the preflight audit.
2. Apply Prisma migrations in production.
3. Dry-run the Clerk migration against the production export.
4. Apply the Clerk migration.
5. Resolve any exceptions with the mapping script.
6. Re-run the audit until there are no legacy-only app users left.
7. Deploy or promote the production app with Neon Auth env vars enabled.
