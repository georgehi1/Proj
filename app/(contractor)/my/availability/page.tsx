import { prisma } from "@/lib/db";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { requireContractor } from "@/lib/contractor";
import { ContractorAvailabilityManager } from "./ContractorAvailabilityManager";

export default async function ContractorAvailabilityPage() {
  const { contractorId } = await requireContractor();

  const availability = await prisma.contractorAvailability.findMany({
    where: { contractorId },
    orderBy: { startDate: "asc" },
    select: { id: true, kind: true, startDate: true, endDate: true, note: true },
  });

  const day = (d: Date) => d.toISOString().slice(0, 10);
  const windows = availability.map((w) => ({
    id: w.id,
    kind: w.kind,
    start: day(w.startDate),
    end: day(w.endDate),
    note: w.note,
  }));

  return (
    <div>
      <PageHeader
        title="My availability"
        subtitle="Let the office know when you can work and when you're off."
      />
      <Card>
        <CardHeader title="Availability" />
        <ContractorAvailabilityManager windows={windows} />
      </Card>
    </div>
  );
}
