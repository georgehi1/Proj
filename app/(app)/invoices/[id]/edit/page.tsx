import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { humanize } from "@/lib/format";
import { InvoiceForm } from "../../InvoiceForm";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [invoice, clients, jobs] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id },
      include: { lineItems: { orderBy: { position: "asc" } } },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, clientId: true },
    }),
  ]);
  if (!invoice) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${humanize(invoice.type)} #${invoice.number}`} />
      <InvoiceForm
        id={invoice.id}
        clients={clients}
        jobs={jobs}
        defaults={{
          type: invoice.type,
          clientId: invoice.clientId,
          jobId: invoice.jobId ?? "",
          status: invoice.status,
          issueDate: invoice.issueDate.toISOString().slice(0, 10),
          dueDate: invoice.dueDate ? invoice.dueDate.toISOString().slice(0, 10) : "",
          vatRate: Number(invoice.vatRate),
          notes: invoice.notes ?? "",
          lineItems: invoice.lineItems.map((l) => ({
            description: l.description,
            quantity: Number(l.quantity),
            unitPrice: Number(l.unitPrice),
          })),
        }}
      />
    </div>
  );
}
