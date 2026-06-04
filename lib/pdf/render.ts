import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { humanize, toNumber } from "@/lib/format";
import { InvoiceDocument, type InvoicePdfData } from "@/lib/pdf/InvoiceDocument";

/**
 * Renders the PDF for a quote/invoice. Returns the bytes plus a sensible
 * filename, or null if the invoice doesn't exist. Shared by the download
 * route and the email action so the document stays identical in both.
 */
export async function renderInvoicePdf(
  id: string
): Promise<{ buffer: Buffer; filename: string } | null> {
  const [invoice, company] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id },
      include: { client: true, lineItems: { orderBy: { position: "asc" } } },
    }),
    prisma.companySettings.findUnique({ where: { id: 1 } }),
  ]);

  if (!invoice) return null;

  const data: InvoicePdfData = {
    type: invoice.type,
    number: invoice.number,
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    vatRate: toNumber(invoice.vatRate),
    subtotal: toNumber(invoice.subtotal),
    vatAmount: toNumber(invoice.vatAmount),
    total: toNumber(invoice.total),
    notes: invoice.notes,
    client: {
      name: invoice.client.name,
      addressLine1: invoice.client.addressLine1,
      addressLine2: invoice.client.addressLine2,
      town: invoice.client.town,
      postcode: invoice.client.postcode,
      email: invoice.client.email,
    },
    lineItems: invoice.lineItems.map((l) => ({
      description: l.description,
      quantity: toNumber(l.quantity),
      unitPrice: toNumber(l.unitPrice),
      lineTotal: toNumber(l.lineTotal),
    })),
    company: {
      companyName: company?.companyName ?? "Homefix Limited",
      addressLine1: company?.addressLine1 ?? null,
      addressLine2: company?.addressLine2 ?? null,
      town: company?.town ?? null,
      postcode: company?.postcode ?? null,
      phone: company?.phone ?? null,
      email: company?.email ?? null,
      vatNumber: company?.vatNumber ?? null,
    },
  };

  const element = createElement(InvoiceDocument, { data }) as Parameters<
    typeof renderToBuffer
  >[0];
  const buffer = await renderToBuffer(element);
  const filename = `${humanize(invoice.type)}-${invoice.number}.pdf`;
  return { buffer, filename };
}
