#!/bin/sh
# Starts the Next.js server (database migrations run on boot via Payload's prodMigrations),
# then warms the home page in the background so visitors never see the build placeholder.
set -eu

# Fail fast on missing configuration instead of serving a broken site.
[ -n "${PAYLOAD_SECRET:-}" ] || { echo "entrypoint: PAYLOAD_SECRET is not set" >&2; exit 1; }
[ -n "${DATABASE_URI:-}" ] || { echo "entrypoint: DATABASE_URI is not set" >&2; exit 1; }
[ -n "${CRON_SECRET:-}" ] || echo "entrypoint: WARNING CRON_SECRET is empty; cron jobs and the start-up warm-up are disabled" >&2

node server.js &
SERVER_PID=$!

# Forward docker stop signals to the server so it shuts down cleanly.
trap 'kill -TERM "$SERVER_PID" 2>/dev/null || true' TERM INT

node ./docker/warmup.mjs &

wait "$SERVER_PID"
