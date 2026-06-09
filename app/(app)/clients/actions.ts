"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { clientSchema, type ClientInput } from "@/lib/validation";
import {
  planClientImport,
  type ImportClientRow,
  type ImportResult,
} from "@/lib/import";

export type { ImportClientRow, ImportResult } from "@/lib/import";

export type SaveResult = { ok: boolean; id?: string; error?: string };

function clean(value?: string) {
  const v = value?.trim();
  return v ? v : null;
}

export async function saveClient(
  id: string | null,
  input: ClientInput
): Promise<SaveResult> {
  await requireRole("ADMIN", "STAFF");
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }
  const d = parsed.data;
  const data = {
    name: d.name,
    type: d.type,
    email: clean(d.email),
    phone: clean(d.phone),
    addressLine1: clean(d.addressLine1),
    addressLine2: clean(d.addressLine2),
    town: clean(d.town),
    postcode: clean(d.postcode),
    notes: clean(d.notes),
  };

  const client = id
    ? await prisma.client.update({ where: { id }, data })
    : await prisma.client.create({ data });

  revalidatePath("/clients");
  if (id) revalidatePath(`/clients/${id}`);
  return { ok: true, id: client.id };
}

export async function deleteClient(id: string) {
  await requireRole("ADMIN");
  await prisma.client.delete({ where: { id } });
  revalidatePath("/clients");
  redirect("/clients");
}

/* ----------------------------- CSV import ----------------------------- */

/**
 * Bulk-create clients from mapped spreadsheet rows. De-duplication and
 * normalisation live in `planClientImport` (lib/import.ts) so they can be
 * unit-tested independently of the database.
 */
export async function importClients(rows: ImportClientRow[]): Promise<ImportResult> {
  await requireRole("ADMIN", "STAFF");

  const existing = await prisma.client.findMany({
    select: { name: true, email: true, phone: true },
  });
  const { toCreate, skipped } = planClientImport(existing, rows);

  if (toCreate.length) {
    await prisma.client.createMany({ data: toCreate });
  }

  revalidatePath("/clients");
  return { created: toCreate.length, skipped, total: rows.length };
}
