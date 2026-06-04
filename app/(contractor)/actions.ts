"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireContractor } from "@/lib/contractor";
import { availabilitySchema, type AvailabilityInput } from "@/lib/validation";

export type SaveResult = { ok: boolean; id?: string; error?: string };

/**
 * Add an availability window for the *signed-in* contractor. The contractor id
 * comes from the session — never from the client — so a contractor can only
 * ever edit their own schedule.
 */
export async function contractorAddAvailability(
  input: AvailabilityInput
): Promise<SaveResult> {
  const { contractorId } = await requireContractor();
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
  revalidatePath("/my/availability");
  revalidatePath(`/contractors/${contractorId}`);
  revalidatePath("/calendar");
  return { ok: true, id: contractorId };
}

export async function contractorDeleteAvailability(id: string) {
  const { contractorId } = await requireContractor();
  // Scope the delete to this contractor so one contractor can't remove
  // another's window by guessing an id.
  const result = await prisma.contractorAvailability.deleteMany({
    where: { id, contractorId },
  });
  if (result.count === 0) throw new Error("Not authorised");
  revalidatePath("/my/availability");
  revalidatePath(`/contractors/${contractorId}`);
  revalidatePath("/calendar");
}
