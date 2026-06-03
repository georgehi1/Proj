"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { extractDocument } from "./actions";

export function ImportDocument() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [fileName, setFileName] = useState<string>();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(undefined);
    startTransition(async () => {
      const res = await extractDocument(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Open the pre-filled draft for the user to review and save.
      router.push(`/invoices/${res.id}/edit`);
      router.refresh();
    });
  }

  return (
    <Card className="p-6">
      <p className="mb-4 text-sm text-slate-500">
        Upload an existing quote or invoice as a <strong>PDF</strong>,{" "}
        <strong>Word (.docx)</strong> or <strong>image</strong>. Claude reads it and
        creates a draft with the client, line items, VAT and totals filled in — you then
        review and save it as a live record. (Old <code>.doc</code> files: save as PDF first.)
      </p>

      <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="document"
          accept=".pdf,.docx,image/*"
          required
          onChange={(e) => setFileName(e.target.files?.[0]?.name)}
          className="block text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Reading document…" : "Extract & review"}
        </Button>
      </form>

      {isPending && (
        <p className="mt-3 text-sm text-slate-500">
          Reading {fileName ? `"${fileName}"` : "your document"} — this usually takes
          10–30 seconds.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <p className="mt-4 text-xs text-slate-400">
        Always check the extracted figures against the original before saving — AI can
        misread messy scans.
      </p>
    </Card>
  );
}
