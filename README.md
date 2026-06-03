#  CRM

A simple, easy-to-use CRM for ****, a . It covers the three things the office
needs day to day:

- **Job management** — track work from enquiry → quoted → scheduled → in progress → completed.
- **Invoicing** — build quotes & invoices with line items and VAT, track payment
  status, and export a branded PDF. A quote can be converted into an invoice in one click.
- **Client communication** — log calls, emails, notes and site visits against each
  client (and optionally a specific job), and see all of a client's jobs and invoices
  in one place.
- **Data migration** — bulk-import clients from a spreadsheet (CSV) with column
  mapping and de-duplication, and turn existing PDF/Word quotes & invoices into live
  records with AI extraction.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- [Prisma](https://www.prisma.io) ORM + PostgreSQL
- [Auth.js](https://authjs.dev) (NextAuth v5) — email/password sign-in
- [@react-pdf/renderer](https://react-pdf.org) for invoice/quote PDFs

## Getting started

### 1. Prerequisites

- Node.js 20+
- A PostgreSQL database. Easiest locally is Docker:

  ```bash
  docker compose up -d
  ```

  (Or point `DATABASE_URL` at any Postgres instance — see `.env.example`.)

### 2. Configure environment

```bash
cp .env.example .env
# then edit .env — set AUTH_SECRET to a long random string:
#   openssl rand -base64 32
# Optional: set ANTHROPIC_API_KEY to enable AI extraction of quotes/invoices
# from PDFs and Word docs (see "Migrating existing data" below).
```

### 3. Install, migrate, seed

```bash
npm install
npm run db:migrate      # apply the database schema
npm run db:seed         # create the admin user + demo data
```

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000 and sign in with the seeded account:

> **** / **password123**

## Migrating existing data

Two tools help bring across data that currently lives in spreadsheets, Word docs and PDFs:

- **Clients from a spreadsheet** (`Clients → Import`). Export your customer list to
  CSV (Excel/Sheets → *Save As / Download → CSV*), upload it, map your columns to the
  fields, preview, and import. Rows are de-duplicated against existing clients by name,
  email or phone, so re-running an import is safe.
- **Quotes & invoices from PDF/Word** (`Invoices → Import from PDF/Word`). Upload an
  existing PDF, Word (`.docx`) or image; Claude extracts the client, line items, VAT
  and totals and creates a **draft** you review on the normal edit screen before saving
  as a live record. Requires `ANTHROPIC_API_KEY` to be set (the feature shows a clear
  message if it isn't). Always check the figures against the original — AI can misread
  messy scans. For old `.doc` files, save them as PDF first.

## Useful scripts

| Script               | What it does                                    |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Start the dev server                            |
| `npm run build`      | Production build                                |
| `npm run typecheck`  | TypeScript type checking                        |
| `npm run db:migrate` | Create & apply a Prisma migration (local)       |
| `npm run db:deploy`  | Apply pending migrations (production)           |
| `npm run db:seed`    | Seed admin, settings **and demo data** (local)  |
| `npm run db:seed:prod` | Seed admin + settings only (no demo data)     |
| `npm run db:studio`  | Open Prisma Studio to browse the database       |
| `npm run smoke`      | End-to-end smoke test (server must be running)  |

## Project layout

```
app/
  (auth)/login/          Sign-in page + action
  (app)/                 Authenticated shell (sidebar + guard)
    page.tsx             Dashboard
    clients/             Client list / detail / forms + comms log
    jobs/                Job list / detail / forms + status control
    invoices/            Invoice & quote list / detail / forms / PDF route
    settings/            Company details used on PDFs
lib/
  auth.ts                Auth.js config
  db.ts                  Prisma client singleton
  validation.ts          Shared zod schemas (forms + server actions)
  invoice.ts             Subtotal / VAT / total maths
  pdf/InvoiceDocument.tsx  Branded PDF template
components/              Shared UI primitives, sidebar, badges, filters
prisma/                  schema.prisma + seed.ts
```

## Deploying to Vercel + Supabase

The app runs on **Vercel**; the database is a **Supabase** Postgres. Vercel runs
the migrations automatically on deploy (`vercel.json` sets the build command to
`prisma migrate deploy && next build`).

1. **Create the Supabase project.** In the dashboard → **Settings → Database →
   Connection string**, copy two strings:
   - **Transaction pooler** (port `6543`) → `DATABASE_URL` (append
     `?pgbouncer=true&connection_limit=1`). This is what the serverless app uses.
   - **Direct connection** (port `5432`) → `DIRECT_URL`. Used only for migrations.
2. **Import the repo into Vercel** and set these environment variables:
   - `DATABASE_URL` and `DIRECT_URL` (from step 1)
   - `AUTH_SECRET` (`openssl rand -base64 32`)
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD` (your real first-login credentials)
   - `ANTHROPIC_API_KEY` (optional — only for AI document import)
   - Leave `SEED_DEMO` unset in production.
3. **Deploy.** The build runs `prisma migrate deploy`, creating all tables.
4. **Create the admin user once** (run locally with the production `DATABASE_URL`
   in your shell, or from a Vercel one-off): `npm run db:seed:prod` — this inserts
   only the company settings and the admin account (no demo data).

> Why two URLs? Supabase's pooler (PgBouncer) is required for serverless
> connection limits, but Prisma migrations need a direct connection — hence
> `DATABASE_URL` (pooled) and `DIRECT_URL` (direct).

## Not included in v1 (natural next steps)

Outbound email/SMS, online card payments, a customer portal, photo attachments on
jobs, a calendar view, and reporting/exports.
