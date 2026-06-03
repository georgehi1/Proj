// Validation rules for job file attachments — pure so they're unit-testable
// and shared between the upload action and (potentially) the client.

export const MAX_ATTACHMENT_BYTES = 12 * 1024 * 1024; // 12MB

// Conservative allowlist: documents, spreadsheets and images a property firm
// actually attaches (certificates, plans, signed quotes). Anything executable
// or unknown is rejected.
export const ALLOWED_ATTACHMENT_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".heic",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".txt",
  ".rtf",
];

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
}

/** Returns a human-readable reason the file should be rejected, or null if OK. */
export function attachmentRejectReason(filename: string, size: number): string | null {
  if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(extensionOf(filename))) {
    return `"${filename}" has an unsupported file type. Allowed: ${ALLOWED_ATTACHMENT_EXTENSIONS.join(", ")}.`;
  }
  if (size <= 0) {
    return `"${filename}" is empty.`;
  }
  if (size > MAX_ATTACHMENT_BYTES) {
    return `"${filename}" is larger than 12MB.`;
  }
  return null;
}
