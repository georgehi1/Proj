import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { JobForm } from "../JobForm";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const [clients, staff] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div>
      <PageHeader title="New job" />
      <JobForm clients={clients} staff={staff} defaults={clientId ? { clientId } : undefined} />
    </div>
  );
}
