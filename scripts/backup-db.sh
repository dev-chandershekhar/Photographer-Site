#!/usr/bin/env bash
# Nightly database backup: pg_dump -> gzip -> upload to a PRIVATE R2 bucket -> prune old copies.
#
# Run on the server (see scripts/crontab.example). Needs the AWS CLI (R2 speaks S3):
#   sudo apt install -y awscli     (or: pip install awscli)
#
# Configuration comes from the app's .env (ENV_FILE, default /opt/app/.env):
#   R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY   – same R2 account as the media bucket
#   BACKUP_BUCKET        – a PRIVATE bucket. Dumps contain inquiries (personal data) and API tokens, so
#                          never use a bucket that is served publicly (like the media bucket).
#   POSTGRES_USER, POSTGRES_DB
# Optional: RETENTION_DAYS (14), BACKUP_PREFIX (backups), PG_CONTAINER, PG_DUMP_CMD, AWS_BIN.
set -euo pipefail

ENV_FILE="${ENV_FILE:-/opt/app/.env}"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

RETENTION_DAYS="${RETENTION_DAYS:-14}"
PREFIX="${BACKUP_PREFIX:-backups}"
AWS_BIN="${AWS_BIN:-aws}"
BUCKET="${BACKUP_BUCKET:-}"

die() { echo "backup: $*" >&2; exit 1; }

[ -n "${R2_ENDPOINT:-}" ] && [ -n "${R2_ACCESS_KEY_ID:-}" ] && [ -n "${R2_SECRET_ACCESS_KEY:-}" ] \
  || die "R2_ENDPOINT, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY must be set"
if [ -z "$BUCKET" ]; then
  if [ "${ALLOW_BACKUP_IN_MEDIA_BUCKET:-}" = "1" ] && [ -n "${R2_BUCKET:-}" ]; then
    echo "backup: WARNING using the media bucket; make sure it is NOT publicly served" >&2
    BUCKET="$R2_BUCKET"
  else
    die "BACKUP_BUCKET must be set to a private bucket (see the header of this script)"
  fi
fi

export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" AWS_DEFAULT_REGION=auto

if [ -z "${PG_DUMP_CMD:-}" ]; then
  container="${PG_CONTAINER:-$(docker ps --filter label=com.docker.compose.service=db --format '{{.Names}}' | head -n1)}"
  [ -n "$container" ] || die "could not find the db container (set PG_CONTAINER)"
  PG_DUMP_CMD="docker exec -i $container pg_dump -U ${POSTGRES_USER:-photographer} -d ${POSTGRES_DB:-photographer} --no-owner --clean --if-exists"
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
file="photographer-$(date -u +%Y%m%d-%H%M%S).sql.gz"

# pipefail makes a failing pg_dump fail the whole pipeline (no silent empty backups).
$PG_DUMP_CMD | gzip -9 > "$tmp/$file"
gzip -t "$tmp/$file" || die "dump is not a valid gzip file"
size="$(wc -c < "$tmp/$file")"
[ "$size" -gt 500 ] || die "dump is suspiciously small ($size bytes); not uploading"

"$AWS_BIN" s3 cp --only-show-errors --endpoint-url "$R2_ENDPOINT" "$tmp/$file" "s3://$BUCKET/$PREFIX/$file"
echo "backup: uploaded $PREFIX/$file ($size bytes)"

# Prune: delete dumps whose date (in the file name) is older than RETENTION_DAYS.
cutoff="$(date -u -d "-$RETENTION_DAYS days" +%Y%m%d)"
"$AWS_BIN" s3 ls --endpoint-url "$R2_ENDPOINT" "s3://$BUCKET/$PREFIX/" | awk '{print $NF}' | while read -r key; do
  if [[ "$key" =~ ^photographer-([0-9]{8})-[0-9]{6}\.sql\.gz$ ]] && [ "${BASH_REMATCH[1]}" -lt "$cutoff" ]; then
    "$AWS_BIN" s3 rm --only-show-errors --endpoint-url "$R2_ENDPOINT" "s3://$BUCKET/$PREFIX/$key"
    echo "backup: pruned $key"
  fi
done
