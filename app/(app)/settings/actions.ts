"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { settingsSchema, type SettingsInput } from "@/lib/validation";

export type SaveResult = { ok: boolean; error?: string };

function clean(value?: string) {
  const v = value?.trim();
  return v ? v : null;
}

export async function saveSettings(input: SettingsInput): Promise<SaveResult> {
  await requireUser();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }
  const d = parsed.data;
  const data = {
    companyName: d.companyName,
    addressLine1: clean(d.addressLine1),
    addressLine2: clean(d.addressLine2),
    town: clean(d.town),
    postcode: clean(d.postcode),
    phone: clean(d.phone),
    email: clean(d.email),
    vatNumber: clean(d.vatNumber),
    defaultVatRate: new Prisma.Decimal(d.defaultVatRate.toFixed(2)),
    invoicePrefix: d.invoicePrefix,
    quotePrefix: d.quotePrefix,
  };

  await prisma.companySettings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });

  revalidatePath("/settings");
  return { ok: true };
}
