"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser, requireRole } from "@/lib/session";
import {
  contractorSchema,
  availabilitySchema,
  type ContractorInput,
  type AvailabilityInput,
} from "@/lib/validation";

export type SaveResult = { ok: boolean; id?: string; error?: string };

function clean(value?: string) {
  const v = value?.trim();
  return v ? v : null;
}

export async function saveContractor(
  id: string | null,
  input: ContractorInput
): Promise<SaveResult> {
  await requireUser();
  const parsed = contractorSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }
  const d = parsed.data;
  const data = {
    name: d.name,
    trade: clean(d.trade),
    companyName: clean(d.companyName),
    email: clean(d.email),
    phone: clean(d.phone),
    dayRate:
      d.dayRate === "" || d.dayRate === undefined
        ? null
        : new Prisma.Decimal(Number(d.dayRate).toFixed(2)),
    notes: clean(d.notes),
    active: d.active,
  };

  const contractor = id
    ? await prisma.contractor.update({ where: { id }, data })
    : await prisma.contractor.create({ data });

  revalidatePath("/contractors");
  if (id) revalidatePath(`/contractors/${id}`);
  return { ok: true, id: contractor.id };
}

export async function deleteContractor(id: string) {
  await requireRole("ADMIN");
  await prisma.contractor.delete({ where: { id } });
  revalidatePath("/contractors");
  redirect("/contractors");
}

export async function addAvailability(
  contractorId: string,
  input: AvailabilityInput
): Promise<SaveResult> {
  await requireUser();
  const parsed = availabilitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }
  const d = parsed.data;
  await prisma.contractorAvailability.create({
    data: {
      contractorId,
      kind: d.kind,
      startDate: new Date(d.startDate),
      endDate: new Date(d.endDate),
      note: d.note?.trim() || null,
    },
  });
  revalidatePath(`/contractors/${contractorId}`);
  revalidatePath("/calendar");
  return { ok: true, id: contractorId };
}

export async function deleteAvailability(id: string) {
  await requireUser();
  const window = await prisma.contractorAvailability.delete({ where: { id } });
  revalidatePath(`/contractors/${window.contractorId}`);
  revalidatePath("/calendar");
}
