// Sentry initialisation for the Edge runtime (middleware, edge routes).
// No-op until a DSN is configured.
import * as Sentry from "@sentry/nextjs";
import { APP_ENV, SENTRY_DSN, SENTRY_TRACES_SAMPLE_RATE } from "@/lib/env";

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: Boolean(SENTRY_DSN),
  environment: APP_ENV,
  tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
  sendDefaultPii: false,
});
