"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui";
import { updateInvoiceStatus } from "../actions";
import type { InvoiceStatus } from "@prisma/client";

const STATUSES: InvoiceStatus[] = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "PAID",
  "OVERDUE",
  "VOID",
];

export function InvoiceStatusControl({
  invoiceId,
  status,
}: {
  invoiceId: string;
  status: InvoiceStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      className="max-w-40"
      defaultValue={status}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as InvoiceStatus;
        startTransition(async () => {
          await updateInvoiceStatus(invoiceId, next);
          router.refresh();
        });
      }}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.charAt(0) + s.slice(1).toLowerCase()}
        </option>
      ))}
    </Select>
  );
}
