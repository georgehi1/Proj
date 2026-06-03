# Homefix CRM — notes for Claude

Small-business CRM for Homefix Limited (property maintenance, Leatherhead).
Features: job management, invoicing (quotes + invoices with VAT & PDF), and a
per-client communication log.

## Stack
Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind v4 · Prisma +
PostgreSQL · Auth.js v5 (credentials) · @react-pdf/renderer.

## Conventions
- **Mutations** are Server Actions co-located in each feature's `actions.ts`.
  They call `requireUser()` (`lib/session.ts`), validate input with the shared
  zod schemas in `lib/validation.ts`, write via Prisma, then `revalidatePath`.
- **Forms** are client components using `react-hook-form` + `zodResolver`. They
  call the action and either show `res.error` or `router.push` on success.
- **UI primitives** live in `components/ui.tsx`; status pills in
  `components/StatusBadge.tsx` (enum → colour map). Reuse these.
- Quotes and invoices share one `Invoice` model, distinguished by `type`.
- Money is `Prisma.Decimal` in the DB; convert with `toNumber` from
  `lib/format.ts`. Invoice maths lives in `lib/invoice.ts` — keep it the single
  source of truth.

## Local dev
`docker compose up -d` (or any Postgres) → `npm run db:migrate` → `npm run db:seed`
→ `npm run dev`. Seeded login: admin@homefixlimited.co.uk / password123.

## Before pushing
Run `npm run typecheck` and `npm run build`. With the server running,
`npm run smoke` exercises auth, the list/form pages, and PDF generation.
