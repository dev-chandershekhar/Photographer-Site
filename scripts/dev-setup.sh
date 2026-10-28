#!/usr/bin/env bash
# One-command local setup + run (macOS / Linux):
#
#   ./scripts/dev-setup.sh
#
# Does: checks Node/pnpm/Docker -> creates .env (with a random PAYLOAD_SECRET) -> starts Postgres in
# Docker -> pnpm install -> migrations -> admin user -> placeholder content -> starts the dev server.
# Safe to re-run at any time; every step is idempotent.
#
# Optional environment variables:
#   ADMIN_EMAIL / ADMIN_PASSWORD   skip the prompts (password needs 12+ characters)
#   SKIP_SEED=1                    don't add placeholder photos/text
#   NO_START=1                     set everything up but don't start `pnpm dev`
#   SKIP_DOCKER=1                  use a Postgres you already run (DATABASE_URI in .env must point at it)
set -euo pipefail
cd "$(dirname "$0")/.."

say()  { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

# ---- Node
say "Checking Node"
command -v node >/dev/null || fail "Node is not installed. Install Node 24 LTS (https://nodejs.org, or: brew install nvm && nvm install)."
node_major="$(node -p 'process.versions.node.split(".")[0]')"
node_minor="$(node -p 'process.versions.node.split(".")[1]')"
node_patch="$(node -p 'process.versions.node.split(".")[2]')"
node_ok=0
if [ "$node_major" -ge 25 ] || { [ "$node_major" -eq 24 ] && [ "$node_minor" -ge 22 ]; } || \
   { [ "$node_major" -eq 22 ] && { [ "$node_minor" -gt 23 ] || { [ "$node_minor" -eq 23 ] && [ "$node_patch" -ge 4 ]; }; }; }; then node_ok=1; fi
[ "$node_ok" -eq 1 ] || fail "Node $(node -v) is too old. This project needs 22.23.4+ or 24.22.1+. With nvm: nvm install 24 && nvm use 24"
echo "Node $(node -v) OK"

# ---- pnpm (via corepack, falling back to npx)
say "Checking pnpm"
if command -v pnpm >/dev/null 2>&1; then
  PNPM="pnpm"
elif corepack enable >/dev/null 2>&1 && command -v pnpm >/dev/null 2>&1; then
  PNPM="pnpm"
else
  echo "pnpm not on PATH; using npx pnpm@10.34.8 instead"
  PNPM="npx --yes pnpm@10.34.8"
fi
echo "pnpm: $($PNPM --version)"

# ---- .env
say "Preparing .env"
[ -f .env ] || { cp .env.example .env; echo "Created .env from .env.example"; }
getenv() { grep -E "^$1=" .env | head -n1 | cut -d= -f2- || true; }
setenv() { # setenv KEY VALUE  (portable in-place edit)
  if grep -qE "^$1=" .env; then
    awk -v k="$1" -v v="$2" 'BEGIN{FS=OFS="="} $1==k{print k"="v; next} {print}' .env > .env.tmp && mv .env.tmp .env
  else
    printf '%s=%s\n' "$1" "$2" >> .env
  fi
}
if [ -z "$(getenv PAYLOAD_SECRET)" ]; then
  setenv PAYLOAD_SECRET "$(openssl rand -hex 32)"
  echo "Generated PAYLOAD_SECRET"
fi
# 127.0.0.1 (not "localhost") avoids IPv6 resolution problems with Docker's port mapping.
if grep -qE '^DATABASE_URI=.*@localhost:' .env; then
  setenv DATABASE_URI "$(getenv DATABASE_URI | sed 's/@localhost:/@127.0.0.1:/')"
  echo "DATABASE_URI now uses 127.0.0.1"
fi
# Images: with every R2_* value blank, uploads are stored in ./media on this machine.
r2_set=0; for k in R2_ENDPOINT R2_BUCKET R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_PUBLIC_URL; do [ -n "$(getenv $k)" ] && r2_set=$((r2_set+1)); done
if [ "$r2_set" -eq 0 ]; then echo "Images: stored locally in ./media"
elif [ "$r2_set" -eq 5 ]; then echo "Images: stored in Cloudflare R2"
else echo "WARNING: only $r2_set of 5 R2_* values are set, so images are stored locally in ./media. Blank them all (local) or fill all five (R2)."; fi
[ -n "$(getenv DATABASE_URI)" ] || fail "DATABASE_URI is empty in .env"

# ---- Postgres
if [ "${SKIP_DOCKER:-}" = "1" ]; then
  say "Skipping Docker (SKIP_DOCKER=1); using DATABASE_URI from .env"
else
  say "Starting Postgres in Docker"
  command -v docker >/dev/null || fail "Docker is not installed. Install Docker Desktop (https://www.docker.com/products/docker-desktop/) and run this again."
  docker info >/dev/null 2>&1 || fail "Docker is installed but not running. Open Docker Desktop, wait until it says 'running', then run this again."
  docker compose up -d --wait db || fail "Could not start the database container. If port 5432 is already used (a local Postgres?), stop that or change the port in docker-compose.yml and DATABASE_URI."
  echo "Postgres is healthy"
fi

# ---- dependencies
say "Installing dependencies"
$PNPM install --frozen-lockfile || $PNPM install

# ---- database
say "Running database migrations"
$PNPM payload migrate

say "Creating the admin user"
if [ -z "${ADMIN_EMAIL:-}" ]; then read -r -p "Admin email [admin@example.com]: " ADMIN_EMAIL; ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"; fi
if [ -z "${ADMIN_PASSWORD:-}" ]; then
  while :; do
    read -r -s -p "Admin password (12+ characters, not saved anywhere): " ADMIN_PASSWORD; echo
    [ "${#ADMIN_PASSWORD}" -ge 12 ] && break
    echo "Too short; use at least 12 characters."
  done
fi
ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" $PNPM create-admin

if [ "${SKIP_SEED:-}" != "1" ]; then
  say "Adding placeholder content (skipped if photos already exist)"
  $PNPM seed
fi

say "Ready"
cat <<MSG
  Site:   http://localhost:3000
  Admin:  http://localhost:3000/admin   (log in with $ADMIN_EMAIL)
  Stop:   Ctrl+C here. The database keeps running; stop it with: docker compose stop db
MSG

if [ "${NO_START:-}" = "1" ]; then exit 0; fi
lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1 && fail "Port 3000 is already in use. Stop whatever is using it, then run: $PNPM dev"
exec $PNPM dev
