import Link from "next/link";
import { prisma } from "@/lib/db";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { ListFilters } from "@/components/ListFilters";
import { formatCurrency, formatDate, humanize } from "@/lib/format";
import type { InvoiceStatus, InvoiceType } from "@prisma/client";

const STATUS_VALUES = ["DRAFT", "SENT", "ACCEPTED", "PAID", "OVERDUE", "VOID"];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>;
}) {
  const { type, status } = await searchParams;
  const typeFilter =
    type === "QUOTE" || type === "INVOICE" ? (type as InvoiceType) : undefined;
  const statusFilter = STATUS_VALUES.includes(status ?? "")
    ? (status as InvoiceStatus)
    : undefined;

  const invoices = await prisma.invoice.findMany({
    where: {
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: [{ issueDate: "desc" }],
    include: { client: { select: { name: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Invoices & quotes"
        subtitle="Create, track and export branded documents."
        action={<LinkButton href="/invoices/new">New document</LinkButton>}
      />

      <ListFilters
        filters={[
          {
            name: "type",
            options: [
              { value: "", label: "All types" },
              { value: "INVOICE", label: "Invoices" },
              { value: "QUOTE", label: "Quotes" },
            ],
          },
          {
            name: "status",
            options: [
              { value: "", label: "All statuses" },
              ...STATUS_VALUES.map((s) => ({ value: s, label: humanize(s) })),
            ],
          },
        ]}
      />

      {invoices.length === 0 ? (
        <EmptyState message="No invoices or quotes yet." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Number</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Issued</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      {humanize(inv.type)} #{inv.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{inv.client.name}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(inv.issueDate)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={inv.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">
                    {formatCurrency(inv.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
