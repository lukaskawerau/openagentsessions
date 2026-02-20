---
summary: Deploy openagentsessions.org on Hetzner VM + Hetzner Object Storage
read_when:
  - preparing production deployment
  - configuring systemd services and timers
  - setting up database migrations and dataset publishing
---

# Hetzner deployment

## 1) Prepare server

- Ubuntu/Debian VM
- Install: `node`, `pnpm`, `postgresql-client`, `awscli`, `git`
- Create deploy user + app dir:

```bash
sudo useradd -m -s /bin/bash deploy
sudo mkdir -p /srv/openagentsessions
sudo chown -R deploy:deploy /srv/openagentsessions
```

- Clone repo into `/srv/openagentsessions`

## 2) Environment

Create `/srv/openagentsessions/.env.production`:

```dotenv
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://openagentsessions.org"
NEXTAUTH_SECRET="<strong-random-secret>"
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
GITHUB_API_TOKEN="..."
MODERATOR_GITHUB_IDS="12345,67890"

DATASET_OUTPUT_DIR="/srv/openagentsessions/.dataset"
HETZNER_S3_ENDPOINT="https://fsn1.your-objectstorage.com"
HETZNER_S3_BUCKET="openagentsessions-dataset"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_DEFAULT_REGION="us-east-1"
```

## 3) Build + migrate flow

Run on each deploy:

```bash
cd /srv/openagentsessions
pnpm install --frozen-lockfile
pnpm build
pnpm db:migrate:deploy
```

Why this flow:
- `migrate deploy` applies committed SQL migrations only
- deterministic + safe for production
- avoids schema drift from `db push`

## 4) systemd units

Copy unit files from `deploy/systemd/` to `/etc/systemd/system/`:

- `openagentsessions-web.service`
- `openagentsessions-dataset-sync.service`
- `openagentsessions-dataset-sync.timer`

Enable + start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openagentsessions-web.service
sudo systemctl enable --now openagentsessions-dataset-sync.timer
```

Check status:

```bash
systemctl status openagentsessions-web.service
systemctl status openagentsessions-dataset-sync.timer
journalctl -u openagentsessions-web.service -f
journalctl -u openagentsessions-dataset-sync.service -f
```

## 5) Reverse proxy + TLS (Caddy)

Caddyfile template in repo:

- `deploy/caddy/Caddyfile`

Install + apply on VM:

```bash
sudo apt-get update
sudo apt-get install -y caddy
sudo cp /srv/openagentsessions/deploy/caddy/Caddyfile /etc/caddy/Caddyfile
sudo mkdir -p /var/log/caddy
sudo chown caddy:caddy /var/log/caddy
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl enable --now caddy
sudo systemctl reload caddy
```

What this config does:
- HTTPS + HTTP/3
- redirects `www.openagentsessions.org` -> apex
- reverse proxy to `127.0.0.1:3000`
- sets security headers
- JSON access logs with rotation
- long cache for `/_next/static/*`

## 6) Dataset sync output

Timer triggers `pnpm dataset:publish`, which does:

1. `node scripts/export-dataset.mjs`
2. `aws s3 sync $DATASET_OUTPUT_DIR s3://$HETZNER_S3_BUCKET --endpoint-url $HETZNER_S3_ENDPOINT --delete`

Published structure:
- `latest/urls.txt`
- `latest/submissions.ndjson`
- `latest/manifest.json`
- `snapshots/<timestamp>/...`
