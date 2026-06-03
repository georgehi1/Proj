# Homefix CRM

A simple, easy-to-use CRM for **Homefix Limited**, a property-maintenance &
renovation company in Leatherhead, Surrey. It covers the three things the office
needs day to day:

- **Job management** — track work from enquiry → quoted → scheduled → in progress → completed.
- **Invoicing** — build quotes & invoices with line items and VAT, track payment
  status, and export a branded PDF. A quote can be converted into an invoice in one click.
- **Client communication** — log calls, emails, notes and site visits against each
  client (and optionally a specific job), and see all of a client's jobs and invoices
  in one place.

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

> **admin@homefixlimited.co.uk** / **password123**

## Useful scripts

| Script               | What it does                                    |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Start the dev server                            |
| `npm run build`      | Production build                                |
| `npm run typecheck`  | TypeScript type checking                        |
| `npm run db:migrate` | Create & apply a Prisma migration               |
| `npm run db:seed`    | Seed admin user, company settings and demo data |
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

## Deploying to Vercel

1. Push this repo to GitHub and import it into Vercel.
2. Provision a Postgres database (e.g. Neon or Vercel Postgres) and set
   `DATABASE_URL` and `AUTH_SECRET` as environment variables.
3. Run `npx prisma migrate deploy` against the production database (e.g. as part
   of the build), then seed an admin user.

## Not included in v1 (natural next steps)

Outbound email/SMS, online card payments, a customer portal, photo attachments on
jobs, a calendar view, and reporting/exports.
