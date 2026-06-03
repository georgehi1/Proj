// Pure helpers for the client CSV importer — no I/O, so they can be unit-tested
// and reused by the server action in clients/actions.ts.

export type ImportClientRow = {
  name?: string;
  type?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  town?: string;
  postcode?: string;
  notes?: string;
};

export type ImportResult = { created: number; skipped: number; total: number };

export type ExistingClient = {
  name: string;
  email: string | null;
  phone: string | null;
};

export type ClientCreate = {
  name: string;
  type: "RESIDENTIAL" | "COMMERCIAL";
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  town: string | null;
  postcode: string | null;
  notes: string | null;
};

const clean = (v?: string | null) => {
  const t = v?.trim();
  return t ? t : null;
};
export const normalisePhone = (v?: string | null) => (v ?? "").replace(/\D/g, "");
export const looksLikeEmail = (v?: string) =>
  !!v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const normaliseType = (v?: string): "RESIDENTIAL" | "COMMERCIAL" =>
  (v ?? "").toLowerCase().includes("comm") ? "COMMERCIAL" : "RESIDENTIAL";

/**
 * Decide which mapped rows become new clients. Rows without a name are dropped;
 * rows matching an existing client — or an earlier row in the same file — by
 * name, email or phone are skipped, so re-running an import is safe.
 */
export function planClientImport(
  existing: ExistingClient[],
  rows: ImportClientRow[]
): { toCreate: ClientCreate[]; skipped: number } {
  const seenNames = new Set(existing.map((e) => e.name.trim().toLowerCase()));
  const seenEmails = new Set(
    existing.map((e) => e.email?.toLowerCase()).filter(Boolean) as string[]
  );
  const seenPhones = new Set(
    existing.map((e) => normalisePhone(e.phone)).filter(Boolean)
  );

  const toCreate: ClientCreate[] = [];
  let named = 0;

  for (const row of rows) {
    const name = row.name?.trim();
    if (!name) continue;
    named++;

    const email = looksLikeEmail(row.email) ? row.email!.trim().toLowerCase() : null;
    const phone = clean(row.phone);
    const phoneKey = normalisePhone(phone);
    const nameKey = name.toLowerCase();

    const duplicate =
      seenNames.has(nameKey) ||
      (email !== null && seenEmails.has(email)) ||
      (phoneKey !== "" && seenPhones.has(phoneKey));
    if (duplicate) continue;

    seenNames.add(nameKey);
    if (email) seenEmails.add(email);
    if (phoneKey) seenPhones.add(phoneKey);

    toCreate.push({
      name,
      type: normaliseType(row.type),
      email,
      phone,
      addressLine1: clean(row.addressLine1),
      addressLine2: clean(row.addressLine2),
      town: clean(row.town),
      postcode: clean(row.postcode),
      notes: clean(row.notes),
    });
  }

  return { toCreate, skipped: named - toCreate.length };
}
