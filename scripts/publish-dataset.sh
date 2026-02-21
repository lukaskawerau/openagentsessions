#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f ".env.production" ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.production
  set +a
fi

: "${HETZNER_S3_ENDPOINT:?Missing HETZNER_S3_ENDPOINT}"
: "${HETZNER_S3_BUCKET:?Missing HETZNER_S3_BUCKET}"
: "${AWS_ACCESS_KEY_ID:?Missing AWS_ACCESS_KEY_ID}"
: "${AWS_SECRET_ACCESS_KEY:?Missing AWS_SECRET_ACCESS_KEY}"

DATASET_OUTPUT_DIR="${DATASET_OUTPUT_DIR:-/tmp/dataset}"

node scripts/export-dataset.mjs

aws s3 sync "$DATASET_OUTPUT_DIR" "s3://$HETZNER_S3_BUCKET" \
  --endpoint-url "$HETZNER_S3_ENDPOINT" \
  --acl public-read \
  --delete \
  --no-progress

echo "dataset published to s3://$HETZNER_S3_BUCKET via $HETZNER_S3_ENDPOINT"
