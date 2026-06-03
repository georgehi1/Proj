import { prisma } from "@/lib/db";
import type { AvailabilityWindow } from "@/lib/availability";

const day = (d: Date) => d.toISOString().slice(0, 10);

// Active contractors plus the data the job form needs to show who's free on a
// given date: their availability windows and the days they're already booked
// (open, scheduled jobs — optionally excluding the job being edited).
export async function getContractorOptions(excludeJobId?: string) {
  const contractors = await prisma.contractor.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      trade: true,
      availability: { select: { kind: true, startDate: true, endDate: true } },
      jobs: {
        where: {
          scheduledDate: { not: null },
          status: { notIn: ["COMPLETED", "CANCELLED"] },
          ...(excludeJobId ? { id: { not: excludeJobId } } : {}),
        },
        select: { scheduledDate: true },
      },
    },
  });

  return contractors.map((c) => ({
    id: c.id,
    name: c.name,
    trade: c.trade,
    availability: c.availability.map(
      (w): AvailabilityWindow => ({
        kind: w.kind,
        start: day(w.startDate),
        end: day(w.endDate),
      })
    ),
    bookedDates: c.jobs.map((j) => day(j.scheduledDate!)),
  }));
}
