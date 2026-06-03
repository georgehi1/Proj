"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { invoiceSchema, type InvoiceInput } from "@/lib/validation";
import { computeTotals } from "@/lib/invoice";
import { formatCurrency } from "@/lib/format";
import { saveInvoice } from "./actions";

const STATUSES: InvoiceInput["status"][] = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "PAID",
  "OVERDUE",
  "VOID",
];

export function InvoiceForm({
  id,
  defaults,
  clients,
  jobs,
}: {
  id?: string;
  defaults?: Partial<InvoiceInput>;
  clients: { id: string; name: string }[];
  jobs: { id: string; title: string; clientId: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      type: "INVOICE",
      clientId: "",
      jobId: "",
      status: "DRAFT",
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: "",
      vatRate: 20,
      notes: "",
      lineItems: [{ description: "", quantity: 1, unitPrice: 0 }],
      ...defaults,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lineItems" });

  const watchedItems = useWatch({ control, name: "lineItems" });
  const watchedVat = useWatch({ control, name: "vatRate" });
  const watchedClient = useWatch({ control, name: "clientId" });

  const totals = useMemo(() => {
    const items = (watchedItems ?? []).map((i) => ({
      description: i.description ?? "",
      quantity: Number(i.quantity) || 0,
      unitPrice: Number(i.unitPrice) || 0,
    }));
    return computeTotals(items, Number(watchedVat) || 0);
  }, [watchedItems, watchedVat]);

  const availableJobs = useMemo(
    () => jobs.filter((j) => j.clientId === watchedClient),
    [jobs, watchedClient]
  );

  const onSubmit = (values: InvoiceInput) => {
    setServerError(undefined);
    startTransition(async () => {
      const res = await saveInvoice(id ?? null, values);
      if (!res.ok) {
        setServerError(res.error);
        return;
      }
      router.push(`/invoices/${res.id}`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Document type" htmlFor="type">
            <Select id="type" {...register("type")} disabled={Boolean(id)}>
              <option value="INVOICE">Invoice</option>
              <option value="QUOTE">Quote</option>
            </Select>
          </Field>
          <Field label="Status" htmlFor="status">
            <Select id="status" {...register("status")}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Client" htmlFor="clientId" error={errors.clientId?.message}>
            <Select id="clientId" {...register("clientId")}>
              <option value="">Choose a client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Linked job (optional)" htmlFor="jobId">
            <Select id="jobId" {...register("jobId")} disabled={!watchedClient}>
              <option value="">None</option>
              {availableJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Issue date" htmlFor="issueDate" error={errors.issueDate?.message}>
            <Input id="issueDate" type="date" {...register("issueDate")} />
          </Field>
          <Field label="Due date (optional)" htmlFor="dueDate">
            <Input id="dueDate" type="date" {...register("dueDate")} />
          </Field>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Line items</h2>
        <div className="space-y-2">
          <div className="hidden grid-cols-12 gap-2 px-1 text-xs font-medium text-slate-400 sm:grid">
            <div className="col-span-6">Description</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">Unit price</div>
            <div className="col-span-2 text-right">Total</div>
          </div>
          {fields.map((field, index) => {
            const line = totals.lines[index];
            return (
              <div key={field.id} className="grid grid-cols-12 items-start gap-2">
                <div className="col-span-12 sm:col-span-6">
                  <Input
                    placeholder="Description"
                    {...register(`lineItems.${index}.description`)}
                  />
                  {errors.lineItems?.[index]?.description && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.lineItems[index]?.description?.message}
                    </p>
                  )}
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    type="number"
                    step="0.01"
                    className="text-right"
                    {...register(`lineItems.${index}.quantity`)}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    type="number"
                    step="0.01"
                    className="text-right"
                    {...register(`lineItems.${index}.unitPrice`)}
                  />
                </div>
                <div className="col-span-3 flex h-9 items-center justify-end text-sm text-slate-700 sm:col-span-1">
                  {formatCurrency(line?.lineTotal ?? 0)}
                </div>
                <div className="col-span-1 flex h-9 items-center justify-end">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="text-slate-400 hover:text-red-600 disabled:opacity-30"
                    aria-label="Remove line"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {errors.lineItems?.message && (
          <p className="mt-2 text-xs text-red-600">{errors.lineItems.message}</p>
        )}
        <button
          type="button"
          onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
          className="mt-3 text-sm font-medium text-brand-600 hover:underline"
        >
          + Add line
        </button>

        <div className="mt-6 flex flex-col items-end gap-1 border-t border-slate-100 pt-4 text-sm">
          <div className="flex w-56 justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex w-56 items-center justify-between text-slate-600">
            <span className="flex items-center gap-2">
              VAT
              <Input
                type="number"
                step="0.01"
                className="w-16 px-2 py-1 text-right"
                {...register("vatRate")}
              />
              %
            </span>
            <span>{formatCurrency(totals.vatAmount)}</span>
          </div>
          <div className="flex w-56 justify-between text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <Field label="Notes (optional)" htmlFor="notes">
          <Textarea id="notes" {...register("notes")} placeholder="Payment terms, thank-you note…" />
        </Field>
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : id ? "Save changes" : "Create"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </Card>
    </form>
  );
}
