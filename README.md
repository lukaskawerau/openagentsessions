# openagentsessions.org (MVP)

Public index of coding-agent sessions for open model training.

Current policy: store metadata only. Actual session content lives in public GitHub gists.

## MVP scope

- GitHub OAuth login
- Submit public gist URL
- Verify gist owner matches logged-in GitHub account
- Reject forked or non-public gists
- Store submission metadata in Postgres
- Moderator queue (`approve`, `reject`, `remove`)

## Tech

- Next.js (App Router, TypeScript)
- NextAuth (GitHub provider, JWT session)
- Prisma + Postgres

## Setup

1. Install deps

   ```bash
   pnpm install
   ```

2. Create env file

   ```bash
   cp .env.example .env
   ```

3. Fill `.env`

   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `MODERATOR_GITHUB_IDS` (GitHub numeric IDs)
   - For production, start from `.env.production.example`

4. Apply schema

   ```bash
   pnpm db:migrate
   pnpm db:generate
   ```

5. Run

   ```bash
   pnpm dev
   ```

## Production deploy essentials

- Domain: `openagentsessions.org`
- OAuth callback: `https://openagentsessions.org/api/auth/callback/github`
- Apply migrations in prod with:

```bash
pnpm db:migrate:deploy
```

Full Hetzner runbook: [`docs/deploy-hetzner.md`](docs/deploy-hetzner.md)

## Dataset export (static files)

Generate static artifacts from approved submissions:

```bash
pnpm dataset:export
```

Default output dir: `.dataset/`

- `.dataset/latest/urls.txt`
- `.dataset/latest/submissions.ndjson`
- `.dataset/latest/manifest.json`
- `.dataset/snapshots/<timestamp>/...` (immutable snapshot)

Custom output dir:

```bash
DATASET_OUTPUT_DIR=./dataset pnpm dataset:export
```

Upload `latest/` and `snapshots/` to S3/R2 and serve behind CDN.

Hetzner S3 publish (template):

```bash
aws s3 sync .dataset s3://openagentsessions-dataset \
  --endpoint-url https://<your-endpoint> \
  --delete
```

Or use the scripted flow:

```bash
pnpm dataset:publish
```

## Notes

- Ownership check verifies gist owner account == logged-in GitHub account.
- Still requires user attestation for rights/provenance + redaction.
- For now, no ingestion of raw session content into DB.
