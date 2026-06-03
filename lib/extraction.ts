import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

/**
 * AI extraction of a quote/invoice from an unstructured document (PDF, Word or
 * image). A single structured-output call to Claude returns the schema below;
 * the result is reviewed by a human before becoming a live record.
 *
 * Pure helpers (schema, content building, draft mapping) are exported so they
 * can be unit-tested without an API key; `runExtraction` makes the live call.
 */

const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
});

export const extractedDocumentSchema = z.object({
  documentType: z.enum(["QUOTE", "INVOICE"]),
  client: z.object({
    name: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    addressLine1: z.string().nullable(),
    addressLine2: z.string().nullable(),
    town: z.string().nullable(),
    postcode: z.string().nullable(),
  }),
  issueDate: z.string().nullable(),
  dueDate: z.string().nullable(),
  vatRate: z.number().nullable(),
  notes: z.string().nullable(),
  lineItems: z.array(lineItemSchema),
});

export type ExtractedDocument = z.infer<typeof extractedDocumentSchema>;

const SYSTEM_PROMPT = `You extract structured data from property-maintenance quotes and invoices for a CRM.

Rules:
- Decide documentType: "QUOTE" for quotations/estimates, "INVOICE" for invoices/bills.
- Extract the customer (the bill-to / client), NOT the supplier "Homefix Limited".
- For each line item, capture description, quantity (default 1 if not stated) and unitPrice as the per-unit price BEFORE VAT, in pounds as a number (no currency symbol).
- vatRate is the VAT percentage as a number (e.g. 20 for 20%). Null if not shown.
- Dates must be ISO format (YYYY-MM-DD). Null if not present.
- Never invent data. If a field is not present in the document, return null.
- Put any payment terms or free-text remarks in notes.`;

const USER_INSTRUCTION =
  "Extract the quote/invoice from this document into the required structure.";

export type ExtractionFile =
  | { kind: "binary"; mediaType: string; base64: string }
  | { kind: "text"; text: string };

/** Build the user content blocks for the Messages API (pure / testable). */
export function buildUserContent(file: ExtractionFile): Anthropic.ContentBlockParam[] {
  if (file.kind === "text") {
    return [
      {
        type: "text",
        text: `${USER_INSTRUCTION}\n\nDocument contents:\n${file.text}`,
      },
    ];
  }
  if (file.mediaType === "application/pdf") {
    return [
      {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: file.base64 },
      },
      { type: "text", text: USER_INSTRUCTION },
    ];
  }
  // Images (scanned documents / photos of paperwork)
  return [
    {
      type: "image",
      source: {
        type: "base64",
        media_type: file.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
        data: file.base64,
      },
    },
    { type: "text", text: USER_INSTRUCTION },
  ];
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const clean = (v: string | null) => {
  const t = v?.trim();
  return t ? t : null;
};

export type ExtractionDraft = {
  documentType: "QUOTE" | "INVOICE";
  client: {
    name: string;
    email: string | null;
    phone: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    town: string | null;
    postcode: string | null;
  };
  issueDate: Date | null;
  dueDate: Date | null;
  vatRate: number;
  notes: string | null;
  lineItems: { description: string; quantity: number; unitPrice: number }[];
};

/** Normalise a raw extraction into a draft ready to become an Invoice (pure). */
export function draftFromExtraction(
  extracted: ExtractedDocument,
  defaultVatRate: number
): ExtractionDraft {
  return {
    documentType: extracted.documentType,
    client: {
      name: extracted.client.name.trim() || "Unknown client",
      email: clean(extracted.client.email)?.toLowerCase() ?? null,
      phone: clean(extracted.client.phone),
      addressLine1: clean(extracted.client.addressLine1),
      addressLine2: clean(extracted.client.addressLine2),
      town: clean(extracted.client.town),
      postcode: clean(extracted.client.postcode),
    },
    issueDate: parseDate(extracted.issueDate),
    dueDate: parseDate(extracted.dueDate),
    vatRate: extracted.vatRate ?? defaultVatRate,
    notes: clean(extracted.notes),
    lineItems: extracted.lineItems
      .filter((l) => l.description?.trim())
      .map((l) => ({
        description: l.description.trim(),
        quantity: Number.isFinite(l.quantity) && l.quantity > 0 ? l.quantity : 1,
        unitPrice: Number.isFinite(l.unitPrice) ? l.unitPrice : 0,
      })),
  };
}

// Equivalent JSON Schema for the structured-output constraint. Hand-written
// (rather than generated from the Zod schema) to stay decoupled from the SDK's
// Zod-v4 helper; the response is validated back against `extractedDocumentSchema`.
const nullableString = { type: ["string", "null"] };
const OUTPUT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["documentType", "client", "issueDate", "dueDate", "vatRate", "notes", "lineItems"],
  properties: {
    documentType: { type: "string", enum: ["QUOTE", "INVOICE"] },
    client: {
      type: "object",
      additionalProperties: false,
      required: ["name", "email", "phone", "addressLine1", "addressLine2", "town", "postcode"],
      properties: {
        name: { type: "string" },
        email: nullableString,
        phone: nullableString,
        addressLine1: nullableString,
        addressLine2: nullableString,
        town: nullableString,
        postcode: nullableString,
      },
    },
    issueDate: nullableString,
    dueDate: nullableString,
    vatRate: { type: ["number", "null"] },
    notes: nullableString,
    lineItems: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["description", "quantity", "unitPrice"],
        properties: {
          description: { type: "string" },
          quantity: { type: "number" },
          unitPrice: { type: "number" },
        },
      },
    },
  },
} satisfies Record<string, unknown>;

/** Make the live extraction call to Claude. Requires ANTHROPIC_API_KEY. */
export async function runExtraction(file: ExtractionFile): Promise<ExtractedDocument> {
  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    system: [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: buildUserContent(file) }],
    output_config: {
      format: { type: "json_schema", schema: OUTPUT_JSON_SCHEMA },
      effort: "medium",
    },
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  if (!text.trim()) {
    throw new Error("Could not read this document. Try a clearer scan or PDF.");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("The document couldn't be parsed. Try a clearer copy.");
  }
  return extractedDocumentSchema.parse(raw);
}
