import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { ClientForm } from "../../ClientForm";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${client.name}`} />
      <ClientForm
        id={client.id}
        defaults={{
          name: client.name,
          type: client.type,
          email: client.email ?? "",
          phone: client.phone ?? "",
          addressLine1: client.addressLine1 ?? "",
          addressLine2: client.addressLine2 ?? "",
          town: client.town ?? "",
          postcode: client.postcode ?? "",
          notes: client.notes ?? "",
        }}
      />
    </div>
  );
}
