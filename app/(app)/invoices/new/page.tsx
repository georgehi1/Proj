import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { InvoiceForm } from "../InvoiceForm";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; jobId?: string; type?: string }>;
}) {
  const { clientId, jobId, type } = await searchParams;
  const [clients, jobs, settings] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, clientId: true },
    }),
    prisma.companySettings.findUnique({ where: { id: 1 } }),
  ]);

  return (
    <div>
      <PageHeader title="New invoice / quote" />
      <InvoiceForm
        clients={clients}
        jobs={jobs}
        defaults={{
          ...(clientId ? { clientId } : {}),
          ...(jobId ? { jobId } : {}),
          ...(type === "QUOTE" ? { type: "QUOTE" } : {}),
          vatRate: settings ? Number(settings.defaultVatRate) : 20,
        }}
      />
    </div>
  );
}
