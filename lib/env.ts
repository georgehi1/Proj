import { z } from "zod";

/**
 * Centralised, validated environment configuration.
 *
 * - `APP_ENV` is the logical environment used to tag Sentry events and gate
 *   behaviour. On Vercel it's derived from `VERCEL_ENV` automatically; set
 *   `APP_ENV` explicitly anywhere else (Docker, bare metal).
 * - `validateServerEnv()` is called once at server boot from `instrumentation.ts`
 *   so a misconfigured production deploy fails fast with a clear message rather
 *   than erroring on the first database query. Skipped during `next build` and
 *   when `SKIP_ENV_VALIDATION=true`.
 */

type AppEnv = "development" | "preview" | "production";

function resolveAppEnv(): AppEnv {
  const raw =
    process.env.APP_ENV ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
  if (raw === "production") return "production";
  if (raw === "preview") return "preview";
  return "development";
}

export const APP_ENV: AppEnv = resolveAppEnv();
export const IS_PRODUCTION = APP_ENV === "production";

// Server can read either name; the browser only ever sees NEXT_PUBLIC_*.
export const SENTRY_DSN =
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || undefined;

export const SENTRY_TRACES_SAMPLE_RATE = (() => {
  const n = Number(process.env.SENTRY_TRACES_SAMPLE_RATE);
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), 1) : 0.1;
})();

/**
 * Schema for the variables the server genuinely needs. Optional integrations
 * (Anthropic, Supabase storage, Resend, Apify, Sentry) are validated where they
 * are used, not here, so the core app boots without them.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1).optional(),
  // Auth.js reads AUTH_SECRET itself; we only insist on it in production, where
  // a missing secret silently weakens session security.
  AUTH_SECRET: IS_PRODUCTION
    ? z.string().min(1, "AUTH_SECRET is required in production")
    : z.string().optional(),
});

let validated = false;

export function validateServerEnv(): void {
  if (validated) return;
  if (process.env.SKIP_ENV_VALIDATION === "true") return;
  // `next build` evaluates server modules; don't fail the build for runtime-only
  // configuration that's injected at deploy time.
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const result = serverSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    const message = `Invalid environment configuration (APP_ENV=${APP_ENV}):\n${issues}`;
    // Always surface the problem; only hard-fail in production so local dev with
    // a partial .env still runs.
    console.error(message);
    if (IS_PRODUCTION) throw new Error(message);
  }
  validated = true;
}
