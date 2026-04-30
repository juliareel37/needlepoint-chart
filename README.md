## Local Development

Before running `node`, `npm`, or `tsc` commands in this repo, load Homebrew's shell env:

```bash
eval "$(/opt/homebrew/bin/brew shellenv zsh)"
```

Start the app:

```bash
npm run dev
```

## Prisma Setup

This app uses Prisma with PostgreSQL and expects:

```bash
DATABASE_URL="pooled connection string"
DIRECT_URL="direct connection string"
```

For Neon:

- `DATABASE_URL` should usually be the pooled connection string used by the app at runtime.
- `DIRECT_URL` should be the non-pooled direct connection string used by Prisma Migrate.

Copy `.env.example` to `.env.local` and fill in real values for local development.

## Production Checklist

1. Create a production PostgreSQL database.
2. Add `DATABASE_URL` and `DIRECT_URL` as production environment variables in your host.
3. Run Prisma migrations in production with:

```bash
eval "$(/opt/homebrew/bin/brew shellenv zsh)"
npm run db:migrate:deploy
```

4. Build the app:

```bash
eval "$(/opt/homebrew/bin/brew shellenv zsh)"
npm run build
```

5. Verify Prisma is up to date:

```bash
eval "$(/opt/homebrew/bin/brew shellenv zsh)"
npm run db:migrate:status
```

## Important Baseline Note

This repo includes a baseline migration at `prisma/migrations/20260416_baseline_existing_schema`.

If your production database already contains the older `PatternDraft` / `PatternVersion` tables and was not originally created by Prisma Migrate, mark that baseline as already applied once before running deploy migrations:

```bash
eval "$(/opt/homebrew/bin/brew shellenv zsh)"
npx prisma migrate resolve --applied 20260416_baseline_existing_schema
```

After that, normal production deploys should use:

```bash
eval "$(/opt/homebrew/bin/brew shellenv zsh)"
npm run db:migrate:deploy
```
