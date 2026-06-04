"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import type { MaterialStatus } from "@prisma/client";

// Used by the shopping list to tick an item off (→ RECEIVED) or undo
// (→ its previous status). Revalidates both the list and the owning job.
export async function setMaterialStatus(id: string, status: MaterialStatus) {
  await requireUser();
  const material = await prisma.jobMaterial.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/shopping");
  revalidatePath(`/jobs/${material.jobId}`);
  return { ok: true };
}
