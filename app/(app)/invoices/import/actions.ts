"use server";

import { revalidatePath } from "next/cache";
import mammoth from "mammoth";
import { Prisma, type InvoiceType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { computeTotals } from "@/lib/invoice";
import {
  runExtraction,
  draftFromExtraction,
  type ExtractionFile,
} from "@/lib/extraction";

export type ImportResult = { ok: boolean; id?: string; error?: string };

const MAX_BYTES = 12 * 1024 * 1024;
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const IMAGE_MIMES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const dec = (n: number) => new Prisma.Decimal(n.toFixed(2));
const normalisePhone = (v?: string | null) => (v ?? "").replace(/\D/g, "");

function guessType(name: string): "RESIDENTIAL" | "COMMERCIAL" {
  return /\b(ltd|limited|llp|plc|inc|services|group|properties|estates|management|construction)\b/i.test(
    name
  )
    ? "COMMERCIAL"
    : "RESIDENTIAL";
}

async function nextNumber(type: InvoiceType): Promise<number> {
  const last = await prisma.invoice.findFirst({
    where: { type },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  return (last?.number ?? 0) + 1;
}

/** Find an existing client matching the extracted details, or create one. */
async function findOrCreateClient(client: {
  name: string;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  town: string | null;
  postcode: string | null;
}): Promise<string> {
  const existing = await prisma.client.findMany({
    select: { id: true, name: true, email: true, phone: true },
  });
  const phoneKey = normalisePhone(client.phone);
  const match = existing.find(
    (e) =>
      e.name.trim().toLowerCase() === client.name.trim().toLowerCase() ||
      (client.email && e.email?.toLowerCase() === client.email.toLowerCase()) ||
      (phoneKey !== "" && normalisePhone(e.phone) === phoneKey)
  );
  if (match) return match.id;

  const created = await prisma.client.create({
    data: {
      name: client.name,
      type: guessType(client.name),
      email: client.email,
      phone: client.phone,
      addressLine1: client.addressLine1,
      addressLine2: client.addressLine2,
      town: client.town,
      postcode: client.postcode,
    },
  });
  return created.id;
}

export async function extractDocument(formData: FormData): Promise<ImportResult> {
  await requireUser();

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      ok: false,
      error:
        "AI extraction isn't configured. Set the ANTHROPIC_API_KEY environment variable to enable it.",
    };
  }

  const file = formData.get("document");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Please choose a file." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File is larger than 12MB." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type;

  let extractionFile: ExtractionFile;
  if (mime === DOCX_MIME || file.name.toLowerCase().endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer });
    if (!value.trim()) {
      return { ok: false, error: "That Word document appears to be empty." };
    }
    extractionFile = { kind: "text", text: value };
  } else if (mime === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    extractionFile = { kind: "binary", mediaType: "application/pdf", base64: buffer.toString("base64") };
  } else if (IMAGE_MIMES.includes(mime)) {
    extractionFile = { kind: "binary", mediaType: mime, base64: buffer.toString("base64") };
  } else {
    return {
      ok: false,
      error: "Unsupported file. Upload a PDF, Word (.docx) or image. For old .doc files, save as PDF first.",
    };
  }

  let draft;
  try {
    const settings = await prisma.companySettings.findUnique({ where: { id: 1 } });
    const defaultVat = settings ? Number(settings.defaultVatRate) : 20;
    const extracted = await runExtraction(extractionFile);
    draft = draftFromExtraction(extracted, defaultVat);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Extraction failed. Please try again.";
    return { ok: false, error: message };
  }

  if (draft.lineItems.length === 0) {
    return {
      ok: false,
      error: "No line items could be read from this document. Try a clearer copy or enter it manually.",
    };
  }

  const clientId = await findOrCreateClient(draft.client);
  const { subtotal, vatAmount, total } = computeTotals(draft.lineItems, draft.vatRate);

  const invoice = await prisma.invoice.create({
    data: {
      type: draft.documentType,
      number: await nextNumber(draft.documentType),
      clientId,
      status: "DRAFT",
      issueDate: draft.issueDate ?? new Date(),
      dueDate: draft.dueDate,
      vatRate: dec(draft.vatRate),
      subtotal: dec(subtotal),
      vatAmount: dec(vatAmount),
      total: dec(total),
      notes: draft.notes,
      lineItems: {
        create: draft.lineItems.map((l, position) => ({
          description: l.description,
          quantity: dec(l.quantity),
          unitPrice: dec(l.unitPrice),
          lineTotal: dec(Math.round(l.quantity * l.unitPrice * 100) / 100),
          position,
        })),
      },
    },
  });

  revalidatePath("/invoices");
  revalidatePath(`/clients/${clientId}`);
  return { ok: true, id: invoice.id };
}
