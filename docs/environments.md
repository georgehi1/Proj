# Environments & monitoring

This project runs in three logical environments. The active one is exposed as
`APP_ENV` and used to tag Sentry events.

| `APP_ENV`     | Where                              | Database                     |
| ------------- | ---------------------------------- | ---------------------------- |
| `development` | Local (`npm run dev`)              | Local Postgres (Docker)      |
| `preview`     | Vercel preview deploys (PRs)       | A staging/preview Postgres   |
| `production`  | Vercel production (`main`)         | Production Postgres          |

`APP_ENV` is resolved in `lib/env.ts` as: `APP_ENV` → else Vercel's `VERCEL_ENV`
→ else `NODE_ENV`. On Vercel you usually don't set it — it's derived from
`VERCEL_ENV` automatically. Set it explicitly for Docker / bare-metal.

`lib/env.ts` also validates the core server variables (`DATABASE_URL`, and
`AUTH_SECRET` in production) once at boot via `instrumentation.ts`, so a
misconfigured production deploy fails fast with a clear message. Set
`SKIP_ENV_VALIDATION=true` to bypass.

## Local development

```bash
docker compose up -d          # local Postgres
cp .env.example .env          # set AUTH_SECRET; APP_ENV stays "development"
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Sentry stays disabled locally (no DSN). Leave `NEXT_PUBLIC_SENTRY_DSN` blank.

## Production & preview on Vercel

The app deploys to Vercel; `vercel.json` runs `prisma migrate deploy && next build`,
so migrations apply automatically on every deploy.

Use **separate databases** for Production and Preview (a second Supabase/Neon
project, or a branch database). Set variables per environment in
**Vercel → Settings → Environment Variables**, scoping each to Production and/or
Preview:

**Required**

- `DATABASE_URL` — pooled connection (Supabase transaction pooler, port `6543`,
  with `?pgbouncer=true&connection_limit=1`)
- `DIRECT_URL` — direct connection (port `5432`), used for migrations
- `AUTH_SECRET` — `openssl rand -base64 32` (a **different** secret per environment)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — first-login credentials

**Recommended**

- `APP_ENV` — usually unset (derived from `VERCEL_ENV`); set it only to override
- `NEXT_PUBLIC_APP_ENV` — set to `production` / `preview` so **client-side**
  errors are tagged (the browser can't read `VERCEL_ENV`)

**Optional integrations** — `ANTHROPIC_API_KEY`, `RESEND_API_KEY` / `EMAIL_FROM`,
`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `ATTACHMENTS_BUCKET`.

Never set `SEED_DEMO` in production. After the first deploy, create the admin
account once by running `npm run db:seed:prod` locally with the production
`DATABASE_URL` exported in your shell.

## Sentry

Error monitoring is wired up with `@sentry/nextjs` but **disabled until a DSN is
set** — the SDK initialises with `enabled: false` when no DSN is present, so
nothing is sent in local dev.

Wiring:

- `instrumentation.ts` — server/edge init + `onRequestError` capture
- `sentry.server.config.ts`, `sentry.edge.config.ts` — server/edge `Sentry.init`
- `instrumentation-client.ts` — browser `Sentry.init` + navigation tracing
- `app/global-error.tsx` — reports unhandled render crashes
- `next.config.ts` — `withSentryConfig` (source-map upload, gated on an auth token)

### Enable it

1. Create a Sentry project (platform: **Next.js**) and copy its **DSN**.
2. Set `NEXT_PUBLIC_SENTRY_DSN` (and `NEXT_PUBLIC_APP_ENV`) in each Vercel
   environment. That's all that's needed for errors to flow, tagged by environment.
3. Tune sampling with `SENTRY_TRACES_SAMPLE_RATE` /
   `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` (`0` disables performance tracing).

### Readable stack traces (optional)

To upload source maps at build time, set these (CI/Vercel only — not locally):

- `SENTRY_ORG`, `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN` — Sentry → Settings → Auth Tokens, with `project:releases` scope

Without `SENTRY_AUTH_TOKEN`, builds are unaffected (no upload attempted).

## Production Docker image

A multi-stage `Dockerfile` builds Next's standalone server. The container runs
`prisma migrate deploy` on start (toggle with `RUN_MIGRATIONS=false`).

```bash
# Build (optionally bake in the client DSN / environment)
docker build -t homefix-crm:prod \
  --build-arg NEXT_PUBLIC_SENTRY_DSN="$NEXT_PUBLIC_SENTRY_DSN" \
  --build-arg NEXT_PUBLIC_APP_ENV=production .

# Run against an existing database
docker run --rm -p 3000:3000 --env-file .env homefix-crm:prod
```

Or bring up app + Postgres together:

```bash
cp .env.example .env   # set AUTH_SECRET (DB URLs are overridden by compose)
docker compose -f docker-compose.prod.yml up --build
```

Notes:

- `next.config.ts` sets `output: "standalone"`; Vercel ignores this.
- `NEXT_PUBLIC_*` values are inlined at **build** time — pass them as build args
  (the compose file wires `NEXT_PUBLIC_SENTRY_DSN` / `NEXT_PUBLIC_APP_ENV`
  through). Server-only secrets are read at **runtime** from `--env-file` / the
  environment.
- For real production, prefer a managed database over the bundled `db` service.
