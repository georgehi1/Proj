import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { JobForm } from "../../JobForm";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [job, clients, staff] = await Promise.all([
    prisma.job.findUnique({ where: { id } }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!job) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${job.title}`} />
      <JobForm
        id={job.id}
        clients={clients}
        staff={staff}
        defaults={{
          clientId: job.clientId,
          title: job.title,
          description: job.description ?? "",
          status: job.status,
          siteAddress: job.siteAddress ?? "",
          scheduledDate: job.scheduledDate
            ? job.scheduledDate.toISOString().slice(0, 10)
            : "",
          assignedToId: job.assignedToId ?? "",
        }}
      />
    </div>
  );
}
