import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Button } from "@/components/ui";
import { currentUser, isAdmin } from "@/lib/session";
import { formatCurrency, formatDate, humanize } from "@/lib/format";
import { convertQuoteToInvoice, deleteInvoice } from "../actions";
import { InvoiceStatusControl } from "./InvoiceStatusControl";
import { SendInvoiceButton } from "./SendInvoiceButton";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = isAdmin(await currentUser());
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      job: { select: { id: true, title: true } },
      lineItems: { orderBy: { position: "asc" } },
    },
  });
  if (!invoice) notFound();

  const label = humanize(invoice.type);

  async function onDelete() {
    "use server";
    await deleteInvoice(id);
  }
  async function onConvert() {
    "use server";
    await convertQuoteToInvoice(id);
  }

  return (
    <div>
      <PageHeader
        title={`${label} #${invoice.number}`}
        subtitle={`For ${invoice.client.name}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <InvoiceStatusControl invoiceId={invoice.id} status={invoice.status} />
            <SendInvoiceButton
              invoiceId={invoice.id}
              label={label}
              clientEmail={invoice.client.email}
            />
            <LinkButton href={`/invoices/${invoice.id}/pdf`} variant="secondary">
              Download PDF
            </LinkButton>
            <LinkButton href={`/invoices/${invoice.id}/edit`} variant="secondary">
              Edit
            </LinkButton>
            {admin && (
              <ConfirmButton action={onDelete} confirmMessage={`Delete ${label} #${invoice.number}?`} />
            )}
          </div>
        }
      />

      {invoice.type === "QUOTE" && (
        <Card className="mb-6 flex items-center justify-between gap-4 p-4">
          <p className="text-sm text-slate-600">
            Quote accepted? Convert it into an invoice — line items are copied over.
          </p>
          <form action={onConvert}>
            <Button type="submit" variant="secondary">
              Convert to invoice
            </Button>
          </form>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Line items" />
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-2 font-medium">Description</th>
                  <th className="px-5 py-2 text-right font-medium">Qty</th>
                  <th className="px-5 py-2 text-right font-medium">Unit</th>
                  <th className="px-5 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.lineItems.map((l) => (
                  <tr key={l.id}>
                    <td className="px-5 py-3 text-slate-700">{l.description}</td>
                    <td className="px-5 py-3 text-right text-slate-600">{Number(l.quantity)}</td>
                    <td className="px-5 py-3 text-right text-slate-600">
                      {formatCurrency(l.unitPrice)}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-800">
                      {formatCurrency(l.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex flex-col items-end gap-1 border-t border-slate-100 px-5 py-4 text-sm">
              <div className="flex w-56 justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex w-56 justify-between text-slate-600">
                <span>VAT ({Number(invoice.vatRate)}%)</span>
                <span>{formatCurrency(invoice.vatAmount)}</span>
              </div>
              <div className="flex w-56 justify-between text-base font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </Card>

          {invoice.notes && (
            <Card className="mt-6">
              <CardHeader title="Notes" />
              <p className="whitespace-pre-wrap px-5 py-4 text-sm text-slate-700">
                {invoice.notes}
              </p>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader title="Details" />
            <dl className="space-y-4 px-5 py-4 text-sm">
              <div>
                <dt className="text-slate-400">Status</dt>
                <dd><StatusBadge value={invoice.status} /></dd>
              </div>
              <div>
                <dt className="text-slate-400">Client</dt>
                <dd>
                  <Link href={`/clients/${invoice.client.id}`} className="text-brand-700 hover:underline">
                    {invoice.client.name}
                  </Link>
                </dd>
              </div>
              {invoice.job && (
                <div>
                  <dt className="text-slate-400">Job</dt>
                  <dd>
                    <Link href={`/jobs/${invoice.job.id}`} className="text-brand-700 hover:underline">
                      {invoice.job.title}
                    </Link>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-slate-400">Issue date</dt>
                <dd className="text-slate-800">{formatDate(invoice.issueDate)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Due date</dt>
                <dd className="text-slate-800">{formatDate(invoice.dueDate)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
