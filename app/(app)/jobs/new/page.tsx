import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { JobForm } from "../JobForm";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; contractorId?: string }>;
}) {
  const { clientId, contractorId } = await searchParams;
  const [clients, contractors] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.contractor.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, trade: true },
    }),
  ]);

  return (
    <div>
      <PageHeader title="New job" />
      <JobForm
        clients={clients}
        contractors={contractors}
        defaults={{
          ...(clientId ? { clientId } : {}),
          ...(contractorId ? { contractorIds: [contractorId] } : {}),
        }}
      />
    </div>
  );
}
