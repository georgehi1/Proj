// Sentry initialisation for the Node.js server runtime.
// No-op until NEXT_PUBLIC_SENTRY_DSN (or SENTRY_DSN) is set, so dev runs clean.
import * as Sentry from "@sentry/nextjs";
import { APP_ENV, SENTRY_DSN, SENTRY_TRACES_SAMPLE_RATE } from "@/lib/env";

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: Boolean(SENTRY_DSN),
  environment: APP_ENV,
  tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
  // Avoid shipping request bodies / user data unless you opt in.
  sendDefaultPii: false,
});
