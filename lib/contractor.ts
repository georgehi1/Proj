import { prisma } from "@/lib/db";
import { requireUser, type SessionUser } from "@/lib/session";

/**
 * Resolves the signed-in user to the Contractor record they're the login for.
 * Throws unless the user has the CONTRACTOR role and is linked to a contractor.
 * Use this at the top of every contractor-portal page and action so a request
 * can only ever act as its own contractor.
 */
export async function requireContractor(): Promise<{
  user: SessionUser;
  contractorId: string;
}> {
  const user = await requireUser();
  if (user.role !== "CONTRACTOR") {
    throw new Error("Not authorised");
  }
  const contractor = await prisma.contractor.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!contractor) {
    throw new Error("Not authorised");
  }
  return { user, contractorId: contractor.id };
}

/**
 * Authorises a mutation on a job. Office roles (ADMIN/STAFF) may touch any job;
 * a CONTRACTOR may only touch jobs they're assigned to. Throws otherwise.
 * This is the server-side gate that lets the office job actions be reused by
 * the contractor portal without leaking access to other jobs.
 */
export async function assertJobAccess(
  user: SessionUser,
  jobId: string
): Promise<void> {
  if (user.role === "ADMIN" || user.role === "STAFF") return;
  if (user.role === "CONTRACTOR") {
    const match = await prisma.job.findFirst({
      where: { id: jobId, contractors: { some: { userId: user.id } } },
      select: { id: true },
    });
    if (match) return;
  }
  throw new Error("Not authorised");
}
