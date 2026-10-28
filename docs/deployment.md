# Deployment runbook (Oracle Free VPS + Coolify + Cloudflare)

Everything here is free-tier. Dashboards change; where a menu name below no longer matches,
follow the vendor's current docs for the same goal.

```
Visitors ─▶ Cloudflare (DNS, TLS, cache) ─▶ VPS ─▶ Coolify/Traefik ─▶ app   (Next.js + Payload)
                                                                    ├▶ db    (Postgres 16, volume)
                                                                    └▶ umami (+ its own Postgres)
Media (public bucket)  ◀── Cloudflare R2 ──▶  Backups (PRIVATE bucket)
```

## 1. Accounts to prepare first

- **Domain on Cloudflare** (e.g. `example.com`; stats on `stats.example.com`).
- **R2**: one *public* bucket for photos (custom domain such as `img.example.com`) and one *private* bucket
  for backups. Create an API token with read/write on both. Never put backups in the public bucket:
  dumps contain inquiries (personal data) and API tokens.
- **Resend**: verify your sending domain, create an API key, pick `EMAIL_FROM` on that domain.
- **Cloudflare Turnstile**: create a widget for the domain (site key + secret key).
- **GitHub repo** with this project on the `main` branch (do not commit `.env`).
- Optional: Meta app and tokens (`docs/social-setup.md`).

## 2. The server

1. Create an Oracle Cloud Always Free **Ampere A1** instance (Ubuntu 24.04 LTS, arm64). All images used here are multi-arch.
2. Oracle network: allow ingress TCP 22, 80, 443 in the VCN security list. The Ubuntu image also ships
   restrictive iptables rules; if 80/443 don't answer, allow them with UFW below (and remove stray `REJECT` lines in `/etc/iptables/rules.v4`).
3. Harden (as root, once):

```bash
adduser deploy && usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh && cp ~/.ssh/authorized_keys /home/deploy/.ssh/ && chown -R deploy:deploy /home/deploy/.ssh
# SSH keys only, no root login (test a second session as `deploy` BEFORE closing this one):
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/; s/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart ssh
ufw default deny incoming && ufw default allow outgoing
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp
ufw enable
apt update && apt install -y unattended-upgrades fail2ban awscli
dpkg-reconfigure -plow unattended-upgrades
```

Do **not** open Coolify's port 8000 publicly; use an SSH tunnel (`ssh -L 8000:localhost:8000 deploy@SERVER`)
or give Coolify its own domain.

## 3. Coolify

Install from the Coolify docs (`curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash`), then in its UI:

1. **Add a project → new resource → your GitHub repo**, branch `main`.
2. Build pack: **Docker Compose**, compose file `docker-compose.yml`.
3. Assign domains: service `app` → `https://example.com`, service `umami` → `https://stats.example.com`
   (both containers listen on port 3000).
4. Set the environment variables (table below). Mark none of the `NEXT_PUBLIC_*` as "runtime only": they are
   used at **build** time.
5. Turn on **auto deploy** for pushes to `main`, then **Deploy**.

On start the container runs the database migrations automatically (Payload `prodMigrations`), then
`docker/entrypoint.sh` waits for a healthy app and regenerates the home page. The image build has no
database, so the page it bakes in is a placeholder that this warm-up replaces within seconds.

### Environment variables

| Variable | Needed | Notes |
|---|---|---|
| `PAYLOAD_SECRET` | yes | `openssl rand -hex 32`. Changing it logs everyone out. |
| `NEXT_PUBLIC_SITE_URL` | yes, **build** | `https://example.com`, no trailing slash. Used by canonical, share cards, sitemap, JSON-LD. |
| `POSTGRES_PASSWORD` | yes | Long random value. `POSTGRES_USER`/`POSTGRES_DB` default to `photographer`. |
| `CRON_SECRET` | yes | `openssl rand -hex 32`. Also used by the start-up warm-up. |
| `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | yes | Media bucket. |
| `R2_PUBLIC_URL` | yes, **build** | `https://img.example.com` (allow-listed for `next/image`). |
| `RESEND_API_KEY`, `EMAIL_FROM` | yes | Contact form emails. Without them inquiries are still saved. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | yes, **build** | |
| `TURNSTILE_SECRET_KEY` | yes | Without it the contact form rejects every submission (fails closed). |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID`, `NEXT_PUBLIC_UMAMI_SRC` | later, **build** | See section 7. |
| `UMAMI_DB_PASSWORD`, `UMAMI_APP_SECRET` | yes | Random values for the Umami service. |
| `META_GRAPH_VERSION` | optional | Defaults to `v21.0`. |

Never set `TURNSTILE_VERIFY_URL`, `INSTAGRAM_GRAPH_BASE` or `FACEBOOK_GRAPH_BASE` in production (test-only).

## 4. First run

1. Open `https://example.com/internal/health`: `{"ok":true}`.
2. Open `https://example.com/admin`. On an empty database Payload shows **Create first user**; do that now,
   before anyone else can.
3. Fill in Site Settings (title, SEO title/description, share image, contact email, location), Hero, About, Services,
   Photos and Testimonials. The placeholder seed is not run in production.

## 5. Cloudflare

- **DNS**: `example.com` and `stats` → server IP, *proxied* (orange cloud). `img` → R2 custom domain.
- **SSL/TLS**: mode **Full (strict)**. Coolify obtains a Let's Encrypt certificate for the origin; if that fails
  behind the proxy, create a Cloudflare Origin Certificate and install it in Coolify instead.
  Enable *Always use HTTPS* and *HSTS* (Edge Certificates; start with a short max-age).
- **Cache Rules** (Caching → Cache Rules), in this order:
  1. `URI Path starts with /admin`, `/api`, `/internal` → **Bypass cache**.
  2. `URI Path starts with /_next/static/` → Eligible for cache, Edge TTL 1 month (files are content-hashed).
  3. `URI Path starts with /_next/image` → Eligible for cache, respect origin (7 days).
  HTML is deliberately not cached: the origin serves it from memory and always returns fresh content after an edit.
- **Turnstile**: add the domain to the widget's allowed hostnames.
- If **Bot Fight Mode** challenges your server's own cron `curl`, call the origin directly instead:
  `curl --resolve example.com:443:127.0.0.1 ...` (see `scripts/crontab.example`), or add a WAF skip rule for `/internal/cron`.

## 6. Cron and backups (on the VPS, as `deploy`)

```bash
sudo mkdir -p /opt/app && sudo chown deploy /opt/app
git clone https://github.com/YOU/REPO.git /opt/app          # only the scripts/ folder is used
chmod +x /opt/app/scripts/*.sh
```

Create `/opt/app/.env` (chmod 600) with just what the backup script needs:

```
R2_ENDPOINT=...   R2_ACCESS_KEY_ID=...   R2_SECRET_ACCESS_KEY=...
BACKUP_BUCKET=photographer-backups        # the PRIVATE bucket
POSTGRES_USER=photographer   POSTGRES_DB=photographer
```

Then `crontab -e` and paste `scripts/crontab.example` (set `DOMAIN` and `CRON_SECRET`). Run one backup by hand
and confirm the file appears in the private bucket:

```bash
/opt/app/scripts/backup-db.sh
```

The script keeps 14 days (`RETENTION_DAYS`). As a second safety net add an R2 lifecycle rule on the backups bucket
that deletes objects after 30 days.

**Restore** (into an empty or existing database; this replaces its contents):

```bash
aws s3 cp --endpoint-url "$R2_ENDPOINT" s3://photographer-backups/backups/photographer-YYYYMMDD-HHMMSS.sql.gz .
gunzip -c photographer-*.sql.gz | docker exec -i $(docker ps -qf label=com.docker.compose.service=db) \
  psql -U photographer -d photographer
```

Test a restore into a scratch database once before you rely on it. Media files live in R2 and are not part of the dump.

## 7. Umami analytics

1. Open `https://stats.example.com`, log in as `admin` / `umami` and **change the password immediately**.
2. Settings → Websites → Add website (your domain). Copy its **Website ID**.
3. In Coolify set `NEXT_PUBLIC_UMAMI_WEBSITE_ID=<id>` and `NEXT_PUBLIC_UMAMI_SRC=https://stats.example.com/script.js`,
   then redeploy (build-time values). The script loads after the page, honours Do Not Track and sets no cookies.

## 8. Uptime monitoring (UptimeRobot, free plan; check its current terms of use)

- Monitor 1: HTTPS, `https://example.com/internal/health`, every 5 minutes, keyword `"ok":true`.
- Monitor 2: `https://stats.example.com/api/heartbeat`.
- Add your email (and phone push) as alert contacts.

## 9. Everyday operations

- **Deploy**: push to `main`. **Rollback**: redeploy the previous commit in Coolify (migrations are not reversed automatically).
- **Schema change**: locally `pnpm generate:types`, `pnpm payload migrate:create <name>`, commit the migration;
  it runs on container start.
- **Logs**: Coolify → the service → Logs. Cron/backup logs: `/var/log/photographer-backup.log`.
- **Update the OS**: unattended-upgrades handles security patches; reboot occasionally (`sudo reboot`), containers restart by themselves.

## 10. Launch checklist

- [ ] `/internal/health` is OK; UptimeRobot monitors are green.
- [ ] Contact form works end-to-end with real Turnstile; both emails arrive.
- [ ] Social sync works (admin → Social Feed → Sync now), if enabled.
- [ ] A backup ran and a restore was tested.
- [ ] Lighthouse mobile ≥ 90 on the live URL; Facebook Sharing Debugger and Google Rich Results Test pass.
- [ ] `NEXT_PUBLIC_SITE_URL`, SEO title/description and share image are real values.
- [ ] Umami records a visit.

## Known limits

- The contact-form rate limit is in memory (one app container), so it resets on restart.
- NEXT_PUBLIC values and `R2_PUBLIC_URL` are baked in at build: changing them means a redeploy.
- No Content-Security-Policy yet (Turnstile, Umami and images each need allowances); add one during launch QA.
