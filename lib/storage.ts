// File storage for job attachments.
//
// When SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set, objects live in a
// Supabase Storage bucket (talked to over its REST API — no extra dependency).
// Otherwise we fall back to storing bytes in Postgres, so local dev and tests
// work with no setup. Callers persist the returned `storageKey` (or null when
// falling back to the DB) on the JobAttachment row.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.ATTACHMENTS_BUCKET || "attachments";

export const storageEnabled = Boolean(SUPABASE_URL && SERVICE_KEY);

function objectUrl(key: string) {
  return `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURI(key)}`;
}

/** Upload bytes; returns the storage key to persist on the record. */
export async function putObject(
  key: string,
  bytes: Buffer,
  contentType: string
): Promise<string> {
  if (!storageEnabled) throw new Error("Object storage is not configured");
  const res = await fetch(objectUrl(key), {
    method: "POST",
    headers: {
      authorization: `Bearer ${SERVICE_KEY}`,
      "content-type": contentType,
      "x-upsert": "true",
    },
    body: new Uint8Array(bytes),
  });
  if (!res.ok) {
    throw new Error(`Storage upload failed (${res.status}): ${await res.text()}`);
  }
  return key;
}

/** Fetch bytes for a stored object (proxied through our authenticated route). */
export async function getObject(key: string): Promise<Buffer> {
  if (!storageEnabled) throw new Error("Object storage is not configured");
  const res = await fetch(objectUrl(key), {
    headers: { authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) {
    throw new Error(`Storage fetch failed (${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/** Best-effort delete; never throws (the DB row is the source of truth). */
export async function deleteObject(key: string): Promise<void> {
  if (!storageEnabled) return;
  try {
    await fetch(objectUrl(key), {
      method: "DELETE",
      headers: { authorization: `Bearer ${SERVICE_KEY}` },
    });
  } catch {
    // ignore — orphaned objects can be reaped separately
  }
}
