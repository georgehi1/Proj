"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { sendInvoiceEmail } from "../actions";

export function SendInvoiceButton({
  invoiceId,
  label,
  clientEmail,
}: {
  invoiceId: string;
  label: string;
  clientEmail: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();

  if (!clientEmail) {
    return (
      <span
        className="cursor-not-allowed text-xs text-slate-400"
        title="Add an email address to this client to send"
      >
        No client email
      </span>
    );
  }

  function onSend() {
    if (!window.confirm(`Email this ${label.toLowerCase()} to ${clientEmail}?`)) return;
    setMessage(undefined);
    startTransition(async () => {
      const res = await sendInvoiceEmail(invoiceId);
      if (!res.ok) {
        setMessage({ ok: false, text: res.error ?? "Failed to send." });
        return;
      }
      setMessage({ ok: true, text: res.error ?? `Sent to ${clientEmail}` });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" onClick={onSend} disabled={isPending}>
        {isPending ? "Sending…" : "Email to client"}
      </Button>
      {message && (
        <span className={`text-xs ${message.ok ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </span>
      )}
    </div>
  );
}
