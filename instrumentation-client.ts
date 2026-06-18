// Sentry initialisation for the browser. This file is self-contained (it must
// not import server-only modules) and is a no-op until a DSN is provided.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const tracesSampleRate = (() => {
  const n = Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE);
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), 1) : 0.1;
})();

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment:
    process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || "development",
  tracesSampleRate,
  sendDefaultPii: false,
});

// Instruments client-side navigations for tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
