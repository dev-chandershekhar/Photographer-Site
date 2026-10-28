# Photographer site

Next.js 15 + Payload CMS 3 + PostgreSQL. See `CLAUDE.md` for the full spec.

## Quick start (one command)

```bash
./scripts/dev-setup.sh
```

Checks Node/pnpm/Docker, creates `.env`, starts Postgres, installs, migrates, creates your admin user, adds
placeholder content and starts the dev server at http://localhost:3000 (admin at `/admin`). Safe to re-run.

## First-time setup (manual steps)

Requires Node 22.23.4+ or 24 LTS (`nvm use`), pnpm 10 (`corepack enable`), and Docker.

```bash
cp .env.example .env              # then set PAYLOAD_SECRET (openssl rand -hex 32)
docker compose up -d db           # Postgres 16 on localhost:5432
pnpm install
pnpm payload migrate              # create tables
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' pnpm create-admin
pnpm seed                         # optional: placeholder photos, services, text
pnpm dev                          # http://localhost:3000  and  /admin
```

(Instead of `pnpm create-admin` you can open `/admin` on the empty database and use the
"create first user" screen.)

## Sample content

`pnpm seed` fills the CMS with generated placeholder images and sample text (skips if photos
exist). `SEED_RESET=true pnpm seed` wipes photos, categories, services, testimonials, social
posts and media first, then reseeds. Users and inquiries are never touched.

## Image storage

Leave the `R2_*` variables blank in development and uploads are saved to `./media`.
Fill in all five and uploads go to Cloudflare R2, served from `R2_PUBLIC_URL`.

## Schema changes

Dev "push" mode is off, so the database only changes through migrations:

```bash
pnpm generate:types
pnpm payload migrate:create <name>
pnpm payload migrate
```

## Deployment

See `docs/deployment.md` (Oracle VPS + Coolify + Cloudflare, backups, cron, Umami, uptime monitoring) and
`docs/social-setup.md` (Instagram/Facebook).
