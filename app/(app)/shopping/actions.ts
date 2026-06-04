"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import type { MaterialStatus } from "@prisma/client";

// Used by the shopping list (office-only) to tick an item off (→ RECEIVED) or
// undo (→ its previous status). Revalidates both the list and the owning job.
export async function setMaterialStatus(id: string, status: MaterialStatus) {
  await requireRole("ADMIN", "STAFF");
  const material = await prisma.jobMaterial.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/shopping");
  revalidatePath(`/jobs/${material.jobId}`);
  return { ok: true };
}
