import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  type: z.enum(["RESIDENTIAL", "COMMERCIAL"]),
  email: z.string().trim().email("Invalid email").or(z.literal("")).optional(),
  phone: z.string().trim().optional(),
  addressLine1: z.string().trim().optional(),
  addressLine2: z.string().trim().optional(),
  town: z.string().trim().optional(),
  postcode: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
export type ClientInput = z.infer<typeof clientSchema>;

export const jobSchema = z.object({
  clientId: z.string().min(1, "Please choose a client"),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  status: z.enum([
    "ENQUIRY",
    "QUOTED",
    "SCHEDULED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
  ]),
  siteAddress: z.string().trim().optional(),
  scheduledDate: z.string().trim().optional(),
  contractorIds: z.array(z.string()).default([]),
});
export type JobInput = z.infer<typeof jobSchema>;

export const contractorSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  trade: z.string().trim().optional(),
  companyName: z.string().trim().optional(),
  email: z.string().trim().email("Invalid email").or(z.literal("")).optional(),
  phone: z.string().trim().optional(),
  dayRate: z
    .union([z.coerce.number().min(0), z.literal("")])
    .optional(),
  notes: z.string().trim().optional(),
  active: z.boolean().default(true),
});
export type ContractorInput = z.infer<typeof contractorSchema>;

export const availabilitySchema = z
  .object({
    kind: z.enum(["AVAILABLE", "TIME_OFF"]),
    startDate: z.string().trim().min(1, "Start date is required"),
    endDate: z.string().trim().min(1, "End date is required"),
    note: z.string().trim().optional(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });
export type AvailabilityInput = z.infer<typeof availabilitySchema>;

export const communicationSchema = z.object({
  clientId: z.string().min(1),
  jobId: z.string().trim().optional(),
  type: z.enum(["CALL", "EMAIL", "NOTE", "SITE_VISIT"]),
  body: z.string().trim().min(1, "Please enter some detail"),
});
export type CommunicationInput = z.infer<typeof communicationSchema>;

export const lineItemSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  quantity: z.coerce.number().min(0, "Must be 0 or more"),
  unitPrice: z.coerce.number(),
});

export const invoiceSchema = z.object({
  type: z.enum(["QUOTE", "INVOICE"]),
  clientId: z.string().min(1, "Please choose a client"),
  jobId: z.string().trim().optional(),
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "PAID", "OVERDUE", "VOID"]),
  issueDate: z.string().trim().min(1, "Issue date is required"),
  dueDate: z.string().trim().optional(),
  vatRate: z.coerce.number().min(0).max(100),
  notes: z.string().trim().optional(),
  lineItems: z.array(lineItemSchema).min(1, "Add at least one line item"),
});
export type InvoiceInput = z.infer<typeof invoiceSchema>;

export const settingsSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required"),
  addressLine1: z.string().trim().optional(),
  addressLine2: z.string().trim().optional(),
  town: z.string().trim().optional(),
  postcode: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Invalid email").or(z.literal("")).optional(),
  vatNumber: z.string().trim().optional(),
  defaultVatRate: z.coerce.number().min(0).max(100),
  invoicePrefix: z.string().trim().min(1),
  quotePrefix: z.string().trim().min(1),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
