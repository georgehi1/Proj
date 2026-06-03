import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { ContractorForm } from "../../ContractorForm";

export default async function EditContractorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contractor = await prisma.contractor.findUnique({ where: { id } });
  if (!contractor) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${contractor.name}`} />
      <ContractorForm
        id={contractor.id}
        defaults={{
          name: contractor.name,
          trade: contractor.trade ?? "",
          companyName: contractor.companyName ?? "",
          email: contractor.email ?? "",
          phone: contractor.phone ?? "",
          dayRate: contractor.dayRate ? Number(contractor.dayRate) : "",
          notes: contractor.notes ?? "",
          active: contractor.active,
        }}
      />
    </div>
  );
}
