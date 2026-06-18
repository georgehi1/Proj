"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Catches errors thrown in the root layout / unexpected render crashes and
// reports them to Sentry (a no-op when no DSN is configured). Must render its
// own <html>/<body> because it replaces the root layout.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#f6f7f9" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div style={{ maxWidth: "28rem", textAlign: "center" }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#0f172a" }}>
              Something went wrong
            </h1>
            <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#64748b" }}>
              An unexpected error occurred. The team has been notified.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                marginTop: "1.25rem",
                borderRadius: "0.5rem",
                background: "#1d54d6",
                color: "#fff",
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
