// Helpers for building safe file-download responses.

/**
 * Build a Content-Disposition header value that can't be used for header
 * injection. The filename is stripped of separators / quotes / control chars
 * for the ASCII fallback, and the original is offered via RFC 5987 `filename*`.
 */
export function contentDisposition(
  type: "inline" | "attachment",
  filename: string
): string {
  const ascii =
    filename
      .replace(/[\\/\r\n"]/g, "_")
      .replace(/[^\x20-\x7e]/g, "_")
      .slice(0, 200) || "file";
  const encoded = encodeURIComponent(filename);
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

/** Headers applied to every binary file we serve from our own routes. */
export const FILE_SECURITY_HEADERS: Record<string, string> = {
  // Don't let the browser MIME-sniff a stored upload into something executable.
  "X-Content-Type-Options": "nosniff",
};

/**
 * Returns the URL only if it's a safe http(s) link, otherwise `undefined`.
 * Guards `href` sinks against `javascript:` / `data:` URLs (stored XSS) that
 * could arrive from saved records or scraped supplier data.
 */
export function safeExternalHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}
