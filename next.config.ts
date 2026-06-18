import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Self-contained server output for the production Docker image.
  // Ignored by Vercel, which manages its own output.
  output: "standalone",
  experimental: {
    // Allow job photo uploads (default Server Action body limit is 1MB).
    serverActions: { bodySizeLimit: "12mb" },
  },
  // Baseline security headers applied to every response. (A strict CSP is left
  // out for now as it needs per-request nonces to avoid breaking Next/Turbopack
  // inline scripts.)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Clickjacking: the app is never meant to be framed.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Quiet unless running in CI.
  silent: !process.env.CI,
  // Upload a wider set of client source maps for readable stack traces.
  widenClientFileUpload: true,
  // Only generate/upload source maps when an auth token is present, so builds
  // without Sentry credentials (local, no-DSN) are unaffected.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  // Don't phone home build telemetry.
  telemetry: false,
});
