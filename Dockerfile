# syntax=docker/dockerfile:1
# Multi-stage build: dependencies -> build -> small runtime image running as a non-root user.
ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

# ---- dependencies (cached until the lockfile changes)
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---- build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* values are inlined at build time, and the page is rendered then, so they are
# build arguments. R2_PUBLIC_URL is needed by next.config (image host allow-list).
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID
ARG NEXT_PUBLIC_UMAMI_SRC
ARG R2_PUBLIC_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
    NEXT_PUBLIC_UMAMI_WEBSITE_ID=$NEXT_PUBLIC_UMAMI_WEBSITE_ID \
    NEXT_PUBLIC_UMAMI_SRC=$NEXT_PUBLIC_UMAMI_SRC \
    R2_PUBLIC_URL=$R2_PUBLIC_URL
# No database is reachable while the image builds; the home page then builds as a placeholder
# and the container's start-up warm-up (docker/entrypoint.sh) regenerates it.
RUN pnpm build

# ---- runtime
FROM node:${NODE_VERSION}-bookworm-slim AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs --no-create-home nextjs \
 && mkdir -p /app/media \
 && chown nextjs:nodejs /app /app/media

COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs docker/entrypoint.sh docker/warmup.mjs ./docker/
RUN chmod +x ./docker/entrypoint.sh

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/internal/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["./docker/entrypoint.sh"]
