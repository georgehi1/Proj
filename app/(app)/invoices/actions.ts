"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { invoiceSchema, type InvoiceInput } from "@/lib/validation";
import { computeTotals } from "@/lib/invoice";
import type { InvoiceStatus, InvoiceType } from "@prisma/client";

export type SaveResult = { ok: boolean; id?: string; error?: string };

function dec(n: number) {
  return new Prisma.Decimal(n.toFixed(2));
}

function clean(value?: string) {
  const v = value?.trim();
  return v ? v : null;
}

async function nextNumber(type: InvoiceType): Promise<number> {
  const last = await prisma.invoice.findFirst({
    where: { type },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  return (last?.number ?? 0) + 1;
}

export async function saveInvoice(
  id: string | null,
  input: InvoiceInput
): Promise<SaveResult> {
  await requireUser();
  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }
  const d = parsed.data;
  const { lines, subtotal, vatAmount, total } = computeTotals(d.lineItems, d.vatRate);

  const base = {
    clientId: d.clientId,
    jobId: clean(d.jobId),
    status: d.status,
    issueDate: new Date(d.issueDate),
    dueDate: d.dueDate ? new Date(d.dueDate) : null,
    vatRate: dec(d.vatRate),
    subtotal: dec(subtotal),
    vatAmount: dec(vatAmount),
    total: dec(total),
    notes: clean(d.notes),
  };

  const lineData = lines.map((l, position) => ({
    description: l.description,
    quantity: dec(l.quantity),
    unitPrice: dec(l.unitPrice),
    lineTotal: dec(l.lineTotal),
    position,
  }));

  let invoiceId: string;
  if (id) {
    // Replace line items wholesale — simplest correct approach for an editor.
    await prisma.$transaction([
      prisma.invoiceLineItem.deleteMany({ where: { invoiceId: id } }),
      prisma.invoice.update({
        where: { id },
        data: { ...base, lineItems: { create: lineData } },
      }),
    ]);
    invoiceId = id;
  } else {
    const created = await prisma.invoice.create({
      data: {
        ...base,
        type: d.type,
        number: await nextNumber(d.type),
        lineItems: { create: lineData },
      },
    });
    invoiceId = created.id;
  }

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath(`/clients/${d.clientId}`);
  return { ok: true, id: invoiceId };
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
  await requireUser();
  const inv = await prisma.invoice.update({ where: { id }, data: { status } });
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  revalidatePath(`/clients/${inv.clientId}`);
}

/** Turn an accepted quote into a draft invoice, copying its line items. */
export async function convertQuoteToInvoice(quoteId: string): Promise<SaveResult> {
  await requireUser();
  const quote = await prisma.invoice.findUnique({
    where: { id: quoteId },
    include: { lineItems: { orderBy: { position: "asc" } } },
  });
  if (!quote || quote.type !== "QUOTE") {
    return { ok: false, error: "Quote not found" };
  }

  const invoice = await prisma.invoice.create({
    data: {
      type: "INVOICE",
      number: await nextNumber("INVOICE"),
      clientId: quote.clientId,
      jobId: quote.jobId,
      status: "DRAFT",
      issueDate: new Date(),
      vatRate: quote.vatRate,
      subtotal: quote.subtotal,
      vatAmount: quote.vatAmount,
      total: quote.total,
      notes: quote.notes,
      lineItems: {
        create: quote.lineItems.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          lineTotal: l.lineTotal,
          position: l.position,
        })),
      },
    },
  });

  revalidatePath("/invoices");
  revalidatePath(`/clients/${quote.clientId}`);
  redirect(`/invoices/${invoice.id}`);
}

export async function deleteInvoice(id: string) {
  await requireUser();
  const inv = await prisma.invoice.delete({ where: { id } });
  revalidatePath("/invoices");
  revalidatePath(`/clients/${inv.clientId}`);
  redirect("/invoices");
}
