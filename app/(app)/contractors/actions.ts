"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
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

// ─── Contractor portal login (admin only) ──────────────────────────────────

export type LoginResult = { ok: boolean; password?: string; error?: string };

// Readable one-time password: avoids ambiguous characters (0/O, 1/l/I).
function generatePassword(length = 12): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

/**
 * Provision a portal login for a contractor. Creates a CONTRACTOR-role user
 * keyed on the contractor's email and returns the generated password ONCE for
 * the admin to share. Idempotency and email-clash are handled explicitly.
 */
export async function enableContractorLogin(contractorId: string): Promise<LoginResult> {
  await requireRole("ADMIN");
  const contractor = await prisma.contractor.findUnique({
    where: { id: contractorId },
    select: { id: true, name: true, email: true, userId: true },
  });
  if (!contractor) return { ok: false, error: "Contractor not found." };
  if (contractor.userId) return { ok: false, error: "Login is already enabled." };
  if (!contractor.email) {
    return { ok: false, error: "Add an email address to this contractor first." };
  }

  const email = contractor.email.toLowerCase();
  const clash = await prisma.user.findUnique({ where: { email } });
  if (clash) {
    return { ok: false, error: "That email is already used by another account." };
  }

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name: contractor.name, email, passwordHash, role: "CONTRACTOR" },
  });
  await prisma.contractor.update({
    where: { id: contractorId },
    data: { userId: user.id },
  });

  revalidatePath(`/contractors/${contractorId}`);
  return { ok: true, password };
}

/** Generate a fresh password and force re-login on all the contractor's sessions. */
export async function resetContractorPassword(contractorId: string): Promise<LoginResult> {
  await requireRole("ADMIN");
  const contractor = await prisma.contractor.findUnique({
    where: { id: contractorId },
    select: { userId: true },
  });
  if (!contractor?.userId) return { ok: false, error: "Login is not enabled." };

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: contractor.userId },
    data: { passwordHash, tokenVersion: { increment: 1 } },
  });

  revalidatePath(`/contractors/${contractorId}`);
  return { ok: true, password };
}

/** Remove a contractor's login. Deleting the user unlinks via SetNull. */
export async function disableContractorLogin(contractorId: string): Promise<LoginResult> {
  await requireRole("ADMIN");
  const contractor = await prisma.contractor.findUnique({
    where: { id: contractorId },
    select: { userId: true },
  });
  if (!contractor?.userId) return { ok: false, error: "Login is not enabled." };

  await prisma.user.delete({ where: { id: contractor.userId } });

  revalidatePath(`/contractors/${contractorId}`);
  return { ok: true };
}
