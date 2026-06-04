import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Fail fast on misconfiguration before the app starts serving.
    const { validateServerEnv } = await import("@/lib/env");
    validateServerEnv();
    await import("@/sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("@/sentry.edge.config");
  }
}

// Reports errors thrown in nested React Server Components / route handlers.
export const onRequestError = Sentry.captureRequestError;
