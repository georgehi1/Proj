# ── deps: install dependencies (prisma generate runs in postinstall) ──────────
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
# Prisma's postinstall (`prisma generate`) needs the schema present.
COPY prisma ./prisma
RUN npm ci

# ── builder: compile the Next.js standalone server ───────────────────────────
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build without contacting external services or the database.
# Pass NEXT_PUBLIC_SENTRY_DSN / SENTRY_* as build args to bake in client DSN and
# upload source maps (optional).
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_APP_ENV
RUN npm run build

# ── runner: minimal production image ─────────────────────────────────────────
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as the unprivileged user that ships with the node image.
# The standalone server output (includes a trimmed node_modules + server.js).
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# Prisma schema/migrations + CLI + engines so the entrypoint can run
# `migrate deploy` against the production database on boot. The generated client
# is copied explicitly because Next's file tracing can miss the engine binary.
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=node:node /app/node_modules/@prisma/engines ./node_modules/@prisma/engines
COPY --from=builder --chown=node:node /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma

COPY --chown=node:node docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER node
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
