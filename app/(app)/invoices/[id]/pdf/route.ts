import { createElement } from "react";
import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { InvoiceDocument, type InvoicePdfData } from "@/lib/pdf/InvoiceDocument";
import { humanize, toNumber } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const [invoice, company] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id },
      include: { client: true, lineItems: { orderBy: { position: "asc" } } },
    }),
    prisma.companySettings.findUnique({ where: { id: 1 } }),
  ]);

  if (!invoice) {
    return new Response("Not found", { status: 404 });
  }

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

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
